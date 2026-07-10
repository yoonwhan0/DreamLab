import { useMemo } from "react";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { getKeywordIcon } from "@/lib/keywordIcons";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import {
  EXPLORE_DISCOVER_KEYWORDS,
  previewKeywordLabel,
} from "@/lib/previewKeywords";
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

  const items = useMemo(
    () =>
      EXPLORE_DISCOVER_KEYWORDS.map((keyword) => {
        const estimate = previewCommunityForKeyword(keyword);
        return {
          keyword,
          label: previewKeywordLabel(keyword),
          estimate,
          stats: estimateToStats(estimate),
          summary: estimateToSummary(estimate, inferCategoryFromKeyword(keyword)),
        };
      }).filter((item) => item.estimate.stories[0]),
    [],
  );

  if (items.length === 0) return null;

  return (
    <section className="space-y-5" aria-labelledby="explore-discover-heading">
      <div className="text-center space-y-1.5">
        <p id="explore-discover-heading" className="section-label">
          탐색 미리보기
        </p>
        <h2 className="text-base font-semibold text-text">이런 꿈, 한 달 뒤는?</h2>
        <p className="text-xs text-text-muted copy-lines px-2">
          아래는 실제 탐색 결과 예시예요. 키워드를 누르면 더 많은 후기·통계를 볼 수
          있습니다.
        </p>
      </div>

      {items.map(({ keyword, label, estimate, stats, summary }) => (
        <article key={keyword} className="space-y-3">
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
            title={`"${label}" — 한 달 뒤는?`}
            variant="compact"
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
