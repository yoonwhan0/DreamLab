import { AppLink } from "@/components/ui/AppLink";

/** 마이 등 — 전용 페이지로 안내하는 짧은 티저 */
export function LabResearchMissionTeaser() {
  return (
    <AppLink
      to="/about"
      className="card card-bezel flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2/40 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">우리는 어떤 것을 연구하나</p>
        <p className="mt-0.5 text-xs text-text-muted copy-lines">
          30일 뒤 결말을 관측하는 DreamLab의 이유
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium text-primary">보기 →</span>
    </AppLink>
  );
}
