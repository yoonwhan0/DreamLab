import type { Handler } from "@netlify/functions";
import { getAdminDb, verifyBearerUid } from "./lib/firebaseAdmin";
import { registerStoryViews } from "./lib/storyUnlockStore";

interface Body {
  keyword?: string;
  storyIds?: string[];
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const uid = await verifyBearerUid(event.headers.authorization);
  if (!uid) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const { keyword, storyIds } = JSON.parse(event.body ?? "{}") as Body;
  if (!keyword?.trim() || !Array.isArray(storyIds) || storyIds.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid payload" }) };
  }

  const db = getAdminDb();
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Server not configured" }) };
  }

  const result = await registerStoryViews(db, uid, keyword.trim(), storyIds);
  return {
    statusCode: result.ok ? 200 : 402,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: result.ok,
      reason: result.reason,
      access: result.access,
    }),
  };
};

export { handler };
