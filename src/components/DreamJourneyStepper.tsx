import { formatDaysBadge, getJourneyProgress } from "@/lib/dreamUtils";
import { isFollowUpDue } from "@/types";

interface DreamJourneyStepperProps {
  createdAt: Date;
  followUpDueAt: Date;
  answered?: boolean;
  compact?: boolean;
}

export function DreamJourneyStepper({
  createdAt,
  followUpDueAt,
  answered = false,
  compact = false,
}: DreamJourneyStepperProps) {
  const due = isFollowUpDue(followUpDueAt);
  const progress = answered ? 100 : getJourneyProgress(createdAt, followUpDueAt);
  const badge = formatDaysBadge(followUpDueAt, answered);

  const step2Label = answered
    ? "답변 완료"
    : due
      ? "답변 가능"
      : "대기";

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-primary tabular-nums">
            {answered ? "✓ 완료" : due ? "⏳ 답변 가능" : `⏳ ${badge}`}
          </span>
          {!answered && !due && (
            <span className="text-[0.6875rem] text-text-muted">30일 여정</span>
          )}
        </div>
        {!answered && (
          <div className="stat-bar-track h-1.5">
            <div className="stat-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-2/80 p-3 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-secondary">30일 여정</span>
        <span
          className={`font-semibold tabular-nums ${
            answered ? "text-success" : due ? "text-primary" : "text-primary"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="flex items-center gap-1 text-[0.6875rem] font-medium">
        <StepDot done label="기록" />
        <StepLine progress={progress} />
        <StepDot active={!answered && !due} done={due || answered} label={step2Label} />
        <StepLine progress={answered ? 100 : due ? 50 : 0} />
        <StepDot done={answered} locked={!answered} label="결과" />
      </div>

      {!answered && (
        <div className="stat-bar-track h-1.5">
          <div className="stat-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function StepDot({
  done,
  active,
  locked,
  label,
}: {
  done?: boolean;
  active?: boolean;
  locked?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          done
            ? "bg-primary"
            : active
              ? "bg-primary ring-2 ring-primary/30"
              : locked
                ? "bg-surface-3"
                : "bg-primary/40"
        }`}
      />
      <span className="truncate text-[0.625rem] text-text-muted max-w-full text-center">
        {label}
      </span>
    </div>
  );
}

function StepLine({ progress }: { progress: number }) {
  return (
    <div className="h-0.5 flex-1 min-w-[0.5rem] rounded-full bg-surface-3 overflow-hidden">
      <div
        className="h-full bg-primary/60 transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
