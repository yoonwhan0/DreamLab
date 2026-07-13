/**
 * 재미 요소 — 정량 신호(희귀도·감정온도·꿈 MBTI)를 **결정론적으로** 계산.
 * 같은 꿈이면 항상 같은 값이 나오도록 시드 기반. AI 호출·비용 없음.
 */

import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";
import type { DreamElements, DreamInterpretation } from "@/types";

export interface DreamRarity {
  /** 1~5 */
  stars: number;
  /** 상위 N% (작을수록 희귀) */
  topPercent: number;
  label: string;
}

export interface EmotionTemperature {
  bars: { label: string; value: number }[];
  /** 대표 온도 문구 */
  headline: string;
}

export interface DreamMbti {
  type: string;
  label: string;
}

const RARITY_LABELS = [
  "흔한 꿈",
  "가끔 보이는 꿈",
  "드문 꿈",
  "희귀한 꿈",
  "아주 희귀한 꿈",
];

function seedFor(interpretation: DreamInterpretation, extra = ""): number {
  const anchor =
    interpretation.researchAnchor?.primary ??
    interpretation.keywords[0] ??
    interpretation.category ??
    "dream";
  return hashSeed(`${anchor}|${interpretation.category}|${extra}`);
}

function countElements(elements?: DreamElements): number {
  if (!elements) return 0;
  return (
    elements.people.length +
    elements.places.length +
    elements.actions.length +
    elements.objects.length +
    elements.events.length +
    elements.symbols.length
  );
}

/**
 * 희귀도 — 요소 조합이 특이할수록, 코호트가 작을수록 희귀.
 * cohortSize(같은 키워드 기록 수)가 있으면 반영, 없으면 요소 다양성으로 추정.
 */
export function computeRarity(
  interpretation: DreamInterpretation,
  cohortSize?: number,
): DreamRarity {
  const rand = createSeededRandom(seedFor(interpretation, "rarity"));

  // 요소가 많고 다양할수록 희귀 점수 ↑
  const elementScore = Math.min(countElements(interpretation.elements), 12) / 12; // 0~1
  const symbolScore = Math.min(interpretation.elements?.symbols.length ?? 0, 4) / 4;

  // 코호트가 작을수록 희귀 (log 스케일). 없으면 시드 난수로 안정적 추정.
  let cohortScore: number;
  if (typeof cohortSize === "number" && cohortSize > 0) {
    // 50명↓ → 희귀, 5000명↑ → 흔함
    const clamped = Math.max(20, Math.min(cohortSize, 8000));
    cohortScore = 1 - (Math.log10(clamped) - Math.log10(20)) / (Math.log10(8000) - Math.log10(20));
  } else {
    cohortScore = 0.35 + rand() * 0.45;
  }

  const raw = elementScore * 0.3 + symbolScore * 0.25 + cohortScore * 0.45; // 0~1
  const stars = Math.max(1, Math.min(5, Math.round(1 + raw * 4)));

  // 상위 %: 희귀할수록 작게 (1~48%)
  const topPercent = Math.max(1, Math.round((1 - raw) * 47) + 1);

  return {
    stars,
    topPercent,
    label: RARITY_LABELS[stars - 1] ?? "드문 꿈",
  };
}

/** 감정 온도 — mood(불안/희망/그리움) + 안정도를 바 형태로 */
export function computeEmotionTemperature(
  interpretation: DreamInterpretation,
): EmotionTemperature {
  const mood = interpretation.mood ?? { anxiety: 40, hope: 35, longing: 25 };
  const seed = seedFor(interpretation, "temp");
  const rand = createSeededRandom(seed);

  // 안정 = 불안의 반대 + 희망 일부 (0~100)
  const stability = Math.max(
    6,
    Math.min(96, Math.round(100 - mood.anxiety * 0.7 + mood.hope * 0.25)),
  );

  const bars = [
    { label: "안정", value: stability },
    { label: "그리움", value: Math.max(4, Math.min(98, mood.longing)) },
    { label: "희망", value: Math.max(4, Math.min(98, mood.hope)) },
    { label: "불안", value: Math.max(4, Math.min(98, mood.anxiety)) },
  ].sort((a, b) => b.value - a.value);

  const top = bars[0]!;
  const headlines: Record<string, string[]> = {
    안정: ["잔잔하게 가라앉은 꿈", "차분한 온도의 꿈"],
    그리움: ["기억을 데우는 꿈", "그리움이 짙게 밴 꿈"],
    희망: ["따뜻하게 부푸는 꿈", "기대가 번지는 꿈"],
    불안: ["긴장이 감도는 꿈", "예민하게 깨어 있는 꿈"],
  };
  const pool = headlines[top.label] ?? ["온도가 뒤섞인 꿈"];
  const headline = pool[seededInt(rand, 0, pool.length - 1)] ?? pool[0]!;

  return { bars, headline };
}

const MBTI_AXES = {
  // 감정 회상형 vs 사건 전개형 → I/E
  ie: (mood: { anxiety: number; hope: number; longing: number }) =>
    mood.longing >= mood.hope ? "I" : "E",
  // 상징 많음(추상) vs 사물·사건 많음(구체) → N/S
  ns: (elements?: DreamElements) => {
    const abstract = elements?.symbols.length ?? 0;
    const concrete = (elements?.objects.length ?? 0) + (elements?.actions.length ?? 0);
    return abstract >= concrete ? "N" : "S";
  },
  // 감정 중심 vs 상황 중심 → F/T
  ft: (mood: { anxiety: number; hope: number; longing: number }) =>
    mood.anxiety <= mood.hope + mood.longing ? "F" : "T",
  // 여운 남김 vs 마무리됨 → P/J (시드로 안정적)
  pj: (seed: number) => (seed % 2 === 0 ? "P" : "J"),
} as const;

const MBTI_LABELS: Record<string, string> = {
  I: "감정 회상형",
  E: "사건 전개형",
  N: "상징 직관형",
  S: "장면 감각형",
  F: "감정 공명형",
  T: "상황 분석형",
};

export function computeDreamMbti(interpretation: DreamInterpretation): DreamMbti {
  const mood = interpretation.mood ?? { anxiety: 40, hope: 35, longing: 25 };
  const seed = seedFor(interpretation, "mbti");
  const type =
    MBTI_AXES.ie(mood) +
    MBTI_AXES.ns(interpretation.elements) +
    MBTI_AXES.ft(mood) +
    MBTI_AXES.pj(seed);

  const label = `${MBTI_LABELS[type[0]!]} · ${MBTI_LABELS[type[1]!]}`;
  return { type, label };
}
