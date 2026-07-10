/** 모바일·PWA·인앱 브라우저 — popup 대신 redirect 로그인 */
export function prefersAuthRedirect(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const mobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari PWA
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const inApp = /FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER|Twitter/i.test(ua);

  return mobile || standalone || inApp;
}
