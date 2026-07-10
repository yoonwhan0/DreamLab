import { useEffect, useState } from "react";
import { CTA_AUTH_GOOGLE } from "@/lib/branding";
import { isAuthRedirectPending } from "@/lib/authPlatform";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";
import { isLinkedAuthUser } from "@/lib/authUser";

interface AuthSheetBodyProps {
  message?: string;
  onAuthenticated?: () => void;
}

/** 바텀시트 — Google 로그인/가입 전용 */
export function AuthSheetBody({ message, onAuthenticated }: AuthSheetBodyProps) {
  const { signInGoogle, user } = useAuth();
  const access = useAccessPolicy();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(() => isAuthRedirectPending());

  useEffect(() => {
    if (access.isMember || isLinkedAuthUser(user)) onAuthenticated?.();
  }, [access.isMember, user, onAuthenticated]);

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await signInGoogle();
      if (isAuthRedirectPending()) {
        setRedirecting(true);
      }
    } catch {
      setError("Google 로그인에 실패했습니다. 다시 시도해 주세요.");
      setRedirecting(false);
    } finally {
      setBusy(false);
    }
  };

  if (redirecting) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-base font-semibold text-text">Google 로그인 처리 중…</p>
        <p className="text-sm text-text-secondary leading-relaxed">
          잠시만 기다려 주세요. 창이 바뀌지 않으면 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold text-text">Google로 로그인 · 가입</p>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {message ??
            "내 꿈을 저장하고 30일 타이머·탐색 후기를 열려면 Google 계정으로 계속하세요."}
        </p>
        <p className="mt-1.5 text-[0.6875rem] text-text-muted leading-relaxed">
          처음이면 자동으로 가입됩니다. 기존 계정이면 로그인됩니다.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={busy}
        className="btn-primary disabled:opacity-60"
      >
        {busy ? "연결 중…" : CTA_AUTH_GOOGLE}
      </button>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
