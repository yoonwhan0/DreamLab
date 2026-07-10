/**
 * VITE_FIREBASE_* 환경변수로 public/firebase-messaging-sw.js 생성.
 * predev / prebuild 에서 실행.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "firebase-messaging-sw.js");

const ENV_FILES = [
  path.join(ROOT, ".env.local"),
  path.join(ROOT, ".env"),
];

function loadEnv() {
  const vars = new Map();
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key.startsWith("VITE_FIREBASE_") && value) vars.set(key, value);
    }
  }
  return vars;
}

const env = loadEnv();

const config = {
  apiKey: env.get("VITE_FIREBASE_API_KEY") ?? "PLACEHOLDER",
  authDomain: env.get("VITE_FIREBASE_AUTH_DOMAIN") ?? "PLACEHOLDER",
  projectId: env.get("VITE_FIREBASE_PROJECT_ID") ?? "PLACEHOLDER",
  storageBucket: env.get("VITE_FIREBASE_STORAGE_BUCKET") ?? "PLACEHOLDER",
  messagingSenderId:
    env.get("VITE_FIREBASE_MESSAGING_SENDER_ID") ?? "PLACEHOLDER",
  appId: env.get("VITE_FIREBASE_APP_ID") ?? "PLACEHOLDER",
};

const content = `importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "꿈연구소(DreamLab)";
  const options = {
    body: payload.notification?.body,
    icon: "/pwa-192x192.png",
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
`;

writeFileSync(OUT, content, "utf8");

const configured = config.apiKey !== "PLACEHOLDER" && config.projectId !== "PLACEHOLDER";
if (configured) {
  console.log("✓ firebase-messaging-sw.js 생성 (Firebase config 적용)");
} else {
  console.warn(
    "⚠ firebase-messaging-sw.js — PLACEHOLDER ( .env 에 VITE_FIREBASE_* 설정 후 재실행 )",
  );
}
