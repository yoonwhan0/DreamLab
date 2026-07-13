import { Link } from "react-router-dom";
import { TierBadge } from "@/components/AccessGate";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { CTA_PREMIUM } from "@/lib/branding";
import { PRICING_TIERS } from "@/lib/pricingTiers";

/** 마이 — 요금제 · 현재 등급 */
export function MyPricingSection() {
  const access = useAccessPolicy();
  const { logout } = useAuth();
  const { openPremiumSheet } = usePremiumSheet();

  return (
    <section className="space-y-3" id="pricing">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">요금 · 열람 권한</h2>
        <TierBadge tier={access.tier} />
      </div>

      <div className="space-y-2.5">
        {PRICING_TIERS.map((t) => (
          <div
            key={t.tier}
            className={`card p-3.5 ${access.tier === t.tier ? "ring-2 ring-primary/30" : ""}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <TierBadge tier={t.tier} />
                <span className="text-sm font-semibold text-text truncate">{t.name}</span>
              </div>
              <span className="text-sm font-medium text-primary shrink-0">{t.price}</span>
            </div>
            <ul className="space-y-1 text-[0.8125rem] text-text-secondary">
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
        <div className="card p-4 text-center space-y-2">
          <p className="text-sm font-medium text-success">프리미엄 이용 중</p>
          <p className="text-xs text-text-secondary">
            누적 아카이브 운세 · 8주 그래프 · 후기 전체를 볼 수 있어요
          </p>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-text-muted underline"
          >
            로그아웃
          </button>
        </div>
      ) : access.isMember ? (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() =>
            openPremiumSheet("누적 아카이브 운세·8주 그래프·후기 전체 — 프리미엄 ₩4,900/월")
          }
        >
          {CTA_PREMIUM}
        </button>
      ) : (
        <p className="text-xs text-center text-text-muted">
          가입은 무료입니다.{" "}
          <Link to="/write" className="text-primary font-medium">
            꿈 기록하기 →
          </Link>
        </p>
      )}
    </section>
  );
}
