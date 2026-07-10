import type { CSSProperties } from "react";
import {
  directionLabel,
  type DreamFortuneSnapshot,
  type FortuneAxisTrend,
  type FortuneDirection,
} from "@/lib/dreamFortuneTrends";
import { CTA_PREMIUM_SEE_ALL, CTA_SIGNUP_SEE_MORE } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";

export type FortuneAccessTier = "guest" | "member" | "premium";

interface DreamFortuneTrendPanelProps {
  snapshot: DreamFortuneSnapshot;
  /** guest | member | premium — 미지정 시 access policy */
  tier?: FortuneAccessTier;
  /** community = 탐색 키워드 · archive = 내 꿈 누적 */
  variant?: "community" | "archive";
  compact?: boolean;
  className?: string;
}

function resolveTier(
  tier: FortuneAccessTier | undefined,
  isGuest: boolean,
  isPremium: boolean,
): FortuneAccessTier {
  if (tier) return tier;
  if (isPremium) return "premium";
  if (isGuest) return "guest";
  return "member";
}

/** guest 1축 · member 3축 · premium 전체 — 운세 트렌드 그래프 */
export function DreamFortuneTrendPanel({
  snapshot,
  tier,
  variant = "community",
  compact = false,
  className = "",
}: DreamFortuneTrendPanelProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  const resolved = resolveTier(tier, access.isGuest, access.isPremium);
  const visibleCount =
    resolved === "premium" ? snapshot.axes.length : resolved === "member" ? 3 : 1;

  const visible = snapshot.axes.slice(0, visibleCount);
  const locked = snapshot.axes.slice(visibleCount);

  const isArchive = variant === "archive" || snapshot.fromArchive;

  const headerLabel = isArchive ? "내 아카이브 · 누적 운세" : "30일 뒤 · 운세 추이";

  const titleLine = isArchive
    ? snapshot.keyword
    : `"${snapshot.keyword}" 꿈을 꾼 사람들`;

  const subtitleLine = isArchive
    ? `${snapshot.archiveDreamCount ?? snapshot.sampleCount}개 꿈 누적 · 30일 후기 ${snapshot.followUpCount}건 — 기록이 쌓일수록 그래프가 자라요`
    : `${snapshot.sampleCount.toLocaleString()}명 기록 · ${snapshot.followUpCount.toLocaleString()}명 30일 후 답변 — 통계적 경향 (예언 아님)`;

  const ctaTitle =
    resolved === "guest"
      ? isArchive
        ? "가입하면 내 꿈 아카이브 운세가 열립니다"
        : "가입하면 재물·연애·직장운 그래프가 열립니다"
      : isArchive
        ? "프리미엄이면 누적 아카이브 8주·전 축 운세"
        : "프리미엄이면 8주 추이·전 축 통계를 볼 수 있어요";

  const onCta = () => {
    if (resolved === "guest") {
      openSignupSheet(
        isArchive
          ? "내 꿈 아카이브 — 누적 운세 그래프"
          : `"${snapshot.keyword}" 꿈 — 30일 뒤 운세 추이`,
      );
      return;
    }
    openPremiumSheet(
      isArchive
        ? "누적 아카이브 운세·8주 그래프 전체"
        : `"${snapshot.keyword}" 운세·통계 전체`,
    );
  };

  return (
    <section
      className={`card-highlight card-bezel overflow-hidden ${compact ? "p-4 space-y-3" : "p-5 space-y-4"} ${className}`.trim()}
    >
      <header className={compact ? "space-y-1" : "text-center space-y-1.5"}>
        <p className="section-label">{headerLabel}</p>
        <h3 className={`font-bold text-text ${compact ? "text-sm" : "text-base"}`}>
          {isArchive ? titleLine : <>&ldquo;{snapshot.keyword}&rdquo; 꿈을 꾼 사람들</>}
        </h3>
        <p className="text-xs text-text-muted copy-lines">
          {subtitleLine}
          {!isArchive && (
            <>
              {" "}
              <span className="text-text-secondary">통계적 경향 (예언 아님)</span>
            </>
          )}
        </p>
      </header>

      <div className="space-y-2.5">
        {visible.map((axis, i) => (
          <AxisRow
            key={axis.id}
            axis={axis}
            fadeTail={resolved === "guest" && i === 0}
            partialBlur={resolved === "member" && i === visible.length - 1}
            showFull={resolved === "premium"}
          />
        ))}
      </div>

      {locked.length > 0 && (
        <div className="relative rounded-xl border border-border overflow-hidden min-h-[5.5rem]">
          <div className="p-3 space-y-2 blur-[5px] opacity-45 pointer-events-none select-none" aria-hidden>
            {locked.slice(0, 3).map((axis) => (
              <AxisRow key={axis.id} axis={axis} ghost showFull={false} />
            ))}
          </div>
          <div className="story-blur-overlay absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-sm font-semibold text-text">
              +{locked.length}개 운세 축
            </p>
            <p className="text-xs text-text-secondary copy-lines max-w-[18rem]">
              {ctaTitle}
            </p>
            <button type="button" onClick={onCta} className="btn-primary text-sm mt-1">
              {resolved === "guest" ? CTA_SIGNUP_SEE_MORE : CTA_PREMIUM_SEE_ALL}
            </button>
          </div>
        </div>
      )}

      {resolved !== "premium" && visible.length > 0 && locked.length === 0 && (
        <p className="text-[0.625rem] text-center text-text-muted">
          프리미엄 — 8주 그래프·전 축 상승/하락 비교
        </p>
      )}
    </section>
  );
}

function AxisRow({
  axis,
  ghost = false,
  fadeTail = false,
  partialBlur = false,
  showFull,
}: {
  axis: FortuneAxisTrend;
  ghost?: boolean;
  fadeTail?: boolean;
  partialBlur?: boolean;
  showFull: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-2 px-3 py-2.5 ${
        ghost ? "opacity-80" : ""
      } ${partialBlur ? "relative overflow-hidden" : ""}`}
    >
      {partialBlur && (
        <div
          className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-surface/95 to-transparent pointer-events-none"
          aria-hidden
        />
      )}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-text">{axis.label}</span>
            <DirectionBadge direction={axis.direction} delta={axis.deltaWeek} />
          </div>
          <Sparkline
            values={axis.series}
            direction={axis.direction}
            fadeTail={fadeTail}
            muted={!showFull}
          />
        </div>
        <div className="text-right shrink-0 tabular-nums">
          <p className="text-lg font-bold text-primary">{axis.score}</p>
          <p className="text-[0.625rem] text-text-muted">지수</p>
        </div>
      </div>
    </div>
  );
}

function DirectionBadge({
  direction,
  delta,
}: {
  direction: FortuneDirection;
  delta: number;
}) {
  const tone =
    direction === "up"
      ? "text-emerald-400"
      : direction === "down"
        ? "text-amber-400"
        : "text-text-muted";

  return (
    <span className={`text-[0.6875rem] font-semibold ${tone}`}>
      {directionLabel(direction)}
      {delta !== 0 && (
        <span className="ml-1 tabular-nums opacity-90">
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
    </span>
  );
}

function Sparkline({
  values,
  direction,
  fadeTail = false,
  muted = false,
}: {
  values: number[];
  direction: FortuneDirection;
  fadeTail?: boolean;
  muted?: boolean;
}) {
  const w = 120;
  const h = 28;
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const stroke =
    direction === "up"
      ? "var(--color-success, #34d399)"
      : direction === "down"
        ? "var(--brand-gold-light, #d4a04a)"
        : "var(--color-primary)";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`w-full max-w-[8rem] h-7 ${muted ? "opacity-70" : ""}`}
      aria-hidden
      style={
        fadeTail
          ? ({ maskImage: "linear-gradient(90deg, #000 55%, transparent)" } as CSSProperties)
          : undefined
      }
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
