import { useLocation } from "react-router-dom";
import { ADMIN_ENTRY_PATH, isAdminEntryPath } from "@/lib/adminPath";

/** standalone(`/`) vs 메인 PWA(`/superadmin`) 절대 경로 */
export function useAdminRoutes() {
  const { pathname } = useLocation();
  const embedded = isAdminEntryPath(pathname);
  const root = embedded ? ADMIN_ENTRY_PATH : "/";

  const to = (segment?: string) => {
    if (!segment) return root;
    return embedded ? `${ADMIN_ENTRY_PATH}/${segment}` : `/${segment}`;
  };

  return { embedded, root, login: to("login"), to };
}
