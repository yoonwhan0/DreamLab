import { Link } from "react-router-dom";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedText } from "@/components/ui/FormattedText";
import {
  canWriteFollowUpNow,
  formatDaysUntil,
  isFollowUpDue,
  OUTCOME_CATEGORIES,
  type Dream,
} from "@/types";

interface MyDreamFollowUpSectionProps {
  dream: Dream;
  dreamId: string;
}

/** 내 꿈 상세 — 30일 여정·내 후기 (커뮤니티/탐색과 분리) */
export function MyDreamFollowUpSection({ dream, dreamId }: MyDreamFollowUpSectionProps) {
  const answered = Boolean(dream.followUp);
  const canWrite = canWriteFollowUpNow(dream);
  const due = isFollowUpDue(dream.followUpDueAt);

  return (
    <section className="card-highlight p-5 space-y-4">
      <div>
        <p className="section-label">내 30일 여정</p>
        <h3 className="mt-1 text-base font-semibold text-text">
          {answered
            ? "한 달 뒤, 내가 남긴 후기"
            : due
              ? "이제 한 달 뒤 후기를 남길 때예요"
              : "지금부터 기록해 두면 변화가 보여요"}
        </h3>
        {canWrite && (
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">
            {due
              ? "꿈을 꾼 지 한 달이 지났어요. 그동안 실제로 어떤 일이 있었는지 남겨 주세요. "
              : `한 달 뒤 정식 알림(${formatDaysUntil(dream.followUpDueAt)})이 오지만, 지금부터 적어두면 그 사이 마음이 어떻게 달라졌는지 비교할 수 있어요. 언제든 이어서 고칠 수 있습니다. `}
            이 기록은 <strong className="text-text font-medium">내 아카이브</strong>에만 남고,
            결말을 남기면 같은 꿈을 꾼 다음 사람의 통계가 됩니다.
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
      ) : canWrite ? (
        <Link to={`/follow-up/${dreamId}`} className="btn-primary !normal-case !tracking-normal">
          그 꿈 이후, 어떤 일이 있었나요?
        </Link>
      ) : null}
    </section>
  );
}
