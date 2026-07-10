import { getRedirectResult, type UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAuthRedirectPending } from "@/lib/authPlatform";

let redirectResultPromise: Promise<UserCredential | null> | null = null;

/** redirect 복귀 시에만 호출 — 매 페이지 getRedirectResult는 popup 로그인 방해 가능 */
function ensureAuthRedirectResult(): Promise<UserCredential | null> {
  if (!auth || !isAuthRedirectPending()) return Promise.resolve(null);
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((error) => {
      redirectResultPromise = null;
      console.error("[auth] getRedirectResult failed:", error);
      throw error;
    });
  }
  return redirectResultPromise;
}

export function getAuthRedirectResult(): Promise<UserCredential | null> {
  return ensureAuthRedirectResult();
}

export function resetAuthRedirectResult(): void {
  redirectResultPromise = null;
}
