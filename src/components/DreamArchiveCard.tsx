import { Link } from "react-router-dom";
import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";
import { AppLink } from "@/components/ui/AppLink";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedText } from "@/components/ui/FormattedText";
import { OUTCOME_CATEGORIES, canWriteFollowUpNow, type Dream } from "@/types";

export function DreamArchiveCard({ dream }: { dream: Dream }) {
  const answered = Boolean(dream.followUp);
  const canWrite = canWriteFollowUpNow(dream);

  return (
    <article className="card card-bezel p-4 space-y-3">
      <AppLink to={`/dream/${dream.id}`} className="block space-y-2 group">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text line-clamp-1 group-hover:text-primary transition-colors">
            {dream.title || "꿈 기록"}
          </h3>
          <time className="text-[0.6875rem] text-text-muted shrink-0 tabular-nums">
            {dream.createdAt.toLocaleDateString("ko-KR")}
          </time>
        </div>

        <DreamJourneyStepper
          createdAt={dream.createdAt}
          followUpDueAt={dream.followUpDueAt}
          answered={answered}
          compact
        />

        <FormattedText className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {dream.content}
        </FormattedText>

        <div className="flex items-center justify-between">
          <EmotionIconGroup ids={dream.emotions} size="sm" />
          <span className="text-xs text-text-muted">상세 보기 →</span>
        </div>
      </AppLink>

      {dream.followUp ? (
        <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-primary">30일 후 · 내가 남긴 후기</p>
            <span className="chip chip-primary text-[0.625rem]">
              {OUTCOME_CATEGORIES[dream.followUp.outcomeCategory]}
            </span>
          </div>
          <FormattedText className="text-sm text-text-secondary leading-relaxed">
            {dream.followUp.note}
          </FormattedText>
          <div className="flex items-center justify-between text-[0.6875rem] text-text-muted">
            <EmotionIconGroup ids={dream.followUp.emotions} size="sm" />
            <span>
              {dream.followUp.answeredAt.toLocaleDateString("ko-KR")} 기록
            </span>
          </div>
        </div>
      ) : canWrite ? (
        <div className="space-y-1.5">
          <Link
            to={`/follow-up/${dream.id}`}
            className="btn-primary !min-h-[2.75rem] text-sm !normal-case !tracking-normal"
          >
            후기 남기기
          </Link>
          <p className="text-[0.6875rem] text-text-muted text-center">
            미리 적어도 OK · 안 적으면 30일에 알림
          </p>
        </div>
      ) : null}
    </article>
  );
}
