import { getRedirectResult, type UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

let redirectResultPromise: Promise<UserCredential | null> | null = null;

/** 페이지 로드 직후 1회만 호출 — React·스플래시보다 먼저 redirect 결과 소비 */
function ensureAuthRedirectResult(): Promise<UserCredential | null> {
  if (!auth) return Promise.resolve(null);
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((error) => {
      console.error("[auth] getRedirectResult failed:", error);
      throw error;
    });
  }
  return redirectResultPromise;
}

export function getAuthRedirectResult(): Promise<UserCredential | null> {
  return ensureAuthRedirectResult();
}

void ensureAuthRedirectResult();
