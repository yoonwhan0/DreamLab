import type { Handler } from "@netlify/functions";
import { getAdminDb, verifyBearerUid } from "./lib/firebaseAdmin";
import { getStoryAccess } from "./lib/storyUnlockStore";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const uid = await verifyBearerUid(event.headers.authorization);
  if (!uid) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const keyword = event.queryStringParameters?.keyword?.trim();
  if (!keyword) {
    return { statusCode: 400, body: JSON.stringify({ error: "keyword required" }) };
  }

  const db = getAdminDb();
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Server not configured" }) };
  }

  const access = await getStoryAccess(db, uid, keyword);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(access),
  };
};

export { handler };
