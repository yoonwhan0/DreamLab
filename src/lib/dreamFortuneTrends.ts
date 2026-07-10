import { hashSeed, createSeededRandom, seededInt } from "@/lib/seededRandom";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import type { DreamStats, OutcomeCategory } from "@/types";

export type FortuneAxisId =
  | "overall"
  | "money"
  | "love"
  | "career"
  | "health"
  | "family"
  | "social";

export type FortuneDirection = "up" | "down" | "flat";

export interface FortuneAxisTrend {
  id: FortuneAxisId;
  label: string;
  direction: FortuneDirection;
  /** 현재 지수 0–100 */
  score: number;
  /** 최근 1주 변화 */
  deltaWeek: number;
  /** 최근 8주 스파크라인 */
  series: number[];
}

export interface DreamFortuneSnapshot {
  keyword: string;
  axes: FortuneAxisTrend[];
  sampleCount: number;
  followUpCount: number;
}

const AXIS_META: { id: FortuneAxisId; label: string; outcomeKeys: OutcomeCategory[] }[] = [
  { id: "overall", label: "종합운", outcomeKeys: ["good", "nothing"] },
  { id: "money", label: "재물운", outcomeKeys: ["money", "good"] },
  { id: "love", label: "연애운", outcomeKeys: ["love", "good"] },
  { id: "career", label: "직장·학업운", outcomeKeys: ["job", "good"] },
  { id: "health", label: "건강·멘탈", outcomeKeys: ["health", "nothing"] },
  { id: "family", label: "가족·대인운", outcomeKeys: ["family", "love"] },
  { id: "social", label: "대외·평판운", outcomeKeys: ["other", "good"] },
];

function axisScoreFromOutcomes(
  outcomes: Record<OutcomeCategory, number>,
  keys: OutcomeCategory[],
  rand: () => number,
): number {
  const total = Object.values(outcomes).reduce((a, b) => a + b, 0) || 1;
  let weighted = 0;
  let weightSum = 0;
  keys.forEach((k, i) => {
    const w = 1 - i * 0.25;
    weighted += (outcomes[k] / total) * 100 * w;
    weightSum += w;
  });
  const base = weighted / weightSum;
  return Math.round(Math.min(92, Math.max(18, base + (rand() - 0.5) * 14)));
}

function buildSeries(seed: number, endScore: number, direction: FortuneDirection): number[] {
  const rand = createSeededRandom(seed);
  const weeks = 8;
  const series: number[] = [];
  let v = endScore - (direction === "up" ? 18 : direction === "down" ? -12 : 4);

  for (let i = 0; i < weeks - 1; i++) {
    v += (rand() - 0.45) * 10;
    v = Math.min(95, Math.max(12, v));
    series.push(Math.round(v));
  }
  series.push(endScore);
  return series;
}

function directionFromDelta(delta: number): FortuneDirection {
  if (delta >= 4) return "up";
  if (delta <= -4) return "down";
  return "flat";
}

/** 같은 꿈 유형 30일 후 데이터 → 다차원 운세 트렌드 */
export function buildDreamFortuneSnapshot(
  keyword: string,
  stats: DreamStats,
): DreamFortuneSnapshot {
  const anchor = keyword.replace(/ 꿈$/, "").trim() || "꿈";
  const seed = hashSeed(`fortune-${anchor}-${stats.totalDreams}`);
  const rand = createSeededRandom(seed);
  const category = inferCategoryFromKeyword(anchor);

  const categoryBoost: Partial<Record<FortuneAxisId, number>> = {
    money: category === "fortune" ? 12 : 0,
    love: category === "love" ? 14 : 0,
    career: category === "career" || category === "anxiety" ? 8 : 0,
    health: category === "anxiety" ? -10 : 0,
    family: category === "family" ? 10 : 0,
  };

  const axes: FortuneAxisTrend[] = AXIS_META.map((meta, idx) => {
    const axisSeed = seed + idx * 7919;
    const r = createSeededRandom(axisSeed);
    let score = axisScoreFromOutcomes(stats.outcomes, meta.outcomeKeys, r);
    score = Math.round(
      Math.min(94, Math.max(14, score + (categoryBoost[meta.id] ?? 0) + (rand() - 0.5) * 6)),
    );

    const series = buildSeries(axisSeed + 1, score, "flat");
    const prev = series[series.length - 2] ?? score;
    const deltaWeek = score - prev;
    const direction = directionFromDelta(deltaWeek);

    // 일부 축은 의도적으로 상승/하락 대비 (지루하지 않게)
    if (meta.id === "overall" && category === "fortune") {
      score = Math.min(88, score + 6);
    }
    if (meta.id === "health" && category === "anxiety") {
      score = Math.max(22, score - 8);
    }

    const adjustedSeries = buildSeries(axisSeed + 2, score, direction);

    return {
      id: meta.id,
      label: meta.label,
      direction,
      score,
      deltaWeek: score - (adjustedSeries[adjustedSeries.length - 2] ?? score),
      series: adjustedSeries,
    };
  });

  // 최소 2개 상승·1개 하락 보장 (시각적 대비)
  const ups = axes.filter((a) => a.id !== "overall" && a.direction === "up").length;
  const downs = axes.filter((a) => a.id !== "overall" && a.direction === "down").length;
  if (ups < 2) {
    const target = axes.find((a) => a.id === "money") ?? axes[1]!;
    target.direction = "up";
    target.deltaWeek = seededInt(rand, 5, 14);
    target.score = Math.min(90, target.score + target.deltaWeek);
    target.series = buildSeries(seed + 99, target.score, "up");
  }
  if (downs < 1) {
    const target = axes.find((a) => a.id === "social") ?? axes[6]!;
    target.direction = "down";
    target.deltaWeek = -seededInt(rand, 4, 11);
    target.score = Math.max(20, target.score + target.deltaWeek);
    target.series = buildSeries(seed + 101, target.score, "down");
  }

  return {
    keyword: anchor,
    axes,
    sampleCount: stats.totalDreams,
    followUpCount: stats.totalWithFollowUp,
  };
}

export function directionLabel(d: FortuneDirection): string {
  switch (d) {
    case "up":
      return "상승 중";
    case "down":
      return "하락 중";
    case "flat":
      return "보합";
    default: {
      const _exhaustive: never = d;
      return _exhaustive;
    }
  }
}
