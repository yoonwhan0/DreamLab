/**
 * 로컬 Vite dev 전용 — /api/* (Netlify 핸들러)
 */
import { localApiPlugin } from "./vite-local-api-plugin";

export function attachDevApi() {
  return localApiPlugin({
    "/api/interpret-dream": async () => {
      const mod = await import("../netlify/functions/interpret-dream");
      return mod.handler;
    },
    "/api/story-access": async () => {
      const mod = await import("../netlify/functions/story-access");
      return mod.handler;
    },
    "/api/register-story-views": async () => {
      const mod = await import("../netlify/functions/register-story-views");
      return mod.handler;
    },
    "/api/create-story-unlock-order": async () => {
      const mod = await import("../netlify/functions/create-story-unlock-order");
      return mod.handler;
    },
    "/api/confirm-story-unlock-payment": async () => {
      const mod = await import("../netlify/functions/confirm-story-unlock-payment");
      return mod.handler;
    },
  });
}
