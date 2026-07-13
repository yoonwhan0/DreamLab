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
import { resolveAnchorKeyword } from "@/services/syntheticCommunityService";
import { DEMO_DREAM } from "@/demo/demoData";
import type { CommunityEstimate, Dream, DreamStats, SimilarDreamSummary } from "@/types";
import { LoadingSpinner, EmotionIconGroup } from "@/components/ui/Icon";
import { FormattedBlocks } from "@/components/ui/FormattedText";

function isOwnDreamRecord(dream: Dream, userId: string | undefined): boolean {
  return Boolean(userId && dream.userId === userId);
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
      if (d && (access.canViewSimilarTypes || access.isGuest)) {
        void loadCommunity(d.interpretation, {
          embedding: d.embedding,
          title: d.title,
          content: d.content,
        });
      } else if (own) {
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
  const keyword =
    dream.interpretation.researchAnchor?.clusterLabel?.trim() || anchor;

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

      <DreamSignalsPanel
        interpretation={dream.interpretation}
        cohortSize={summary?.totalCount}
      />

      {isOwnDream && id && !isPreview && (
        <>
          <MyDreamFollowUpSection dream={dream} dreamId={id} />

          {access.isMember && summary && stats && summary.totalCount > 0 && (
            <section className="space-y-4">
              <div className="text-center space-y-1">
                <p className="section-label">비슷한 꿈을 꾼 사람들</p>
                <p className="text-xs text-text-muted copy-lines px-2">
                  꿈연구소 해몽과 별도 — 같은 유형·키워드로 기록된 사람들의 한 달 뒤 데이터입니다.
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
              <DreamDnaPanel
                summary={summary}
                stats={stats}
                anchor={anchor}
                topMatchPercent={topMatchPercent}
              />
              {summary.stories.length > 0 && (
                <CommunityStoriesPanel
                  stories={summary.stories.slice(0, access.isPremium ? 2 : 1)}
                  title={`"${keyword}" — 다른 사람들은?`}
                  variant="compact"
                  blurLocked={!access.isPremium}
                  lockedCount={Math.max(
                    summary.withFollowUpCount - 1,
                    summary.stories.length - 1 + 10,
                    12,
                  )}
                  blurPreviewStory={summary.stories[1]}
                  keyword={anchor}
                  isEstimated={isEstimated}
                />
              )}
            </section>
          )}

          <p className="text-center text-xs text-text-muted leading-relaxed px-2">
            더 많은 비슷한 꿈·통계는{" "}
            <Link to="/explore" className="text-primary font-medium hover:underline">
              탐색
            </Link>
            에서 볼 수 있어요.
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
          <DreamDnaPanel
            summary={summary}
            stats={stats}
            anchor={anchor}
            topMatchPercent={topMatchPercent}
          />
          {summary.stories.length > 0 && (
            <CommunityStoriesPanel
              stories={summary.stories.slice(0, access.isPremium ? summary.stories.length : 1)}
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
          description="꿈연구소 해몽은 이미 보셨어요. 가입하면 30일 타이머·탐색·저장이 열립니다."
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
    </div>
  );
}
