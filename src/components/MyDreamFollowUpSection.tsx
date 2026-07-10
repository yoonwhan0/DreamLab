import { Link } from "react-router-dom";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedText } from "@/components/ui/FormattedText";
import { formatDaysUntil, isFollowUpDue, OUTCOME_CATEGORIES, type Dream } from "@/types";

interface MyDreamFollowUpSectionProps {
  dream: Dream;
  dreamId: string;
}

/** 내 꿈 상세 — 30일 여정·내 후기 (커뮤니티/탐색과 분리) */
export function MyDreamFollowUpSection({ dream, dreamId }: MyDreamFollowUpSectionProps) {
  const due = isFollowUpDue(dream.followUpDueAt);
  const answered = Boolean(dream.followUp);

  return (
    <section className="card-highlight p-5 space-y-4">
      <div>
        <p className="section-label">내 30일 여정</p>
        <h3 className="mt-1 text-base font-semibold text-text">
          {answered
            ? "한 달 뒤, 내가 남긴 후기"
            : due
              ? "지금 후기를 남길 수 있어요"
              : `아직 ${formatDaysUntil(dream.followUpDueAt)}`}
        </h3>
        {!answered && !due && (
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">
            알림이 오면 그때 현실에서 어떤 일이 있었는지 적어 주세요. 이 기록은{" "}
            <strong className="text-text font-medium">내 아카이브</strong>에만 남습니다.
          </p>
        )}
      </div>

      {dream.followUp ? (
        <div className="rounded-xl border border-primary/20 bg-surface-2 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="chip chip-primary">
              {OUTCOME_CATEGORIES[dream.followUp.outcomeCategory]}
            </span>
            <span className="text-[0.6875rem] text-text-muted">
              {dream.followUp.answeredAt.toLocaleDateString("ko-KR")} 기록
            </span>
          </div>
          <FormattedText className="text-sm text-text-secondary leading-relaxed">
            {dream.followUp.note}
          </FormattedText>
          <EmotionIconGroup ids={dream.followUp.emotions} size="sm" />
        </div>
      ) : due ? (
        <Link to={`/follow-up/${dreamId}`} className="btn-primary !normal-case !tracking-normal">
          그 꿈 이후, 어떤 일이 있었나요?
        </Link>
      ) : (
        <p className="text-sm text-text-muted text-center py-2">
          남의 후기가 아니라, <span className="text-text-secondary">내 한 달 뒤</span>를 기다리는
          중이에요.
        </p>
      )}
    </section>
  );
}
