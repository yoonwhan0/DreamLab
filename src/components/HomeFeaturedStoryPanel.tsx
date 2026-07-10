import { FormattedBlocks } from "@/components/ui/FormattedText";
import { EmotionIconGroup } from "@/components/ui/Icon";
import {
  BRAND_FORBIDDEN_TEASE,
  CTA_PREMIUM_SEE_ALL,
  CTA_SIGNUP_SEE_MORE,
} from "@/lib/branding";
import { getKeywordIcon } from "@/lib/keywordIcons";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import type { CommunityEstimate } from "@/types";
import {
  OUTCOME_CATEGORIES,
  getEmotionLabel,
  type CommunityStory,
} from "@/types";

interface HomeFeaturedStoryPanelProps {
  keyword: string;
  label: string;
  estimate: CommunityEstimate;
}

/** 홈 후기 — 숫자 없이 금지 엿보기 톤 + 사람 이야기 */
export function HomeFeaturedStoryPanel({
  keyword,
  label,
  estimate,
}: HomeFeaturedStoryPanelProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  const story = estimate.stories[0];
  if (!story) return null;

  const showLock = !access.isPremium;

  return (
    <section className="card-highlight card-bezel p-4 sm:p-5 space-y-4">
      <header className="text-center space-y-2">
        <p className="section-label">열람 로그 · 일부 공개</p>
        <h3 className="text-lg font-bold text-text leading-snug">
          <span className="mr-1" aria-hidden>
            {getKeywordIcon(keyword)}
          </span>
          &ldquo;{label}&rdquo; 꿈을 꾼 누군가의
        </h3>
        <p className="text-sm text-text-secondary copy-lines leading-relaxed">
          한 달 뒤, 실제로 어떻게 됐는지 —{" "}
          <span className="text-primary font-medium">지금 이 한 건만</span> 열려
          있습니다.
        </p>
      </header>

      <FeaturedStoryCard story={story} />

      {showLock && (
        <div className="rounded-xl border border-dashed border-accent/25 bg-surface-2/80 p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-text">나머지 결말은 여기서 멈춥니다</p>
          <p className="text-xs text-text-muted copy-lines leading-relaxed">
            {BRAND_FORBIDDEN_TEASE}
          </p>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() =>
              access.isGuest
                ? openSignupSheet(`“${keyword}” — 당신만 아직 모르는 결말`)
                : openPremiumSheet(`“${keyword}” 후기 전체 — 프리미엄`)
            }
          >
            {access.isGuest ? CTA_SIGNUP_SEE_MORE : CTA_PREMIUM_SEE_ALL}
          </button>
        </div>
      )}
    </section>
  );
}

function FeaturedStoryCard({ story }: { story: CommunityStory }) {
  return (
    <article className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-text-muted">익명 관측자 · D+30</p>
          <p className="font-semibold text-text text-sm leading-snug line-clamp-1">
            {story.dreamTitle}
          </p>
        </div>
        <EmotionIconGroup ids={story.emotions} size="sm" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold text-text-muted">꿈</p>
          <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={2}>
            {story.dreamSnippet}
          </FormattedBlocks>
        </div>
        <div className="space-y-1 border-t border-border/60 pt-2">
          <p className="text-[0.625rem] font-semibold text-primary">30일 후</p>
          <FormattedBlocks className="text-text-secondary leading-relaxed" maxLines={2}>
            {story.afterStory}
          </FormattedBlocks>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip chip-primary text-[0.6875rem]">
          {OUTCOME_CATEGORIES[story.outcomeCategory]}
        </span>
        {story.emotions.slice(0, 2).map((id) => (
          <span key={id} className="chip text-[0.625rem] text-text-muted">
            {getEmotionLabel(id)}
          </span>
        ))}
      </div>
    </article>
  );
}
