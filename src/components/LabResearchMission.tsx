import { useEffect, useState } from "react";
import { BRAND_CLOSING, BRAND_MANIFESTO, BRAND_TAGLINE } from "@/lib/branding";
import { ContributionGrid } from "@/components/ContributionGrid";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

export const RESEARCH_MISSION_HASH = "research";

const RESEARCH_TOPICS = [
  {
    title: "같은 꿈 → 30일 뒤",
    body: "해몽이 끝나는 지점에서, 실제로 한 달 뒤 어떤 일이 있었는지를 모읍니다.",
  },
  {
    title: "누적된 꿈 패턴",
    body: "기록이 쌓일수록 키워드·감정·운세 경향이 아카이브 그래프로 드러납니다.",
  },
  {
    title: "해몽 vs 현실",
    body: "인터넷 해몽과 실제 후기가 얼마나 다른지 — 겹쳐 비교합니다.",
  },
  {
    title: "익명 후기 네트워크",
    body: "비슷한 꿈을 꾼 사람들의 30일 답변이 다음 관측의 통계가 됩니다.",
  },
] as const;

interface LabResearchMissionBodyProps {
  /** 홈 히어로 아래 — 태그라인은 이미 노출됨 */
  hideTagline?: boolean;
}

export function LabResearchMissionBody({ hideTagline = false }: LabResearchMissionBodyProps) {
  const { stats } = useLiveLabMetrics();

  return (
    <div className="space-y-4">
      {!hideTagline && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text text-center">{BRAND_TAGLINE}</p>
          <p className="text-xs text-text-secondary text-center copy-lines leading-relaxed">
            {BRAND_MANIFESTO}
          </p>
        </div>
      )}

      {hideTagline && (
        <p className="text-xs text-text-secondary text-center copy-lines leading-relaxed">
          {BRAND_MANIFESTO}
        </p>
      )}

      <ul className="space-y-2">
        {RESEARCH_TOPICS.map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-border bg-surface-2/80 px-3 py-2.5"
          >
            <p className="text-xs font-semibold text-primary">{item.title}</p>
            <p className="mt-0.5 text-[0.6875rem] text-text-secondary leading-relaxed">
              {item.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-primary/20 bg-primary-soft/15 p-3 space-y-2">
        <p className="text-[0.625rem] font-semibold text-text-muted uppercase tracking-wider text-center">
          전체 관측 밀도
        </p>
        <ContributionGrid grid={stats.contributionGrid} />
        <p className="text-[0.6875rem] text-text-muted text-center">
          {stats.totalDreams.toLocaleString()}건 기록 · {BRAND_CLOSING}
        </p>
      </div>
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
              <LabResearchMissionBody hideTagline />
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
