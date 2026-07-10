import type { Handler } from "@netlify/functions";
import { getAdminDb, getAdminInitError, isAdminServerConfigured, verifyBearerAdmin } from "./lib/firebaseAdmin";

const ADMIN_SEED_USER_ID = "dreamlab-seed-data";
const BATCH_SIZE = 400;

interface ImportPayload {
  content?: string;
  userId?: string;
  [key: string]: unknown;
}

function validateSeedPayload(data: ImportPayload): string | null {
  if (data.userId !== ADMIN_SEED_USER_ID) return "invalid userId";
  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (content.length < 8) return "content too short";
  return null;
}

function reviveTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const ms = (value: unknown) => {
    if (typeof value === "number") return new Date(value);
    return new Date();
  };

  const followUpRaw = data.followUp as Record<string, unknown> | undefined;

  const {
    importedBy: _importedBy,
    importedAt: _importedAt,
    seedSource: _seedSource,
    likes: _likes,
    ...rest
  } = data;

  return {
    ...rest,
    isPublic: true,
    createdAt: ms(data.createdAt),
    followUpDueAt: ms(data.followUpDueAt),
    ...(followUpRaw
      ? {
          followUp: {
            ...followUpRaw,
            answeredAt: ms(followUpRaw.answeredAt),
          },
        }
      : {}),
  };
}

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

  let body: { payloads?: Record<string, unknown>[] };
  try {
    body = JSON.parse(event.body ?? "{}") as { payloads?: Record<string, unknown>[] };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const payloads = body.payloads ?? [];
  if (payloads.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "payloads required" }) };
  }

  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const chunk = payloads.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let chunkCount = 0;

    for (const raw of chunk) {
      const validationError = validateSeedPayload(raw as ImportPayload);
      if (validationError) {
        failed += 1;
        errors.push(validationError);
        continue;
      }

      try {
        const ref = db.collection("dreams").doc();
        batch.set(ref, reviveTimestamps(raw));
        chunkCount += 1;
      } catch (e) {
        failed += 1;
        errors.push(e instanceof Error ? e.message : "save failed");
      }
    }

    if (chunkCount > 0) {
      await batch.commit();
      imported += chunkCount;
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imported, failed, errors: errors.slice(0, 20) }),
  };
};

export { handler };
