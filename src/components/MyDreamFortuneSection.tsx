import { useMemo } from "react";
import { DreamFortuneTrendPanel } from "@/components/DreamFortuneTrendPanel";
import { buildDreamFortuneSnapshot } from "@/lib/dreamFortuneTrends";
import { resolveResearchAnchor } from "@/lib/dreamAnchor";
import { previewCommunityForKeyword, estimateToStats } from "@/services/syntheticCommunityService";
import type { Dream } from "@/types";

interface MyDreamFortuneSectionProps {
  dreams: Dream[];
}

/** 마이 — 최근 꿈 기준 운세 추이 (AI 재해석 대체) */
export function MyDreamFortuneSection({ dreams }: MyDreamFortuneSectionProps) {
  const latest = dreams[0];
  const snapshot = useMemo(() => {
    if (!latest) return null;
    const keyword =
      resolveResearchAnchor(latest.interpretation, latest.title, latest.content) ||
      latest.title ||
      "꿈";
    const estimate = previewCommunityForKeyword(keyword);
    const stats = estimateToStats(estimate);
    return buildDreamFortuneSnapshot(keyword, stats);
  }, [latest]);

  if (!snapshot || !latest) return null;

  return (
    <DreamFortuneTrendPanel
      snapshot={snapshot}
      compact
    />
  );
}
