import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const SERVER_ENV_KEYS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

/** DreamLab Admin — 사용자 PWA와 별도 포트(5174) */
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of SERVER_ENV_KEYS) {
    if (env[key]) process.env[key] = env[key];
  }

  const plugins = [react(), tailwindcss()];

  if (mode === "development") {
    const devApiUrl = new URL("./scripts/vite-dev-api-plugin.ts", import.meta.url).href;
    const { attachDevApi } = await import(devApiUrl);
    plugins.push(attachDevApi());
  }

  return {
    root: path.resolve(__dirname, "admin"),
    publicDir: path.resolve(__dirname, "public"),
    plugins,
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
  };
});
