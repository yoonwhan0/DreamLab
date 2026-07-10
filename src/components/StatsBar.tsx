import type { OutcomeCategory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

interface StatsBarProps {
  items: { category: OutcomeCategory; label: string; percent: number }[];
  totalCount: number;
}

export function StatsBar({ items, totalCount }: StatsBarProps) {
  if (totalCount === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-text-secondary">아직 30일 후 답변이 없어요</p>
        <p className="mt-1 text-sm text-text-muted">
          데이터가 쌓이면 통계가 공개됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="section-label">
        {totalCount}건 기준 · 통계적 경향 (예측 아님)
      </p>
      {items.map((item) => (
        <div key={item.category}>
          <div className="mb-1.5 flex justify-between text-[0.9375rem]">
            <span className="text-text">{item.label}</span>
            <span className="font-bold text-primary tabular-nums">
              {item.percent}%
            </span>
          </div>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OutcomePicker({
  selected,
  onChange,
}: {
  selected: OutcomeCategory | null;
  onChange: (category: OutcomeCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(OUTCOME_CATEGORIES) as OutcomeCategory[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`min-h-[3rem] rounded-xl px-3 py-3 text-sm font-medium transition-all ${
            selected === key
              ? "bg-primary text-white shadow-sm"
              : "card text-text-secondary hover:bg-surface-2"
          }`}
        >
          {OUTCOME_CATEGORIES[key]}
        </button>
      ))}
    </div>
  );
}
