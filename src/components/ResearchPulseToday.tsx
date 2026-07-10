import type { CSSProperties } from "react";
import { LiveStat } from "@/components/LiveStat";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

export function ResearchPulseToday() {
  const { stats, config } = useLiveLabMetrics();

  const items = [
    {
      label: "오늘 새로 관측된 꿈",
      value: stats.todayNewDreams,
      unit: "건",
    },
    {
      label: "오늘 30일이 지난 기록",
      value: stats.todayFollowUpDue,
      unit: "건",
    },
    {
      label: "새로운 패턴 발견",
      value: stats.todayNewPatterns,
      unit: "개",
    },
  ] as const;

  return (
    <div className="research-today card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="section-label !mb-0">오늘의 관측</p>
        {config.liveEnabled && (
          <span className="research-live-badge text-[0.5rem] py-0">LIVE</span>
        )}
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={item.label}
            className="flex items-baseline justify-between gap-3 motion-reveal"
            style={{ "--motion-delay": `${i * 60}ms` } as CSSProperties}
          >
            <span className="text-xs text-text-secondary">{item.label}</span>
            <span className="text-sm font-bold">
              <LiveStat value={item.value} className="text-primary font-bold" />
              <span className="text-text-muted font-normal ml-0.5">{item.unit}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
