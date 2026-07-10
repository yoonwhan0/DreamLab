import { useState } from "react";
import { Navigate } from "react-router-dom";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAdminRoutes } from "@admin/lib/adminRoutes";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { StatusBanner } from "@admin/components/AdminUi";

export function LoginPage() {
  const { root } = useAdminRoutes();
  const { signInGoogle, signInEmail, error, loading, user, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
        <StatusBanner type="warn">
          Firebase env가 없습니다. <code>.env</code>에 <code>VITE_FIREBASE_*</code>를
          설정하세요.
        </StatusBanner>
      </div>
    );
  }

  if (!loading && user && isAdmin) {
    return <Navigate to={root} replace />;
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInEmail(email, password);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
      <div className="card card-bezel p-6 w-full max-w-md space-y-5">
        <div>
          <p className="section-label brand-wordmark">DreamLab · ERP</p>
          <h1 className="page-title mt-1">운영자 로그인</h1>
          <p className="text-xs text-text-muted mt-2">
            Firestore <code>users/&#123;uid&#125;.role = &quot;admin&quot;</code> 계정만
            접근할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={busy || loading}
          onClick={() => void signInGoogle()}
        >
          Google로 로그인
        </button>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="btn btn-secondary w-full" disabled={busy}>
            이메일 로그인
          </button>
        </form>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
