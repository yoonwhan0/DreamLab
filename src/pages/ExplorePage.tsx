import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversionGate } from "@/components/ConversionGate";
import { KeywordChipRail } from "@/components/KeywordChipRail";
import { MemberUnlockBanner } from "@/components/MemberUnlockBanner";
import { AiWritingPulse } from "@/components/motion/AiWritingPulse";
import { withMinimumDelay } from "@/lib/minimumDelay";
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
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { resolveCommunityData } from "@/services/communityDataService";
import { interpretDream } from "@/services/interpretService";
import { getOutcomePercentages } from "@/services/dreamService";
import {
  MEMBER_FREE_STORY_VIEWS,
  STORY_PAID_UNLOCK_PRICE_WON,
  initialStoryVisibleCount,
  storyLoadChunk,
} from "@/lib/storyAccessPricing";
import {
  computeMaxVisible,
  fetchStoryAccess,
  registerStoryViews,
} from "@/services/storyUnlockService";
import type { DreamStats, SimilarDreamSummary, StoryKeywordAccess } from "@/types";
import { KEYWORD_RAIL_COUNT, provocativeSearchPlaceholder, previewKeywordLabel } from "@/lib/previewKeywords";

function buildExploreDreamContent(query: string): string {
  const q = query.trim();
  if (q.length >= 40) return q;
  return `"${q}"이(가) 꿈의 중심이었어요. 장면은 사람마다 다르지만 비슷한 키워드로 기록해 두었어요.`;
}

const AI_WRITING_MIN_MS = 2200;

export function ExplorePage() {
  const access = useAccessPolicy();
  const { openPremiumSheet } = usePremiumSheet();
  const { openSignupSheet } = useSignupSheet();
  const exploreKeywords = useFeaturedKeywords(KEYWORD_RAIL_COUNT);
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
  const [visibleStoryCount, setVisibleStoryCount] = useState(1);
  const [storyAccess, setStoryAccess] = useState<StoryKeywordAccess | null>(null);
  const [limitMessage, setLimitMessage] = useState("");
  const searchGenRef = useRef(0);

  const displayKeyword = previewKeywordLabel(pendingKeyword || activeQuery);
  const isSearchBusy = isFetching || isSyncing;
  const maxSlots = access.isPremium
    ? Number.MAX_SAFE_INTEGER
    : access.isMember
      ? computeMaxVisible(storyAccess)
      : 0;

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
    setActiveQuery(q);

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
    const initialVisible = access.isGuest
      ? 1
      : initialStoryVisibleCount(access.isPremium, restored);
    setVisibleStoryCount(initialVisible);

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

      setSummary(community.summary);
      setStats(community.stats);
      setIsEstimated(community.isEstimated);

      const storyCap = community.summary.stories.length;
      const initialShown = Math.min(initialVisible, storyCap);

      if (access.isMember && !access.isPremium && storyCap > 0) {
        const synced = await syncVisibleStories(initialShown, community.summary, q);
        if (gen === searchGenRef.current && synced) {
          setVisibleStoryCount(initialShown);
        }
      } else {
        setVisibleStoryCount(initialShown);
      }
    } catch {
      /* AI 실패 시 빈 결과 유지 */
    } finally {
      if (gen === searchGenRef.current) {
        setIsFetching(false);
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

  const syncVisibleStories = async (
    nextCount: number,
    summarySnapshot = summary,
    keywordSnapshot = activeQuery,
  ) => {
    if (!summarySnapshot || !keywordSnapshot || access.isPremium) {
      setVisibleStoryCount(nextCount);
      return true;
    }

    const slice = summarySnapshot.stories.slice(0, nextCount);
    const ids = slice.map((s) => s.id);
    const reg = await registerStoryViews(keywordSnapshot, ids);
    if (!reg.ok) {
      setLimitMessage(
        `무료 ${MEMBER_FREE_STORY_VIEWS}건을 모두 봤습니다. 프리미엄 또는 앱에서 구독해 주세요.`,
      );
      return false;
    }
    setStoryAccess(reg.access);
    setVisibleStoryCount(Math.min(nextCount, summarySnapshot.stories.length));
    return true;
  };

  const ensureStoryAt = (index: number): SimilarDreamSummary | null => {
    if (!summary) return null;
    if (index < summary.stories.length) return summary;
    return null;
  };

  const handleLoadMoreStories = async () => {
    if (!summary || !activeQuery) return;
    if (access.isGuest) {
      openSignupSheet("Google로 가입하면 같은 꿈 후기를 더 볼 수 있어요.");
      return;
    }
    if (!access.isMember) return;

    const chunk = storyLoadChunk(visibleStoryCount);
    const target = visibleStoryCount + chunk;

    if (!access.isPremium && target > maxSlots) {
      setLimitMessage(
        `무료 ${MEMBER_FREE_STORY_VIEWS}건을 모두 봤습니다. 추가 1건은 ${STORY_PAID_UNLOCK_PRICE_WON}원 · 프리미엄은 전체 열람.`,
      );
      return;
    }

    const withStory = ensureStoryAt(target - 1);
    if (!withStory || target > withStory.stories.length) {
      setLimitMessage("AI가 생성한 후기를 모두 봤습니다. 실제 기록이 쌓이면 더 열립니다.");
      return;
    }

    if (access.isPremium) {
      setVisibleStoryCount(target);
      return;
    }

    const ok = await syncVisibleStories(
      Math.min(target, withStory.stories.length),
      withStory,
      activeQuery,
    );
    if (!ok) {
      setLimitMessage("열람 한도를 초과했습니다. 프리미엄 또는 앱 구독이 필요합니다.");
    }
  };

  const visibleStories =
    summary != null
      ? summary.stories.slice(0, Math.min(visibleStoryCount, summary.stories.length))
      : [];

  const canLoadMore =
    summary != null &&
    visibleStoryCount < summary.stories.length &&
    (access.isPremium || (access.isMember && visibleStoryCount < maxSlots) || access.isGuest);

  const needsPaywall =
    access.isMember &&
    !access.isPremium &&
    summary != null &&
    visibleStoryCount >= maxSlots;

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

      <KeywordChipRail
        label="이런 꿈, 한 달 뒤는?"
        keywords={exploreKeywords}
        activeKeyword={activeQuery || pendingKeyword}
        variant="explore"
        onSelect={(term) => void runSearch(term)}
      />

      {access.isGuest && (
        <p className="text-xs text-text-muted text-center px-2 copy-lines">
          비회원도 탐색 미리보기는 볼 수 있어요. <strong className="text-text">중간부터 블러</strong>
          되며, Google 가입 시 더 열립니다.
        </p>
      )}

      {access.isMember && !access.isPremium && (
        <p className="text-xs text-text-muted text-center px-2 copy-lines">
          회원 — 키워드당 후기 <strong className="text-text">{MEMBER_FREE_STORY_VIEWS}건 무료</strong>
          , 이후 1건씩 불러오기 · 추가 1건{" "}
          <strong className="text-text">{STORY_PAID_UNLOCK_PRICE_WON}원</strong>
        </p>
      )}

      {access.isPremium && (
        <p className="text-xs text-text-muted text-center px-2 copy-lines">
          프리미엄 — 처음 {initialStoryVisibleCount(true, 0)}건 집중 노출, 이후 한 건씩 세밀하게 불러옵니다.
        </p>
      )}

      {hasSearched && isSearchBusy && activeQuery && (
        <AiWritingPulse keyword={displayKeyword} />
      )}

      {hasSearched &&
        !isSearchBusy &&
        activeQuery &&
        !summary &&
        !stats && (
          <p className="text-center text-sm text-text-secondary py-8 card p-6 copy-lines">
            후기를 불러오지 못했어요. 잠시 후 다시 검색해 주세요.
          </p>
        )}

      {hasSearched && summary && stats && activeQuery && (
        <div className="space-y-4 explore-ai-reveal" aria-busy={isSearchBusy}>
          {access.isMember && !access.isPremium && <MemberUnlockBanner />}

          <div className="space-y-4">
            {storyAccess?.aiBlocked && !access.isPremium && access.isMember && (
              <p className="text-xs text-center text-text-muted card p-3">
                이 키워드는 무료 {MEMBER_FREE_STORY_VIEWS}건 열람 기록이 있어 AI 재생성 없이 캐시·합성
                데이터를 사용합니다.
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
                <DreamFortuneTrendPanel snapshot={buildDreamFortuneSnapshot(activeQuery, stats)} />
              </>
            ) : (
              <p className="text-center text-text-secondary py-8 card p-6">
                아직 기록이 없어요. 쌓이면 여기에 표시됩니다.
              </p>
            )}

            {visibleStories.length > 0 && (
              <>
                <CommunityStoriesPanel
                  stories={visibleStories}
                  title={`"${displayKeyword}" — 한 달 뒤는?`}
                  variant="compact"
                  blurLocked={!access.isPremium && (access.isGuest || needsPaywall)}
                  lockedCount={
                    access.isPremium
                      ? 0
                      : Math.max(
                          summary.stories.length - visibleStories.length,
                          summary.withFollowUpCount - visibleStories.length,
                          access.isGuest ? 8 : 4,
                        )
                  }
                  blurPreviewStory={summary.stories[visibleStories.length]}
                  keyword={activeQuery}
                  isEstimated={isEstimated}
                />

                {!access.isPremium && storyAccess && access.isMember && (
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
                    {access.isGuest
                      ? "Google 가입하고 후기 더 보기"
                      : access.isPremium
                        ? "후기 1건 더 보기"
                        : visibleStoryCount >= MEMBER_FREE_STORY_VIEWS
                          ? `후기 1건 더 보기 (${STORY_PAID_UNLOCK_PRICE_WON}원)`
                          : "후기 1건 더 보기"}
                  </button>
                )}

                {needsPaywall && access.isMember && !access.isPremium && (
                  <div className="card border border-accent/20 p-4 space-y-3 text-center">
                    <p className="text-sm font-semibold text-text">
                      무료 {MEMBER_FREE_STORY_VIEWS}건을 다 봤습니다
                    </p>
                    <p className="text-xs text-text-secondary copy-lines">
                      추가 1건은 {STORY_PAID_UNLOCK_PRICE_WON}원 · 전체는 프리미엄 구독(앱스토어·Play)으로
                      열립니다.
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

                {access.isGuest && summary.stories.length > visibleStories.length && (
                  <ConversionGate step={2} keyword={activeQuery} />
                )}

                {limitMessage && (
                  <p className="text-xs text-center text-text-secondary copy-lines">{limitMessage}</p>
                )}
              </>
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
