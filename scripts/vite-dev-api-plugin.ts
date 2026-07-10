/**
 * 로컬 Vite dev 전용 — /api/interpret-dream (Netlify 핸들러)
 * vite.config.ts에서 정적 import 금지 (프로덕션 config 번들 시 @/ alias 깨짐 방지)
 */
import { localApiPlugin } from "./vite-local-api-plugin";

export function attachDevApi() {
  return localApiPlugin(async () => {
    const mod = await import("../netlify/functions/interpret-dream");
    return mod.handler;
  });
}
