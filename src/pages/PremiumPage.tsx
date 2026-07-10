import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { PolicyBanner, TierBadge } from "@/components/AccessGate";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { getRandomProvocativeKeywords } from "@/lib/previewKeywords";
import { previewCommunityForKeyword } from "@/services/syntheticCommunityService";

const TIERS = [
  {
    tier: "guest" as const,
    name: "비회원",
    price: "무료",
    features: ["자극 패턴 맛보기", "AI 해몽 미리보기"],
    locked: ["유사 꿈", "30일 알림", "결과·후기 통계"],
  },
  {
    tier: "member" as const,
    name: "회원 (2단계 필수)",
    price: "무료",
    features: ["꿈 저장", "유사 꿈 · 키워드", "30일 알림", "후기 작성"],
    locked: ["30일 후 결과 통계", "전체 후기 열람 — 3단계 필요"],
  },
  {
    tier: "premium" as const,
    name: "프리미엄 (3단계 필수)",
    price: "₩4,900/월",
    features: [
      "회원 기능 전체",
      "30일 후 결과 통계",
      "익명 후기 전체 열람",
      "최근 꿈 AI 재해석",
      "무제한 탐색",
    ],
    locked: [] as string[],
  },
];

export function PremiumPage() {
  return <PremiumPageContent />;
}

export function PremiumPageContent() {
  const { signInGoogle, signUpEmail, signInEmail, logout, user } = useAuth();
  const access = useAccessPolicy();
  const [mode, setMode] = useState<"login" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { openPremiumSheet } = usePremiumSheet();
  const previewKeyword = useState(() => getRandomProvocativeKeywords(1)[0] ?? "로또")[0];
  const previewStories = previewCommunityForKeyword(previewKeyword).stories;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signUpEmail(email, password);
      else await signInEmail(email, password);
      setMode(null);
    } catch {
      setError("로그인에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHero title={PAGE_COPY.premium.title} desc={PAGE_COPY.premium.desc} />
      <div className="flex justify-center -mt-2">
        <TierBadge tier={access.tier} />
      </div>

      <CommunityStoriesPanel
        stories={previewStories}
        title={`“${previewKeyword}” — 프리미엄에서 열리는 후기`}
        blurLocked={!access.isPremium}
        lockedCount={45}
        keyword={previewKeyword}
      />

      <PolicyBanner />

      <div className="space-y-3">
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className={`card p-4 ${access.tier === t.tier ? "ring-2 ring-primary/30" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TierBadge tier={t.tier} />
                <span className="font-semibold text-text">{t.name}</span>
              </div>
              <span className="text-sm font-medium text-primary">{t.price}</span>
            </div>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-success">✓</span>
                  <span>{f}</span>
                </li>
              ))}
              {t.locked.map((f) => (
                <li key={f} className="flex gap-2 text-text-muted">
                  <span>—</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {access.isPremium ? (
        <div className="card p-5 text-center space-y-2">
          <p className="font-medium text-success">프리미엄 이용 중</p>
          <p className="text-sm text-text-secondary">
            모든 후기·통계를 제한 없이 볼 수 있어요
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-sm text-text-muted underline"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <>
          {!access.isMember && (
            <button type="button" onClick={signInGoogle} className="btn-secondary">
              Google로 회원가입
            </button>
          )}

          {access.isMember && !access.isPremium && (
            <div className="space-y-3">
              <p className="text-xs text-center text-accent font-semibold">
                STEP 3 · 통계·후기 전체는 구독 필수
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  openPremiumSheet("30일 뒤 통계·익명 후기 전체를 열려면 프리미엄 구독이 필요합니다.")
                }
              >
                프리미엄 시작하기 — ₩4,900/월
              </button>
            </div>
          )}

          {!user && (
            <div className="card p-4 space-y-3">
              {mode ? (
                <form onSubmit={handleAuth} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    className="input"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (6자 이상)"
                    className="input"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" className="btn-primary">
                    {mode === "signup" ? "회원가입" : "로그인"}
                  </button>
                </form>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="btn-secondary flex-1"
                  >
                    이메일 로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="btn-secondary flex-1"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          )}

          {access.isMember && (
            <button
              type="button"
              onClick={logout}
              className="w-full text-sm text-text-muted underline"
            >
              로그아웃
            </button>
          )}
        </>
      )}
    </div>
  );
}
