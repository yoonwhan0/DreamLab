/**
 * 로컬 Vite dev 전용 — /api/* (Netlify 핸들러)
 */
import { localApiPlugin } from "./vite-local-api-plugin.ts";

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
    "/api/admin-import-dreams": async () => {
      const mod = await import("../netlify/functions/admin-import-dreams");
      return mod.handler;
    },
    "/api/admin-delete-dreams": async () => {
      const mod = await import("../netlify/functions/admin-delete-dreams");
      return mod.handler;
    },
  });
}
