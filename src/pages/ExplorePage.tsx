import { useRef, useState } from "react";

import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { SimilarDreamsPanel } from "@/components/SimilarDreamsPanel";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { StatsBar } from "@/components/StatsBar";
import { SurvivalRate } from "@/components/SurvivalRate";
import { AppIcons, Icon } from "@/components/ui/Icon";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { resolveCommunityData } from "@/services/communityDataService";
import { interpretDream } from "@/services/interpretService";
import { getOutcomePercentages } from "@/services/dreamService";
import {
  estimateToStats,
  estimateToSummary,
  previewCommunityForKeyword,
} from "@/services/syntheticCommunityService";
import type { DreamStats, SimilarDreamSummary } from "@/types";
import {
  getExploreDefaultKeyword,
  POPULAR_SEARCHES,
  provocativeSearchPlaceholder,
  previewKeywordLabel,
} from "@/lib/previewKeywords";

function buildExploreDreamContent(query: string): string {
  const q = query.trim();
  if (q.length >= 40) return q;
  if (q.length >= 20) {
    return `${q}이(가) 선명하게 보였던 꿈이었어요. 그 장면이 계속 머리에 남아서 궁금해졌어요.`;
  }
  return `꿈 속에서 ${q}이(가) 나왔어요. ${q}과(와) 관련된 장면이 선명했고, 무섭기도 하고 궁금했어요.`;
}

function loadLocalPreview(keyword: string) {
  const estimate = previewCommunityForKeyword(keyword);
  const category = /뱀|쫓|추락|시험|불|죽|실직/.test(keyword)
    ? "anxiety"
    : /연애|남친|여친|바람|불륜|이별/.test(keyword)
      ? "love"
      : "general";
  return {
    summary: estimateToSummary(estimate, category),
    stats: estimateToStats(estimate),
    isEstimated: true,
  };
}

export function ExplorePage() {
  const access = useAccessPolicy();
  const defaultKeyword = useState(() => getExploreDefaultKeyword())[0];
  const [placeholder] = useState(provocativeSearchPlaceholder);

  const initialPreview = useState(() => loadLocalPreview(defaultKeyword))[0];
  const [query, setQuery] = useState(defaultKeyword);
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(
    () => initialPreview.summary,
  );
  const [stats, setStats] = useState<DreamStats | null>(() => initialPreview.stats);
  const [isEstimated, setIsEstimated] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchGenRef = useRef(0);

  const displayKeyword = previewKeywordLabel(query);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q || searching) return;

    const gen = ++searchGenRef.current;
    setQuery(q);
    setSearching(true);

    try {
      const dreamContent = buildExploreDreamContent(q);

      const { interpretation, embedding, communityEstimate } =
        await interpretDream(q, dreamContent);

      if (gen !== searchGenRef.current) return;

      const community = await resolveCommunityData(interpretation, {
        embedding,
        title: q,
        estimate: communityEstimate,
      });

      if (gen !== searchGenRef.current) return;

      setSummary(community.summary);
      setStats(community.stats);
      setIsEstimated(community.isEstimated);
    } finally {
      if (gen === searchGenRef.current) {
        setSearching(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.explore.title} desc={PAGE_COPY.explore.desc} />

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          placeholder={placeholder}
          className="input pr-12"
        />
        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white"
          aria-label="검색"
        >
          <Icon icon={AppIcons.search} size="sm" className="text-white" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleSearch(term)}
            className="chip hover:bg-surface-3"
          >
            {term}
          </button>
        ))}
      </div>

      {searching ? (
        <LoadingPulse label="같은 꿈 데이터 스캔 중..." />
      ) : summary && stats && query ? (
        <div className="space-y-4">
          {summary.totalCount > 0 ? (
            <>
              <CommunityStatPreview
                keyword={displayKeyword}
                totalCount={summary.totalCount}
                withFollowUpCount={summary.withFollowUpCount}
                stats={stats}
                showCuriosityTease={!access.isPremium}
                lockOutcomes={!access.isPremium}
                isEstimated={isEstimated}
              />

              {access.isMember && <SimilarDreamsPanel summary={summary} />}
            </>
          ) : (
            <p className="text-center text-text-secondary py-8 card p-6">
              아직 데이터가 없어요. 쌓이면 여기에 표시됩니다.
            </p>
          )}

          {summary.stories.length > 0 && (
            <CommunityStoriesPanel
              stories={summary.stories}
              blurLocked={!access.isPremium}
              lockedCount={Math.max(summary.stories.length - 1, 48)}
              keyword={query}
            />
          )}

          {access.canViewOutcomeStats && stats.totalWithFollowUp > 0 && (
            <>
              <SurvivalRate
                totalDreams={stats.totalDreams}
                totalWithFollowUp={stats.totalWithFollowUp}
              />
              <div className="card p-5">
                <h3 className="font-semibold text-text mb-4">한 달 뒤, 그들의 답</h3>
                <StatsBar
                  items={getOutcomePercentages(stats)}
                  totalCount={stats.totalWithFollowUp}
                />
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
