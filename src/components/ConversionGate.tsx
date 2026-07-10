import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";
import { BRAND_FORBIDDEN_TEASE, CTA_PREMIUM, CTA_SIGNUP } from "@/lib/branding";

interface ConversionGateProps {
  step: 2 | 3;
  keyword?: string;
  compact?: boolean;
}

export function ConversionGate({ step, keyword, compact = false }: ConversionGateProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  if (step === 2 && access.isMember) return null;
  if (step === 3 && access.isPremium) return null;

  const isSignup = step === 2;
  const title = isSignup
    ? keyword
      ? `“${keyword}” — 당신만 아직 모르는 결말`
      : "당신만 아직 모르는 결말"
    : keyword
      ? `“${keyword}” — 8주 운세·통계 전체`
      : "8주 운세 그래프 · 후기 전체";

  const description = isSignup
    ? "같은 꿈을 꾼 이들은 이미 한 달 뒤를 남겼습니다. 로그인하거나 가입하고 당신의 결말도 기록하세요."
    : BRAND_FORBIDDEN_TEASE;

  const cta = isSignup ? CTA_SIGNUP : CTA_PREMIUM;
  const onClick = isSignup
    ? () => openSignupSheet(description)
    : () => openPremiumSheet(description);

  return (
    <div
      className={`card border border-accent/15 text-center space-y-3 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <p className={`font-semibold text-text ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </p>
      <p className="text-sm text-text-secondary copy-lines leading-relaxed">{description}</p>
      <button type="button" onClick={onClick} className="btn-primary w-full sm:w-auto">
        {cta}
      </button>
    </div>
  );
}
