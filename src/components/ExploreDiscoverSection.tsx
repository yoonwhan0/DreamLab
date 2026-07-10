import { useMemo } from "react";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useFeaturedKeywords } from "@/hooks/useFeaturedKeywords";
import { getKeywordIcon } from "@/lib/keywordIcons";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import {
  EXPLORE_DISCOVER_PREVIEW_COUNT,
  previewKeywordLabel,
} from "@/lib/previewKeywords";
import { SIMILAR_MONTH_LABEL, SIMILAR_MONTH_TITLE } from "@/lib/dataCopy";
import {
  estimateToStats,
  estimateToSummary,
  previewCommunityForKeyword,
} from "@/services/syntheticCommunityService";

interface ExploreDiscoverSectionProps {
  onSelectKeyword: (keyword: string) => void;
}

/** 탐색 — 검색 전 여러 키워드 후기·통계 맛보기 */
export function ExploreDiscoverSection({ onSelectKeyword }: ExploreDiscoverSectionProps) {
  const access = useAccessPolicy();
  const discoverKeywords = useFeaturedKeywords(EXPLORE_DISCOVER_PREVIEW_COUNT);

  const items = useMemo(
    () =>
      discoverKeywords.map((keyword) => {
        const estimate = previewCommunityForKeyword(keyword);
        return {
          keyword,
          label: previewKeywordLabel(keyword),
          estimate,
          stats: estimateToStats(estimate),
          summary: estimateToSummary(estimate, inferCategoryFromKeyword(keyword)),
        };
      }).filter((item) => item.estimate.stories[0]),
    [discoverKeywords],
  );

  if (items.length === 0) return null;

  return (
    <section className="space-y-5" aria-labelledby="explore-discover-heading">
      <div className="text-center space-y-1.5">
        <p id="explore-discover-heading" className="section-label">
          탐색 미리보기
        </p>
        <h2 className="text-base font-semibold text-text">{SIMILAR_MONTH_LABEL}</h2>
        <p className="text-xs text-text-muted copy-lines px-2">
          아래는 실제 탐색 결과 예시예요. 키워드를 누르면 더 많은 후기·통계를 볼 수
          있습니다.
        </p>
      </div>

      {items.map(({ keyword, label, estimate, stats, summary }, index) => (
        <article key={`${keyword}-${index}`} className="space-y-3">
          <button
            type="button"
            onClick={() => onSelectKeyword(keyword)}
            className="chip w-full justify-center !min-h-[2.75rem] hover:bg-surface-3"
          >
            <span className="mr-1.5" aria-hidden>
              {getKeywordIcon(keyword)}
            </span>
            <span className="font-semibold">{keyword}</span>
            <span className="text-text-muted ml-1.5">· 전체 보기</span>
          </button>

          <CommunityStatPreview
            keyword={label}
            totalCount={summary.totalCount}
            withFollowUpCount={summary.withFollowUpCount}
            stats={stats}
            lockOutcomes={!access.isPremium}
            isEstimated
          />

          <CommunityStoriesPanel
            stories={[estimate.stories[0]!]}
            title={SIMILAR_MONTH_TITLE(label)}
            variant="compact"
            dreamTeaseBlur={access.isGuest}
            blurLocked={access.isGuest}
            lockedCount={Math.max(
              estimate.withFollowUpCount - 1,
              estimate.stories.length - 1 + 8,
              10,
            )}
            blurPreviewStory={estimate.stories[1]}
            keyword={keyword}
            isEstimated
          />
        </article>
      ))}
    </section>
  );
}
