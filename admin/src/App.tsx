import { BrowserRouter } from "react-router-dom";
import { AdminApp } from "@admin/AdminApp";

/** 로컬 standalone — `npm run dev:admin` (port 5174) */
export function App() {
  return (
    <BrowserRouter>
      <AdminApp />
    </BrowserRouter>
  );
}
