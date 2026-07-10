import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { AuthSheetBody } from "@/components/AuthSheetBody";

interface SignupSheetContextValue {
  openSignupSheet: (message?: string) => void;
  closeSignupSheet: () => void;
}

const SignupSheetContext = createContext<SignupSheetContextValue | null>(null);

export function SignupSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

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
            aria-label="Google 가입"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-border" />
            <AuthSheetBody message={message} onAuthenticated={closeSignupSheet} />
            <Link to="/my#pricing" onClick={closeSignupSheet} className="btn-secondary text-sm">
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
