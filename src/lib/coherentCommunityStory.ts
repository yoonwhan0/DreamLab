import { formatObservatoryId } from "@/lib/observatoryCredibility";
import {
  getKeywordNarrativePack,
  resolveNarrativePack,
  type KeywordNarrativePack,
} from "@/lib/keywordNarratives";
import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";
import { VIVID_AFTER_BY_OUTCOME, VIVID_DREAM_SCENES } from "@/lib/vividPreviewCopy";
import type { CommunityStory, DreamEmotionId, OutcomeCategory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

export const ANONYMOUS_STORY_PROFILE = "익명 기록";

const EMOTION_POOL: DreamEmotionId[] = ["scared", "weird", "calm", "sad", "happy"];

const GENERIC_DREAM_TITLE_TEMPLATES = [
  (k: string) => `${k} 앞에서 한참 멈춰 있던 꿈`,
  (k: string) => `깨고 나서도 ${k}만 떠오른 새벽`,
  (k: string) => `${k} 주변을 계속 맴돌던 꿈`,
  (k: string) => `말없이 바라본 ${k} 장면`,
  (k: string) => `${k} 쪽으로 다시 돌아간 꿈`,
  (k: string) => `${k}만 이상하게 또렷했던 밤`,
  (k: string) => `아무 말 없이 지나친 ${k}`,
  (k: string) => `${k} 근처에서 길을 잃은 꿈`,
] as const;

const GENERIC_DREAM_SNIPPETS = [
  (k: string) =>
    `꿈에서 계속 남은 건 "${k}"였어요. 장소는 낯설었는데 그 주변만 이상하게 또렷했습니다. 깨고 나서도 왜 그 장면을 오래 보고 있었는지 계속 생각났어요.`,
  (k: string) =>
    `"${k}" 근처에 서 있었고, 누군가를 기다리는 느낌이었습니다. 특별한 사건은 없었는데 몸이 먼저 긴장해 있었어요. 아침에 일어나서 바로 메모해 뒀습니다.`,
  (k: string) =>
    `처음엔 평범한 꿈인 줄 알았는데 마지막에 "${k}" 장면만 크게 남았습니다. 소리나 대사는 거의 기억나지 않았어요. 대신 그때의 공기와 기분이 오래 갔습니다.`,
  (k: string) =>
    `"${k}" 앞에서 발이 잘 떨어지지 않았습니다. 무섭다기보다는 신경이 쓰이는 쪽에 가까웠어요. 깨고 나니 그 단어부터 검색하게 됐습니다.`,
  (k: string) =>
    `길을 걷다가 갑자기 "${k}" 앞에서 멈췄습니다. 주변 사람들은 아무렇지 않게 지나갔는데 저만 그 장면을 오래 보고 있었어요. 깬 뒤에도 그 이상한 정적이 남았습니다.`,
  (k: string) =>
    `"${k}"이 가까워졌다가 멀어지는 장면이 반복됐습니다. 꿈속에서는 이유를 알고 있는 것 같았는데, 깨고 나니 설명이 잘 안 됐어요. 그래서 잊기 전에 문장으로 남겼습니다.`,
  (k: string) =>
    `낯선 장소였지만 "${k}"만은 현실처럼 선명했습니다. 손으로 만져보려는데 닿기 직전에 장면이 바뀌었어요. 아침까지 그 아쉬운 느낌이 계속 남았습니다.`,
  (k: string) =>
    `꿈속에서 저는 계속 "${k}" 쪽으로 돌아가고 있었습니다. 누가 부른 것도 아닌데 발길이 그쪽으로 갔어요. 깨어난 뒤에는 그게 무엇을 확인하고 싶었던 건지 궁금했습니다.`,
] as const;

const DREAM_DETAIL_LINES = [
  (k: string) => `깬 뒤에는 "${k}"이라는 단어보다 그때의 몸 상태가 더 오래 남았습니다.`,
  (k: string) => `나중에 다시 읽어보려고 "${k}" 주변의 색, 소리, 거리감까지 적어 두었습니다.`,
  (k: string) => `그 장면이 좋은지 나쁜지 바로 판단하기보다는, 왜 "${k}"에서 멈췄는지 보려고 했습니다.`,
  (k: string) => `평소라면 지나쳤을 장면인데 꿈에서는 "${k}"만 오래 붙잡고 있었습니다.`,
] as const;

const AFTER_DETAIL_LINES: Record<OutcomeCategory, string[]> = {
  good: [
    "한 달 뒤 다시 보니 그때의 긴장이 조금 풀려 있었습니다.",
    "기록을 남겨둔 덕분에 좋은 쪽으로 바뀐 부분도 더 잘 보였습니다.",
  ],
  bad: [
    "그 시기를 지나고 나서야 제가 얼마나 예민했는지 알았습니다.",
    "꿈이 맞았다기보다, 이미 마음이 많이 지쳐 있었다는 쪽에 가까웠습니다.",
  ],
  love: [
    "감정이 바로 정리되진 않았지만, 예전처럼 서두르지는 않았습니다.",
    "한 달 뒤에는 관계를 조금 더 천천히 보게 됐습니다.",
  ],
  job: [
    "그 뒤로 일정과 할 일을 종이에 다시 적어 보면서 조금 정리됐습니다.",
    "결과보다 준비 과정에서 제가 어디에 눌려 있었는지가 보였습니다.",
  ],
  health: [
    "한 달 뒤에는 수면과 컨디션을 먼저 확인하는 습관이 생겼습니다.",
    "큰 문제로 이어지진 않았지만 몸이 보내는 신호를 덜 무시하게 됐습니다.",
  ],
  family: [
    "가족 이야기를 바로 꺼내진 못했지만, 연락을 미루지는 않게 됐습니다.",
    "그 뒤로 오래 묵은 감정을 조금씩 나눠 보려고 했습니다.",
  ],
  money: [
    "숫자를 직접 확인하고 나서야 막연한 불안이 조금 줄었습니다.",
    "한 달 뒤에는 지출을 미루지 않고 바로 적어두기 시작했습니다.",
  ],
  other: [
    "큰 사건보다 감정의 방향을 확인한 기록에 가까웠습니다.",
    "다시 읽어보니 꿈보다 그때의 생활 리듬이 더 선명하게 보였습니다.",
  ],
};

function storyLines(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?。])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clampStoryLines(lines: string[]): string {
  return lines.slice(0, 5).join("\n");
}

export function storyRelatesToAnchor(text: string, anchor: string): boolean {
  const k = anchor.trim();
  if (!k || k === "꿈") return true;
  if (text.includes(k)) return true;
  const tokens = k.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.some((t) => text.includes(t));
}

export function isGenericVividPoolSnippet(snippet: string): boolean {
  const head = snippet.trim().slice(0, 28);
  if (!head) return false;
  return VIVID_DREAM_SCENES.some(
    (scene) => scene.startsWith(head) || head.startsWith(scene.slice(0, 28)),
  );
}

export function genericDreamTitle(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const variant = Math.abs(hashSeed(`generic-title-${k}-${index}`));
  return GENERIC_DREAM_TITLE_TEMPLATES[variant % GENERIC_DREAM_TITLE_TEMPLATES.length]!(k);
}

export function genericKeywordSnippet(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const variant = Math.abs(hashSeed(`generic-snippet-${k}-${index}`));
  const base = GENERIC_DREAM_SNIPPETS[variant % GENERIC_DREAM_SNIPPETS.length]!(k);
  return ensureDreamStoryLines(base, k, index);
}

export function ensureDreamStoryLines(text: string, anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const lines = storyLines(text);
  let offset = 0;
  while (lines.length < 3 && offset < DREAM_DETAIL_LINES.length) {
    lines.push(DREAM_DETAIL_LINES[(index + offset) % DREAM_DETAIL_LINES.length]!(k));
    offset += 1;
  }
  return clampStoryLines(lines);
}

export function ensureAfterStoryLines(
  text: string,
  outcome: OutcomeCategory,
  index: number,
  anchor = "",
): string {
  const lines = storyLines(text);
  const extras = AFTER_DETAIL_LINES[outcome] ?? AFTER_DETAIL_LINES.other;
  let offset = 0;
  while (lines.length < 3 && offset < extras.length) {
    lines.push(extras[(index + offset) % extras.length]!);
    offset += 1;
  }
  const k = anchor.trim();
  if (k && k !== "꿈" && !lines.some((line) => storyRelatesToAnchor(line, k))) {
    lines.push(`한 달 뒤 돌아보니 "${k}" 장면이 왜 자꾸 떠올랐는지 조금 더 보였습니다.`);
  }
  return clampStoryLines(lines);
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
  const pool = custom?.length ? custom : VIVID_AFTER_BY_OUTCOME[outcome];
  return pool[seededInt(rand, 0, pool.length - 1)] ?? pool[0];
}

/** 키워드 하나에 제목·꿈·30일 후기가 같은 맥락으로 맞춰진 후기 1건 */
export function buildCoherentStoryForKeyword(keyword: string, index = 0): CommunityStory {
  const anchor = keyword.trim() || "꿈";
  const curated = getKeywordNarrativePack(anchor);
  const pack = resolveNarrativePack(anchor);
  const seed = hashSeed(`coherent-story-${anchor}-${index}`);
  const rand = createSeededRandom(seed);
  const outcome = pickOutcome(rand, pack);
  const slot = curated ? index % curated.dreamSnippets.length : index;

  const dreamTitle = curated
    ? curated.titles[slot % curated.titles.length]!
    : genericDreamTitle(anchor, index);
  const dreamSnippet = curated
    ? ensureDreamStoryLines(curated.dreamSnippets[slot]!, anchor, index)
    : genericKeywordSnippet(anchor, index);
  const afterStory = pickAfterStory(outcome, curated ?? pack, rand);

  const emotions: DreamEmotionId[] = [
    EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)],
    ...(rand() > 0.4 ? [EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)]] : []),
  ];

  return {
    id: formatObservatoryId(anchor, index),
    dreamTitle,
    dreamSnippet,
    emotions,
    outcomeCategory: outcome,
    afterStory: ensureAfterStoryLines(afterStory, outcome, index, anchor),
    recordedDaysAgo: seededInt(rand, 7, 35),
    profile: ANONYMOUS_STORY_PROFILE,
  };
}

/** 제목·꿈·후기가 서로 다른 소스에서 섞이지 않도록 정렬 */
export function alignStoryToKeyword(
  story: CommunityStory,
  anchor: string,
  index: number,
): CommunityStory {
  const k = anchor.trim() || "꿈";
  const coherent = buildCoherentStoryForKeyword(k, index);
  const snippetOk =
    !isGenericVividPoolSnippet(story.dreamSnippet) &&
    storyRelatesToAnchor(story.dreamSnippet, k);
  const titleOk =
    story.dreamTitle.trim().length > 0 &&
    (storyRelatesToAnchor(story.dreamTitle, k) || storyRelatesToAnchor(story.dreamTitle, story.dreamSnippet));
  const afterOk = storyRelatesToAnchor(story.afterStory, k) || story.afterStory.length >= 40;

  if (snippetOk && titleOk && afterOk) {
    return {
      ...story,
      dreamSnippet: ensureDreamStoryLines(story.dreamSnippet, k, index),
      afterStory: ensureAfterStoryLines(story.afterStory, story.outcomeCategory, index, k),
      profile: ANONYMOUS_STORY_PROFILE,
    };
  }

  return {
    ...coherent,
    afterStory: afterOk
      ? ensureAfterStoryLines(story.afterStory, story.outcomeCategory, index, k)
      : coherent.afterStory,
    outcomeCategory: afterOk ? story.outcomeCategory : coherent.outcomeCategory,
    emotions: story.emotions.length > 0 ? story.emotions : coherent.emotions,
    profile: ANONYMOUS_STORY_PROFILE,
  };
}
