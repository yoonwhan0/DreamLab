import type { CommunityStory, DreamEmotionId } from "@/types";
import { OUTCOME_CATEGORIES, getEmotionLabel } from "@/types";
import { EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedBlocks, FormattedText } from "@/components/ui/FormattedText";
import { CTA_PREMIUM_SEE_ALL, CTA_SIGNUP_SEE_MORE } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { ANONYMOUS_STORY_PROFILE } from "@/lib/coherentCommunityStory";
import { SIMILAR_STORIES_DEFAULT_TITLE } from "@/lib/dataCopy";

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
  /** 사용자 꿈 감정 — 사례별 유사도(같은 감정축) 표기용 */
  userEmotions?: DreamEmotionId[];
  centered?: boolean;
}

export function CommunityStoriesPanel({
  stories,
  title = SIMILAR_STORIES_DEFAULT_TITLE,
  variant,
  compact = false,
  blurLocked = false,
  dreamTeaseBlur = false,
  lockedCount,
  blurPreviewStory: _blurPreviewStory,
  isEstimated: _isEstimated = false,
  keyword,
  userEmotions,
  centered: _centered = false,
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
            variant={resolvedVariant}
            matchLabel={keyword}
            userEmotions={userEmotions}
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
              <StoryContent
                story={story}
                variant={resolvedVariant}
                matchLabel={keyword}
                userEmotions={userEmotions}
              />
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

/** 사례별 유사도 — 감정 겹침 + id 해시로 결정적, 62~86% */
function storyMatchPercent(
  story: CommunityStory,
  userEmotions?: DreamEmotionId[],
): number {
  const shared =
    userEmotions && userEmotions.length > 0
      ? story.emotions.filter((e) => userEmotions.includes(e)).length /
        userEmotions.length
      : 0.4;
  let hash = 0;
  for (let i = 0; i < story.id.length; i++) {
    hash = (hash * 31 + story.id.charCodeAt(i)) >>> 0;
  }
  const jitter = hash % 8;
  return Math.min(86, Math.max(62, 62 + Math.round(shared * 18) + jitter));
}

function StoryContent({
  story,
  variant = "full",
  matchLabel,
  userEmotions,
  dreamTeaseBlur = false,
  onDreamTeaseSignup,
}: {
  story: CommunityStory;
  variant?: "full" | "compact" | "minimal";
  /** 이 사례가 사용자 꿈과 어떤 계열로 겹치는지(데이터 매칭 근거) */
  matchLabel?: string;
  /** 사용자 꿈 감정 — 같은 감정축 표기용 */
  userEmotions?: DreamEmotionId[];
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

  const cleanMatch = matchLabel?.replace(/ 꿈$/, "").trim();
  const matchPercent = storyMatchPercent(story, userEmotions);
  const sharedEmotion =
    userEmotions && userEmotions.length > 0
      ? story.emotions.find((e) => userEmotions.includes(e))
      : undefined;
  const emotionAxis = sharedEmotion ? getEmotionLabel(sharedEmotion) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">
            {formatStoryProfile(story.profile)} · {story.recordedDaysAgo}일 전 관측
          </p>
          <p className="mt-1 font-medium text-text leading-snug line-clamp-1">
            사례 · {story.dreamTitle}
          </p>
        </div>
        <EmotionIconGroup ids={story.emotions} size="sm" />
      </div>

      <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-bold text-accent tabular-nums">
            유사도 {matchPercent}%
          </span>
          {(emotionAxis || cleanMatch) && (
            <span className="h-3 w-px bg-border" aria-hidden />
          )}
          <span className="text-[0.6875rem] text-text-secondary">
            {emotionAxis && (
              <span className="text-text font-medium">같은 감정축 ‘{emotionAxis}’</span>
            )}
            {emotionAxis && cleanMatch ? " · " : ""}
            {cleanMatch && (
              <span className="text-text font-medium">같은 상징축 ‘{cleanMatch}’</span>
            )}
          </span>
        </div>
        <p className="text-[0.6875rem] text-text-muted leading-relaxed">
          장면은 달라도, 같은 감정·상징으로 분류된 기록이에요. 똑같은 꿈이 아니라
          같은 <span className="text-text-secondary">계열</span>이에요.
        </p>
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="text-xs font-semibold text-text-muted">이 사람의 꿈 (다른 장면)</p>
        <DreamSnippetBlock
          snippet={story.dreamSnippet}
          teaseBlur={dreamTeaseBlur}
          onTeaseSignup={onDreamTeaseSignup}
          className="text-text-secondary leading-relaxed"
          maxLines={12}
        />
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="text-xs font-semibold text-text-muted">
          30일 뒤, 이 사람은 이렇게 적었습니다
        </p>
        <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={12}>
          {story.afterStory}
        </FormattedBlocks>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3 text-xs">
        <span className="text-text-muted">그 결과</span>
        <span className="chip chip-primary">{OUTCOME_CATEGORIES[story.outcomeCategory]}</span>
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
