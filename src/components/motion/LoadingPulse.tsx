interface LoadingPulseProps {
  label?: string;
}

/** AI 분석·검색 중 — 빠르게 샤샤샥 도는 신비로운 로더 */
export function LoadingPulse({ label = "분석 중..." }: LoadingPulseProps) {
  return (
    <div className="loading-pulse py-10 text-center space-y-4" role="status" aria-live="polite">
      <div className="loading-pulse-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="text-sm font-semibold motion-shimmer">{label}</p>
    </div>
  );
}
