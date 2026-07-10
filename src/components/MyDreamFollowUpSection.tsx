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
          {answered ? "한 달 뒤, 내가 남긴 후기" : "지금 후기를 남길 수 있어요"}
        </h3>
        {canWrite && (
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">
            미리 적어도 됩니다. 아직 안 적었다면{" "}
            <span className="text-text font-medium">
              {due ? "알림이 왔거나 곧 옵니다" : `${formatDaysUntil(dream.followUpDueAt)} 알림`}
            </span>
            이 옵니다. 이 기록은 <strong className="text-text font-medium">내 아카이브</strong>
            에만 남습니다.
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
