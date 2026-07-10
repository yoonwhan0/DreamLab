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

/**
 * popup COOP 이슈·모바일·PWA·인앱 브라우저 — redirect 로그인
 * (Netlify 등에서 signInWithPopup + window.closed 가 막히는 경우)
 */
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

export async function startGoogleRedirect(
  linkAnonymous: boolean,
): Promise<void> {
  const { GoogleAuthProvider, linkWithRedirect, signInWithRedirect } = await import(
    "firebase/auth"
  );
  const { auth } = await import("@/lib/firebase");
  if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");

  markAuthRedirectPending();
  const provider = new GoogleAuthProvider();
  const current = auth.currentUser;

  if (linkAnonymous && current?.isAnonymous) {
    await linkWithRedirect(current, provider);
    return;
  }

  await signInWithRedirect(auth, provider);
}
