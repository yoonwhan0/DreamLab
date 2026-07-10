import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface SignupSheetContextValue {
  openSignupSheet: (message?: string) => void;
  closeSignupSheet: () => void;
}

const SignupSheetContext = createContext<SignupSheetContextValue | null>(null);

export function SignupSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const { signInGoogle } = useAuth();

  const openSignupSheet = useCallback((msg?: string) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  const closeSignupSheet = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openSignupSheet, closeSignupSheet }),
    [openSignupSheet, closeSignupSheet],
  );

  return (
    <SignupSheetContext.Provider value={value}>
      {children}
      {open && (
        <div
          className="signup-sheet-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
          onClick={closeSignupSheet}
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
              <p className="text-base font-semibold text-text">회원가입</p>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {message ??
                  "내 꿈을 저장하고 30일 타이머·같은 꿈 데이터를 열려면 가입하세요."}
              </p>
            </div>
            <button type="button" onClick={signInGoogle} className="btn-primary">
              Google로 시작하기
            </button>
            <Link to="/my" onClick={closeSignupSheet} className="btn-secondary text-sm">
              요금제 · 마이페이지
            </Link>
          </div>
        </div>
      )}
    </SignupSheetContext.Provider>
  );
}

export function useSignupSheet(): SignupSheetContextValue {
  const ctx = useContext(SignupSheetContext);
  if (!ctx) {
    throw new Error("useSignupSheet must be used within SignupSheetProvider");
  }
  return ctx;
}
