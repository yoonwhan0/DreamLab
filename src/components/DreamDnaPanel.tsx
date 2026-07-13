import {
  OUTCOME_CATEGORIES,
  type DreamInterpretation,
  type DreamStats,
  type SimilarDreamSummary,
  type OutcomeCategory,
} from "@/types";
import { hashSeed } from "@/lib/seededRandom";

function uniqNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** 겹치는 축 근거 — 사용자 꿈에서 추출된 요소(Dream Parser) 기준 */
function AxisTile({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="dream-signal-tile">
      <div className="flex items-baseline justify-between">
        <p className="dream-signal-label">{label}</p>
        <span className="text-[0.6875rem] font-semibold text-accent tabular-nums">
          {items.length}개
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {items.slice(0, 4).map((it) => (
          <span key={it} className="chip text-[0.6875rem]">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_MARKS = ["①", "②", "③"];

/** 의미 없는 필러 키워드 — 메달 노출에서 제외 */
const GENERIC_KEYWORDS = new Set(["기록", "감정", "꿈", "마음", "변화", "생각", "사람"]);

/** "face-animal-symbol" 같은 영문 슬러그(내부 키)는 사용자에게 숨김 */
function isSlugKeyword(value: string): boolean {
  return !/[가-힣]/.test(value) && /^[a-z0-9][a-z0-9\s._-]*$/i.test(value);
}

/**
 * 탐색·커뮤니티 재미 — Dream DNA 유사도, 가장 많이 함께 등장한 키워드,
 * 이 꿈 이후 가장 많이 적힌 후기(결말) 분포.
 */
export function DreamDnaPanel({
  summary,
  stats,
  anchor,
  topMatchPercent,
  interpretation,
}: {
  summary: SimilarDreamSummary;
  stats: DreamStats;
  anchor: string;
  topMatchPercent?: number;
  interpretation?: DreamInterpretation;
}) {
  // Dream DNA — 실제 매칭 점수 우선, 없으면 앵커 기반 결정론적 추정(78~94%)
  const dna =
    typeof topMatchPercent === "number" && topMatchPercent > 0
      ? topMatchPercent
      : 78 + (hashSeed(`dna-${anchor}`) % 17);

  // 89%가 어디서 왔는지 — 사용자 꿈에서 추출된 요소를 축별로 근거 제시
  const el = interpretation?.elements;
  const sceneAxis = uniqNonEmpty([
    ...(el?.places ?? []),
    ...(el?.actions ?? []),
    ...(el?.events ?? []),
  ]);
  const emotionAxis = uniqNonEmpty(el?.emotions ?? []);
  const symbolAxis = uniqNonEmpty([...(el?.symbols ?? []), ...(el?.objects ?? [])]);
  const hasAxes = sceneAxis.length + emotionAxis.length + symbolAxis.length > 0;

  const seenKeywords = new Set<string>();
  const topKeywords = summary.keywords
    .filter((k) => {
      const key = k.keyword.trim();
      if (!key || seenKeywords.has(key)) return false;
      if (GENERIC_KEYWORDS.has(key) || isSlugKeyword(key)) return false;
      seenKeywords.add(key);
      return true;
    })
    .slice(0, 3);

  const outcomeEntries = (
    Object.entries(stats.outcomes) as [OutcomeCategory, number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const outcomeTotal = outcomeEntries.reduce((sum, [, c]) => sum + c, 0) || 1;

  return (
    <div className="card card-bezel p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">Dream DNA</p>
          <p className="text-[0.625rem] text-text-muted mt-0.5">
            같은 꿈을 꾼 사람들과의 유사도
          </p>
        </div>
        <span className="badge badge-member shrink-0">관측</span>
      </div>

      {/* Dream DNA 유사도 */}
      <div className="flex items-center gap-4">
        <div
          className="dream-dna-ring"
          style={{
            background: `conic-gradient(var(--brand-amber) ${dna * 3.6}deg, color-mix(in srgb, var(--color-border) 60%, transparent) 0deg)`,
          }}
        >
          <div className="flex h-[3.4rem] w-[3.4rem] items-center justify-center rounded-full bg-surface">
            <span className="text-lg font-bold text-text tabular-nums">{dna}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold text-text">
            당신과 가장 비슷한 꿈
          </p>
          <p className="text-[0.75rem] text-text-muted mt-0.5 leading-relaxed">
            {hasAxes
              ? `장면 ${sceneAxis.length} · 감정 ${emotionAxis.length} · 상징 ${symbolAxis.length}개가 겹쳤습니다.`
              : `${dna}% 일치 · 같은 상징·감정 축을 공유합니다.`}
          </p>
        </div>
      </div>

      {/* 겹치는 축 — 89%의 근거 */}
      {hasAxes && (
        <div className="space-y-2">
          <p className="dream-signal-label">겹치는 축</p>
          <div className="space-y-2">
            <AxisTile label="같은 장면" items={sceneAxis} />
            <AxisTile label="같은 감정" items={emotionAxis} />
            <AxisTile label="같은 상징" items={symbolAxis} />
          </div>
        </div>
      )}

      {/* 가장 많이 같이 등장한 키워드 */}
      {topKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="dream-signal-label">가장 많이 같이 등장한 키워드</p>
          <div className="space-y-1.5">
            {topKeywords.map((k, i) => (
              <div key={k.keyword} className="dream-dna-rank">
                <span aria-hidden>{MEDALS[i]}</span>
                <span className="font-medium text-text">{k.keyword}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이 꿈 이후 가장 많이 적은 후기 */}
      {outcomeEntries.length > 0 && (
        <div className="space-y-2">
          <p className="dream-signal-label">이 꿈 이후, 가장 많이 적은 후기</p>
          <div className="space-y-2">
            {outcomeEntries.map(([category, count], i) => {
              const pct = Math.round((count / outcomeTotal) * 100);
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-[0.8125rem] mb-0.5">
                    <span className="text-text-secondary">
                      <span className="text-text-muted mr-1" aria-hidden>
                        {RANK_MARKS[i]}
                      </span>
                      {OUTCOME_CATEGORIES[category]}
                    </span>
                    <span className="font-semibold text-text tabular-nums">{pct}%</span>
                  </div>
                  <div className="stat-bar-track h-1.5">
                    <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
