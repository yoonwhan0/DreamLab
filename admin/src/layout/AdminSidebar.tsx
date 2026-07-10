import { LayoutDashboard, Database, Users, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { BRAND_TAGLINE } from "@/lib/branding";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { useAdminRoutes } from "@admin/lib/adminRoutes";

const NAV_ITEMS = [
  { segment: "", label: "대시보드", icon: LayoutDashboard, end: true as const },
  { segment: "members", label: "회원", icon: Users, end: false as const },
  { segment: "dreams", label: "꿈 DB", icon: Database, end: false as const },
] as const;

export function AdminSidebar() {
  const { user, logout } = useAdminAuth();
  const { root, to } = useAdminRoutes();

  const linkTo = (segment: string) => {
    if (!segment) return root;
    return to(segment);
  };

  return (
    <aside className="admin-sidebar flex flex-col w-full lg:w-52 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface/80 lg:min-h-dvh">
      <div className="p-4 border-b border-border">
        <p className="section-label brand-wordmark !mb-0">DreamLab · Admin</p>
        <p className="text-[0.6875rem] text-text-muted mt-1 leading-snug">{BRAND_TAGLINE}</p>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.segment || "root"}>
              <NavLink
                to={linkTo(item.segment)}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-sm transition-colors touch-manipulation ${
                    isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-text-secondary hover:text-text hover:bg-surface"
                  }`
                }
              >
                <item.icon size={16} className="shrink-0 opacity-80" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {user && (
          <p className="text-[0.625rem] text-text-muted truncate px-2" title={user.email ?? ""}>
            {user.email ?? user.uid.slice(0, 8)}
          </p>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-text-secondary hover:text-text rounded-lg hover:bg-surface"
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
