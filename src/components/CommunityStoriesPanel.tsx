import type { CommunityStory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedBlocks, FormattedText } from "@/components/ui/FormattedText";
import { CTA_PREMIUM_SEE_ALL, CTA_SIGNUP_SEE_MORE } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { ANONYMOUS_STORY_PROFILE } from "@/lib/coherentCommunityStory";

interface CommunityStoriesPanelProps {
  stories: CommunityStory[];
  title?: string;
  /** full — 기본 / compact — 줄임 / minimal — 홈용 초슬림 */
  variant?: "full" | "compact" | "minimal";
  compact?: boolean;
  blurLocked?: boolean;
  /** 비회원 미리보기 — 꿈 본문만 희미하게 (회원은 선명) */
  dreamTeaseBlur?: boolean;
  lockedCount?: number;
  /** 블러 뒤에 희미히 보여줄 다음 후기 */
  blurPreviewStory?: CommunityStory;
  isEstimated?: boolean;
  keyword?: string;
  centered?: boolean;
}

export function CommunityStoriesPanel({
  stories,
  title = "유사한 내용의 한 달 뒤, 실제로 어땠는지",
  variant,
  compact = false,
  blurLocked = false,
  dreamTeaseBlur = false,
  lockedCount,
  blurPreviewStory: _blurPreviewStory,
  isEstimated: _isEstimated = false,
  keyword: _keyword,
  centered = false,
}: CommunityStoriesPanelProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  if (stories.length === 0) return null;

  const resolvedVariant = variant ?? (compact ? "compact" : "full");
  const isMinimal = resolvedVariant === "minimal";

  const first = stories[0];
  const rest = isMinimal ? [] : stories.slice(1);
  const extraLocked = lockedCount ?? Math.max(stories.length - 1, 0);
  const showBlur = blurLocked && extraLocked > 0;

  const sectionLabel = dreamTeaseBlur
    ? "후기 맛보기 · 꿈 내용은 가입 후"
    : blurLocked
      ? access.isGuest
        ? "후기 한 건만 공개"
        : "일부만 공개 · 프리미엄"
      : "30일 뒤 후기";

  return (
    <div className={`card card-bezel ${isMinimal ? "p-4 space-y-3" : "p-5 space-y-4"}`}>
      <div className={isMinimal ? "" : "text-center"}>
        <p className="section-label">{sectionLabel}</p>
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
            dreamTeaseBlur={dreamTeaseBlur}
            onDreamTeaseSignup={
              dreamTeaseBlur
                ? () => openSignupSheet("회원가입하면 꿈 내용을 볼 수 있어요.")
                : undefined
            }
          />
        </article>
      )}

      {rest.length > 0 && (
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
        <div className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-text">
            {access.isGuest ? "Google 가입 후 후기를 더 볼 수 있어요" : "프리미엄에서 전체 공개"}
          </p>
          <p className="text-xs text-text-secondary copy-lines max-w-[16rem] mx-auto">
            {access.isGuest
              ? "Google로 가입하면 같은 꿈 후기·탐색 한도가 열립니다."
              : "결말·통계·8주 운세 그래프는 프리미엄 구독에서 볼 수 있어요."}
          </p>
          <button
            type="button"
            className="btn-primary mt-1 text-sm"
            onClick={() =>
              access.isGuest
                ? openSignupSheet("Google로 가입하면 같은 꿈 후기를 더 볼 수 있어요.")
                : openPremiumSheet("후기·통계 전체는 프리미엄 구독에서 볼 수 있어요.")
            }
          >
            {access.isGuest ? CTA_SIGNUP_SEE_MORE : CTA_PREMIUM_SEE_ALL}
          </button>
        </div>
      )}
    </div>
  );
}

function StoryContent({
  story,
  centered = false,
  variant = "full",
  dreamTeaseBlur = false,
  onDreamTeaseSignup,
}: {
  story: CommunityStory;
  centered?: boolean;
  variant?: "full" | "compact" | "minimal";
  /** 비회원 미리보기 — 꿈 본문만 하단 블러, 30일 후는 선명 */
  dreamTeaseBlur?: boolean;
  onDreamTeaseSignup?: () => void;
}) {
  if (variant === "minimal") {
    return (
      <div className="space-y-2 text-sm">
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold text-text-muted uppercase">꿈</p>
          <DreamSnippetBlock
            snippet={story.dreamSnippet}
            teaseBlur={dreamTeaseBlur}
            onTeaseSignup={onDreamTeaseSignup}
            className="text-text-secondary leading-relaxed"
            maxLines={5}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold text-text-muted uppercase">30일 후</p>
          <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={5}>
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
            {formatStoryProfile(story.profile)}
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
              {formatStoryProfile(story.profile)}
            </p>
            <p className="mt-1 font-medium text-text line-clamp-1">{story.dreamTitle}</p>
          </div>
          <EmotionIconGroup ids={story.emotions} size="sm" />
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-surface/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted">꿈</p>
          <DreamSnippetBlock
            snippet={story.dreamSnippet}
            teaseBlur={dreamTeaseBlur}
            onTeaseSignup={onDreamTeaseSignup}
            className="text-text-secondary"
            maxLines={5}
          />
        </div>
        <div className="rounded-lg bg-surface/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted">30일 후</p>
          <FormattedBlocks
            className="text-text-secondary"
            maxLines={5}
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

function DreamSnippetBlock({
  snippet,
  teaseBlur,
  onTeaseSignup,
  className,
  maxLines,
}: {
  snippet: string;
  teaseBlur: boolean;
  onTeaseSignup?: () => void;
  className?: string;
  maxLines: number;
}) {
  if (teaseBlur) {
    return (
      <div className="dream-snippet-tease">
        <FormattedBlocks className={`dream-snippet-tease__body ${className ?? ""}`} maxLines={maxLines}>
          {snippet}
        </FormattedBlocks>
        <div className="dream-snippet-tease__hint">
          <p className="dream-snippet-tease__hint-text">회원가입하면 꿈 내용이 보여요</p>
          {onTeaseSignup && (
            <button type="button" className="dream-snippet-tease__hint-btn" onClick={onTeaseSignup}>
              {CTA_SIGNUP_SEE_MORE}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <FormattedBlocks className={className} maxLines={maxLines}>
      {snippet}
    </FormattedBlocks>
  );
}

function formatStoryProfile(_profile: string): string {
  return ANONYMOUS_STORY_PROFILE;
}
