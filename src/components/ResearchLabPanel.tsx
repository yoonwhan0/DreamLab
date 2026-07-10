import type { CSSProperties } from "react";
import { LiveStat } from "@/components/LiveStat";
import { BRAND_CLOSING } from "@/lib/branding";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

export function ResearchLabPanel() {
  const { stats } = useLiveLabMetrics();

  return (
    <div className="research-lab card card-bezel p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="section-label !mb-0">현재 연구중</p>
        <span className="research-live-badge" aria-hidden="true">
          LIVE
        </span>
      </div>

      <dl className="research-stats grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[0.625rem] text-text-muted uppercase tracking-wider">
            꿈 기록
          </dt>
          <dd className="text-sm font-bold text-text">
            <LiveStat value={stats.totalDreams} className="font-bold text-text" />
          </dd>
        </div>
        <div>
          <dt className="text-[0.625rem] text-text-muted uppercase tracking-wider">
            30일 결과
          </dt>
          <dd className="text-sm font-bold text-primary">
            <LiveStat
              value={stats.totalFollowUpResults}
              className="font-bold text-primary"
            />
          </dd>
        </div>
        <div>
          <dt className="text-[0.625rem] text-text-muted uppercase tracking-wider">
            누적 연구
          </dt>
          <dd className="text-sm font-bold text-text tabular-nums">
            <LiveStat value={stats.researchDays} className="font-bold text-text" />
            <span className="text-[0.625rem] font-normal text-text-muted">일</span>
          </dd>
        </div>
      </dl>

      <ContributionGrid grid={stats.contributionGrid} />

      <p className="text-[0.6875rem] text-text-muted text-center copy-lines">
        <LiveStat value={stats.totalDreams} className="text-text-muted font-normal" />
        개의 꿈이 기록되었습니다. {BRAND_CLOSING}
      </p>
    </div>
  );
}

function ContributionGrid({ grid }: { grid: number[][] }) {
  return (
    <div className="research-contrib research-contrib-cyber" aria-label="연구 활동 히트맵">
      <div className="research-contrib-header">
        <span className="research-contrib-sys">SYS://OBS_DENSITY</span>
        <span className="research-contrib-ping" aria-hidden>
          SCAN
        </span>
      </div>

      <div className="research-contrib-viewport">
        <div className="research-contrib-wave research-contrib-wave-h" aria-hidden />
        <div className="research-contrib-wave research-contrib-wave-v" aria-hidden />
        <div className="research-contrib-grid">
          {grid.map((week, wi) => (
            <div key={wi} className="research-contrib-week">
              {week.map((level, di) => (
                <span
                  key={`${wi}-${di}`}
                  className="research-contrib-cell"
                  data-level={level}
                  style={
                    {
                      "--cell-delay": `${((wi * 7 + di) % 17) * 0.11}s`,
                      "--cell-wave": `${((wi + di) % 5) * 0.4}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="research-contrib-legend text-[0.5rem] text-text-muted mt-1">
        <span className="research-contrib-blink">관측 밀도</span> · 최근 {grid.length}주 ·
        uplink active
      </p>
    </div>
  );
}
