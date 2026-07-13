import { resolveResearchAnchor } from "@/lib/dreamAnchor";
import {
  buildCoherentStoryForKeyword,
  isManualStoryKeyword,
} from "@/lib/coherentCommunityStory";
import { getKeywordNarrativePack } from "@/lib/keywordNarratives";
import {
  cohortSizeForKeyword,
  humanizeCount,
} from "@/lib/observatoryCredibility";
import {
  resolveNarrativePack,
  inferCategoryFromKeyword,
  type KeywordNarrativePack,
} from "@/lib/keywordNarratives";
import { createSeededRandom, hashSeed } from "@/lib/seededRandom";
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

function buildStoryAt(
  _rand: () => number,
  anchorKeyword: string,
  _pack: KeywordNarrativePack,
  index: number,
): CommunityStory {
  return buildCoherentStoryForKeyword(anchorKeyword, index);
}

function generateStories(
  rand: () => number,
  anchorKeyword: string,
  pack: KeywordNarrativePack,
  count = 12,
): CommunityStory[] {
  return Array.from({ length: count }, (_, i) =>
    buildStoryAt(rand, anchorKeyword, pack, i),
  );
}

/** 탐색 더보기 — 키워드 팩에 정의된 N번째 후기만 (랜덤 조합 없음) */
export function generateSyntheticStoryAt(keyword: string, index: number): CommunityStory | null {
  const curated = getKeywordNarrativePack(keyword);
  if (!curated || index >= curated.dreamSnippets.length) return null;

  const anchor = keyword.trim() || "꿈";
  const pack = resolveNarrativePack(anchor);
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
  const seed = hashSeed(`${anchor}|${interpretation.category}|${interpretation.keywords.join(",")}`) + index * 997;
  const rand = createSeededRandom(seed);
  return buildStoryAt(rand, anchor, pack, index);
}

function buildSeed(interpretation: DreamInterpretation, title = "", anchor = ""): number {
  return hashSeed(
    `${title}|${anchor}|${interpretation.category}|${interpretation.keywords.join(",")}`,
  );
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

/**
 * 후기 결말 분포 — 표시되는 후기 1~4건이 아니라 코호트 전체(withFollowUpCount) 기준으로
 * 여러 카테고리에 현실적으로 분산한다. (예전엔 후기 수만큼만 집계해 "건강 100%"처럼 나옴)
 */
function distributeOutcomes(
  pack: KeywordNarrativePack,
  rand: () => number,
  withFollowUpCount: number,
): Record<OutcomeCategory, number> {
  const keys = Object.keys(OUTCOME_CATEGORIES) as OutcomeCategory[];
  const outcomes = keys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<OutcomeCategory, number>);

  if (withFollowUpCount <= 0) return outcomes;

  // 팩이 해당 결말에 맞춤 후기를 가지고 있으면 그 방향이 더 자주 나오도록 가중
  const weights = keys.map((key) => {
    const hasCustom = (pack.afterByOutcome[key]?.length ?? 0) > 0;
    const base = hasCustom ? 18 : 6;
    return base * (0.7 + rand() * 0.6);
  });
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;

  let assigned = 0;
  keys.forEach((key, i) => {
    const n = Math.floor((weights[i]! / totalW) * withFollowUpCount);
    outcomes[key] = n;
    assigned += n;
  });

  // 반올림으로 남은 표는 가중치 큰 결말부터 1개씩 채운다
  const order = keys
    .map((key, i) => ({ key, weight: weights[i]! }))
    .sort((a, b) => b.weight - a.weight);
  let leftover = withFollowUpCount - assigned;
  let oi = 0;
  while (leftover > 0) {
    outcomes[order[oi % order.length]!.key] += 1;
    leftover -= 1;
    oi += 1;
  }

  return outcomes;
}

export function generateSyntheticCommunity(
  interpretation: DreamInterpretation,
  title = "",
  content = "",
  storyCount = 1,
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

  const stories =
    storyCount <= 1
      ? [buildCoherentStoryForKeyword(anchor, 0)]
      : generateStories(rand, anchor, pack, storyCount);

  const samples = stories.slice(0, Math.min(8, storyCount)).map((s) => ({
    title: s.dreamTitle,
    snippet: s.dreamSnippet,
    emotions: s.emotions,
  }));

  const outcomes = distributeOutcomes(pack, rand, withFollowUpCount);

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
  const raw = keyword.trim();
  const anchor = isManualStoryKeyword(raw) ? raw : "시험";
  const pack = resolveNarrativePack(anchor);
  const content = `${anchor} 꿈을 기록해 두고 한 달 뒤에 다시 읽었습니다. 장면은 제각각이어도 남는 감정이 비슷한 경우가 있더라고요.`;
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
  return generateSyntheticCommunity(interpretation, anchor, content, 1);
}

export function resolveAnchorKeyword(
  title: string,
  interpretation: DreamInterpretation,
  content = "",
): string {
  return resolveResearchAnchor(interpretation, title, content);
}
