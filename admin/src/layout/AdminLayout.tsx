import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "@admin/layout/AdminSidebar";

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="admin-layout min-h-dvh bg-bg text-text flex flex-col lg:flex-row w-full">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <Outlet key={pathname} />
      </main>
    </div>
  );
}
