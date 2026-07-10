interface LoadingPulseProps {
  label?: string;
}

/** 해몽·유사 꿈 검색 중 로더 */
export function LoadingPulse({ label = "유사한 꿈을 찾는 중…" }: LoadingPulseProps) {
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
