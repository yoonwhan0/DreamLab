import { resolveResearchAnchor } from "@/lib/dreamAnchor";
import { getKeywordNarrativePack } from "@/lib/keywordNarratives";
import {
  formatObservatoryId,
  cohortSizeForKeyword,
  humanizeCount,
} from "@/lib/observatoryCredibility";
import {
  resolveNarrativePack,
  inferCategoryFromKeyword,
  type KeywordNarrativePack,
} from "@/lib/keywordNarratives";
import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";
import { ensureMultiline } from "@/lib/interpretationTone";
import {
  VIVID_AFTER_BY_OUTCOME,
  VIVID_DREAM_TITLES,
  VIVID_STORY_PROFILES,
  pickVividScene,
} from "@/lib/vividPreviewCopy";
import type {
  CommunityEstimate,
  CommunityStory,
  DreamEmotionId,
  DreamInterpretation,
  DreamStats,
  OutcomeCategory,
  SimilarDreamSummary,
} from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

const EMOTION_POOL: DreamEmotionId[] = [
  "scared",
  "weird",
  "calm",
  "sad",
  "happy",
];

const PROFILES = [...VIVID_STORY_PROFILES];

const GENERIC_AFTER: Record<OutcomeCategory, string[]> = VIVID_AFTER_BY_OUTCOME;

export function resolveAnchorKeyword(
  title: string,
  interpretation: DreamInterpretation,
  content = "",
): string {
  return resolveResearchAnchor(interpretation, title, content);
}

function buildSeed(interpretation: DreamInterpretation, title = "", anchor = ""): number {
  return hashSeed(
    `${title}|${anchor}|${interpretation.category}|${interpretation.keywords.join(",")}`,
  );
}

function pickOutcome(rand: () => number, pack: KeywordNarrativePack): OutcomeCategory {
  const keys = Object.keys(OUTCOME_CATEGORIES) as OutcomeCategory[];
  const hasCustom = Object.keys(pack.afterByOutcome).length > 0;
  const weights = hasCustom
    ? keys.map((k) => (pack.afterByOutcome[k]?.length ? 22 : 8))
    : [12, 22, 12, 10, 9, 8, 7, 20];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return keys[i]!;
  }
  return "other";
}

function pickAfterStory(
  outcome: OutcomeCategory,
  pack: KeywordNarrativePack,
  rand: () => number,
): string {
  const custom = pack.afterByOutcome[outcome];
  const pool = custom?.length ? custom : GENERIC_AFTER[outcome];
  return ensureMultiline(pool[seededInt(rand, 0, pool.length - 1)] ?? pool[0]);
}

function generateStories(
  rand: () => number,
  anchorKeyword: string,
  pack: KeywordNarrativePack,
  count = 12,
): CommunityStory[] {
  const curatedPack = getKeywordNarrativePack(anchorKeyword);

  return Array.from({ length: count }, (_, i) => {
    const outcome = pickOutcome(rand, pack);
    const snippet = curatedPack
      ? curatedPack.dreamSnippets[i % curatedPack.dreamSnippets.length]!
      : pickVividScene(i + hashSeed(`${anchorKeyword}-${i}`));
    const dreamTitle = curatedPack
      ? curatedPack.titles[i % curatedPack.titles.length]!
      : VIVID_DREAM_TITLES[i % VIVID_DREAM_TITLES.length]!;
    const emotions: DreamEmotionId[] = [
      EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)],
      ...(rand() > 0.4
        ? [EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)]]
        : []),
    ];
    const daysAgo = seededInt(rand, 3, 41);

    return {
      id: formatObservatoryId(anchorKeyword, i),
      dreamTitle,
      dreamSnippet: snippet,
      emotions,
      outcomeCategory: outcome,
      afterStory: pickAfterStory(outcome, pack, rand),
      recordedDaysAgo: daysAgo,
      profile: PROFILES[i % PROFILES.length],
    };
  });
}

function buildCounts(
  rand: () => number,
  pack: KeywordNarrativePack,
  anchor: string,
  interpretation: DreamInterpretation,
  totalCount: number,
) {
  const keywordList = [
    anchor,
    ...pack.relatedKeywords,
    ...interpretation.keywords.filter((k) => k !== anchor),
  ].slice(0, 6);

  const keywords = keywordList.map((keyword, i) => {
    const ratio = 0.58 - i * 0.085;
    const raw = Math.round(totalCount * ratio * (0.78 + rand() * 0.44));
    return {
      keyword,
      count: humanizeCount(Math.max(17, raw), hashSeed(`${anchor}-kw-${i}`)),
    };
  });

  const emotionCounts = EMOTION_POOL.slice(0, 5).map((emotion, i) => {
    const raw = Math.round(totalCount * (0.44 - i * 0.07) * (0.82 + rand() * 0.36));
    return {
      emotion,
      count: humanizeCount(Math.max(11, raw), hashSeed(`${anchor}-em-${i}`)),
    };
  });

  return { keywords, emotionCounts };
}

export function generateSyntheticCommunity(
  interpretation: DreamInterpretation,
  title = "",
  content = "",
): CommunityEstimate {
  const anchor = resolveAnchorKeyword(title, interpretation, content);
  const pack = resolveNarrativePack(anchor);
  const seed = buildSeed(interpretation, title, anchor);
  const rand = createSeededRandom(seed);

  const totalCount = cohortSizeForKeyword(anchor, pack.countRange);
  const followUpRate = pack.followUpRate + (rand() - 0.5) * 0.04;
  const withFollowUpCount = humanizeCount(
    Math.round(totalCount * followUpRate),
    seed + 1,
  );

  const { keywords, emotionCounts } = buildCounts(
    rand,
    pack,
    anchor,
    interpretation,
    totalCount,
  );

  const stories = generateStories(rand, anchor, pack, 12);

  const samples = stories.slice(0, 8).map((s) => ({
    title: s.dreamTitle,
    snippet: s.dreamSnippet,
    emotions: s.emotions,
  }));

  const outcomes = Object.keys(OUTCOME_CATEGORIES).reduce(
    (acc, key) => {
      acc[key as OutcomeCategory] = 0;
      return acc;
    },
    {} as Record<OutcomeCategory, number>,
  );

  for (const story of stories) {
    outcomes[story.outcomeCategory]++;
  }

  const keys = Object.keys(outcomes) as OutcomeCategory[];
  const storyTotal = keys.reduce((sum, key) => sum + outcomes[key], 0);
  if (storyTotal > 0 && withFollowUpCount > 0) {
    let assigned = 0;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        outcomes[key] = Math.max(0, withFollowUpCount - assigned);
      } else {
        const n = Math.round((outcomes[key] / storyTotal) * withFollowUpCount);
        outcomes[key] = n;
        assigned += n;
      }
    });
  }

  return {
    totalCount,
    withFollowUpCount,
    keywords,
    emotionCounts,
    samples,
    stories,
    outcomes,
    isEstimated: true,
  };
}

export function estimateToSummary(
  estimate: CommunityEstimate,
  category: string,
): SimilarDreamSummary {
  return {
    totalCount: estimate.totalCount,
    withFollowUpCount: estimate.withFollowUpCount,
    category,
    keywords: estimate.keywords,
    emotionCounts: estimate.emotionCounts,
    samples: estimate.samples,
    stories: estimate.stories,
    isEstimated: estimate.isEstimated,
  };
}

export function estimateToStats(estimate: CommunityEstimate): DreamStats {
  const totalDreams = estimate.totalCount;
  const totalWithFollowUp = estimate.withFollowUpCount;
  const survivalRate =
    totalDreams > 0
      ? Math.round((totalWithFollowUp / totalDreams) * 100)
      : 0;

  return {
    totalDreams,
    totalWithFollowUp,
    survivalRate,
    outcomes: estimate.outcomes,
    topEmotions: estimate.emotionCounts.map(({ emotion, count }) => ({
      emotion,
      count,
    })),
    isEstimated: true,
  };
}

export function previewCommunityForKeyword(keyword: string) {
  const anchor = keyword.trim() || "꿈";
  const pack = resolveNarrativePack(anchor);
  const content = `"${anchor}" 꿈 검색하다가 여기 후기 보고 소름 — 장면은 제각각인데 기분은 비슷하더라고요.`;
  const interpretation: DreamInterpretation = {
    usualTake: "",
    symbol: "",
    psychology: "",
    reflection: "",
    keywords: [anchor, ...pack.relatedKeywords.slice(0, 2)],
    category: inferCategoryFromKeyword(anchor),
    researchAnchor: {
      primary: anchor,
      clusterLabel: `${anchor} 관련 꿈`,
    },
  };
  return generateSyntheticCommunity(interpretation, anchor, content);
}
