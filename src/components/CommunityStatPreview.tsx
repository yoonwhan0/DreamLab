import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ObservatoryMeta } from "@/components/ObservatoryMeta";
import { formatAnswerRatePercent } from "@/lib/observatoryCredibility";
import { getOutcomePercentages } from "@/services/dreamService";
import type { DreamStats } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

interface CommunityStatPreviewProps {
  keyword: string;
  totalCount: number;
  withFollowUpCount: number;
  stats: DreamStats;
  showCuriosityTease?: boolean;
  lockOutcomes?: boolean;
  isEstimated?: boolean;
}

export function CommunityStatPreview({
  keyword,
  totalCount,
  withFollowUpCount,
  stats,
  showCuriosityTease = false,
  lockOutcomes = false,
  isEstimated: _isEstimated = false,
}: CommunityStatPreviewProps) {
  const [ready, setReady] = useState(false);
  const answerRate = formatAnswerRatePercent(withFollowUpCount, totalCount);

  const outcomes = getOutcomePercentages(stats);
  const topNothing = outcomes.find((o) => o.category === "nothing");
  const topBad = outcomes.find((o) => o.category === "bad");
  const topGood = outcomes.find((o) => o.category === "good");
  const knownPercent = outcomes.reduce((s, o) => s + o.percent, 0);
  const mysteryPercent = Math.max(0, 100 - knownPercent);

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

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2 text-sm relative overflow-hidden">
        {lockOutcomes ? (
          <div className="relative min-h-[7rem]">
            <div
              className="space-y-2 blur-[6px] opacity-50 pointer-events-none select-none"
              aria-hidden
            >
              {topNothing && (
                <GhostOutcomeRow
                  label={OUTCOME_CATEGORIES.nothing}
                  percent={topNothing.percent}
                />
              )}
              {topGood && (
                <GhostOutcomeRow label={OUTCOME_CATEGORIES.good} percent={topGood.percent} />
              )}
              {topBad && (
                <GhostOutcomeRow label={OUTCOME_CATEGORIES.bad} percent={topBad.percent} />
              )}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-surface/80">
              <p className="text-xs text-accent font-semibold">프리미엄 전용</p>
              <p className="text-xs text-text-secondary copy-lines leading-relaxed">
                {showCuriosityTease && mysteryPercent > 0
                  ? `나머지 ${mysteryPercent}% 결말 + 8주 운세 그래프 — 프리미엄에서 열림`
                  : "재물·연애·직장운 8주 추이 — 프리미엄에서 전체"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {topNothing && topNothing.percent > 0 && (
              <OutcomeRow label={OUTCOME_CATEGORIES.nothing} percent={topNothing.percent} delay={200} />
            )}
            {topGood && topGood.percent > 0 && (
              <OutcomeRow label={OUTCOME_CATEGORIES.good} percent={topGood.percent} delay={320} />
            )}
            {topBad && topBad.percent > 0 && (
              <OutcomeRow label={OUTCOME_CATEGORIES.bad} percent={topBad.percent} delay={440} />
            )}
          </>
        )}
      </div>

      <ObservatoryMeta keyword={keywordPlain} />
    </div>
  );
}

function GhostOutcomeRow({ label, percent }: { label: string; percent: number }) {
  return <OutcomeRow label={label} percent={percent} muted />;
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
