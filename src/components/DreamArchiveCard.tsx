import { Link } from "react-router-dom";
import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";
import { AppLink } from "@/components/ui/AppLink";
import { FormattedText } from "@/components/ui/FormattedText";
import { OUTCOME_CATEGORIES, canWriteFollowUpNow, type Dream } from "@/types";

export function DreamArchiveCard({ dream }: { dream: Dream }) {
  const answered = Boolean(dream.followUp);
  const canWrite = canWriteFollowUpNow(dream);

  return (
    <article className="card card-bezel p-3.5 space-y-2.5">
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

        <FormattedText className="text-sm text-text-secondary line-clamp-1 leading-relaxed">
          {dream.content}
        </FormattedText>

        <p className="text-xs font-medium text-primary">30일 여정 보기 →</p>
      </AppLink>

      {dream.followUp && (
        <div className="rounded-lg border border-primary/15 bg-primary-soft/20 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="chip chip-primary text-[0.625rem]">
              {OUTCOME_CATEGORIES[dream.followUp.outcomeCategory]}
            </span>
            <span className="text-[0.625rem] text-text-muted">내 후기</span>
          </div>
          <FormattedText className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {dream.followUp.note}
          </FormattedText>
        </div>
      )}

      {!answered && canWrite && (
        <Link
          to={`/follow-up/${dream.id}`}
          className="btn-secondary !min-h-[2.5rem] w-full text-xs !normal-case !tracking-normal"
        >
          후기 남기기
        </Link>
      )}
    </article>
  );
}
