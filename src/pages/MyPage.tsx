import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TierBadge } from "@/components/AccessGate";
import { CommunityStatPreview } from "@/components/CommunityStatPreview";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { ConversionGate } from "@/components/ConversionGate";
import { DreamCard } from "@/components/DreamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { PremiumPageContent } from "@/pages/PremiumPage";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { getUserDreams } from "@/services/dreamService";
import {
  estimateToStats,
  previewCommunityForKeyword,
} from "@/services/syntheticCommunityService";
import {
  getRandomProvocativeKeywords,
  previewKeywordLabel,
} from "@/lib/previewKeywords";
import type { Dream } from "@/types";

function buildMyTeaser() {
  const keyword = getRandomProvocativeKeywords(1)[0] ?? "시험";
  const data = previewCommunityForKeyword(keyword);
  return { keyword, label: previewKeywordLabel(keyword), data };
}

export function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [dreamsLoading, setDreamsLoading] = useState(true);
  const [teaser] = useState(buildMyTeaser);
  const teaserStats = estimateToStats(teaser.data);

  useEffect(() => {
    async function load() {
      if (!user) {
        setDreamsLoading(false);
        return;
      }
      const data = await getUserDreams(user.uid);
      setDreams(data);
      setDreamsLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.my.title} desc={PAGE_COPY.my.desc} centered={false} />
      <div className="mt-1">
        <TierBadge tier={access.tier} />
      </div>

      {!access.isPremium && (
        <section className="space-y-3">
          <CommunityStatPreview
            keyword={teaser.label}
            totalCount={teaser.data.totalCount}
            withFollowUpCount={teaser.data.withFollowUpCount}
            stats={teaserStats}
            showCuriosityTease
            lockOutcomes
            isEstimated
          />
          {teaser.data.stories[0] && (
            <CommunityStoriesPanel
              stories={teaser.data.stories}
              blurLocked
              lockedCount={51}
              keyword={teaser.keyword}
            />
          )}
        </section>
      )}

      {access.isGuest && dreams.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">저장된 꿈</h3>
            <Link to="/write" className="text-xs font-medium text-primary">
              + 새 꿈
            </Link>
          </div>
          {authLoading || dreamsLoading ? (
            <LoadingSpinner label="불러오는 중" />
          ) : (
            <div className="space-y-3">
              {dreams.slice(0, 3).map((dream) => (
                <DreamCard key={dream.id} dream={dream} />
              ))}
            </div>
          )}
        </section>
      )}

      {!access.isMember && (
        <ConversionGate step={2} keyword={teaser.keyword} compact />
      )}

      {access.isMember && !access.isPremium && (
        <ConversionGate step={3} keyword={teaser.keyword} compact />
      )}

      {access.isMember ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">내 꿈</h3>
            <Link to="/write" className="text-xs font-medium text-primary">
              + 새 꿈
            </Link>
          </div>
          {authLoading || dreamsLoading ? (
            <LoadingSpinner label="불러오는 중" />
          ) : dreams.length === 0 ? (
            <EmptyState
              title="아직 꿈이 없습니다"
              description="첫 꿈을 적으면 30일 타이머가 시작됩니다"
              actionLabel="꿈 적기"
              actionTo="/write"
            />
          ) : (
            <div className="space-y-3">
              {dreams.slice(0, 3).map((dream) => (
                <DreamCard key={dream.id} dream={dream} />
              ))}
              {dreams.length > 3 && (
                <Link to="/my-dreams" className="block text-center text-sm text-primary">
                  전체 {dreams.length}개 보기
                </Link>
              )}
            </div>
          )}
        </section>
      ) : dreams.length === 0 ? (
        <button
          type="button"
          onClick={() =>
            openSignupSheet(
              "2단계 회원가입 — 유사 꿈·30일 푸시 알림·후기 작성을 열려면 가입하세요.",
            )
          }
          className="card w-full p-4 text-left ring-1 ring-accent/30"
        >
          <p className="text-[0.625rem] font-semibold text-accent uppercase">STEP 2 · 필수</p>
          <p className="font-medium text-text mt-1">유사 꿈 · 30일 알림</p>
          <p className="mt-1 text-sm text-text-secondary">가입하면 푸시·후기가 열립니다 →</p>
        </button>
      ) : null}

      <PremiumPageContent />
    </div>
  );
}
