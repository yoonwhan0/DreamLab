import type { CommunityStory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedBlocks, FormattedText } from "@/components/ui/FormattedText";
import { BRAND_FORBIDDEN_TEASE, CTA_PREMIUM_SEE_ALL, CTA_SIGNUP_SEE_MORE } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";

interface CommunityStoriesPanelProps {
  stories: CommunityStory[];
  title?: string;
  /** full — 기본 / compact — 2건 / minimal — 홈용 초슬림 */
  variant?: "full" | "compact" | "minimal";
  compact?: boolean;
  blurLocked?: boolean;
  lockedCount?: number;
  isEstimated?: boolean;
  keyword?: string;
  centered?: boolean;
}

export function CommunityStoriesPanel({
  stories,
  title = "한 달 뒤, 실제로 어땠는지",
  variant,
  compact = false,
  blurLocked = false,
  lockedCount,
  isEstimated: _isEstimated = false,
  keyword,
  centered = false,
}: CommunityStoriesPanelProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  if (stories.length === 0) return null;

  const resolvedVariant = variant ?? (compact ? "compact" : "full");
  const isMinimal = resolvedVariant === "minimal";
  const isCompact = resolvedVariant === "compact";

  const first = stories[0];
  const rest = isCompact || isMinimal ? [] : stories.slice(1);
  const extraLocked = lockedCount ?? Math.max(stories.length - 1, 0);
  const showBlur = blurLocked && extraLocked > 0;

  return (
    <div className={`card card-bezel ${isMinimal ? "p-4 space-y-3" : "p-5 space-y-4"}`}>
      <div className={isMinimal ? "" : "text-center"}>
        <p className="section-label">
          {blurLocked ? "30일 뒤 후기 · 1건만 공개" : "30일 뒤 후기"}
        </p>
        {!isMinimal && (
          <FormattedText as="h3" className="mt-1 text-base font-semibold text-text">
            {title}
          </FormattedText>
        )}
        {isMinimal && (
          <FormattedText as="h3" className="mt-1 text-sm font-semibold text-text">
            {title}
          </FormattedText>
        )}
      </div>

      {first && (
        <article
          className={`rounded-xl border border-border bg-surface-2 ${
            isMinimal ? "p-3 space-y-2" : "p-4 space-y-3"
          }`}
        >
          <StoryContent
            story={first}
            centered={centered}
            variant={resolvedVariant}
          />
        </article>
      )}

      {rest.length > 0 && !showBlur && (
        <div className="space-y-3">
          {rest.map((story) => (
            <article
              key={story.id}
              className="rounded-xl border border-border bg-surface-2 p-4 space-y-3"
            >
              <StoryContent story={story} centered={centered} variant={resolvedVariant} />
            </article>
          ))}
        </div>
      )}

      {showBlur && (
        <div className="relative rounded-xl overflow-hidden min-h-[6rem] border border-border">
          <div className="story-blur-overlay absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center motion-pulse-soft">
            <p className="text-sm font-semibold text-text">
              +{extraLocked.toLocaleString()}건 더
            </p>
            <button
              type="button"
              className="btn-primary mt-1 text-sm"
              onClick={() =>
                access.isGuest
                  ? openSignupSheet(
                      keyword
                        ? `“${keyword}” 한 달 뒤 결말 ${extraLocked}건 — 가입 후 열림`
                        : "가입 후 더 많은 후기를 볼 수 있어요",
                    )
                  : openPremiumSheet(
                      keyword
                        ? `“${keyword}” 후기 ${extraLocked}건 — 프리미엄에서 전체`
                        : BRAND_FORBIDDEN_TEASE,
                    )
              }
            >
              {access.isGuest ? CTA_SIGNUP_SEE_MORE : CTA_PREMIUM_SEE_ALL}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryContent({
  story,
  centered = false,
  variant = "full",
}: {
  story: CommunityStory;
  centered?: boolean;
  variant?: "full" | "compact" | "minimal";
}) {
  if (variant === "minimal") {
    return (
      <div className="space-y-2 text-sm">
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold text-text-muted uppercase">꿈</p>
          <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={2}>
            {story.dreamSnippet}
          </FormattedBlocks>
        </div>
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold text-text-muted uppercase">30일 후</p>
          <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={2}>
            {story.afterStory}
          </FormattedBlocks>
        </div>
        <span className="chip chip-primary text-[0.625rem]">
          {OUTCOME_CATEGORIES[story.outcomeCategory]}
        </span>
      </div>
    );
  }

  const align = centered ? "text-center" : "";

  return (
    <div className={`space-y-3 ${align}`}>
      {centered ? (
        <div className="space-y-2">
          <p className="text-xs text-text-muted tabular-nums">
            {story.profile} · 익명
          </p>
          <p className="font-medium text-text leading-snug">{story.dreamTitle}</p>
          <div className="flex justify-center">
            <EmotionIconGroup ids={story.emotions} size="sm" />
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-text-muted tabular-nums">
              {story.profile} · 익명
            </p>
            <p className="mt-1 font-medium text-text line-clamp-1">{story.dreamTitle}</p>
          </div>
          <EmotionIconGroup ids={story.emotions} size="sm" />
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-surface/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted">꿈</p>
          <FormattedBlocks
            className="text-text-secondary"
            maxLines={variant === "compact" ? 2 : 4}
          >
            {story.dreamSnippet}
          </FormattedBlocks>
        </div>
        <div className="rounded-lg bg-surface/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted">30일 후</p>
          <FormattedBlocks
            className="text-text-secondary"
            maxLines={variant === "compact" ? 2 : 5}
          >
            {story.afterStory}
          </FormattedBlocks>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 text-xs ${
          centered ? "justify-center flex-wrap" : "justify-between"
        }`}
      >
        <span className="chip chip-primary">{OUTCOME_CATEGORIES[story.outcomeCategory]}</span>
        {variant === "full" && (
          <span className="text-text-muted">{story.recordedDaysAgo}일 전</span>
        )}
      </div>
    </div>
  );
}
