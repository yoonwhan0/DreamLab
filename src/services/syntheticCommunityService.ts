import { resolveResearchAnchor, extractDreamExcerpts, excerptToStoryTitle } from "@/lib/dreamAnchor";
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

const PROFILES = [
  "관측자 #A-2847 · 20대",
  "관측자 #B-1092 · 30대",
  "관측자 #C-4418 · 20대",
  "관측자 #D-7731 · 40대",
  "관측자 #E-3305 · 30대",
  "관측자 #F-9024 · 20대",
  "관측자 #G-1566 · 30대",
  "관측자 #H-6682 · 40대",
];

const GENERIC_AFTER: Record<OutcomeCategory, string[]> = {
  nothing: [
    "30일이 지나도 딱히 큰 일은 없었어요. 꿈에서 느낀 공포와 달리, 현실은 조용히 흘렀습니다. 돌아보니 괜히 마음만 앞섰던 것 같아요.",
    "별일 없이 지나갔습니다. 기록해둔 덕분에 '혹시 큰일 나면 어쩌지' 하는 생각이 조금 가라앉았어요.",
    "특별한 변화는 없었지만, 비슷한 꿈은 다시 꾸지 않았어요. 마음이 정리된 느낌입니다.",
  ],
  good: [
    "기대하지 않았던 좋은 소식이 있었어요. 꿈과 직접 연결되진 않지만, 한동안 무거웠던 마음이 가벼워졌습니다.",
    "오래 고민하던 일이 풀렸어요. 꿈 이후로 '최악만 상상하던 버릇'을 멈추니 일이 순조로워진 것 같아요.",
  ],
  bad: [
    "한 달 안에 관계에서 큰 싸움이 났어요. 꿈에서 느낀 배신감이 현실로 번진 것 같기도 했습니다. 그래도 대화로 정리했고, 지금은 그때보다 마음이 편해요.",
    "직장에서 갑작스러운 압박이 있었어요. 꿈이 경고였는지는 모르겠지만, 힘든 시기였습니다.",
  ],
  love: [
    "30일 후 연락이 왔어요. 꿈의 그리움과 비슷한 감정이었지만, 서두르지 않아도 괜찮다는 걸 알게 됐어요.",
    "새 만남이 있었어요. 꿈 이후로 '혼자가 아니다'는 감각이 조금 돌아왔습니다.",
  ],
  job: [
    "중요한 결정을 내려야 했어요. 꿈 이후로 '최악을 상정'하기보다 선택에 집중할 수 있었습니다.",
    "업무 스트레스가 peak였습니다. 그래도 한 달 뒤엔 '그때도 버텼구나' 하고 스스로를 인정하게 됐어요.",
  ],
  health: [
    "검진·컨디션 이슈로 긴장했어요. 꿈의 불길함이 겹쳐 더 무서웠습니다. 결과는 대부분 괜찮았고, 몸을 챙기는 계기가 됐어요.",
  ],
  family: [
    "가족과 오랜 갈등이 다시 떠올랐어요. 날카롭게 부딪히는 일도 있었습니다. 그래도 대화로 조금씩 풀렸어요.",
  ],
  money: [
    "예상치 못한 지출이 터졌어요. 꿈의 '손재'와 겹쳐 패닉이 났습니다. 계획을 세우고 결국 정리됐어요.",
    "돈 문제로 며칠 밤을 지샜어요. 한 달 뒤 돌아보니 '그때도 넘어갔다'는 게 위로가 됐어요.",
  ],
  other: [
    "꿈과 직접 연결되긴 어렵지만, 그 한 달 동안 방향을 다시 생각했어요. 혼란스러웠지만, 지금은 조금 선명해졌습니다.",
  ],
};

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
    : [26, 10, 20, 10, 8, 7, 6, 4, 9];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return keys[i];
  }
  return "nothing";
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
  interpretation: DreamInterpretation,
  title: string,
  content: string,
  count = 8,
): CommunityStory[] {
  const excerpts = extractDreamExcerpts(`${title}\n${content}`, count);
  const clusterTitle = interpretation.researchAnchor?.clusterLabel?.trim();

  return Array.from({ length: count }, (_, i) => {
    const outcome = pickOutcome(rand, pack);
    const fromUser = excerpts[i];
    const snippet =
      fromUser ??
      pack.dreamSnippets[i % pack.dreamSnippets.length] ??
      pack.dreamSnippets[0]!;
    const dreamTitle =
      i === 0 && clusterTitle
        ? clusterTitle
        : fromUser
          ? excerptToStoryTitle(fromUser)
          : (pack.titles[i % pack.titles.length] ?? pack.titles[0]!);
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
  const anchor = resolveAnchorKeyword(title, interpretation);
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

  const stories = generateStories(
    rand,
    anchor,
    pack,
    interpretation,
    title,
    content,
    8,
  );

  const samples = stories.slice(0, 5).map((s) => ({
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
  const interpretation: DreamInterpretation = {
    usualTake: "",
    symbol: "",
    psychology: "",
    reflection: "",
    keywords: [anchor, ...pack.relatedKeywords.slice(0, 2)],
    category: inferCategoryFromKeyword(anchor),
  };
  return generateSyntheticCommunity(interpretation, anchor, anchor);
}
