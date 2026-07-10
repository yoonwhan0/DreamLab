import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { MemberUnlockBanner } from "@/components/MemberUnlockBanner";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import type { CommunityEstimate } from "@/types";

interface HomeFeaturedStoryPanelProps {
  keyword: string;
  label: string;
  estimate: CommunityEstimate;
}

/** 홈 — 후기 미리보기 + 블러 + 가입/프리미엄 유도 */
export function HomeFeaturedStoryPanel({
  keyword,
  estimate,
}: HomeFeaturedStoryPanelProps) {
  const access = useAccessPolicy();

  if (!estimate.stories[0]) return null;

  const maxVisible = access.isPremium ? 3 : access.isMember ? 2 : 1;
  const visibleStories = estimate.stories.slice(0, maxVisible);
  const lockedCount = Math.max(
    estimate.withFollowUpCount - visibleStories.length,
    estimate.stories.length - visibleStories.length + 10,
    12,
  );

  return (
    <section className="space-y-3">
      {access.isMember && !access.isPremium && <MemberUnlockBanner />}

      <CommunityStoriesPanel
        stories={visibleStories}
        title={`"${keyword}" 꿈 — 한 달 뒤는?`}
        variant="compact"
        blurLocked={!access.isPremium}
        lockedCount={lockedCount}
        keyword={keyword}
        blurPreviewStory={estimate.stories[maxVisible] ?? estimate.stories[1]}
        isEstimated
      />
    </section>
  );
}
