import {
  estimateToStats,
  estimateToSummary,
  generateSyntheticCommunity,
} from "@/services/syntheticCommunityService";
import {
  buildSimilarDreamSummary,
  computeStats,
  findSimilarDreams,
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
  mergeCommunityStories,
  overlapsUserDreamFields,
  sanitizeAiCommunityStory,
} from "@/lib/communityStoryQuality";

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
}

function mergeEstimate(
  estimate: CommunityEstimate | null | undefined,
  interpretation: DreamInterpretation,
  title: string,
  content = "",
): CommunityEstimate {
  const synthetic = generateSyntheticCommunity(interpretation, title, content);
  if (!estimate) return synthetic;

  const clusterTitle = interpretation.researchAnchor?.clusterLabel?.trim();

  const aiStories = (estimate.stories ?? [])
    .map((story, i) => sanitizeAiCommunityStory(story, i, content, title))
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const stories = mergeCommunityStories(aiStories, synthetic.stories);
  const rawSamples =
    estimate.samples?.length >= 3
      ? estimate.samples
      : stories.slice(0, 5).map((s) => ({
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
    .concat(
      synthetic.samples.filter(
        (sample) =>
          !overlapsUserDreamFields(content, title, {
            title: sample.title,
            snippet: sample.snippet,
          }),
      ),
    )
    .slice(0, 5);

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
    isEstimated: true,
  };
}

function ensureStories(
  summary: SimilarDreamSummary,
  fallback: CommunityEstimate,
): SimilarDreamSummary {
  if (summary.stories.length >= 3) return summary;
  return {
    ...summary,
    stories: fallback.stories,
    samples: summary.samples.length > 0 ? summary.samples : fallback.samples,
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

  const similar = await findSimilarDreams(
    embedding?.length ? embedding : undefined,
    interpretation.keywords,
    interpretation.category,
  );

  if (similar.length >= minReal) {
    const summary = ensureStories(
      buildSimilarDreamSummary(similar, interpretation.category),
      merged,
    );
    const stats = computeStats(similar);
    return { summary, stats, isEstimated: false };
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
    };
  }

  return {
    summary: estimateToSummary(merged, interpretation.category),
    stats: estimateToStats(merged),
    isEstimated: true,
  };
}
