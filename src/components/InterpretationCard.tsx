import {
  DISTINCT_INTERPRETATION_NOTE,
  LEGAL_DISCLAIMER,
  type DreamInterpretation,
} from "@/types";

import { ANCHOR_STOP_WORDS, mergeAiKeywords } from "@/lib/dreamAnchor";
import { FormattedBlocks, FormattedText } from "@/components/ui/FormattedText";

export function InterpretationCard({
  interpretation,
  dreamContent = "",
  dreamTitle = "",
  mode = "default",
}: {
  interpretation: DreamInterpretation;
  dreamContent?: string;
  dreamTitle?: string;
  /** 내 아카이브 — 커뮤니티·탐색 티저 없이 해몽만 */
  mode?: "default" | "personal";
}) {
  const keywords = mergeAiKeywords(
    interpretation.keywords,
    dreamTitle,
    dreamContent,
    6,
  ).filter((k) => !ANCHOR_STOP_WORDS.has(k) && k.length >= 2);

  const personal = mode === "personal";

  return (
    <div className="card card-bezel card-glow p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">{personal ? "AI 해몽" : "관측 메모"}</p>
          {!personal && (
            <p className="text-[0.6875rem] text-text-muted mt-0.5 leading-relaxed">
              일반 해몽
              <span className="mx-1.5 text-border-strong">→</span>
              다른 관점
              <span className="mx-1.5 text-border-strong">→</span>
              30일 데이터
            </p>
          )}
          {personal && (
            <p className="text-[0.6875rem] text-text-muted mt-0.5 leading-relaxed">
              기록 직후 받은 해석입니다. 한 달 뒤 내 후기와 함께 아카이브에 남아요.
            </p>
          )}
        </div>
        <span className="badge badge-member shrink-0">
          {personal ? "내 기록" : "연구소 관점"}
        </span>
      </div>

      <LensBlock
        label="일반적인 해몽"
        hint="인터넷·전통에서 흔히 말하는 해석"
        content={interpretation.usualTake}
        variant="usual"
      />

      {interpretation.alternativeLens && (
        <LensBlock
          label="다른 관점"
          hint="연구소가 겹쳐 보는 해석"
          content={interpretation.alternativeLens}
          variant="alt"
        />
      )}

      <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 space-y-3">
        <p className="text-[0.6875rem] font-semibold text-text-muted">지금 상태</p>
        <FormattedBlocks
          className="text-[0.9375rem] font-medium text-text"
          maxLines={5}
        >
          {interpretation.psychology}
        </FormattedBlocks>

        {interpretation.mood && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <MoodBar label="불안" value={interpretation.mood.anxiety} />
            <MoodBar label="희망" value={interpretation.mood.hope} />
            <MoodBar label="그리움" value={interpretation.mood.longing} />
          </div>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <Section title="상징 (입구)" content={interpretation.symbol} />
        <Section title="한 달 뒤 · 갈릴 지점" content={interpretation.reflection} />
      </div>

      {interpretation.labObservations && !personal && (
        <div className="rounded-xl border border-primary/25 bg-primary-soft/20 p-4 space-y-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-primary">
              연구소 관측
            </p>
            <p className="text-[0.625rem] text-text-muted mt-0.5">
              비슷한 장면을 남긴 기록에서 자주 보이는 패턴
            </p>
          </div>
          <FormattedBlocks className="text-[0.875rem] text-text-secondary" maxLines={3}>
            {interpretation.labObservations.sceneNote}
          </FormattedBlocks>
          {interpretation.labObservations.commonBehaviors.length > 0 && (
            <ul className="space-y-1.5 text-[0.8125rem] text-text-secondary list-disc pl-4">
              {interpretation.labObservations.commonBehaviors.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {interpretation.labObservations.relatedSearches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {interpretation.labObservations.relatedSearches.map((k) => (
                <span key={k} className="chip text-xs">
                  #{k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {keywords.length > 0 && (
        <div className="space-y-2">
          <p className="text-[0.6875rem] text-text-muted">연구 키워드</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k} className="chip chip-primary text-xs">
                #{k}
              </span>
            ))}
          </div>
        </div>
      )}

      {!personal && (
      <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3.5 space-y-2.5">
        <FormattedText className="text-[0.6875rem] text-text-muted leading-relaxed" maxLines={4}>
          {DISTINCT_INTERPRETATION_NOTE}
        </FormattedText>
        <div className="h-px bg-border/50" aria-hidden />
        <FormattedText className="text-[0.6875rem] text-text-muted leading-relaxed" maxLines={4}>
          {LEGAL_DISCLAIMER}
        </FormattedText>
      </div>
      )}
    </div>
  );
}

function LensBlock({
  label,
  hint,
  content,
  variant,
}: {
  label: string;
  hint: string;
  content: string;
  variant: "usual" | "alt";
}) {
  const isAlt = variant === "alt";

  return (
    <div
      className={
        isAlt
          ? "rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2.5"
          : "rounded-xl border border-border bg-surface-2/80 p-4 space-y-2.5"
      }
    >
      <div>
        <p
          className={
            isAlt
              ? "text-[0.6875rem] font-semibold uppercase tracking-wider text-accent"
              : "text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted"
          }
        >
          {label}
        </p>
        <p className="text-[0.625rem] text-text-muted mt-0.5">{hint}</p>
      </div>
      <FormattedBlocks
        className={
          isAlt
            ? "text-[0.9375rem] font-medium text-text"
            : "text-[0.9375rem] text-text-secondary"
        }
        maxLines={6}
      >
        {content}
      </FormattedBlocks>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-text-muted">{title}</p>
      <FormattedBlocks className="text-[0.875rem] text-text-secondary" maxLines={4}>
        {content}
      </FormattedBlocks>
    </div>
  );
}

function MoodBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5 text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text tabular-nums">{value}%</span>
      </div>
      <div className="stat-bar-track h-1.5">
        <div className="stat-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

