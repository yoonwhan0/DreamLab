import type { DreamInterpretation } from "@/types";
import {
  computeDreamMbti,
  computeEmotionTemperature,
  computeRarity,
} from "@/lib/dreamSignals";

/**
 * 재미 요소 — 오늘의 희귀도, 감정온도, 꿈 MBTI, 상징 연결도, 영화 매칭,
 * 한줄평, 연구소장 한마디. 정량 값은 결정론적으로 계산되어 매번 동일.
 */
export function DreamSignalsPanel({
  interpretation,
  cohortSize,
}: {
  interpretation: DreamInterpretation;
  cohortSize?: number;
}) {
  const rarity = computeRarity(interpretation, cohortSize);
  const temperature = computeEmotionTemperature(interpretation);
  const mbti = computeDreamMbti(interpretation);
  const signals = interpretation.signals;
  const symbolChain =
    signals?.symbolChain?.filter((s) => s.trim().length > 0) ?? [];

  return (
    <div className="card card-bezel p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">DreamLab Signals</p>
          <p className="text-[0.625rem] text-text-muted mt-0.5">
            이 꿈에서 읽어낸 신호들
          </p>
        </div>
        <span className="badge badge-member shrink-0">관측</span>
      </div>

      {/* 오늘의 희귀도 */}
      <div className="dream-signal-tile">
        <div className="flex items-center justify-between">
          <p className="dream-signal-label">오늘의 희귀도</p>
          <p className="text-[0.6875rem] font-semibold text-accent tabular-nums">
            상위 {rarity.topPercent}%
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-lg tracking-widest text-accent" aria-hidden>
            {"★".repeat(rarity.stars)}
            <span className="text-text-muted/40">
              {"★".repeat(5 - rarity.stars)}
            </span>
          </span>
          <span className="text-[0.8125rem] text-text-secondary">{rarity.label}</span>
        </div>
      </div>

      {/* 꿈 감정온도 */}
      <div className="dream-signal-tile">
        <div className="flex items-center justify-between">
          <p className="dream-signal-label">꿈 감정온도</p>
          <p className="text-[0.6875rem] text-text-muted">{temperature.headline}</p>
        </div>
        <div className="space-y-2 mt-2">
          {temperature.bars.map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between mb-0.5 text-[0.6875rem]">
                <span className="text-text-secondary">{bar.label}</span>
                <span className="font-medium text-text tabular-nums">{bar.value}%</span>
              </div>
              <div className="stat-bar-track h-1.5">
                <div className="stat-bar-fill" style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 꿈 MBTI + 영화 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dream-signal-tile">
          <p className="dream-signal-label">꿈 MBTI</p>
          <p className="text-lg font-bold text-text mt-1 tracking-wide">{mbti.type}</p>
          <p className="text-[0.6875rem] text-text-muted mt-0.5">{mbti.label}</p>
        </div>
        {signals?.movies && signals.movies.length > 0 && (
          <div className="dream-signal-tile">
            <p className="dream-signal-label">이 꿈을 영화로</p>
            <ul className="mt-1 space-y-1">
              {signals.movies.slice(0, 3).map((m) => (
                <li key={m.title} className="text-[0.8125rem] text-text-secondary">
                  <span className="text-text font-medium">🎬 {m.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 상징 연결도 */}
      {symbolChain.length >= 2 && (
        <div className="dream-signal-tile">
          <p className="dream-signal-label">상징 연결도</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {symbolChain.map((node, i) => (
              <span key={`${node}-${i}`} className="flex items-center gap-1.5">
                <span className="dream-signal-node">{node}</span>
                {i < symbolChain.length - 1 && (
                  <span className="text-text-muted/60" aria-hidden>
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 한줄평 + 소장 한마디 */}
      {signals?.oneLiner && (
        <div className="dream-signal-quote">
          <p className="text-[0.625rem] text-text-muted mb-1">꿈 한줄평</p>
          <p className="text-[0.9375rem] font-medium text-text leading-relaxed">
            “{signals.oneLiner}”
          </p>
        </div>
      )}
      {signals?.directorNote && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-[0.625rem] font-semibold text-accent mb-1">
            📖 연구소장 한마디
          </p>
          <p className="text-[0.875rem] text-text-secondary leading-relaxed">
            {signals.directorNote}
          </p>
        </div>
      )}
    </div>
  );
}
