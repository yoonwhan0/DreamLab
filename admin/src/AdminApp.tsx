import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ADMIN_ENTRY_PATH } from "@/lib/adminPath";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAdminRoutes } from "@admin/lib/adminRoutes";
import { AdminLayout } from "@admin/layout/AdminLayout";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { LoginPage } from "@admin/pages/LoginPage";
import { DashboardPage } from "@admin/pages/DashboardPage";
import { MembersPage } from "@admin/pages/MembersPage";
import { DreamsPage } from "@admin/pages/DreamsPage";
import { StatusBanner } from "@admin/components/AdminUi";

function AdminGate({ children }: { children: ReactNode }) {
  const { embedded, login } = useAdminRoutes();
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-text-muted text-sm">
        인증 확인 중…
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to={embedded ? "login" : login} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
        <div className="max-w-md space-y-4">
          <StatusBanner type="warn">
            admin 권한이 없습니다. Firestore{" "}
            <code>users/{user.uid}.role = &quot;admin&quot;</code> 을 설정하거나 마스터
            계정으로 로그인하세요.
          </StatusBanner>
          <p className="text-xs text-text-muted text-center">{user.email}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminShellRoutes() {
  const { embedded, root } = useAdminRoutes();

  const protectedLayout = (
    <Route
      element={
        <AdminGate>
          <AdminLayout />
        </AdminGate>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="members" element={<MembersPage />} />
      <Route path="dreams" element={<DreamsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Route>
  );

  if (embedded) {
    return (
      <Routes>
        <Route path="login" element={<LoginPage />} />
        {protectedLayout}
        <Route path="*" element={<Navigate to={ADMIN_ENTRY_PATH} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AdminGate><AdminLayout /></AdminGate>}>
        <Route index element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="dreams" element={<DreamsPage />} />
        <Route path="*" element={<Navigate to={root} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={root} replace />} />
    </Routes>
  );
}

/** 사용자 PWA `/superadmin/*` — 대시보드 · 회원 · 꿈 DB */
export function AdminApp() {
  if (!isFirebaseConfigured) {
    const isProd = import.meta.env.PROD;
    return (
      <div className="admin-shell min-h-dvh flex items-center justify-center p-6 bg-bg">
        <div className="max-w-md space-y-3 text-sm text-text-secondary">
          <StatusBanner type="warn">
            Firebase 미설정 — <code>VITE_FIREBASE_*</code> 환경변수가 빌드에 없습니다.
          </StatusBanner>
          {isProd ? (
            <p>
              Netlify → Environment variables → <code>VITE_FIREBASE_*</code> 저장 후 Redeploy
              하세요.
            </p>
          ) : (
            <p>
              프로젝트 루트 <code>.env</code>에 Firebase 웹 설정을 넣고 dev 서버를 다시
              실행하세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-dvh w-full bg-bg text-text">
      <AdminShellRoutes />
    </div>
  );
}
