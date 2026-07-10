import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { DreamJourneyStepper } from "@/components/DreamJourneyStepper";
import { JourneyOnboardingCard } from "@/components/JourneyOnboardingCard";
import { MyDreamFollowUpSection } from "@/components/MyDreamFollowUpSection";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { UpgradeGate } from "@/components/AccessGate";
import { InterpretationCard } from "@/components/InterpretationCard";
import { SimilarDreamsPanel } from "@/components/SimilarDreamsPanel";
import { StatsBar } from "@/components/StatsBar";
import { SurvivalRate } from "@/components/SurvivalRate";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import {
  getDream,
  getOutcomePercentages,
  saveDream,
} from "@/services/dreamService";
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
  const { signInGoogle, user } = useAuth();
  const access = useAccessPolicy();
  const [dream, setDream] = useState<Dream | null>(null);
  const [summary, setSummary] = useState<SimilarDreamSummary | null>(null);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [isEstimated, setIsEstimated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isPreview = id === "preview";
  const isOwnDream = useMemo(
    () => (dream ? isOwnDreamRecord(dream, user?.uid) : false),
    [dream, user?.uid],
  );
  const showCommunity = !isOwnDream && (isPreview || access.canViewSimilarTypes);

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
        const raw = sessionStorage.getItem("pendingDream");
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
            setLoading(false);
          }

          void loadCommunity(interpretation, {
            embedding: data.embedding,
            title: data.title,
            content: data.content,
            estimate: data.communityEstimate,
          });
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
      if (d && !own && access.canViewSimilarTypes) {
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
  }, [id, isPreview, access.canViewSimilarTypes, user?.uid]);

  useEffect(() => {
    async function saveAfterSignup() {
      const raw = sessionStorage.getItem("pendingDream");
      if (!access.isMember || !isPreview || !raw || !auth?.currentUser) return;

      setSaving(true);
      try {
        const data = JSON.parse(raw);
        const dreamId = await saveDream(
          auth.currentUser.uid,
          data.title,
          data.content,
          data.emotions ?? [],
          data.interpretation,
          data.embedding ?? [],
        );
        sessionStorage.removeItem("pendingDream");
        navigate(`/dream/${dreamId}?new=1`, { replace: true });
      } finally {
        setSaving(false);
      }
    }
    saveAfterSignup();
  }, [access.isMember, isPreview, navigate]);

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

      {isOwnDream && id && !isPreview && (
        <>
          <MyDreamFollowUpSection dream={dream} dreamId={id} />
          <p className="text-center text-xs text-text-muted leading-relaxed px-2">
            다른 사람들의 비슷한 꿈·한 달 뒤 통계는{" "}
            <Link to="/explore" className="text-primary font-medium hover:underline">
              탐색
            </Link>
            탭에서 볼 수 있어요.
          </p>
        </>
      )}

      {showCommunity && summary && stats && summary.totalCount > 0 && (
        <CommunityStatPreview
          keyword={keyword}
          totalCount={summary.totalCount}
          withFollowUpCount={summary.withFollowUpCount}
          stats={stats}
          showCuriosityTease={!access.isPremium}
          isEstimated={isEstimated}
        />
      )}

      {isPreview ? (
        <>
          {summary && summary.stories.length > 0 && (
            <CommunityStoriesPanel
              stories={summary.stories}
              blurLocked
              lockedCount={Math.max(summary.stories.length - 1, 20)}
              isEstimated={isEstimated}
            />
          )}
          <UpgradeGate
            title="회원가입하면 저장됩니다"
            description="30일 타이머 · 유사 꿈 · (프리미엄) 한 달 뒤 통계가 열립니다"
            ctaLabel="Google로 가입"
            onCta={signInGoogle}
          />
        </>
      ) : (
        !isOwnDream && (
          <>
            {access.isGuest && (
              <UpgradeGate
                title="회원가입하면 더 열립니다"
                description="유사 꿈 패턴 · 30일 푸시 알림 · 한 달 뒤 후기 작성"
                ctaLabel="Google로 가입"
                onCta={signInGoogle}
              />
            )}

            {summary && summary.totalCount > 0 && (
              <SimilarDreamsPanel summary={summary} />
            )}

            {summary && summary.stories.length > 0 && (
              <CommunityStoriesPanel
                stories={summary.stories}
                blurLocked={!access.isPremium}
                lockedCount={Math.max(summary.stories.length - 1, 20)}
                isEstimated={isEstimated}
              />
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
