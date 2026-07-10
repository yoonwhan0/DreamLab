import { useLocation } from "react-router-dom";
import { ADMIN_ENTRY_PATH, isAdminEntryPath } from "@/lib/adminPath";

/** standalone Admin(`/`) vs 메인 PWA(`/superadmin`) */
export function useAdminRoutePath(): string {
  const { pathname } = useLocation();
  return isAdminEntryPath(pathname) ? ADMIN_ENTRY_PATH : "/";
}
