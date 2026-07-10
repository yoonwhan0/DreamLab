import type { ReactNode } from "react";

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc mt-1 max-w-2xl">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4 space-y-1">
      <p className="text-[0.625rem] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ? "text-primary" : "text-text"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && (
          <span className="text-sm font-normal text-text-muted ml-0.5">{suffix}</span>
        )}
      </p>
      {hint && <p className="text-[0.6875rem] text-text-muted">{hint}</p>}
    </div>
  );
}

export function StatusBanner({
  type,
  children,
}: {
  type: "info" | "warn" | "success";
  children: ReactNode;
}) {
  const styles =
    type === "warn"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
      : type === "success"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        : "border-border bg-surface text-text-secondary";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
  );
}

export function DataTable({
  columns,
  rows,
  emptyLabel = "데이터 없음",
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, ReactNode>[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-text-muted">{emptyLabel}</div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-2.5 text-[0.625rem] uppercase tracking-wider text-text-muted font-semibold ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 hover:bg-surface/50">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-2.5 ${col.className ?? ""}`}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfigField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-text">{label}</span>
      {children}
      {hint && <p className="text-[0.6875rem] text-text-muted">{hint}</p>}
    </label>
  );
}

export function SaveBar({
  onSave,
  saving,
  status,
}: {
  onSave: () => void;
  saving?: boolean;
  status?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 sticky bottom-4 z-10 card p-3 border-primary/20">
      <button
        type="button"
        className="btn btn-primary text-sm"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "저장 중…" : "Firestore에 저장"}
      </button>
      {status && <span className="text-xs text-accent">{status}</span>}
      <span className="text-[0.6875rem] text-text-muted ml-auto">
        저장 즉시 사용자 앱·Functions가 읽습니다 (재배포 불필요)
      </span>
    </div>
  );
}
