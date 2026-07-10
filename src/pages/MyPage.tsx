import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DreamArchiveCalendar } from "@/components/DreamArchiveCalendar";
import { DreamArchiveCard } from "@/components/DreamArchiveCard";
import { CuriosityTease } from "@/components/CuriosityTease";
import { MyDreamFortuneSection } from "@/components/MyDreamFortuneSection";
import { MyPricingSection } from "@/components/MyPricingSection";
import { ConversionGate } from "@/components/ConversionGate";
import { TierBadge } from "@/components/AccessGate";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { CTA_SIGNUP } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { getUserDreams } from "@/services/dreamService";
import type { Dream } from "@/types";

const ARCHIVE_PREVIEW = 8;

export function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [dreamsLoading, setDreamsLoading] = useState(true);

  const loadDreams = async () => {
    if (!user) {
      setDreams([]);
      setDreamsLoading(false);
      return;
    }
    setDreamsLoading(true);
    const data = await getUserDreams(user.uid);
    setDreams(data);
    setDreamsLoading(false);
  };

  useEffect(() => {
    void loadDreams();
  }, [user]);

  const stats = useMemo(() => {
    const withFollowUp = dreams.filter((d) => d.followUp).length;
    const pending = dreams.length - withFollowUp;
    return { total: dreams.length, withFollowUp, pending };
  }, [dreams]);

  const previewDreams = dreams.slice(0, ARCHIVE_PREVIEW);

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.my.title} desc={PAGE_COPY.my.desc} centered={false} />
      <div className="flex justify-end -mt-2">
        <TierBadge tier={access.tier} />
      </div>

      {dreams.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="전체 기록" value={stats.total} />
          <StatPill label="30일 후기" value={stats.withFollowUp} accent />
          <StatPill label="대기 중" value={stats.pending} />
        </div>
      )}

      {access.isMember && dreams.length > 0 && (
        <DreamArchiveCalendar dreams={dreams} />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text">최근 꿈</h2>
          <Link to="/write" className="text-xs font-medium text-primary shrink-0">
            + 새 꿈
          </Link>
        </div>

        {authLoading || dreamsLoading ? (
          <LoadingSpinner label="아카이브 불러오는 중" />
        ) : dreams.length === 0 ? (
          <EmptyState
            title="아직 꿈이 없습니다"
            description="꿈을 적으면 30일 타이머가 시작되고, 한 달 뒤 내 후기가 이곳에 쌓입니다."
            actionLabel="첫 꿈 적기"
            actionTo="/write"
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {previewDreams.map((dream) => (
                <DreamArchiveCard key={dream.id} dream={dream} />
              ))}
            </div>
            {dreams.length > ARCHIVE_PREVIEW && (
              <Link
                to="/my-dreams"
                className="block text-center text-sm font-medium text-primary py-2"
              >
                전체 {dreams.length}개 아카이브 보기
              </Link>
            )}
          </>
        )}
      </section>

      {access.isMember && dreams.length > 0 && (
        <MyDreamFortuneSection dreams={dreams} />
      )}

      <MyPricingSection />

      {access.isMember && !access.isPremium && dreams.length > 0 && (
        <ConversionGate step={3} compact />
      )}

      {access.isMember && !access.isPremium && dreams.length === 0 && (
        <CuriosityTease
          title="탐색에서 비슷한 꿈 후기 보기"
          body="꿈을 기록하면 내 아카이브 운세 그래프가 쌓입니다. 탐색에서 같은 꿈 후기도 볼 수 있어요."
          cta="탐색으로 가기"
          to="/explore"
        />
      )}

      {access.isGuest && (
        <CuriosityTease
          title="로그인 · 가입 · 꿈 저장"
          body="로그인하면 내 꿈 저장·30일 알림·탐색 후기 열람이 열립니다."
          cta={CTA_SIGNUP}
          onAction={() =>
            openSignupSheet("로그인하거나 가입하면 꿈 저장·30일 알림·탐색이 열립니다.")
          }
        />
      )}

      {access.isGuest && dreams.length > 0 && (
        <button
          type="button"
          onClick={() =>
            openSignupSheet("가입하면 꿈이 계정에 안전하게 보관되고, 30일 후기·알림이 열립니다.")
          }
          className="card w-full p-4 text-left ring-1 ring-accent/30"
        >
          <p className="text-[0.625rem] font-semibold text-accent uppercase">STEP 2 · 권장</p>
          <p className="font-medium text-text mt-1">내 아카이브를 계정에 연결하기</p>
          <p className="mt-1 text-sm text-text-secondary">가입 후에도 기록이 유지됩니다 →</p>
        </button>
      )}

      {!access.isMember && dreams.length === 0 && (
        <button
          type="button"
          onClick={() => openSignupSheet("가입하면 꿈 저장·30일 알림·후기 작성이 열립니다.")}
          className="btn-secondary w-full text-sm"
        >
          {CTA_SIGNUP}
        </button>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-3 text-center ${
        accent ? "border-primary/30 bg-primary-soft/20" : "border-border bg-surface-2"
      }`}
    >
      <p className="text-lg font-bold text-text tabular-nums">{value}</p>
      <p className="text-[0.625rem] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
