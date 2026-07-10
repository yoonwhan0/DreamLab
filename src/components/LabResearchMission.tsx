import { BRAND_CLOSING, BRAND_MANIFESTO, BRAND_TAGLINE } from "@/lib/branding";
import { ContributionGrid } from "@/components/ContributionGrid";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

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

/** 연구소 소개 본문 — /about 전용 페이지 */
export function LabResearchMissionBody() {
  const { stats } = useLiveLabMetrics();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-text text-center">{BRAND_TAGLINE}</p>
        <p className="text-xs text-text-secondary text-center copy-lines leading-relaxed">
          {BRAND_MANIFESTO}
        </p>
      </div>

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
