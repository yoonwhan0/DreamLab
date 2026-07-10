import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { BRAND_FORBIDDEN_TEASE, CTA_PREMIUM, CTA_SIGNUP } from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useSignupSheet } from "@/hooks/useSignupSheet";

interface PremiumSheetContextValue {
  openPremiumSheet: (message?: string) => void;
  closePremiumSheet: () => void;
}

const PremiumSheetContext = createContext<PremiumSheetContextValue | null>(null);

export function PremiumSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const { openSignupSheet } = useSignupSheet();
  const access = useAccessPolicy();
  const [checkoutMsg, setCheckoutMsg] = useState("");

  const openPremiumSheet = useCallback((msg?: string) => {
    setMessage(msg);
    setCheckoutMsg("");
    setOpen(true);
  }, []);

  const closePremiumSheet = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openPremiumSheet, closePremiumSheet }),
    [openPremiumSheet, closePremiumSheet],
  );

  const handleCheckout = () => {
    setCheckoutMsg(
      "프리미엄 구독은 App Store(iOS) · Google Play(Android) 인앱결제로 연결됩니다. 앱 출시 후 이 화면에서 바로 구독할 수 있어요.",
    );
  };

  return (
    <PremiumSheetContext.Provider value={value}>
      {children}
      {open && (
        <div
          className="signup-sheet-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
          onClick={closePremiumSheet}
          role="presentation"
        >
          <div
            className="signup-sheet w-full max-w-lg rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-border" />
            <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-accent">
                프리미엄
              </p>
              <p className="text-base font-semibold text-text mt-1">프리미엄 구독</p>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {message ?? BRAND_FORBIDDEN_TEASE}
              </p>
            </div>

            {!access.isMember ? (
              <>
                <p className="text-xs text-text-muted text-center">
                  프리미엄은 회원 로그인 후 구독할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closePremiumSheet();
                    openSignupSheet("로그인하거나 가입한 뒤 프리미엄 구독을 이어갈 수 있어요.");
                  }}
                  className="btn-primary"
                >
                  {CTA_SIGNUP}
                </button>
              </>
            ) : access.isPremium ? (
              <p className="text-sm text-success text-center">이미 프리미엄 이용 중입니다.</p>
            ) : (
              <>
                <button type="button" onClick={handleCheckout} className="btn-primary">
                  {CTA_PREMIUM}
                </button>
                {checkoutMsg && (
                  <p className="text-xs text-text-secondary text-center card p-3">
                    {checkoutMsg}
                  </p>
                )}
              </>
            )}

            <Link
              to="/my"
              onClick={closePremiumSheet}
              className="btn-secondary text-sm block text-center"
            >
              요금제 자세히 보기
            </Link>
          </div>
        </div>
      )}
    </PremiumSheetContext.Provider>
  );
}

export function usePremiumSheet(): PremiumSheetContextValue {
  const ctx = useContext(PremiumSheetContext);
  if (!ctx) {
    throw new Error("usePremiumSheet must be used within PremiumSheetProvider");
  }
  return ctx;
}
