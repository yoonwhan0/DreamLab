import type { SimilarDreamSummary } from "@/types";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedText } from "@/components/ui/FormattedText";

const CATEGORY_LABELS: Record<string, string> = {
  family: "가족",
  love: "연애·관계",
  career: "직장·학업",
  anxiety: "불안·스트레스",
  fortune: "재물·기회",
  general: "일반",
};

interface SimilarDreamsPanelProps {
  summary: SimilarDreamSummary;
}

export function SimilarDreamsPanel({ summary }: SimilarDreamsPanelProps) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="section-label">비슷한 꿈을 꾼 사람들</p>
        <h3 className="mt-1 text-xl font-bold text-text">
          {summary.totalCount.toLocaleString()}명
          <span className="ml-2 text-base font-normal text-text-secondary">
            — 유사한 내용, 각자 다른 한 달 뒤
          </span>
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="chip chip-primary">
          {CATEGORY_LABELS[summary.category] ?? summary.category}
        </span>
        {summary.keywords.slice(0, 5).map(({ keyword, count }) => (
          <span key={keyword} className="chip">
            {keyword}
            <span className="ml-1 text-text-muted tabular-nums">{count}</span>
          </span>
        ))}
      </div>

      {summary.emotionCounts.length > 0 && (
        <div>
          <p className="section-label mb-2">꿈 속 감정</p>
          <div className="flex flex-wrap gap-4">
            {summary.emotionCounts.map(({ emotion, count }) => (
              <span
                key={emotion}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary"
              >
                <EmotionIconGroup ids={[emotion]} size="sm" />
                <span className="font-medium text-text tabular-nums">
                  {count}명
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.samples.length > 0 && (
        <div>
          <p className="section-label mb-2">비슷했던 꿈 (익명)</p>
          <div className="space-y-2">
            {summary.samples.map((sample, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface-2 px-3 py-3 text-sm space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <EmotionIconGroup ids={sample.emotions} size="sm" />
                  <p className="font-medium text-text">{sample.title}</p>
                </div>
                {sample.snippet && (
                  <FormattedText className="text-text-secondary leading-relaxed pl-0.5">
                    {`"${sample.snippet}"`}
                  </FormattedText>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted text-center border-t border-border pt-3 tabular-nums">
        {summary.withFollowUpCount.toLocaleString()}명이 D+30 결과를 남겼습니다 — 나머지는 시간이 쌓이는 중
      </p>
    </div>
  );
}

export { CATEGORY_LABELS };
