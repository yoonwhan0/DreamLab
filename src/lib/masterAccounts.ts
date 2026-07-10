/** 결제 연동 전 운영·마스터 계정 — 프리미엄 권한 부여 */
const MASTER_ACCOUNT_EMAILS = new Set(["yoonwhan0@gmail.com"]);

export function isMasterAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}
