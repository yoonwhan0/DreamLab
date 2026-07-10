import { useMemo } from "react";
import type { Dream } from "@/types";

interface MonthBucket {
  key: string;
  year: number;
  month: number;
  label: string;
  count: number;
}

function groupDreamsByMonth(dreams: Dream[], maxMonths = 6): MonthBucket[] {
  const map = new Map<string, MonthBucket>();

  for (const dream of dreams) {
    const d = dream.createdAt;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        key,
        year,
        month,
        label: `${year}.${month}월`,
        count: 1,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, maxMonths);
}

function renderBlocks(count: number): string {
  const cap = 24;
  if (count <= cap) return "■".repeat(count);
  const major = Math.floor(count / 5);
  const rest = count % 5;
  return "■".repeat(Math.min(cap, major)) + (rest > 0 ? "▪" : "");
}

export function DreamArchiveCalendar({ dreams }: { dreams: Dream[] }) {
  const months = useMemo(() => groupDreamsByMonth(dreams), [dreams]);

  if (months.length === 0) return null;

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">꿈 달력</h2>
        <span className="text-[0.6875rem] text-text-muted">기록이 쌓일수록 채워집니다</span>
      </div>
      <ul className="space-y-2.5">
        {months.map((m) => (
          <li key={m.key} className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-text-muted w-[4.5rem] shrink-0 tabular-nums">
              {m.label}
            </span>
            <span
              className="text-primary/80 text-sm tracking-tighter leading-none truncate flex-1"
              aria-label={`${m.count}건`}
            >
              {renderBlocks(m.count)}
            </span>
            <span className="text-xs text-text-muted tabular-nums shrink-0">{m.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
