/** 메인 PWA에서 Admin ERP 진입 경로 (공개 URL — Firestore role로 실제 보호) */
export const ADMIN_ENTRY_PATH = "/superadmin";

export function isAdminEntryPath(pathname: string): boolean {
  return pathname === ADMIN_ENTRY_PATH || pathname.startsWith(`${ADMIN_ENTRY_PATH}/`);
}
