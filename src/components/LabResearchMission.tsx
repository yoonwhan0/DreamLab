import { useEffect, useState } from "react";
import {
  BRAND_CLOSING,
  BRAND_TAGLINE,
  RESEARCH_MISSION_BEATS,
  RESEARCH_MISSION_PILLARS,
} from "@/lib/branding";
import { ContributionGrid } from "@/components/ContributionGrid";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

export const RESEARCH_MISSION_HASH = "research";

interface LabResearchMissionBodyProps {
  /** 홈 히어로 아래 — 태그라인은 이미 노출됨 */
  hideTagline?: boolean;
  /** 홈 메인에 관측 밀도가 이미 있음 */
  hideDensity?: boolean;
}

export function LabResearchMissionBody({
  hideTagline = false,
  hideDensity = false,
}: LabResearchMissionBodyProps) {
  const { stats } = useLiveLabMetrics();
  const lastBeatIndex = RESEARCH_MISSION_BEATS.length - 1;

  return (
    <div className="space-y-3">
      {!hideTagline && (
        <p className="text-sm font-medium text-text text-center">{BRAND_TAGLINE}</p>
      )}

      <div className="space-y-2">
        {RESEARCH_MISSION_BEATS.map((beat, index) => (
          <p
            key={beat}
            className={`text-xs leading-relaxed copy-lines text-center ${
              index === lastBeatIndex
                ? "font-medium text-primary"
                : "text-text-secondary"
            }`}
          >
            {beat}
          </p>
        ))}
      </div>

      <ul className="research-mission-pillars space-y-1.5 border-l-2 border-primary/25 pl-3">
        {RESEARCH_MISSION_PILLARS.map((pillar) => (
          <li key={pillar.label} className="text-[0.6875rem] leading-relaxed">
            <span className="font-semibold text-primary">{pillar.label}</span>
            <span className="text-text-secondary"> — {pillar.text}</span>
          </li>
        ))}
      </ul>

      {!hideDensity && (
        <div className="rounded-xl border border-primary/20 bg-primary-soft/15 p-3 space-y-2">
          <p className="text-[0.625rem] font-semibold text-text-muted uppercase tracking-wider text-center">
            전체 관측 밀도
          </p>
          <ContributionGrid grid={stats.contributionGrid} />
          <p className="text-[0.6875rem] text-text-muted text-center">
            {stats.totalDreams.toLocaleString()}건 기록 · {BRAND_CLOSING}
          </p>
        </div>
      )}

      {hideDensity && (
        <p className="text-[0.6875rem] text-text-muted text-center copy-lines">{BRAND_CLOSING}</p>
      )}
    </div>
  );
}

interface LabResearchMissionProps {
  variant?: "hero" | "card";
  defaultOpen?: boolean;
  openOnHash?: boolean;
}

/** 홈 히어로 아래 · 마이 — 「우리는 어떤 것을 연구하나」 아코디언 */
export function LabResearchMission({
  variant = "card",
  defaultOpen = false,
  openOnHash = false,
}: LabResearchMissionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!openOnHash) return;

    const syncFromHash = () => {
      if (window.location.hash !== `#${RESEARCH_MISSION_HASH}`) return;

      setOpen(true);
      requestAnimationFrame(() => {
        document.getElementById(RESEARCH_MISSION_HASH)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [openOnHash]);

  const toggle = () => setOpen((value) => !value);

  if (variant === "hero") {
    return (
      <div id={RESEARCH_MISSION_HASH} className="mx-auto max-w-[21rem] text-center">
        <button
          type="button"
          onClick={toggle}
          className="research-mission-trigger w-full text-sm font-medium text-primary py-1.5 transition-colors hover:text-primary/80"
          aria-expanded={open}
        >
          우리는 어떤 것을 연구하나
          <span className="ml-1 text-text-muted text-xs" aria-hidden>
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open && (
          <div className="motion-accordion-open mt-3 text-left">
            <div className="card card-bezel p-4">
              <LabResearchMissionBody hideTagline hideDensity />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card card-bezel overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-2 hover:bg-surface-2/50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-text">우리는 어떤 것을 연구하나</span>
        <span className="text-xs text-text-muted shrink-0">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/60 motion-accordion-open">
          <div className="pt-3">
            <LabResearchMissionBody />
          </div>
        </div>
      )}
    </div>
  );
}
