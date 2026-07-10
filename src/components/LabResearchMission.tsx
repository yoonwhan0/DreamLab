import { useEffect, useState } from "react";
import {
  BRAND_CLOSING,
  BRAND_MANIFESTO,
  BRAND_TAGLINE,
  RESEARCH_MISSION_BEATS,
  RESEARCH_MISSION_HOOK,
  RESEARCH_MISSION_TITLE,
  RESEARCH_MISSION_TOPICS,
} from "@/lib/branding";
import { ContributionGrid } from "@/components/ContributionGrid";
import { FormattedText } from "@/components/ui/FormattedText";
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
    <div className="research-mission-body space-y-4">
      {!hideTagline && (
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-text">{BRAND_TAGLINE}</p>
          <FormattedText
            as="p"
            autoFormat={false}
            className="text-xs text-text-secondary leading-relaxed"
          >
            {BRAND_MANIFESTO}
          </FormattedText>
        </div>
      )}

      {hideTagline && (
        <div className="space-y-2 text-center">
          <FormattedText
            as="p"
            autoFormat={false}
            className="research-mission-hook"
          >
            {RESEARCH_MISSION_HOOK}
          </FormattedText>
          <FormattedText
            as="p"
            autoFormat={false}
            className="text-xs text-text-secondary leading-relaxed"
          >
            {BRAND_MANIFESTO}
          </FormattedText>
        </div>
      )}

      <div className="research-mission-beats space-y-2.5">
        {RESEARCH_MISSION_BEATS.map((beat, index) => (
          <FormattedText
            key={beat}
            as="p"
            autoFormat={false}
            className={`text-xs leading-relaxed text-center ${
              index === lastBeatIndex
                ? "research-mission-beat-accent"
                : "text-text-secondary"
            }`}
          >
            {beat}
          </FormattedText>
        ))}
      </div>

      <ul className="research-mission-topics space-y-2">
        {RESEARCH_MISSION_TOPICS.map((item) => (
          <li key={item.title} className="research-mission-topic">
            <p className="research-mission-topic-title">{item.title}</p>
            <FormattedText
              as="p"
              autoFormat={false}
              className="research-mission-topic-body"
            >
              {item.body}
            </FormattedText>
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
        <FormattedText as="p" autoFormat={false} className="research-mission-closing">
          {BRAND_CLOSING}
        </FormattedText>
      )}
    </div>
  );
}

interface LabResearchMissionProps {
  variant?: "hero" | "card";
  defaultOpen?: boolean;
  openOnHash?: boolean;
}

/** 홈 히어로 아래 · 마이 — 「우리는 어떤 것을 연구하는가」 */
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
      <div id={RESEARCH_MISSION_HASH} className="research-mission-hero">
        <button
          type="button"
          onClick={toggle}
          className="research-mission-hero-trigger"
          aria-expanded={open}
        >
          <span className="section-label research-mission-label">DreamLab Research</span>
          <span className="research-mission-question">{RESEARCH_MISSION_TITLE}</span>
          <span className="research-mission-hint">{open ? "접기" : "열어보기"}</span>
        </button>

        {open && (
          <div className="research-mission-panel motion-accordion-open">
            <LabResearchMissionBody hideTagline hideDensity />
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
        <span className="text-sm font-semibold text-text">{RESEARCH_MISSION_TITLE}</span>
        <span className="text-xs text-text-muted shrink-0">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/60 motion-accordion-open">
          <div className="pt-3">
            <LabResearchMissionBody />
          </div>
        </div>
      )}
    </div>
  );
}
