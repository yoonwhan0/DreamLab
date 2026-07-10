import { GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AUTH_REDIRECT_PENDING_KEY = "dreamlab-auth-redirect-pending";
const AUTH_REDIRECT_PENDING_AT_KEY = "dreamlab-auth-redirect-pending-at";
const AUTH_REDIRECT_TIMEOUT_MS = 120_000;

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER|Twitter/i.test(navigator.userAgent);
}

export { isInAppBrowser };

/** Netlify COOP 헤더 적용 후 popup 우선 — redirect는 popup 차단 시에만 */
export function prefersAuthRedirect(): boolean {
  return false;
}

export function markAuthRedirectPending(): void {
  const at = String(Date.now());
  try {
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, "1");
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_AT_KEY, at);
  } catch {
    /* ignore */
  }
}

export function clearAuthRedirectPending(): void {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
    localStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    localStorage.removeItem(AUTH_REDIRECT_PENDING_AT_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthRedirectPending(): boolean {
  try {
    // 예전 redirect 시도에서 남은 localStorage 플래그 정리
    const legacyPending = localStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === "1";
    if (legacyPending) {
      clearAuthRedirectPending();
      return false;
    }

    if (isAuthRedirectTimedOut()) {
      clearAuthRedirectPending();
      return false;
    }
    return sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function isAuthRedirectTimedOut(): boolean {
  try {
    const at = Number(sessionStorage.getItem(AUTH_REDIRECT_PENDING_AT_KEY));
    if (!at || Number.isNaN(at)) return false;
    return Date.now() - at > AUTH_REDIRECT_TIMEOUT_MS;
  } catch {
    return false;
  }
}

/** Google redirect — 익명 연동 없이 직접 로그인만 */
export async function startGoogleRedirect(): Promise<void> {
  if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");

  if (isInAppBrowser()) {
    throw new Error("Google 로그인에 실패했습니다. 다시 시도해 주세요.");
  }

  markAuthRedirectPending();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // 남아 있는 익명 세션 제거 — link 지옥 방지
  if (auth.currentUser?.isAnonymous) {
    await signOut(auth);
  }

  await signInWithRedirect(auth, provider);
}
