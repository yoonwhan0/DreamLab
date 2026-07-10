import { GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AUTH_REDIRECT_PENDING_KEY = "dreamlab-auth-redirect-pending";

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER|Twitter/i.test(navigator.userAgent);
}

/** 모바일·PWA·인앱 — redirect (popup COOP 이슈 회피) */
export function prefersAuthRedirect(): boolean {
  if (typeof window === "undefined") return false;
  return isInAppBrowser() || isMobileUa() || isStandalonePwa();
}

export function markAuthRedirectPending(): void {
  try {
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearAuthRedirectPending(): void {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthRedirectPending(): boolean {
  try {
    return sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Google redirect — 익명 연동 없이 직접 로그인만 */
export async function startGoogleRedirect(): Promise<void> {
  if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");

  markAuthRedirectPending();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // 남아 있는 익명 세션 제거 — link 지옥 방지
  if (auth.currentUser?.isAnonymous) {
    await signOut(auth);
  }

  await signInWithRedirect(auth, provider);
}
