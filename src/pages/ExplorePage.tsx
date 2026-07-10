import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversionGate } from "@/components/ConversionGate";
import { MemberUnlockBanner } from "@/components/MemberUnlockBanner";
import { ExploreDiscoverSection } from "@/components/ExploreDiscoverSection";
import { AiWritingPulse } from "@/components/motion/AiWritingPulse";
import { withMinimumDelay } from "@/lib/minimumDelay";
import { SimilarDreamsPanel } from "@/components/SimilarDreamsPanel";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { DreamFortuneTrendPanel } from "@/components/DreamFortuneTrendPanel";
import { buildDreamFortuneSnapshot } from "@/lib/dreamFortuneTrends";
import { StatsBar } from "@/components/StatsBar";
import { SurvivalRate } from "@/components/SurvivalRate";
import { AppIcons, Icon } from "@/components/ui/Icon";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useFeaturedKeywords } from "@/hooks/useFeaturedKeywords";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { resolveCommunityData } from "@/services/communityDataService";
import { interpretDream } from "@/services/interpretService";
import {
  estimateToStats,
  estimateToSummary,
  previewCommunityForKeyword,
} from "@/services/syntheticCommunityService";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import { getKeywordIcon } from "@/lib/keywordIcons";
import { getOutcomePercentages } from "@/services/dreamService";
import {
  MEMBER_FREE_STORY_VIEWS,
  storyLoadChunk,
} from "@/lib/storyAccessPricing";
import {
  computeMaxVisible,
  fetchStoryAccess,
  registerStoryViews,
} from "@/services/storyUnlockService";
import type { DreamStats, SimilarDreamSummary, StoryKeywordAccess } from "@/types";
import {
  EXPLORE_KEYWORD_CHIP_COUNT,
  provocativeSearchPlaceholder,
  previewKeywordLabel,
} from "@/lib/previewKeywords";

function buildExploreDreamContent(query: string): string {
  const q = query.trim();
  if (q.length >= 40) return q;
  return `"${q}"이(가) 떠오르는 꿈을 여러 번 꾼 것 같아요. 장면은 사람마다 다르지만 비슷한 분위기로 기록해 두었어요.`;
}

/** AI가 너무 즉시 끝나지 않게 — 작성 연출 최소 시간 */
const AI_WRITING_MIN_MS = 2200;
/** fetchStoryAccess·합성 데이터 준비 구간 — 로딩이 보이도록 최소 시간 */
const FETCH_MIN_MS = 360;

function applyInstantEstimate(keyword: string) {
  const estimate = previewCommunityForKeyword(keyword);
  return {
    summary: estimateToSummary(estimate, inferCategoryFromKeyword(keyword)),
    stats: estimateToStats(estimate),
    isEstimated: true as const,
  };
}

export function ExplorePage() {
  const access = useAccessPolicy();
  const { openPremiumSheet } = usePremiumSheet();
  const exploreKeywords = useFeaturedKeywords(EXPLORE_KEYWORD_CHIP_COUNT);
  const [searchParams] = useSearchParams();
  const [placeholder] = useState(provocativeSearchPlaceholder);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(null);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isEstimated, setIsEstimated] = useState(true);
  const [visibleStoryCount, setVisibleStoryCount] = useState(2);
  const [storyAccess, setStoryAccess] = useState<StoryKeywordAccess | null>(null);
  const [limitMessage, setLimitMessage] = useState("");
  const searchGenRef = useRef(0);

  const displayKeyword = previewKeywordLabel(pendingKeyword || activeQuery);
  const isSearchBusy = isFetching || isSyncing;
  const maxSlots =
    access.isPremium || !access.isMember
      ? (summary?.stories.length ?? MEMBER_FREE_STORY_VIEWS)
      : computeMaxVisible(storyAccess);

  const runSearch = async (searchQuery: string, accessOverride?: StoryKeywordAccess | null) => {
    const q = searchQuery.trim();
    if (!q) return;

    const gen = ++searchGenRef.current;
    setPendingKeyword(q);
    setQuery(q);
    setHasSearched(true);
    setIsFetching(true);
    setIsSyncing(false);
    setSummary(null);
    setStats(null);
    setLimitMessage("");

    let accessState = accessOverride ?? null;
    if (access.isMember && !access.isPremium) {
      try {
        accessState = await fetchStoryAccess(q);
        if (gen === searchGenRef.current) setStoryAccess(accessState);
      } catch {
        /* 합성 데이터만 유지 */
      }
    }

    if (gen !== searchGenRef.current) return;

    const restored = accessState?.viewedStoryIds.length ?? 0;
    const initialVisible = restored > 0 ? restored : storyLoadChunk(0);
    setVisibleStoryCount(initialVisible);

    const instant = applyInstantEstimate(q);

    await withMinimumDelay(Promise.resolve(), FETCH_MIN_MS);

    if (gen !== searchGenRef.current) return;

    setActiveQuery(q);
    setSummary(instant.summary);
    setStats(instant.stats);
    setIsEstimated(instant.isEstimated);
    setIsFetching(false);
    setIsSyncing(true);

    try {
      const skipAi = Boolean(accessState?.aiBlocked);

      const loadAi = async () => {
        const dreamContent = buildExploreDreamContent(q);
        const { interpretation, embedding, communityEstimate } = await interpretDream(
          q,
          dreamContent,
          { skipAi },
        );

        if (gen !== searchGenRef.current) return null;

        return resolveCommunityData(interpretation, {
          embedding,
          title: q,
          content: dreamContent,
          estimate: communityEstimate,
        });
      };

      const community = await withMinimumDelay(
        loadAi(),
        skipAi ? 0 : AI_WRITING_MIN_MS,
      );

      if (gen !== searchGenRef.current || !community) return;

      if (access.isMember) {
        setSummary(community.summary);
        setStats(community.stats);
        setIsEstimated(community.isEstimated);
      }
    } catch {
      /* 즉시 표시한 기록은 유지 */
    } finally {
      if (gen === searchGenRef.current) {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q) return;
    void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link once
  }, []);

  const syncVisibleStories = async (nextCount: number) => {
    if (!summary || !activeQuery || access.isPremium) {
      setVisibleStoryCount(nextCount);
      return;
    }

    const slice = summary.stories.slice(0, nextCount);
    const ids = slice.map((s) => s.id);
    const reg = await registerStoryViews(activeQuery, ids);
    if (!reg.ok) {
      setLimitMessage("무료 4건을 모두 봤습니다. 프리미엄 또는 앱에서 구독해 주세요.");
      return false;
    }
    setStoryAccess(reg.access);
    setVisibleStoryCount(Math.min(nextCount, summary.stories.length));
    return true;
  };

  const handleLoadMoreStories = async () => {
    if (!summary || !access.isMember || access.isPremium) return;

    const chunk = storyLoadChunk(visibleStoryCount);
    const next = Math.min(visibleStoryCount + chunk, summary.stories.length);

    if (next > maxSlots) {
      setLimitMessage("무료 4건을 모두 봤습니다. 프리미엄으로 전체를 열 수 있어요.");
      return;
    }

    const ok = await syncVisibleStories(next);
    if (!ok) setLimitMessage("열람 한도를 초과했습니다. 프리미엄 또는 앱 구독이 필요합니다.");
  };

  const visibleStories =
    access.isMember && summary
      ? summary.stories.slice(0, Math.min(visibleStoryCount, maxSlots, summary.stories.length))
      : [];

  const canLoadMore =
    access.isMember &&
    !access.isPremium &&
    summary != null &&
    visibleStoryCount < summary.stories.length &&
    visibleStoryCount < maxSlots;

  const needsPaywall =
    access.isMember &&
    !access.isPremium &&
    summary != null &&
    visibleStoryCount >= maxSlots &&
    visibleStoryCount < summary.stories.length;

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.explore.title} desc={PAGE_COPY.explore.desc} />

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch(query)}
          placeholder={placeholder}
          className="input pr-12"
        />
        <button
          type="button"
          disabled={isSearchBusy}
          onClick={() => void runSearch(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-70"
          aria-label={isSearchBusy ? "검색 중" : "검색"}
        >
          {isSearchBusy ? (
            <Icon icon={AppIcons.spinner} size="sm" className="text-white animate-spin" />
          ) : (
            <Icon icon={AppIcons.search} size="sm" className="text-white" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {exploreKeywords.map((term, index) => (
          <button
            key={`${term}-${index}`}
            type="button"
            onClick={() => void runSearch(term)}
            className="chip hover:bg-surface-3"
          >
            <span className="mr-1" aria-hidden>
              {getKeywordIcon(term)}
            </span>
            {term}
          </button>
        ))}
      </div>

      {access.isMember && !access.isPremium && (
        <p className="text-xs text-text-muted text-center px-2 copy-lines">
          회원 — 키워드당 후기 <strong className="text-text">{MEMBER_FREE_STORY_VIEWS}건 무료</strong>
          . 더 보려면 <strong className="text-primary">프리미엄 구독</strong> (앱스토어·Play)
        </p>
      )}

      {!hasSearched && (
        <ExploreDiscoverSection onSelectKeyword={(term) => void runSearch(term)} />
      )}

      {hasSearched && isSearchBusy && (
        <AiWritingPulse keyword={displayKeyword} />
      )}

      {hasSearched && summary && stats && activeQuery && (
        <div
          className={`space-y-4 ${isSyncing ? "" : "explore-ai-reveal"}`}
          aria-busy={isSearchBusy}
        >
          {access.isMember && !access.isPremium && <MemberUnlockBanner />}

          <div className={isSyncing ? "explore-ai-syncing space-y-4" : "space-y-4"}>
          {storyAccess?.aiBlocked && !access.isPremium && (
            <p className="text-xs text-center text-text-muted card p-3">
              이 키워드는 무료 4건 열람 기록이 저장되어 AI 재생성 없이 캐시·합성 데이터를
              사용합니다.
            </p>
          )}

          {summary.totalCount > 0 ? (
            <>
              <CommunityStatPreview
                keyword={displayKeyword}
                totalCount={summary.totalCount}
                withFollowUpCount={summary.withFollowUpCount}
                stats={stats}
                lockOutcomes={!access.isPremium}
                isEstimated={isEstimated}
              />
              <DreamFortuneTrendPanel
                snapshot={buildDreamFortuneSnapshot(activeQuery, stats)}
                compact={access.isGuest}
              />
            </>
          ) : (
            <p className="text-center text-text-secondary py-8 card p-6">
              아직 기록이 없어요. 쌓이면 여기에 표시됩니다.
            </p>
          )}

          {access.isGuest && summary.stories.length > 0 && (
            <>
              <CommunityStoriesPanel
                stories={summary.stories.slice(0, 1)}
                title={`"${displayKeyword}" — 한 달 뒤는?`}
                variant="compact"
                blurLocked
                lockedCount={Math.max(
                  summary.withFollowUpCount - 1,
                  summary.stories.length - 1 + 8,
                  10,
                )}
                blurPreviewStory={summary.stories[1]}
                keyword={activeQuery}
                isEstimated={isEstimated}
              />
              <ConversionGate step={2} keyword={activeQuery} />
            </>
          )}

          {access.isGuest && summary.stories.length === 0 && summary.totalCount > 0 && (
            <ConversionGate step={2} keyword={activeQuery} />
          )}

          {access.isGuest && (
            <p className="text-xs text-text-muted text-center px-2">
              검색어는 연구 데이터에 반영됩니다. 후기 열람은 회원만 가능합니다.
            </p>
          )}

          {access.isMember && visibleStories.length > 0 && (
            <>
              <CommunityStoriesPanel
                stories={visibleStories}
                title={`"${displayKeyword}" — 한 달 뒤는?`}
                variant="compact"
                blurLocked={!access.isPremium && needsPaywall}
                lockedCount={
                  access.isPremium
                    ? 0
                    : Math.max(
                        summary.stories.length - visibleStories.length,
                        summary.withFollowUpCount - visibleStories.length,
                        6,
                      )
                }
                blurPreviewStory={
                  summary.stories[visibleStories.length] ?? summary.stories[1]
                }
                keyword={activeQuery}
                isEstimated={isEstimated}
              />

              {!access.isPremium && storyAccess && (
                <p className="text-xs text-center text-text-muted tabular-nums">
                  열람 {visibleStories.length} / {maxSlots}건
                  {storyAccess.paidUnlockCount > 0 &&
                    ` (유료 ${storyAccess.paidUnlockCount}건)`}
                </p>
              )}

              {canLoadMore && (
                <button
                  type="button"
                  onClick={() => void handleLoadMoreStories()}
                  className="btn-secondary !min-h-[2.75rem] text-sm !normal-case !tracking-normal"
                >
                  후기 {storyLoadChunk(visibleStoryCount)}건 더 보기
                </button>
              )}

              {needsPaywall && (
                <div className="card border border-accent/20 p-4 space-y-3 text-center">
                  <p className="text-sm font-semibold text-text">
                    무료 {MEMBER_FREE_STORY_VIEWS}건을 다 봤습니다
                  </p>
                  <p className="text-xs text-text-secondary copy-lines">
                    후기·통계 전체는 프리미엄 구독으로 열립니다. iOS·Android 앱에서는 App Store /
                    Google Play 결제를 사용합니다.
                  </p>
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    onClick={() =>
                      openPremiumSheet(
                        "프리미엄이면 후기·통계를 전부 볼 수 있어요. 앱 출시 후 스토어 구독으로 연결됩니다.",
                      )
                    }
                  >
                    프리미엄 구독 안내
                  </button>
                </div>
              )}

              {limitMessage && (
                <p className="text-xs text-center text-text-secondary copy-lines">{limitMessage}</p>
              )}
            </>
          )}

          {access.isMember && access.isPremium && summary.totalCount > 0 && (
            <SimilarDreamsPanel summary={summary} />
          )}

          {access.canViewOutcomeStats && stats.totalWithFollowUp > 0 && (
            <div className="space-y-4">
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
            </div>
          )}
          </div>
        </div>
      )}

    </div>
  );
}
