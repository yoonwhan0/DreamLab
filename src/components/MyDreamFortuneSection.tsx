import { useMemo } from "react";
import { DreamFortuneTrendPanel } from "@/components/DreamFortuneTrendPanel";
import { buildDreamFortuneFromArchive } from "@/lib/dreamFortuneTrends";
import type { Dream } from "@/types";

interface MyDreamFortuneSectionProps {
  dreams: Dream[];
}

/** 마이 — 누적 꿈 아카이브에서 운세 추이 (기록 쌓일수록 그래프 성장) */
export function MyDreamFortuneSection({ dreams }: MyDreamFortuneSectionProps) {
  const snapshot = useMemo(() => buildDreamFortuneFromArchive(dreams), [dreams]);

  if (!snapshot) return null;

  return (
    <DreamFortuneTrendPanel
      snapshot={snapshot}
      variant="archive"
      compact
    />
  );
}
