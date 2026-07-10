import { useRef, useState } from "react";
import { ConversionGate } from "@/components/ConversionGate";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { SimilarDreamsPanel } from "@/components/SimilarDreamsPanel";
import { PageHero } from "@/components/ui/PageHero";
import { CONSUMER_JOURNEY, PAGE_COPY } from "@/lib/productIdeas";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
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
import { getOutcomePercentages } from "@/services/dreamService";
import type { DreamStats, SimilarDreamSummary } from "@/types";
import {
  POPULAR_SEARCHES,
  provocativeSearchPlaceholder,
  previewKeywordLabel,
} from "@/lib/previewKeywords";

const STORY_CHUNK = 2;
const MEMBER_FREE_CAP = 4;

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
  const [placeholder] = useState(provocativeSearchPlaceholder);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(null);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isEstimated, setIsEstimated] = useState(true);
  const [visibleStoryCount, setVisibleStoryCount] = useState(STORY_CHUNK);
  const searchGenRef = useRef(0);

  const displayKeyword = previewKeywordLabel(activeQuery);

  const runSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    const gen = ++searchGenRef.current;
    setActiveQuery(q);
    setQuery(q);
    setHasSearched(true);
    setVisibleStoryCount(STORY_CHUNK);

    const instant = applyInstantEstimate(q);
    setSummary(instant.summary);
    setStats(instant.stats);
    setIsEstimated(instant.isEstimated);
    setIsSyncing(true);

    try {
      const dreamContent = buildExploreDreamContent(q);
      const { interpretation, embedding, communityEstimate } = await interpretDream(
        q,
        dreamContent,
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

  const handleLoadMoreStories = () => {
    const total = summary?.stories.length ?? 0;
    const next = visibleStoryCount + STORY_CHUNK;

    if (!access.isPremium && next > MEMBER_FREE_CAP) {
      openPremiumSheet("한 달 뒤 후기를 더 보려면 프리미엄이 필요합니다.");
      return;
    }

    if (!access.isPremium && visibleStoryCount >= MEMBER_FREE_CAP) {
      openPremiumSheet("전체 후기·통계 열람은 프리미엄입니다.");
      return;
    }

    setVisibleStoryCount(Math.min(next, total));
  };

  const memberStoryCap = access.isPremium ? (summary?.stories.length ?? 0) : MEMBER_FREE_CAP;
  const visibleStories =
    access.isMember && summary
      ? summary.stories.slice(0, Math.min(visibleStoryCount, memberStoryCap))
      : [];

  const canLoadMore =
    access.isMember &&
    summary != null &&
    visibleStoryCount < summary.stories.length &&
    (access.isPremium || visibleStoryCount < MEMBER_FREE_CAP);

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.explore.title} desc={PAGE_COPY.explore.desc} />

      <section className="card p-4 space-y-2">
        <p className="section-label">이 탭에서 하는 일</p>
        <p className="text-sm text-text-secondary leading-relaxed">
          <strong className="text-text font-medium">남들이 꾼 비슷한 꿈</strong>과{" "}
          <strong className="text-text font-medium">한 달 뒤에 남긴 후기</strong>를 봅니다. 내
          꿈 기록은 <span className="text-primary">마이</span> 탭에서 확인하세요.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CONSUMER_JOURNEY.map((step) => (
            <span
              key={step.step}
              className={`chip text-[0.625rem] ${step.step === 4 ? "chip-primary" : ""}`}
            >
              {step.step}. {step.label}
            </span>
          ))}
        </div>
      </section>

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
            {term}
          </button>
        ))}
      </div>

      {!hasSearched && (
        <p className="text-center text-sm text-text-muted py-8 card p-6">
          키워드를 입력하거나 위 뱃지를 눌러 보세요. 회원이면 한 달 뒤 후기를 열어볼 수
          있습니다.
        </p>
      )}

      {hasSearched && summary && stats && activeQuery && (
        <div className="space-y-4">
          {isSyncing && (
            <p className="text-xs text-text-muted text-center">최신 기록을 불러오는 중…</p>
          )}

          {summary.totalCount > 0 ? (
            <CommunityStatPreview
              keyword={displayKeyword}
              totalCount={summary.totalCount}
              withFollowUpCount={summary.withFollowUpCount}
              stats={stats}
              showCuriosityTease={!access.isPremium}
              lockOutcomes={!access.isPremium}
              isEstimated={isEstimated}
            />
          ) : (
            <p className="text-center text-text-secondary py-8 card p-6">
              아직 기록이 없어요. 쌓이면 여기에 표시됩니다.
            </p>
          )}

          {access.isGuest && (
            <>
              <p className="text-xs text-text-muted text-center px-2">
                검색어는 연구 데이터에 반영됩니다. 후기 열람은 회원만 가능합니다.
              </p>
              <ConversionGate step={2} keyword={activeQuery} />
            </>
          )}

          {access.isMember && visibleStories.length > 0 && (
            <>
              <CommunityStoriesPanel
                stories={visibleStories}
                blurLocked={false}
                lockedCount={0}
                keyword={activeQuery}
                isEstimated={isEstimated}
              />

              {canLoadMore && (
                <button
                  type="button"
                  onClick={handleLoadMoreStories}
                  className="btn-secondary !min-h-[2.75rem] text-sm !normal-case !tracking-normal"
                >
                  후기 {STORY_CHUNK}건 더 보기
                  {!access.isPremium && visibleStoryCount + STORY_CHUNK > MEMBER_FREE_CAP
                    ? " (프리미엄)"
                    : ""}
                </button>
              )}

              {!access.isPremium && visibleStoryCount >= MEMBER_FREE_CAP && (
                <ConversionGate step={3} keyword={activeQuery} compact />
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
