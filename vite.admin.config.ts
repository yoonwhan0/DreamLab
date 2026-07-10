import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** DreamLab Admin — 사용자 PWA와 별도 포트(5174) */
export default defineConfig({
  root: path.resolve(__dirname, "admin"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@admin": path.resolve(__dirname, "./admin/src"),
      "@assets": path.resolve(__dirname, "./assets"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: path.resolve(__dirname, "dist-admin"),
    emptyOutDir: true,
  },
});
