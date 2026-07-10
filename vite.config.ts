import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { localApiPlugin } from "./scripts/vite-local-api-plugin";

const SERVER_ENV_KEYS = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of SERVER_ENV_KEYS) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
  plugins: [
    react(),
    tailwindcss(),
    localApiPlugin(async () => {
      const mod = await import("./netlify/functions/interpret-dream");
      return mod.handler;
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon-16.png",
        "favicon-32.png",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-512x512-maskable.png",
      ],
      manifest: {
        name: "꿈연구소(DreamLab)",
        short_name: "DreamLab",
        description: "우리는 꿈의 결과가 궁금했습니다. 해몽이 닿지 못한 금단의 영역, 한 달 뒤에 열립니다.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        lang: "ko",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        importScripts: ["/firebase-messaging-sw.js"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@admin": path.resolve(__dirname, "./admin/src"),
      "@assets": path.resolve(__dirname, "./assets"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: "127.0.0.1",
  },
};
});
