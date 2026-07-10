import type { ReactNode } from "react";
import { CTA_PREMIUM_SEE_ALL, CTA_SIGNUP_SEE_MORE } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { useSignupSheet } from "@/hooks/useSignupSheet";

interface InterpretationTierBlurProps {
  /** guest = 가입 유도 / premium = 프리미엄 유도 */
  lock: "guest" | "premium" | false;
  label: string;
  children: ReactNode;
  preview?: ReactNode;
}

/** 해몽 카드 — 회원·프리미엄 티어 블러 */
export function InterpretationTierBlur({
  lock,
  label,
  children,
  preview,
}: InterpretationTierBlurProps) {
  const access = useAccessPolicy();
  const { openSignupSheet } = useSignupSheet();
  const { openPremiumSheet } = usePremiumSheet();

  if (!lock) {
    return <>{children}</>;
  }

  const isGuest = lock === "guest";

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-surface-2 min-h-[5rem]">
      <div className="p-4 story-blurred pointer-events-none select-none max-h-[12rem] overflow-hidden" aria-hidden>
        {preview ?? children}
      </div>
      <div className="story-blur-overlay absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="text-xs text-text-secondary copy-lines max-w-[18rem]">
          {isGuest
            ? "가입하면 연구소 AI 해몽 전체와 30일 타이머가 열립니다."
            : "프리미엄에서 연구소 입장 해석·비슷한 꿈 패턴을 전부 볼 수 있어요."}
        </p>
        <button
          type="button"
          className="btn-primary mt-1 text-sm"
          onClick={() =>
            isGuest
              ? openSignupSheet("가입 후 AI 해몽·30일 여정을 이어갈 수 있어요.")
              : openPremiumSheet(
                  access.isMember ? CTA_PREMIUM_SEE_ALL : "프리미엄에서 해몽 전체 보기",
                )
          }
        >
          {isGuest ? CTA_SIGNUP_SEE_MORE : CTA_PREMIUM_SEE_ALL}
        </button>
      </div>
    </div>
  );
}
