import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { DreamFortuneTrendPanel } from "@/components/DreamFortuneTrendPanel";
import { buildDreamFortuneSnapshot } from "@/lib/dreamFortuneTrends";
import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";
import { JourneyOnboardingCard } from "@/components/JourneyOnboardingCard";
import { MyDreamFollowUpSection } from "@/components/MyDreamFollowUpSection";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { UpgradeGate } from "@/components/AccessGate";
import { InterpretationCard } from "@/components/InterpretationCard";
import { DreamSignalsPanel } from "@/components/DreamSignalsPanel";
import { DreamDnaPanel } from "@/components/DreamDnaPanel";
import { LabHandoffDivider } from "@/components/LabHandoffDivider";
import { SimilarDreamsPanel } from "@/components/SimilarDreamsPanel";
import { StatsBar } from "@/components/StatsBar";
import { SurvivalRate } from "@/components/SurvivalRate";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { CTA_SIGNUP } from "@/lib/branding";
import { getPendingDreamRaw } from "@/lib/pendingDreamStorage";
import { isLinkedAuthUser } from "@/lib/authUser";
import {
  getDream,
  getOutcomePercentages,
} from "@/services/dreamService";
import { flushPendingDream } from "@/services/pendingDreamService";
import { resolveCommunityData } from "@/services/communityDataService";
import { generateExploreStorySlot } from "@/services/interpretService";
import { resolveAnchorKeyword } from "@/services/syntheticCommunityService";
import { DEMO_DREAM } from "@/demo/demoData";
import {
  MEMBER_FREE_STORY_VIEWS,
  PREMIUM_MAX_STORY_VIEWS,
} from "@/lib/storyAccessPricing";
import type {
  CommunityEstimate,
  CommunityStory,
  Dream,
  DreamStats,
  SimilarDreamSummary,
} from "@/types";
import { LoadingSpinner, EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedBlocks } from "@/components/ui/FormattedText";

function isOwnDreamRecord(dream: Dream, userId: string | undefined): boolean {
  return Boolean(userId && dream.userId === userId);
}

/** "animal-faces-intimacy" 같은 영문 슬러그(내부 키)를 사용자에게 노출하지 않기 위한 판별 */
function isAsciiSlug(value: string): boolean {
  const s = value.trim();
  if (!s) return true;
  return !/[가-힣]/.test(s) && /^[a-z0-9][a-z0-9\s._-]*$/i.test(s);
}

export function DreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openSignupSheet } = useSignupSheet();
  const access = useAccessPolicy();
  const [dream, setDream] = useState<Dream | null>(null);
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(null);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isEstimated, setIsEstimated] = useState(true);
  const [topMatchPercent, setTopMatchPercent] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCohort, setShowCohort] = useState(false);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortStories, setCohortStories] = useState<CommunityStory[]>([]);
  const [cohortMoreLoading, setCohortMoreLoading] = useState(false);

  const isPreview = id === "preview";
  const isOwnDream = useMemo(
    () => (dream ? isOwnDreamRecord(dream, user?.uid) : false),
    [dream, user?.uid],
  );
  const showCommunity = !isOwnDream && (isPreview || access.canViewSimilarTypes || access.isGuest);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity(
      interpretation: Dream["interpretation"],
      options: {
        embedding?: number[];
        title?: string;
        content?: string;
        estimate?: CommunityEstimate;
      },
    ) {
      const community = await resolveCommunityData(interpretation, options);
      if (cancelled) return;
      setSummary(community.summary);
      setStats(community.stats);
      setIsEstimated(community.isEstimated);
      setTopMatchPercent(community.topMatchPercent);
    }

    async function load() {
      if (!id) return;

      // 다른 꿈으로 이동 시 코호트 열람 상태 초기화
      setShowCohort(false);
      setCohortStories([]);

      if (id === "demo") {
        setDream(DEMO_DREAM);
        setLoading(false);
        void loadCommunity(DEMO_DREAM.interpretation, {
          title: DEMO_DREAM.title,
          content: DEMO_DREAM.content,
        });
        return;
      }

      if (isPreview) {
        const raw = getPendingDreamRaw();
        if (!raw) {
          setLoading(false);
          return;
        }

        try {
          const data = JSON.parse(raw) as {
            title?: string;
            content: string;
            emotions: Dream["emotions"];
            interpretation: Dream["interpretation"];
            embedding?: number[];
            communityEstimate?: CommunityEstimate;
          };

          const interpretation = data.interpretation;
          const previewDream: Dream = {
            id: "preview",
            userId: "guest",
            title: data.title ?? "",
            content: data.content,
            emotions: data.emotions ?? [],
            interpretation,
            createdAt: new Date(),
            followUpDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isPublic: false,
            likes: 0,
          };

          if (!cancelled) {
            setDream(previewDream);
            setSummary(null);
            setStats(null);
            setLoading(false);
          }
        } catch {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      const d = await getDream(id);
      if (cancelled) return;

      setDream(d);
      setLoading(false);

      const own = d ? isOwnDreamRecord(d, user?.uid) : false;
      // 내 꿈: '한 달 뒤 후기 보기' 버튼을 눌렀을 때 그 시점에 생성/조회 (지연 로딩)
      if (d && !own && (access.canViewSimilarTypes || access.isGuest)) {
        void loadCommunity(d.interpretation, {
          embedding: d.embedding,
          title: d.title,
          content: d.content,
          estimate: d.communityEstimate,
        });
      } else {
        setSummary(null);
        setStats(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isPreview, access.canViewSimilarTypes, access.isGuest, user?.uid]);

  useEffect(() => {
    async function saveAfterSignup() {
      const raw = getPendingDreamRaw();
      if (!isPreview || !raw || !user || !isLinkedAuthUser(user)) return;

      setSaving(true);
      try {
        const dreamId = await flushPendingDream(user.uid);
        if (dreamId) {
          navigate(`/dream/${dreamId}?new=1`, { replace: true });
        }
      } finally {
        setSaving(false);
      }
    }
    void saveAfterSignup();
  }, [user, isPreview, navigate]);

  if (loading || saving) {
    return <LoadingSpinner label={saving ? "저장 중..." : "불러오는 중..."} />;
  }

  if (!dream) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">꿈을 찾을 수 없어요</p>
        <Link to="/my" className="mt-4 inline-block text-primary font-medium">
          내 아카이브로
        </Link>
      </div>
    );
  }

  const anchor = resolveAnchorKeyword(dream.title, dream.interpretation, dream.content);
  const rawCluster = dream.interpretation.researchAnchor?.clusterLabel?.trim() ?? "";
  const keyword = rawCluster && !isAsciiSlug(rawCluster) ? rawCluster : anchor;

  const storyCap = access.isPremium ? PREMIUM_MAX_STORY_VIEWS : MEMBER_FREE_STORY_VIEWS;

  // 첫 열람 — 통계를 불러오고 사례는 "한 건만" 심도 있게 정제해 보여준다.
  async function handleLoadCohort() {
    if (!dream || cohortLoading) return;
    setCohortLoading(true);
    try {
      const community = await resolveCommunityData(dream.interpretation, {
        embedding: dream.embedding,
        title: dream.title,
        content: dream.content,
        estimate: dream.communityEstimate,
      });

      setSummary(community.summary);
      setStats(community.stats);
      setIsEstimated(community.isEstimated);
      setTopMatchPercent(community.topMatchPercent);

      let first: CommunityStory[] = [];
      if (!community.isEstimated && community.summary.stories.length > 0) {
        // 실제 관측 기록이 있으면 그중 한 건
        first = community.summary.stories.slice(0, 1);
      } else {
        // 합성 코호트 → 데이터 정제 방식으로 한 건 생성
        try {
          const s = await generateExploreStorySlot(dream.title, dream.content, 0, []);
          first = [s];
        } catch {
          first = [];
        }
      }
      setCohortStories(first);
    } finally {
      setCohortLoading(false);
      setShowCohort(true);
    }
  }

  // 추가 열람 — 한 번에 한 건씩, 앞 제목을 피해 서로 다른 사례로 정제한다.
  async function handleLoadMoreStory() {
    if (!dream || cohortMoreLoading) return;
    if (cohortStories.length >= storyCap) return;
    setCohortMoreLoading(true);
    try {
      const idx = cohortStories.length;
      if (!isEstimated && summary && summary.stories[idx]) {
        const next = summary.stories[idx]!;
        setCohortStories((prev) => [...prev, next]);
      } else {
        const s = await generateExploreStorySlot(
          dream.title,
          dream.content,
          idx,
          cohortStories.map((g) => g.dreamTitle),
        );
        const key = s.dreamTitle.trim();
        setCohortStories((prev) =>
          key && prev.some((g) => g.dreamTitle.trim() === key) ? prev : [...prev, s],
        );
      }
    } catch {
      /* 실패 시 조용히 무시 — 이미 열린 사례는 유지 */
    } finally {
      setCohortMoreLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {isOwnDream && (
        <Link
          to="/my"
          className="inline-flex items-center text-sm text-text-muted hover:text-primary transition-colors"
        >
          ← 내 아카이브
        </Link>
      )}

      {isPreview && (
        <p className="text-xs font-medium text-warning text-right">미저장 미리보기</p>
      )}

      {!isNew && (
        <DreamJourneyStepper
          createdAt={dream.createdAt}
          followUpDueAt={dream.followUpDueAt}
          answered={Boolean(dream.followUp)}
        />
      )}

      {isNew && (
        <JourneyOnboardingCard
          createdAt={dream.createdAt}
          followUpDueAt={dream.followUpDueAt}
          isPreview={isPreview}
          isGuest={access.isGuest && !isPreview}
        />
      )}

      {isNew && access.isMember && !isPreview && <PushNotificationPrompt />}

      <div className="card p-5">
        <p className="text-xs text-text-muted mb-2">
          {dream.createdAt.toLocaleDateString("ko-KR")}
        </p>
        {dream.title && (
          <h2 className="text-lg font-bold text-text mb-2">{dream.title}</h2>
        )}
        <FormattedBlocks className="text-[0.9375rem] text-text-secondary" maxLines={12}>
          {dream.content}
        </FormattedBlocks>
        <div className="mt-3">
          <EmotionIconGroup ids={dream.emotions} size="md" />
        </div>
      </div>

      <InterpretationCard
        interpretation={dream.interpretation}
        dreamContent={dream.content}
        dreamTitle={dream.title}
        mode={isOwnDream ? "personal" : "default"}
      />

      {isOwnDream && id && !isPreview && (
        <>
          <LabHandoffDivider />

          {access.isMember && !showCohort && (
            <button
              type="button"
              onClick={() => void handleLoadCohort()}
              disabled={cohortLoading}
              className="btn-primary w-full !min-h-[4rem] flex-col gap-0.5 py-3 disabled:opacity-60"
            >
              <span className="text-base font-bold">
                {cohortLoading ? "사례를 정제하는 중..." : `“${keyword}” 30일 뒤 사례 열람`}
              </span>
              <span className="text-xs font-normal opacity-85">
                {cohortLoading
                  ? "같은 계열로 기록된 사람들의 30일 뒤를 데이터에서 찾고 있어요"
                  : "같은 키워드로 기록된 사람들의 30일 뒤를 한 건씩 정제해 보여드려요 →"}
              </span>
            </button>
          )}

          {access.isMember &&
            showCohort &&
            (!summary || !stats || summary.totalCount === 0) && (
              <p className="text-center text-xs text-text-muted copy-lines px-2 py-4">
                아직 비슷한 꿈 데이터가 충분하지 않아요. 한 달 뒤 후기가 쌓이면 다시 보여드릴게요.
              </p>
            )}

          {access.isMember && showCohort && summary && stats && summary.totalCount > 0 && (
            <section className="space-y-5">
              <div className="text-center space-y-1.5">
                <p className="section-label">관측 기록 · 같은 계열의 30일 뒤</p>
                <p className="text-xs text-text-muted copy-lines px-2 leading-relaxed">
                  해몽이 아닙니다. 같은 유형·키워드로 분류된 기록을 데이터에서 찾아,
                  한 건씩 정제해 보여드립니다.
                </p>
              </div>

              <CommunityStatPreview
                keyword={keyword}
                totalCount={summary.totalCount}
                withFollowUpCount={summary.withFollowUpCount}
                stats={stats}
                lockOutcomes={!access.isPremium}
                isEstimated={isEstimated}
              />
              {access.isPremium && (
                <DreamDnaPanel
                  summary={summary}
                  stats={stats}
                  anchor={anchor}
                  topMatchPercent={topMatchPercent}
                  interpretation={dream.interpretation}
                />
              )}

              {cohortStories.length > 0 ? (
                <div className="space-y-3">
                  <CommunityStoriesPanel
                    stories={cohortStories}
                    title={`“${keyword}” 계열 · 관측 사례`}
                    variant="full"
                    keyword={keyword}
                    userEmotions={dream.emotions}
                    isEstimated={isEstimated}
                  />

                  {cohortStories.length < storyCap ? (
                    <button
                      type="button"
                      onClick={() => void handleLoadMoreStory()}
                      disabled={cohortMoreLoading}
                      className="btn-secondary w-full disabled:opacity-60"
                    >
                      {cohortMoreLoading
                        ? "다음 사례를 정제하는 중..."
                        : `다음 사례 1건 더 열기  ·  ${cohortStories.length}/${storyCap}`}
                    </button>
                  ) : (
                    !access.isPremium && (
                      <p className="text-center text-xs text-text-muted copy-lines px-4 leading-relaxed">
                        회원은 사례 {MEMBER_FREE_STORY_VIEWS}건까지 열람돼요. 프리미엄은
                        한 꿈당 {PREMIUM_MAX_STORY_VIEWS}건까지 볼 수 있어요.
                      </p>
                    )
                  )}
                </div>
              ) : (
                <p className="text-center text-xs text-text-muted copy-lines px-2 py-4 leading-relaxed">
                  아직 정제된 사례가 없어요. 잠시 후 다시 시도해 주세요.
                </p>
              )}
            </section>
          )}

          <MyDreamFollowUpSection dream={dream} dreamId={id} />

          <p className="text-center text-xs text-text-muted copy-lines px-4 pt-1">
            당신의 답이 다음 사람의 통계가 됩니다. 오늘 남긴 후기가, 언젠가 누군가의 불안을 조금 덜어줄 수도 있어요.
          </p>
        </>
      )}

      {showCommunity && summary && stats && summary.totalCount > 0 && (
        <>
          <CommunityStatPreview
            keyword={keyword}
            totalCount={summary.totalCount}
            withFollowUpCount={summary.withFollowUpCount}
            stats={stats}
            lockOutcomes={!access.isPremium}
            isEstimated={isEstimated}
          />
          <DreamFortuneTrendPanel
            snapshot={buildDreamFortuneSnapshot(keyword, stats)}
            compact={!access.isPremium}
          />
          {access.isPremium && (
            <DreamDnaPanel
              summary={summary}
              stats={stats}
              anchor={anchor}
              topMatchPercent={topMatchPercent}
              interpretation={dream.interpretation}
            />
          )}
          {summary.stories.length > 0 && (
            <CommunityStoriesPanel
              stories={summary.stories.slice(0, access.isPremium ? summary.stories.length : 1)}
              keyword={keyword}
              userEmotions={dream.emotions}
              blurLocked={!access.isPremium}
              lockedCount={Math.max(summary.stories.length - 1, 8)}
              blurPreviewStory={summary.stories[1]}
              isEstimated={isEstimated}
            />
          )}
        </>
      )}

      {isPreview ? (
        <UpgradeGate
          title="Google로 가입하면 저장됩니다"
          description="꿈연구소 해몽은 이미 보셨어요. 가입하면 30일 타이머·후기·저장이 열립니다."
          ctaLabel={CTA_SIGNUP}
          onCta={() =>
            openSignupSheet("Google로 가입하면 이 꿈이 저장되고 30일 여정이 시작됩니다.")
          }
        />
      ) : (
        !isOwnDream && (
          <>
            {access.isGuest && (
              <UpgradeGate
                title="Google로 가입하면 더 열립니다"
                description="꿈연구소장의 관점 전체 · 30일 푸시 · 한 달 뒤 후기 작성"
                ctaLabel={CTA_SIGNUP}
                onCta={() =>
                  openSignupSheet("Google로 가입하면 비슷한 꿈·30일 알림·후기 작성이 열립니다.")
                }
              />
            )}

            {access.canViewSimilarTypes && summary && summary.totalCount > 0 && (
              <SimilarDreamsPanel summary={summary} />
            )}

            {access.canViewOutcomeStats && stats && stats.totalDreams > 0 && (
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
          </>
        )
      )}

      {!isPreview && (
        <details className="group rounded-2xl">
          <summary className="card card-bezel flex cursor-pointer list-none items-center justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-semibold text-text">
                <span className="group-open:hidden">연구 신호 더보기</span>
                <span className="hidden group-open:inline">연구 신호 접기</span>
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-text-muted">
                희귀도 · 감정온도 · 꿈 MBTI · 영화 · 한줄평
              </span>
            </span>
            <span
              className="shrink-0 text-text-muted transition-transform group-open:rotate-180"
              aria-hidden
            >
              ▾
            </span>
          </summary>
          <div className="mt-3">
            <DreamSignalsPanel
              interpretation={dream.interpretation}
              cohortSize={summary?.totalCount}
            />
          </div>
        </details>
      )}
    </div>
  );
}
