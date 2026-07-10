import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  Brain,
  Database,
  LayoutDashboard,
  LogOut,
  Settings,
  Sliders,
  Users,
  Waypoints,
} from "lucide-react";
import { BRAND_TAGLINE } from "@/lib/branding";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";

const NAV_MAIN = [
  { to: "", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "monitoring", label: "모니터링", icon: Activity },
  { to: "members", label: "회원", icon: Users },
  { to: "dreams", label: "꿈 DB", icon: Database },
  { to: "follow-up", label: "Follow-up", icon: Waypoints },
  { to: "data-exposure", label: "데이터 노출", icon: Sliders },
  { to: "ai-usage", label: "AI 사용량", icon: Brain },
] as const;

const NAV_SETTINGS = [
  { to: "settings/lab-metrics", label: "홈 KPI", icon: LayoutDashboard },
  { to: "settings/push", label: "푸시", icon: Bell },
  { to: "settings/system", label: "시스템", icon: Settings },
] as const;

export function AdminSidebar() {
  const { user, logout } = useAdminAuth();

  return (
    <aside className="admin-sidebar flex flex-col w-56 shrink-0 border-r border-border bg-surface/60 min-h-dvh">
      <div className="p-4 border-b border-border">
        <p className="section-label brand-wordmark !mb-0">DreamLab · ERP</p>
        <p className="text-[0.6875rem] text-text-muted mt-1 leading-snug">{BRAND_TAGLINE}</p>
      </div>

      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        <NavGroup title="운영" items={NAV_MAIN} />
        <NavGroup title="설정" items={NAV_SETTINGS} />
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

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: readonly { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[];
}) {
  return (
    <div>
      <p className="px-2 mb-1.5 text-[0.5625rem] uppercase tracking-widest text-text-muted">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
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
    </div>
  );
}
