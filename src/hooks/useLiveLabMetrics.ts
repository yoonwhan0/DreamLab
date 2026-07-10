import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_LAB_METRICS,
  fetchLabMetricsConfig,
  kstMidnightMs,
  LAB_METRICS_UPDATED_EVENT,
  msSinceKstMidnight,
  type LabMetricsConfig,
} from "@/lib/labMetricsConfig";
import {
  computeResearchLabStats,
  type ResearchLabStats,
} from "@/lib/researchLab";

const TICK_MS = 3_200;

export function useLiveLabMetrics(): {
  stats: ResearchLabStats;
  config: LabMetricsConfig;
  loading: boolean;
} {
  const [config, setConfig] = useState<LabMetricsConfig>(DEFAULT_LAB_METRICS);
  const [stats, setStats] = useState<ResearchLabStats>(() =>
    computeResearchLabStats(DEFAULT_LAB_METRICS),
  );
  const [loading, setLoading] = useState(true);
  const midnightRef = useRef(kstMidnightMs());

  useEffect(() => {
    let cancelled = false;
    void fetchLabMetricsConfig().then((loaded) => {
      if (cancelled) return;
      setConfig(loaded);
      setStats(computeResearchLabStats(loaded, msSinceKstMidnight()));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const reload = () => {
      void fetchLabMetricsConfig().then((loaded) => {
        setConfig(loaded);
        setStats(computeResearchLabStats(loaded, msSinceKstMidnight()));
      });
    };
    window.addEventListener(LAB_METRICS_UPDATED_EVENT, reload);
    return () => window.removeEventListener(LAB_METRICS_UPDATED_EVENT, reload);
  }, []);

  useEffect(() => {
    const apply = () => {
      const since = msSinceKstMidnight();
      const currentMidnight = kstMidnightMs();
      if (currentMidnight !== midnightRef.current) {
        midnightRef.current = currentMidnight;
      }
      setStats(computeResearchLabStats(config, since));
    };

    apply();
    if (!config.liveEnabled) return;

    const id = window.setInterval(apply, TICK_MS);
    return () => window.clearInterval(id);
  }, [config]);

  return { stats, config, loading };
}
