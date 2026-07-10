import { ContributionGrid } from "@/components/ContributionGrid";
import { BRAND_CLOSING } from "@/lib/branding";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

/** 홈 — 숫자 대시보드 없이 우주 신호(관측 밀도)만 */
export function HomeObservatorySignal() {
  const { stats } = useLiveLabMetrics();

  return (
    <section className="research-lab card card-bezel p-3.5 space-y-2.5 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="section-label !mb-0">관측 uplink</p>
        <span className="research-live-badge text-[0.5rem] py-0.5" aria-hidden>
          LIVE
        </span>
      </div>

      <ContributionGrid grid={stats.contributionGrid} />

      <p className="text-[0.6875rem] text-text-muted text-center copy-lines leading-relaxed">
        {BRAND_CLOSING}
      </p>
    </section>
  );
}
