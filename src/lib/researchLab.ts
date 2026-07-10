import { createSeededRandom, hashSeed } from "@/lib/seededRandom";
import {
  type LabMetricsConfig,
  computeDailyJitter,
  daysSinceLaunch,
  kstMidnightMs,
  liveCounterValue,
  msSinceKstMidnight,
  DEFAULT_LAB_METRICS,
} from "@/lib/labMetricsConfig";

export interface ResearchLabStats {
  totalDreams: number;
  totalFollowUpResults: number;
  researchDays: number;
  todayNewDreams: number;
  todayFollowUpDue: number;
  todayNewPatterns: number;
  contributionGrid: number[][];
}

function daySeed(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  return hashSeed(`${y}-${m}-${d}`);
}

function buildContributionGrid(weeks: number, seed: number): number[][] {
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: number[] = [];
    for (let d = 0; d < 7; d++) {
      const cellRand = createSeededRandom(hashSeed(`contrib-${w}-${d}-${seed}`));
      const roll = cellRand();
      const wave = Math.sin((w + d * 0.35) * 0.9) * 0.5 + 0.5;
      const level = Math.min(4, Math.max(1, Math.floor(roll * 3 + wave * 2)));
      row.push(level);
    }
    grid.push(row);
  }
  return grid;
}

export function computeResearchLabStats(
  config: LabMetricsConfig = DEFAULT_LAB_METRICS,
  sinceMidnightMs = msSinceKstMidnight(),
): ResearchLabStats {
  const seed = daySeed();
  const days = daysSinceLaunch(config.labLaunchDate);
  const jitter = computeDailyJitter(config, seed);

  const staticDreams =
    config.baseDreams + days * config.dreamsPerDay + jitter.dream;
  const staticResults =
    config.baseResults + days * config.resultsPerDay + jitter.result;

  const liveDreamsExtra = config.liveEnabled
    ? liveCounterValue(config.totalDreamsLive, sinceMidnightMs, seed + 1)
    : 0;

  const todayNewDreams = config.liveEnabled
    ? liveCounterValue(config.todayNewDreams, sinceMidnightMs, seed)
    : config.todayNewDreams.base;

  const todayFollowUpDue = config.liveEnabled
    ? liveCounterValue(config.todayFollowUpDue, sinceMidnightMs, seed + 2)
    : config.todayFollowUpDue.base;

  const todayNewPatterns = config.liveEnabled
    ? liveCounterValue(config.todayNewPatterns, sinceMidnightMs, seed + 3)
    : config.todayNewPatterns.base;

  return {
    totalDreams: staticDreams + liveDreamsExtra,
    totalFollowUpResults: staticResults,
    researchDays: config.baseResearchDays + days,
    todayNewDreams,
    todayFollowUpDue,
    todayNewPatterns,
    contributionGrid: buildContributionGrid(config.contributionWeeks, seed),
  };
}

/** @deprecated use computeResearchLabStats via useLiveLabMetrics */
export function getResearchLabStats(): ResearchLabStats {
  return computeResearchLabStats();
}

export { kstMidnightMs };
