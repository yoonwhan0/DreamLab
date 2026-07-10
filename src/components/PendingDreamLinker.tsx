import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isLinkedAuthUser } from "@/lib/authUser";
import { getPendingDreamRaw } from "@/lib/pendingDreamStorage";
import { flushPendingDream } from "@/services/pendingDreamService";

/** Google 가입 직후 — 어느 페이지에서든 미저장 꿈을 아카이브에 연동 */
export function PendingDreamLinker() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (loading || syncingRef.current) return;
    if (!isLinkedAuthUser(user)) return;
    if (!getPendingDreamRaw()) return;

    // DreamDetailPage preview 흐름이 처리 중이면 중복 저장 방지
    if (location.pathname === "/dream/preview") return;

    syncingRef.current = true;
    void flushPendingDream(user!.uid)
      .then((dreamId) => {
        if (dreamId) {
          navigate(`/dream/${dreamId}?new=1`, { replace: true });
        }
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [user, loading, location.pathname, navigate]);

  return null;
}
