import { Link } from "react-router-dom";
import { AppIcons, Icon } from "@/components/ui/Icon";

interface TierBadgeProps {
  tier: "guest" | "member" | "premium";
}

const CONFIG = {
  guest: { label: "비회원", className: "badge-guest" },
  member: { label: "회원", className: "badge-member" },
  premium: { label: "프리미엄", className: "badge-premium" },
} as const;

export function TierBadge({ tier }: TierBadgeProps) {
  const c = CONFIG[tier];
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}

interface UpgradeGateProps {
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo?: string;
  onCta?: () => void;
}

export function UpgradeGate({
  title,
  description,
  ctaLabel,
  ctaTo = "/premium",
  onCta,
}: UpgradeGateProps) {
  return (
    <div className="card p-6 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
        <Icon icon={AppIcons.lock} size="lg" className="text-primary" />
      </div>
      <div>
        <p className="text-base font-semibold text-text">{title}</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      {onCta ? (
        <button type="button" onClick={onCta} className="btn-primary">
          {ctaLabel}
        </button>
      ) : (
        <Link to={ctaTo} className="btn-primary">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export function PolicyBanner() {
  return (
    <div className="card p-4 space-y-3">
      <p className="section-label">어디까지 볼 수 있나</p>
      <ul className="space-y-2.5 text-[0.9375rem] text-text-secondary">
        <PolicyRow tier="guest" text="비회원 — 꿈 내용 DB 저장 (익명)" />
        <PolicyRow tier="member" text="회원 — 유사 꿈 · 30일 푸시 · 후기 적재" />
        <PolicyRow tier="premium" text="프리미엄 — 8주 운세 그래프 · 통계·후기 전체" />
      </ul>
    </div>
  );
}

function PolicyRow({
  tier,
  text,
}: {
  tier: "guest" | "member" | "premium";
  text: string;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <TierBadge tier={tier} />
      <span>{text}</span>
    </li>
  );
}
