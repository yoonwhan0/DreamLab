import { useState } from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { SplashScreen } from "@/components/SplashScreen";
import { AdminApp } from "@admin/AdminApp";
import { isAdminEntryPath } from "@/lib/adminPath";

import { MemberRoute } from "@/components/MemberRoute";

import { DemoProvider } from "@/demo/DemoProvider";

import { AuthProvider } from "@/hooks/useAuth";

import { SignupSheetProvider } from "@/hooks/useSignupSheet";
import { PremiumSheetProvider } from "@/hooks/usePremiumSheet";
import { PendingDreamLinker } from "@/components/PendingDreamLinker";

import { HomePage } from "@/pages/HomePage";

import { WriteDreamPage } from "@/pages/WriteDreamPage";

import { DreamDetailPage } from "@/pages/DreamDetailPage";

import { FollowUpPage } from "@/pages/FollowUpPage";

import { MyDreamsPage } from "@/pages/MyDreamsPage";

import { MyPage } from "@/pages/MyPage";



export default function App() {
  const [splashDone, setSplashDone] = useState(() =>
    isAdminEntryPath(window.location.pathname),
  );

  return (
    <DemoProvider>
      <AuthProvider>
        {!splashDone ? (
          <SplashScreen onComplete={() => setSplashDone(true)} />
        ) : (
          <>
        <PendingDreamLinker />
        <SignupSheetProvider>
          <PremiumSheetProvider>
            <Routes>
              <Route path="/superadmin/*" element={<AdminApp />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/write" element={<WriteDreamPage />} />
                      <Route path="/dream/:id" element={<DreamDetailPage />} />
                      <Route
                        path="/follow-up/:id"
                        element={
                          <MemberRoute>
                            <FollowUpPage />
                          </MemberRoute>
                        }
                      />
                      <Route
                        path="/my-dreams"
                        element={
                          <MemberRoute>
                            <MyDreamsPage />
                          </MemberRoute>
                        }
                      />
                      <Route path="/explore" element={<Navigate to="/" replace />} />
                      <Route path="/about" element={<Navigate to="/#research" replace />} />
                      <Route path="/my" element={<MyPage />} />
                      <Route path="/premium" element={<Navigate to="/my#pricing" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </PremiumSheetProvider>
        </SignupSheetProvider>
          </>
        )}
      </AuthProvider>
    </DemoProvider>
  );
}

