import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@admin/layout/AdminSidebar";

export function AdminLayout() {
  return (
    <div className="min-h-dvh bg-bg text-text flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
