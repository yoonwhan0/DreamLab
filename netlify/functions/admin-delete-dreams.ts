import type { Handler } from "@netlify/functions";
import {
  getAdminDb,
  getAdminInitError,
  isAdminServerConfigured,
  verifyBearerAdmin,
} from "./lib/firebaseAdmin";

const BATCH_SIZE = 400;

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const admin = await verifyBearerAdmin(event.headers.authorization);
  if (!admin) {
    const configured = isAdminServerConfigured();
    const initError = getAdminInitError();
    return {
      statusCode: configured ? 403 : 503,
      body: JSON.stringify({
        error: configured
          ? "Admin required"
          : initError ??
            "Server not configured — FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
      }),
    };
  }

  const db = getAdminDb();
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Server not configured" }) };
  }

  let body: { ids?: unknown };
  try {
    body = JSON.parse(event.body ?? "{}") as { ids?: unknown };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const rawIds = body.ids;
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "ids required" }) };
  }

  const ids = rawIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (ids.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "ids required" }) };
  }

  let deleted = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let chunkCount = 0;

    for (const id of chunk) {
      batch.delete(db.collection("dreams").doc(id));
      chunkCount += 1;
    }

    if (chunkCount > 0) {
      await batch.commit();
      deleted += chunkCount;
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleted }),
  };
};

export { handler };
