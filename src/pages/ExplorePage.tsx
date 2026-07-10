import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversionGate } from "@/components/ConversionGate";
import { MemberUnlockBanner } from "@/components/MemberUnlockBanner";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
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
  formatStoryUnlockPrice,
  storyLoadChunk,
} from "@/lib/storyAccessPricing";
import {
  computeMaxVisible,
  fetchStoryAccess,
  registerStoryViews,
} from "@/services/storyUnlockService";
import { payForStoryUnlock } from "@/services/storyPaymentService";
import type { DreamStats, SimilarDreamSummary, StoryKeywordAccess } from "@/types";
import {
  POPULAR_SEARCHES,
  provocativeSearchPlaceholder,
  previewKeywordLabel,
} from "@/lib/previewKeywords";

function buildExploreDreamContent(query: string): string {
  const q = query.trim();
  if (q.length >= 40) return q;
  return `"${q}"이(가) 떠오르는 꿈을 여러 번 꾼 것 같아요. 장면은 사람마다 다르지만 비슷한 분위기로 기록해 두었어요.`;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [placeholder] = useState(provocativeSearchPlaceholder);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(null);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isEstimated, setIsEstimated] = useState(true);
  const [visibleStoryCount, setVisibleStoryCount] = useState(2);
  const [storyAccess, setStoryAccess] = useState<StoryKeywordAccess | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const searchGenRef = useRef(0);
  const paidHandledRef = useRef(false);

  const displayKeyword = previewKeywordLabel(activeQuery);
  const maxSlots =
    access.isPremium || !access.isMember
      ? (summary?.stories.length ?? MEMBER_FREE_STORY_VIEWS)
      : computeMaxVisible(storyAccess);

  const runSearch = async (searchQuery: string, accessOverride?: StoryKeywordAccess | null) => {
    const q = searchQuery.trim();
    if (!q) return;

    const gen = ++searchGenRef.current;
    setActiveQuery(q);
    setQuery(q);
    setHasSearched(true);
    setPayError("");

    let accessState = accessOverride ?? null;
    if (access.isMember && !access.isPremium) {
      try {
        accessState = await fetchStoryAccess(q);
        if (gen === searchGenRef.current) setStoryAccess(accessState);
      } catch {
        /* 합성 데이터만 유지 */
      }
    }

    const restored = accessState?.viewedStoryIds.length ?? 0;
    const initialVisible = restored > 0 ? restored : storyLoadChunk(0);
    setVisibleStoryCount(initialVisible);

    const instant = applyInstantEstimate(q);
    setSummary(instant.summary);
    setStats(instant.stats);
    setIsEstimated(instant.isEstimated);
    setIsSyncing(true);

    try {
      const dreamContent = buildExploreDreamContent(q);
      const skipAi = Boolean(accessState?.aiBlocked);
      const { interpretation, embedding, communityEstimate } = await interpretDream(
        q,
        dreamContent,
        { skipAi },
      );

      if (gen !== searchGenRef.current) return;

      const community = await resolveCommunityData(interpretation, {
        embedding,
        title: q,
        content: dreamContent,
        estimate: communityEstimate,
      });

      if (gen !== searchGenRef.current) return;

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
    const paid = searchParams.get("paid") === "1";
    if (!q) return;

    void (async () => {
      await runSearch(q);
      if (paid && !paidHandledRef.current && access.isMember && !access.isPremium) {
        paidHandledRef.current = true;
        setSearchParams({}, { replace: true });
        try {
          const nextAccess = await fetchStoryAccess(q);
          setStoryAccess(nextAccess);
          setVisibleStoryCount((prev) => Math.min(prev + 1, nextAccess.maxSlots));
        } catch {
          /* ignore */
        }
      }
    })();
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
      setPayError("무료 4건 이후는 건당 200원 결제가 필요합니다.");
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
      setPayError("무료 4건을 모두 봤습니다. 1건 더 보려면 결제해 주세요.");
      return;
    }

    const ok = await syncVisibleStories(next);
    if (!ok) setPayError("열람 한도를 초과했습니다. 결제 후 이어서 볼 수 있어요.");
  };

  const handlePayForOneStory = async () => {
    if (!activeQuery) return;
    setPaying(true);
    setPayError("");
    try {
      await payForStoryUnlock(activeQuery);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "결제를 시작하지 못했습니다.");
    } finally {
      setPaying(false);
    }
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
          onClick={() => void runSearch(query)}
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
          , 이후 1건씩 <strong className="text-primary">{formatStoryUnlockPrice()}</strong>
        </p>
      )}

      {!hasSearched && (
        <p className="text-center text-sm text-text-muted py-8 card p-6">
          키워드를 입력하거나 위 뱃지를 눌러 보세요. 회원이면 한 달 뒤 후기를 열어볼 수
          있습니다.
        </p>
      )}

      {hasSearched && summary && stats && activeQuery && (
        <div className="space-y-4">
          {access.isMember && !access.isPremium && <MemberUnlockBanner />}

          {isSyncing && (
            <p className="text-xs text-text-muted text-center">최신 기록을 불러오는 중…</p>
          )}

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
                showCuriosityTease={!access.isPremium}
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
                    같은 꿈·30일 뒤 후기를 1건 더 보려면 {formatStoryUnlockPrice()} 결제
                  </p>
                  <button
                    type="button"
                    disabled={paying}
                    onClick={() => void handlePayForOneStory()}
                    className="btn-primary text-sm disabled:opacity-60"
                  >
                    {paying ? "결제창 여는 중…" : `후기 1건 더 보기 · ${formatStoryUnlockPrice()}`}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-text-muted underline"
                    onClick={() =>
                      openPremiumSheet("프리미엄이면 후기·통계를 전부 볼 수 있어요.")
                    }
                  >
                    또는 프리미엄으로 전체 보기
                  </button>
                </div>
              )}

              {payError && (
                <p className="text-xs text-center text-red-400 copy-lines">{payError}</p>
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
      )}

      {hasSearched && isSyncing && !summary && (
        <LoadingPulse label="비슷한 기록을 찾는 중…" />
      )}
    </div>
  );
}
