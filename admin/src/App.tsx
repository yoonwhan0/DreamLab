import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AdminLayout } from "@admin/layout/AdminLayout";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { LoginPage } from "@admin/pages/LoginPage";
import { DashboardPage } from "@admin/pages/DashboardPage";
import { MonitoringPage } from "@admin/pages/MonitoringPage";
import { MembersPage } from "@admin/pages/MembersPage";
import { DreamsPage } from "@admin/pages/DreamsPage";
import { FollowUpPage } from "@admin/pages/FollowUpPage";
import { DataExposurePage } from "@admin/pages/DataExposurePage";
import { AiUsagePage } from "@admin/pages/AiUsagePage";
import { PushSettingsPage } from "@admin/pages/PushSettingsPage";
import { LabMetricsPage } from "@admin/pages/LabMetricsPage";
import { SystemSettingsPage } from "@admin/pages/SystemSettingsPage";
import { StatusBanner } from "@admin/components/AdminUi";

function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-text-muted text-sm">
        인증 확인 중…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
        <div className="max-w-md space-y-4">
          <StatusBanner type="warn">
            admin 권한이 없습니다. Firestore{" "}
            <code>users/{user.uid}.role = &quot;admin&quot;</code> 을 설정하세요.
          </StatusBanner>
          <p className="text-xs text-text-muted text-center">{user.email}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
        <StatusBanner type="warn">
          Firebase 미설정 — <code>.env</code> 후 <code>admin.bat</code> 재실행
        </StatusBanner>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <AdminGate>
              <AdminLayout />
            </AdminGate>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="dreams" element={<DreamsPage />} />
          <Route path="follow-up" element={<FollowUpPage />} />
          <Route path="data-exposure" element={<DataExposurePage />} />
          <Route path="ai-usage" element={<AiUsagePage />} />
          <Route path="settings/lab-metrics" element={<LabMetricsPage />} />
          <Route path="settings/push" element={<PushSettingsPage />} />
          <Route path="settings/system" element={<SystemSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
