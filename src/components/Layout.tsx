import { useLocation } from "react-router-dom";
import { AppLink } from "@/components/ui/AppLink";
import { ScrollToTop } from "@/components/ScrollToTop";
import { TierBadge } from "@/components/AccessGate";
import { AppBackground } from "@/components/AppBackground";
import { DemoTierSwitcher } from "@/components/DemoTierSwitcher";
import { AppIcons, Icon, type NavIconKey } from "@/components/ui/Icon";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { APP_NAME_EN, APP_SUBTITLE } from "@/lib/branding";
import { APP_ICON } from "@/lib/brandAssets";
import { showDemoUi } from "@/demo/demoData";

const navItems: { path: string; label: string; icon: NavIconKey }[] = [
  { path: "/", label: "홈", icon: "home" },
  { path: "/write", label: "기록", icon: "write" },
  { path: "/explore", label: "탐색", icon: "explore" },
  { path: "/my", label: "마이", icon: "user" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const access = useAccessPolicy();

  return (
    <>
      <ScrollToTop />
      <AppBackground />
      <div className="relative flex min-h-dvh flex-col">
        <header className="app-header sticky top-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <AppLink
              to="/"
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <span className="brand-logo-frame flex h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <img
                  src={APP_ICON.md}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="min-w-0">
                <h1 className="brand-wordmark truncate text-sm font-bold text-text">
                  {APP_NAME_EN}
                </h1>
                <p className="truncate text-[0.625rem] text-text-muted tracking-[0.06em]">
                  {APP_SUBTITLE}
                </p>
              </div>
            </AppLink>
            <TierBadge tier={access.tier} />
          </div>
        </header>

        {showDemoUi && <DemoTierSwitcher />}

        <main
          key={location.pathname}
          className={`app-main page-enter relative z-10 mx-auto w-full max-w-lg flex-1 px-4 py-5 ${
            showDemoUi ? "pt-12" : ""
          }`}
        >
          {children}
        </main>

        <nav className="app-nav sticky bottom-0 z-50 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg justify-around">
            {navItems.map((item) => {
              const active =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`);

              return (
                <AppLink
                  key={item.path}
                  to={item.path}
                  className={`nav-item nav-item-motion ${active ? "nav-item-active" : ""}`}
                >
                  <Icon
                    icon={AppIcons[item.icon]}
                    size="md"
                    className={active ? "text-primary" : undefined}
                  />
                  <span>{item.label}</span>
                </AppLink>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
