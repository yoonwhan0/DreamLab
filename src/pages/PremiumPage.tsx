import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { PAGE_COPY } from "@/lib/productIdeas";
import { PolicyBanner, TierBadge } from "@/components/AccessGate";
import { CommunityStoriesPanel } from "@/components/CommunityStoriesPanel";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { EXPLORE_DISCOVER_KEYWORDS } from "@/lib/previewKeywords";
import { PRICING_TIERS } from "@/lib/pricingTiers";
import { DreamFortuneTrendPanel } from "@/components/DreamFortuneTrendPanel";
import { buildDreamFortuneSnapshot } from "@/lib/dreamFortuneTrends";
import { previewCommunityForKeyword, estimateToStats } from "@/services/syntheticCommunityService";

const TIERS = PRICING_TIERS;

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
  const previewKeyword = EXPLORE_DISCOVER_KEYWORDS[0] ?? "시험";
  const previewStories = previewCommunityForKeyword(previewKeyword).stories;
  const fortunePreview = buildDreamFortuneSnapshot(
    previewKeyword,
    estimateToStats(previewCommunityForKeyword(previewKeyword)),
  );

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

      <DreamFortuneTrendPanel snapshot={fortunePreview} tier={access.isPremium ? "premium" : access.isMember ? "member" : "guest"} />

      <CommunityStoriesPanel
        stories={previewStories}
        title={`"${previewKeyword}" — 프리미엄에서 보는 후기·통계`}
        blurLocked={!access.isPremium}
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
