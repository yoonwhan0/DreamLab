import { createSeededRandom } from "@/lib/seededRandom";

export interface LiveCounterConfig {
  /** 오늘 0시(KST) 기준 시작값 */
  base: number;
  /** 오늘 최대치 */
  max: number;
  /** 평균 몇 ms마다 +1 (살아있는 카운터) */
  tickMs: number;
}

export interface LabMetricsConfig {
  version: 1;
  liveEnabled: boolean;
  labLaunchDate: string;
  baseDreams: number;
  baseResults: number;
  baseResearchDays: number;
  dreamsPerDay: number;
  resultsPerDay: number;
  dailyDreamJitter: number;
  dailyResultJitter: number;
  todayNewDreams: LiveCounterConfig;
  todayFollowUpDue: LiveCounterConfig;
  todayNewPatterns: LiveCounterConfig;
  /** 누적 꿈 기록 — 아주 느리게 증가 */
  totalDreamsLive: LiveCounterConfig;
  contributionWeeks: number;
}

export const LAB_METRICS_STORAGE_KEY = "dreamlab-lab-metrics";
export const LAB_METRICS_UPDATED_EVENT = "dreamlab-metrics-updated";

export const DEFAULT_LAB_METRICS: LabMetricsConfig = {
  version: 1,
  liveEnabled: true,
  labLaunchDate: "2022-11-01",
  baseDreams: 12_491,
  baseResults: 4_812,
  baseResearchDays: 1283,
  dreamsPerDay: 12,
  resultsPerDay: 3,
  dailyDreamJitter: 90,
  dailyResultJitter: 30,
  todayNewDreams: { base: 380, max: 520, tickMs: 42_000 },
  todayFollowUpDue: { base: 70, max: 130, tickMs: 95_000 },
  todayNewPatterns: { base: 1, max: 6, tickMs: 180_000 },
  totalDreamsLive: { base: 0, max: 999_999_999, tickMs: 28_000 },
  contributionWeeks: 24,
};

export function kstMidnightMs(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  return Date.UTC(y, m, d) - 9 * 60 * 60 * 1000;
}

export function msSinceKstMidnight(): number {
  return Math.max(0, Date.now() - kstMidnightMs());
}

function mergeCounter(
  partial: Partial<LiveCounterConfig> | undefined,
  fallback: LiveCounterConfig,
): LiveCounterConfig {
  return {
    base: partial?.base ?? fallback.base,
    max: partial?.max ?? fallback.max,
    tickMs: partial?.tickMs ?? fallback.tickMs,
  };
}

export function mergeLabMetricsConfig(
  partial: Partial<LabMetricsConfig> | null | undefined,
): LabMetricsConfig {
  if (!partial) return { ...DEFAULT_LAB_METRICS };
  return {
    ...DEFAULT_LAB_METRICS,
    ...partial,
    todayNewDreams: mergeCounter(
      partial.todayNewDreams,
      DEFAULT_LAB_METRICS.todayNewDreams,
    ),
    todayFollowUpDue: mergeCounter(
      partial.todayFollowUpDue,
      DEFAULT_LAB_METRICS.todayFollowUpDue,
    ),
    todayNewPatterns: mergeCounter(
      partial.todayNewPatterns,
      DEFAULT_LAB_METRICS.todayNewPatterns,
    ),
    totalDreamsLive: mergeCounter(
      partial.totalDreamsLive,
      DEFAULT_LAB_METRICS.totalDreamsLive,
    ),
  };
}

export function loadLabMetricsFromStorage(): LabMetricsConfig {
  try {
    const raw = localStorage.getItem(LAB_METRICS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAB_METRICS };
    return mergeLabMetricsConfig(JSON.parse(raw) as Partial<LabMetricsConfig>);
  } catch {
    return { ...DEFAULT_LAB_METRICS };
  }
}

export function saveLabMetricsToStorage(config: LabMetricsConfig): void {
  localStorage.setItem(LAB_METRICS_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(LAB_METRICS_UPDATED_EVENT));
}

export async function fetchLabMetricsConfig(): Promise<LabMetricsConfig> {
  try {
    const { fetchLabMetricsOpsConfig } = await import("@/services/opsConfigService");
    return await fetchLabMetricsOpsConfig();
  } catch {
    // Firestore 미연결 — JSON/로컬 폴백
  }

  try {
    const res = await fetch(`/lab-metrics.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<LabMetricsConfig>;
      return mergeLabMetricsConfig(data);
    }
  } catch {
    // public 파일 없음 — 로컬/기본값
  }
  return loadLabMetricsFromStorage();
}

/** 오늘 경과 시간 기준 살아있는 카운터 */
export function liveCounterValue(
  counter: LiveCounterConfig,
  sinceMidnightMs: number,
  daySeed: number,
): number {
  const rand = createSeededRandom(daySeed);
  const jitter = Math.floor(rand() * 4);
  const ticks = Math.floor(sinceMidnightMs / Math.max(counter.tickMs, 1000));
  return Math.min(counter.max, counter.base + ticks + jitter);
}

export function daysSinceLaunch(launchDate: string): number {
  const launch = new Date(launchDate).getTime();
  return Math.max(1, Math.floor((Date.now() - launch) / (24 * 60 * 60 * 1000)));
}

export function computeDailyJitter(
  config: LabMetricsConfig,
  daySeed: number,
): { dream: number; result: number } {
  const rand = createSeededRandom(daySeed);
  return {
    dream: 380 + Math.floor(rand() * config.dailyDreamJitter),
    result: 85 + Math.floor(rand() * config.dailyResultJitter),
  };
}
