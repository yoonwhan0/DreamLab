import {
  estimateToStats,
  estimateToSummary,
  generateSyntheticCommunity,
} from "@/services/syntheticCommunityService";
import { buildCoherentStoryForKeyword } from "@/lib/coherentCommunityStory";
import {
  buildSimilarDreamSummary,
  computeStats,
  findScoredSimilarDreams,
} from "@/services/dreamService";
import type {
  CommunityEstimate,
  DreamInterpretation,
  DreamStats,
  SimilarDreamSummary,
} from "@/types";
import { MIN_REAL_COMMUNITY_COUNT } from "@/types";
import { fetchDataExposureConfig } from "@/services/opsConfigService";
import type { DataExposureConfig } from "@/lib/opsConfig";
import { DEFAULT_DATA_EXPOSURE } from "@/lib/opsConfig";
import {
  overlapsUserDreamFields,
  sanitizeAiCommunityStory,
} from "@/lib/communityStoryQuality";
import { isStrongAnchor } from "@/lib/similarDreamMatch";
import { collectDreamTags } from "@/lib/dreamMatch";

const EXPOSURE_CACHE_MS = 5 * 60 * 1000;
let exposureCache: DataExposureConfig | null = null;
let exposureCacheAt = 0;

async function getDataExposureConfig(): Promise<DataExposureConfig> {
  const now = Date.now();
  if (exposureCache && now - exposureCacheAt < EXPOSURE_CACHE_MS) {
    return exposureCache;
  }
  try {
    exposureCache = await fetchDataExposureConfig();
  } catch {
    exposureCache = DEFAULT_DATA_EXPOSURE;
  }
  exposureCacheAt = now;
  return exposureCache;
}

export interface CommunityDataResult {
  summary: SimilarDreamSummary;
  stats: DreamStats;
  isEstimated: boolean;
  /** Dream DNA — 가장 비슷한 꿈과의 매칭 점수(0~100) */
  topMatchPercent?: number;
}

function mergeEstimate(
  estimate: CommunityEstimate | null | undefined,
  interpretation: DreamInterpretation,
  title: string,
  content = "",
): CommunityEstimate {
  const synthetic = generateSyntheticCommunity(interpretation, title, content, 1);
  if (!estimate) return synthetic;

  const clusterTitle = interpretation.researchAnchor?.clusterLabel?.trim();

  const anchor =
    interpretation.researchAnchor?.primary?.trim() ||
    title.trim() ||
    interpretation.keywords[0]?.trim() ||
    "";

  const aiStories = (estimate.stories ?? [])
    .map((story, i) => sanitizeAiCommunityStory(story, i, content, title, anchor))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const stories =
    aiStories.length > 0
      ? aiStories
      : isStrongAnchor(anchor)
        ? [buildCoherentStoryForKeyword(anchor, 0)]
        : [];

  const rawSamples =
    estimate.samples?.length >= 1
      ? estimate.samples.slice(0, stories.length)
      : stories.map((s) => ({
          title: s.dreamTitle,
          snippet: s.dreamSnippet,
          emotions: s.emotions,
        }));

  const samples = rawSamples
    .filter(
      (sample) =>
        !overlapsUserDreamFields(content, title, {
          title: sample.title,
          snippet: sample.snippet,
        }) &&
        !overlapsUserDreamFields(content, clusterTitle ?? "", {
          title: sample.title,
          snippet: sample.snippet,
        }),
    )
    .slice(0, Math.max(stories.length, 1));

  return {
    ...synthetic,
    totalCount: estimate.totalCount || synthetic.totalCount,
    withFollowUpCount:
      estimate.withFollowUpCount || synthetic.withFollowUpCount,
    keywords:
      estimate.keywords?.length >= 2 ? estimate.keywords : synthetic.keywords,
    emotionCounts:
      estimate.emotionCounts?.length >= 2
        ? estimate.emotionCounts
        : synthetic.emotionCounts,
    outcomes: estimate.outcomes ?? synthetic.outcomes,
    stories,
    samples,
    isEstimated: aiStories.length === 0,
  };
}

function ensureStories(
  summary: SimilarDreamSummary,
  fallback: CommunityEstimate,
  anchor = "",
): SimilarDreamSummary {
  if (summary.stories.length > 0) return summary;
  const coherent = buildCoherentStoryForKeyword(anchor || "꿈", 0);
  return {
    ...summary,
    stories: fallback.stories[0] ? [fallback.stories[0]] : [coherent],
    samples: summary.samples.length > 0 ? summary.samples : fallback.samples.slice(0, 1),
  };
}

export async function resolveCommunityData(
  interpretation: DreamInterpretation,
  options: {
    embedding?: number[];
    title?: string;
    content?: string;
    estimate?: CommunityEstimate | null;
  } = {},
): Promise<CommunityDataResult> {
  const { embedding, title = "", content = "", estimate } = options;
  const exposure = await getDataExposureConfig();
  const minReal = exposure.minRealCommunityCount || MIN_REAL_COMMUNITY_COUNT;
  const merged = mergeEstimate(estimate, interpretation, title, content);

  if (exposure.blendMode === "synthetic_only") {
    return {
      summary: estimateToSummary(merged, interpretation.category),
      stats: estimateToStats(merged),
      isEstimated: true,
    };
  }

  const scored = await findScoredSimilarDreams(
    embedding?.length ? embedding : undefined,
    interpretation.keywords,
    interpretation.category,
    collectDreamTags(interpretation),
  );
  const similar = scored.map((s) => s.dream);
  const topMatchPercent = scored[0]?.score.total;

  if (similar.length >= minReal) {
    const anchor =
      interpretation.researchAnchor?.primary?.trim() ||
      title.trim() ||
      interpretation.keywords[0]?.trim() ||
      "";
    const summary = ensureStories(
      buildSimilarDreamSummary(similar, interpretation.category),
      merged,
      anchor,
    );
    const stats = computeStats(similar);
    return { summary, stats, isEstimated: false, topMatchPercent };
  }

  if (exposure.blendMode === "organic_only") {
    return {
      summary: {
        totalCount: similar.length,
        withFollowUpCount: similar.filter((d) => d.followUp).length,
        category: interpretation.category,
        keywords: [],
        emotionCounts: [],
        samples: [],
        stories: [],
        isEstimated: false,
      },
      stats: computeStats(similar),
      isEstimated: false,
      topMatchPercent,
    };
  }

  return {
    summary: estimateToSummary(merged, interpretation.category),
    stats: estimateToStats(merged),
    isEstimated: merged.isEstimated,
  };
}
