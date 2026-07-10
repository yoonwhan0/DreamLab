import { useEffect, useState } from "react";
import {
  CTA_AUTH_EMAIL_LOGIN,
  CTA_AUTH_EMAIL_SIGNUP,
  CTA_AUTH_GOOGLE,
} from "@/lib/branding";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { useAuth } from "@/hooks/useAuth";

interface AuthSheetBodyProps {
  message?: string;
  onAuthenticated?: () => void;
}

/** 바텀시트 — Google + 이메일 로그인/가입 */
export function AuthSheetBody({ message, onAuthenticated }: AuthSheetBodyProps) {
  const { signInGoogle, signInEmail, signUpEmail } = useAuth();
  const access = useAccessPolicy();
  const [mode, setMode] = useState<"login" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (access.isMember) onAuthenticated?.();
  }, [access.isMember, onAuthenticated]);

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await signInGoogle();
    } catch {
      setError("Google 로그인에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") await signUpEmail(email, password);
      else await signInEmail(email, password);
      setMode(null);
    } catch {
      setError(
        mode === "signup"
          ? "가입에 실패했습니다. 이미 가입한 이메일이면 로그인을 시도해 주세요."
          : "로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold text-text">로그인 · 가입</p>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {message ??
            "내 꿈을 저장하고 30일 타이머·탐색 후기를 열려면 로그인하거나 가입하세요."}
        </p>
        <p className="mt-1.5 text-[0.6875rem] text-text-muted leading-relaxed">
          처음이면 자동으로 가입됩니다. 이미 계정이 있으면 로그인해 주세요.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={busy}
        className="btn-primary disabled:opacity-60"
      >
        {CTA_AUTH_GOOGLE}
      </button>

      {mode ? (
        <form onSubmit={(e) => void handleEmail(e)} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="input"
            autoComplete="email"
            disabled={busy}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            className="input"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            disabled={busy}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {mode === "signup" ? CTA_AUTH_EMAIL_SIGNUP : CTA_AUTH_EMAIL_LOGIN}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setError("");
            }}
            className="text-xs text-text-muted w-full text-center"
          >
            다른 방법으로
          </button>
        </form>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            disabled={busy}
            className="btn-secondary flex-1 text-sm disabled:opacity-60"
          >
            {CTA_AUTH_EMAIL_LOGIN}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            disabled={busy}
            className="btn-secondary flex-1 text-sm disabled:opacity-60"
          >
            {CTA_AUTH_EMAIL_SIGNUP}
          </button>
        </div>
      )}

      {!mode && error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
