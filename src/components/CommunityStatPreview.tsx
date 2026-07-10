import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ObservatoryMeta } from "@/components/ObservatoryMeta";
import { formatAnswerRatePercent } from "@/lib/observatoryCredibility";
import { getOutcomePercentages } from "@/services/dreamService";
import type { DreamStats } from "@/types";

interface CommunityStatPreviewProps {
  keyword: string;
  totalCount: number;
  withFollowUpCount: number;
  stats: DreamStats;
  lockOutcomes?: boolean;
  isEstimated?: boolean;
}

export function CommunityStatPreview({
  keyword,
  totalCount,
  withFollowUpCount,
  stats,
  lockOutcomes = false,
  isEstimated: _isEstimated = false,
}: CommunityStatPreviewProps) {
  const [ready, setReady] = useState(false);
  const answerRate = formatAnswerRatePercent(withFollowUpCount, totalCount);

  const outcomes = getOutcomePercentages(stats);
  const topOutcomes = outcomes.slice(0, 3);

  const keywordPlain = useMemo(
    () => keyword.replace(/ 꿈$/, "").trim(),
    [keyword],
  );

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const barStyle = {
    "--target-width": `${Math.min(100, Number(answerRate))}%`,
  } as CSSProperties;

  return (
    <div className="card-highlight card-bezel card-glow p-5 space-y-4">
      <div className="text-center">
        <p className="section-label">같은 꿈 · 30일 뒤</p>
        <p className="text-lg font-semibold text-text mt-1">&ldquo;{keyword}&rdquo;</p>
        <p className="mt-1 text-sm text-text-secondary copy-lines">
          <span className="text-primary font-semibold tabular-nums">
            {totalCount.toLocaleString()}명
          </span>
          이 비슷한 꿈을 꿨습니다
        </p>
      </div>

      <p className="text-[0.9375rem] text-text-secondary text-center copy-lines leading-relaxed">
        그중{" "}
        <strong className="text-primary tabular-nums motion-count">{answerRate}%</strong>
        가 한 달 뒤 결과를 남겼어요.
      </p>

      <div className="space-y-1.5">
        <div className="stat-bar-track stat-bar-track-glow">
          <div
            className={`stat-bar-fill ${ready ? "stat-bar-fill-animated" : ""}`}
            style={ready ? barStyle : { width: 0 }}
          />
        </div>
        <p className="text-xs text-text-muted text-center tabular-nums">
          {withFollowUpCount.toLocaleString()}건 공개
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2 text-sm">
        {lockOutcomes ? (
          <div className="py-6 px-2 text-center space-y-1.5">
            <p className="text-xs text-text-muted font-medium">프리미엄에서 전체</p>
            <p className="text-xs text-text-secondary copy-lines leading-relaxed">
              결말 비율 · 재물·연애·직장운 8주 추이는 프리미엄 구독에서 볼 수 있어요.
            </p>
          </div>
        ) : (
          <>
            {topOutcomes.map((item, index) => (
              <OutcomeRow
                key={item.category}
                label={item.label}
                percent={item.percent}
                delay={200 + index * 120}
              />
            ))}
          </>
        )}
      </div>

      <ObservatoryMeta keyword={keywordPlain} />
    </div>
  );
}

function OutcomeRow({
  label,
  percent,
  delay,
  muted = false,
}: {
  label: string;
  percent: number;
  delay?: number;
  muted?: boolean;
}) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={delay !== undefined ? "motion-reveal space-y-1" : "space-y-1"}
      style={delay !== undefined ? ({ "--motion-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={muted ? "text-text-muted" : "text-text-secondary"}>{label}</span>
        <span
          className={`font-semibold tabular-nums ${muted ? "text-text-muted" : "text-text"}`}
        >
          {safePercent}%
        </span>
      </div>
      <div className={`stat-bar-track h-1 ${muted ? "opacity-50" : ""}`}>
        <div className="stat-bar-fill" style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}
