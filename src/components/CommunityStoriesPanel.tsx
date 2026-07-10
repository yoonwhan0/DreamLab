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

  compact?: boolean;

  blurLocked?: boolean;

  lockedCount?: number;

  isEstimated?: boolean;

  keyword?: string;

  /** 홈 등 — 제목·본문 가운데 정렬 */
  centered?: boolean;

}



export function CommunityStoriesPanel({

  stories,

  title = "한 달 뒤, 실제로 어땠는지",

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



  const first = stories[0];

  const rest = compact ? stories.slice(1, 2) : stories.slice(1);

  const extraLocked = lockedCount ?? Math.max(stories.length - 1, 0);

  const showBlur = blurLocked && extraLocked > 0;



  return (

    <div className="card card-bezel p-5 space-y-4">

      <div className="text-center">
        <p className="section-label">
          {blurLocked ? "30일 뒤 후기 · 1건만 공개" : "30일 뒤 후기"}
        </p>
        <FormattedText as="h3" className="mt-1 text-base font-semibold text-text">
          {title}
        </FormattedText>
      </div>



      {first && (

        <article className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">

          <StoryContent story={first} centered={centered} />

        </article>

      )}



      {rest.length > 0 && !showBlur && (

        <div className="space-y-3">

          {rest.map((story) => (

            <article

              key={story.id}

              className="rounded-xl border border-border bg-surface-2 p-4 space-y-3"

            >

              <StoryContent story={story} centered={centered} />

            </article>

          ))}

        </div>

      )}



      {showBlur && (

        <div className="relative rounded-xl overflow-hidden min-h-[9rem] border border-border">

          {rest[0] && (

            <article className="story-blurred bg-surface-2 p-4 space-y-3 pointer-events-none">

              <StoryContent story={rest[0]} centered={centered} />

            </article>

          )}

          <div className="story-blur-overlay absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center motion-pulse-soft">

            <p className="text-sm font-semibold text-text">
              +{extraLocked.toLocaleString()}건 더
            </p>
            <p className="text-xs text-text-muted copy-lines leading-relaxed">
              {access.isGuest
                ? "같은 꿈을 꾼 이들의 결말 — 대부분은 여기서 멈춥니다"
                : "나머지 결말 — 열람 권한이 있는 자만 봅니다"}
            </p>

            <button
              type="button"
              className="btn-primary mt-1 text-sm"
              onClick={() =>
                access.isGuest
                  ? openSignupSheet(
                      keyword
                        ? `“${keyword}” 한 달 뒤 결말 ${extraLocked}건 — 당신만 아직 모릅니다`
                        : "당신만 아직 모르는 결말 — 가입 후 열림",
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



      {compact && !showBlur && stories.length > 2 && (

        <p className="text-center text-xs text-text-muted">+{stories.length - 2}건 더</p>

      )}

    </div>

  );

}



function StoryContent({
  story,
  centered = false,
}: {
  story: CommunityStory;
  centered?: boolean;
}) {
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
          <FormattedBlocks className="text-text-secondary" maxLines={4}>
            {story.dreamSnippet}
          </FormattedBlocks>
        </div>
        <div className="rounded-lg bg-surface/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted">30일 후</p>
          <FormattedBlocks className="text-text-secondary" maxLines={5}>
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
        <span className="text-text-muted">{story.recordedDaysAgo}일 전</span>
      </div>
    </div>
  );
}


