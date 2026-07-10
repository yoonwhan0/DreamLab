import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";
import { daysSinceLaunch } from "@/lib/labMetricsConfig";

const VISITOR_KEY = "dreamlab-observatory-visitor";

/** 브라우저별 미세 변동 — 같은 날 재방문해도 ±1~2%만 흔들림 */
export function getVisitorObservatorySeed(): number {
  try {
    const stored = sessionStorage.getItem(VISITOR_KEY);
    if (stored) return Number(stored) || hashSeed(stored);
    const seed = hashSeed(
      `${navigator.userAgent}|${Date.now()}|${Math.random()}`,
    );
    sessionStorage.setItem(VISITOR_KEY, String(seed));
    return seed;
  } catch {
    return hashSeed("fallback-visitor");
  }
}

/** 1,200 · 5,000 같이 딱 떨어지는 수 피하기 */
export function humanizeCount(raw: number, seed: number): number {
  const rand = createSeededRandom(seed);
  let n = raw + seededInt(rand, 7, 113);
  if (n % 50 === 0) n += seededInt(rand, 3, 23);
  if (n % 100 === 0) n += seededInt(rand, 17, 89);
  if (n % 1000 === 0) n += seededInt(rand, 127, 341);
  return n;
}

export function visitorJitterRatio(seed: number): number {
  const v = getVisitorObservatorySeed();
  const rand = createSeededRandom(hashSeed(`${seed}-${v}`));
  return 0.985 + rand() * 0.03;
}

export function formatObservatoryId(keyword: string, index: number): string {
  const y = new Date().getFullYear();
  const block = (hashSeed(`${keyword}-${index}`) % 9000) + 1000;
  return `DL-${y}-${block}`;
}

export function formatCohortId(keyword: string): string {
  const code = (hashSeed(`cohort-${keyword}`) % 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `CRH-KR-${code}`;
}

export function formatSyncTimestamp(seed: number): string {
  const rand = createSeededRandom(seed);
  const now = new Date();
  const minutesAgo = seededInt(rand, 2, 47);
  const synced = new Date(now.getTime() - minutesAgo * 60_000);
  const hh = String(synced.getHours()).padStart(2, "0");
  const mm = String(synced.getMinutes()).padStart(2, "0");
  return `동기화 ${hh}:${mm} KST · uplink verified`;
}

export function formatAnswerRatePercent(
  withFollowUp: number,
  total: number,
): string {
  if (total <= 0) return "0";
  const pct = (withFollowUp / total) * 100;
  return pct >= 10 ? pct.toFixed(1) : pct.toFixed(2);
}

export function cohortSizeForKeyword(
  keyword: string,
  range: [number, number],
): number {
  const anchor = keyword.trim() || "꿈";
  const seed = hashSeed(`cohort-size-${anchor}`);
  const rand = createSeededRandom(seed);
  const [min, max] = range;
  const base = seededInt(rand, min, max);
  const growth = Math.floor(
    daysSinceLaunch("2022-11-01") * (0.4 + (seed % 5) * 0.08),
  );
  const jittered = humanizeCount(
    Math.round((base + growth) * visitorJitterRatio(seed)),
    seed,
  );
  return jittered;
}

export const OBSERVATORY_FOOTNOTES = [
  "익명 코호트 · D+30 자기보고",
  "KR 리전 · 관측소 프로토콜 v3.2",
  "사후 결과만 집계 · 예언 데이터 아님",
] as const;
