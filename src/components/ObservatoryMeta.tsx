import { formatSyncTimestamp } from "@/lib/observatoryCredibility";
import { hashSeed } from "@/lib/seededRandom";

interface ObservatoryMetaProps {
  keyword?: string;
  className?: string;
  /** full = 갱신 시각만 (기본) */
  variant?: "full" | "hidden";
}

/** 과한 기술 메타는 숨기고, 갱신 시각 한 줄만 */
export function ObservatoryMeta({
  keyword = "",
  className = "",
  variant = "full",
}: ObservatoryMetaProps) {
  if (variant === "hidden") return null;

  const seed = hashSeed(`sync-${keyword}-${new Date().toDateString()}`);
  const synced = formatSyncTimestamp(seed).replace("동기화 ", "").replace(" · uplink verified", "");

  return (
    <p
      className={`text-[0.625rem] text-text-muted text-center tabular-nums ${className}`.trim()}
    >
      {synced}
    </p>
  );
}
