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
  VIVID_STORY_PROFILES,
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

function keywordDreamTitle(anchor: string): string {
  const t = anchor.trim();
  if (!t) return "꿈";
  return t.includes("꿈") ? t : `${t} 꿈`;
}

/** 키워드 팩 없을 때 — 제목·본문·후기가 한 줄기로 맞음 */
function genericDreamTitle(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const templates = [
    `${k} 앞에서 한참 멈춰 있던 꿈`,
    `깨고 나서도 ${k}만 떠오른 새벽`,
    `${k} 주변을 계속 맴돌던 꿈`,
    `말없이 바라본 ${k} 장면`,
  ];
  return templates[index % templates.length] ?? keywordDreamTitle(k);
}

function genericKeywordSnippet(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const templates = [
    `꿈에서 계속 남은 건 "${k}"였어요. 장소는 낯설었는데 그 주변만 이상하게 또렷했습니다. 깨고 나서도 왜 그 장면을 오래 보고 있었는지 계속 생각났어요.`,
    `"${k}" 근처에 서 있었고, 누군가를 기다리는 느낌이었습니다. 특별한 사건은 없었는데 몸이 먼저 긴장해 있었어요. 아침에 일어나서 바로 메모해 뒀습니다.`,
    `처음엔 평범한 꿈인 줄 알았는데 마지막에 "${k}" 장면만 크게 남았습니다. 소리나 대사는 거의 기억나지 않았어요. 대신 그때의 공기와 기분이 오래 갔습니다.`,
    `"${k}"을(를) 지나치려는데 발이 잘 떨어지지 않았습니다. 무섭다기보다는 신경이 쓰이는 쪽에 가까웠어요. 깨고 나니 그 단어부터 검색하게 됐습니다.`,
  ];
  return ensureMultiline(templates[index % templates.length] ?? templates[0]);
}

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

function buildStoryAt(
  rand: () => number,
  anchorKeyword: string,
  pack: KeywordNarrativePack,
  index: number,
): CommunityStory {
  const curatedPack = getKeywordNarrativePack(anchorKeyword);
  const outcome = pickOutcome(rand, pack);
  const slot = curatedPack
    ? index % curatedPack.dreamSnippets.length
    : 0;

  const dreamTitle = curatedPack
    ? curatedPack.titles[slot % curatedPack.titles.length]!
    : genericDreamTitle(anchorKeyword, index);
  const dreamSnippet = curatedPack
    ? curatedPack.dreamSnippets[slot]!
    : genericKeywordSnippet(anchorKeyword, index);
  const afterStory = curatedPack
    ? pickAfterStory(outcome, curatedPack, rand)
    : pickAfterStory(outcome, pack, rand);

  const emotions: DreamEmotionId[] = [
    EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)],
    ...(rand() > 0.4 ? [EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)]] : []),
  ];
  const daysAgo = seededInt(rand, 3, 41);

  return {
    id: formatObservatoryId(anchorKeyword, index),
    dreamTitle,
    dreamSnippet,
    emotions,
    outcomeCategory: outcome,
    afterStory,
    recordedDaysAgo: daysAgo,
    profile: PROFILES[index % PROFILES.length],
  };
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
  const seed = buildSeed(interpretation, anchor, anchor) + index * 997;
  const rand = createSeededRandom(seed);
  return buildStoryAt(rand, anchor, pack, index);
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

  const stories = generateStories(rand, anchor, pack, storyCount);

  const samples = stories.slice(0, Math.min(8, storyCount)).map((s) => ({
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
  const content = `"${anchor}" 꿈을 기록해 두고 한 달 뒤에 다시 읽었습니다. 장면은 제각각이어도 남는 감정이 비슷한 경우가 있더라고요.`;
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
