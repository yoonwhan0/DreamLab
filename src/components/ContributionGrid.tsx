import type { CSSProperties } from "react";

interface ContributionGridProps {
  grid: number[][];
}

/** SYS://OBS_DENSITY — 관측 밀도 히트맵 (우주 신호 비주얼) */
export function ContributionGrid({ grid }: ContributionGridProps) {
  return (
    <div
      className="research-contrib research-contrib-cyber"
      aria-label="관측 밀도 신호"
    >
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
        <span className="research-contrib-blink">관측 밀도</span> · 최근 {grid.length}주 · uplink
        active
      </p>
    </div>
  );
}
