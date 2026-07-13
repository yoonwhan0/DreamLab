import {
  DISTINCT_INTERPRETATION_NOTE,
  LEGAL_DISCLAIMER,
  type DreamInterpretation,
  type DreamObservation,
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
                추측 없이, 꿈에 있던 장면만 관측 → 상징 → 수렴 → 한계 순으로 겨눕니다.
              </p>
            </div>
            <span className="badge badge-member shrink-0">연구소장</span>
          </div>

          {interpretation.observation && (
            <ObservationBlock observation={interpretation.observation} />
          )}

          {interpretation.alternativeLens && (
            <LensBlock
              label="DreamLab Interpretation"
              hint="관측 → 상징 → 수렴 → 한계"
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
                <ReflectionDialogue content={interpretation.reflection} preview />
              }
            >
              <ReflectionDialogue content={interpretation.reflection} />
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

const RANK_MARKS = ["①", "②", "③", "④"];

function ObservationBlock({ observation }: { observation: DreamObservation }) {
  const elements = observation.repeatedElements.filter((e) => e.trim().length > 0);
  const axes = observation.axes.filter((a) => a.trim().length > 0);

  if (elements.length === 0 && !observation.note) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-2/70 p-4 space-y-3">
      <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
          DreamLab Observation
        </p>
        <p className="text-[0.625rem] text-text-muted mt-0.5">
          이번 꿈에서 반복되는 요소
        </p>
      </div>

      {elements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {elements.slice(0, 4).map((el, i) => (
            <span key={el} className="dream-signal-node">
              <span className="text-text-muted mr-1" aria-hidden>
                {RANK_MARKS[i]}
              </span>
              {el}
            </span>
          ))}
        </div>
      )}

      {axes.length > 0 && (
        <p className="text-[0.8125rem] text-text-secondary leading-relaxed">
          이 요소들은{" "}
          {axes.map((axis, i) => (
            <span key={axis}>
              <span className="font-semibold text-text">‘{axis}’</span>
              {i < axes.length - 1 ? " · " : ""}
            </span>
          ))}{" "}
          축으로 연결됩니다.
        </p>
      )}

      {observation.note && (
        <p className="text-[0.8125rem] text-text-muted leading-relaxed">
          {observation.note}
        </p>
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

function ReflectionDialogue({
  content,
  preview = false,
}: {
  content: string;
  preview?: boolean;
}) {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="reflection-dialogue space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-text-muted">한 달 뒤 · 갈릴 지점</p>
        <span className="text-[0.625rem] text-text-muted">당신에게, 편하게</span>
      </div>
      <div className="reflection-dialogue__bubble space-y-2.5">
        {lines.slice(0, preview ? 2 : 4).map((line) => (
          <p
            key={line}
            className={
              /[?？]$/.test(line) || line.includes("?")
                ? "reflection-dialogue__question"
                : "reflection-dialogue__note"
            }
          >
            {line}
          </p>
        ))}
      </div>
      <p className="text-[0.625rem] text-text-muted leading-relaxed">
        연구소 해몽과는 다른 영역이에요. 꿈은 종종 반대로 읽히기도 해요 — 한 달 뒤 기록과 겹쳐 보면
        갈릴 지점이 보입니다.
      </p>
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
