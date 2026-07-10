import {
  DISTINCT_INTERPRETATION_NOTE,
  LEGAL_DISCLAIMER,
  type DreamInterpretation,
} from "@/types";

import { ANCHOR_STOP_WORDS, mergeAiKeywords } from "@/lib/dreamAnchor";
import { FormattedBlocks, FormattedText } from "@/components/ui/FormattedText";
import { InterpretationTierBlur } from "@/components/InterpretationTierBlur";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";

export function InterpretationCard({
  interpretation,
  dreamContent = "",
  dreamTitle = "",
  mode = "default",
}: {
  interpretation: DreamInterpretation;
  dreamContent?: string;
  dreamTitle?: string;
  /** 내 아카이브 — 내 꿈 해몽 + (하단) 비슷한 꿈은 별도 섹션 */
  mode?: "default" | "personal";
}) {
  const access = useAccessPolicy();
  const keywords = mergeAiKeywords(
    interpretation.keywords,
    dreamTitle,
    dreamContent,
    6,
  ).filter((k) => !ANCHOR_STOP_WORDS.has(k) && k.length >= 2);

  const personal = mode === "personal";
  const lockGuest = access.isGuest;
  const lockPremium = access.isMember && !access.isPremium;

  const guestLock = lockGuest ? ("guest" as const) : false;
  const premiumLock = lockPremium ? ("premium" as const) : false;

  return (
    <div className="card card-bezel card-glow p-5 space-y-5">
      {/* 1. 꿈연구소 해몽 — 비회원도 전체 공개 */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">꿈연구소 해몽</p>
            <p className="text-[0.6875rem] text-text-muted mt-0.5 leading-relaxed copy-lines">
              {personal
                ? "당신 꿈 장면만 보고 쓴 일반 해몽입니다."
                : "인터넷·전통 해몽과 비교할 수 있는 기본 해석입니다."}
            </p>
          </div>
          <span className="badge badge-member shrink-0">
            {personal ? "내 기록" : "해몽"}
          </span>
        </div>

        <LensBlock
          label="꿈연구소 해몽"
          hint="당신 꿈 장면만 보고 쓴 해몽"
          content={interpretation.usualTake}
          variant="usual"
          maxLines={12}
        />
      </div>

      {/* 2. 꿈연구소장의 관점 — 비회원은 여기부터 잠금 */}
      <InterpretationTierBlur
        lock={guestLock}
        label="꿈연구소장의 관점"
        preview={
          <div className="space-y-3">
            {interpretation.alternativeLens && (
              <LensBlock
                label="꿈연구소장의 관점"
                hint="심리·상징 관점"
                content={interpretation.alternativeLens}
                variant="alt"
                maxLines={3}
              />
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">꿈연구소장의 관점</p>
              <p className="text-[0.6875rem] text-text-muted mt-0.5 leading-relaxed">
                연구소장이 이 꿈을 심리·상징·패턴으로 풀어 쓴 해석입니다.
              </p>
            </div>
            <span className="badge badge-member shrink-0">연구소장</span>
          </div>

          {interpretation.alternativeLens && (
            <LensBlock
              label="꿈연구소장의 관점"
              hint="심리·상징 관점"
              content={interpretation.alternativeLens}
              variant="alt"
              maxLines={10}
            />
          )}

          <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 space-y-3">
            <p className="text-[0.6875rem] font-semibold text-text-muted">지금 상태</p>
            <FormattedBlocks
              className="text-[0.9375rem] font-medium text-text"
              maxLines={8}
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
            <Section title="상징 (입구)" content={interpretation.symbol} maxLines={6} />
            <InterpretationTierBlur
              lock={premiumLock}
              label="한 달 뒤 · 갈릴 지점"
              preview={
                <Section title="한 달 뒤 · 갈릴 지점" content={interpretation.reflection} maxLines={5} />
              }
            >
              <Section title="한 달 뒤 · 갈릴 지점" content={interpretation.reflection} maxLines={6} />
            </InterpretationTierBlur>
          </div>

          {interpretation.labObservations && (
            <InterpretationTierBlur
              lock={premiumLock}
              label="비슷한 꿈을 꾼 사람들"
              preview={
                <div className="rounded-xl border border-primary/25 bg-primary-soft/20 p-4 space-y-2">
                  <p className="text-[0.6875rem] font-semibold text-primary">비슷한 꿈을 꾼 사람들</p>
                  <FormattedBlocks className="text-[0.875rem] text-text-secondary" maxLines={5}>
                    {interpretation.labObservations.sceneNote}
                  </FormattedBlocks>
                </div>
              }
            >
              <div className="rounded-xl border border-primary/25 bg-primary-soft/20 p-4 space-y-3">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-primary">
                    비슷한 꿈을 꾼 사람들
                  </p>
                  <p className="text-[0.625rem] text-text-muted mt-0.5">
                    같은 유형·키워드로 기록된 사람들의 패턴 (해몽과는 별도)
                  </p>
                </div>
                <FormattedBlocks className="text-[0.875rem] text-text-secondary" maxLines={5}>
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
            </InterpretationTierBlur>
          )}
        </div>
      </InterpretationTierBlur>

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
  maxLines = 6,
}: {
  label: string;
  hint: string;
  content: string;
  variant: "usual" | "alt";
  maxLines?: number;
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
            ? "text-[0.9375rem] font-medium text-text leading-relaxed"
            : "text-[0.9375rem] text-text-secondary leading-relaxed"
        }
        maxLines={maxLines}
      >
        {content}
      </FormattedBlocks>
    </div>
  );
}

function Section({
  title,
  content,
  maxLines = 4,
}: {
  title: string;
  content: string;
  maxLines?: number;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-text-muted">{title}</p>
      <FormattedBlocks className="text-[0.875rem] text-text-secondary leading-relaxed" maxLines={maxLines}>
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
