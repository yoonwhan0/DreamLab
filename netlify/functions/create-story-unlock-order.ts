import type { Handler } from "@netlify/functions";
import { getAdminDb, verifyBearerUid } from "./lib/firebaseAdmin";
import {
  STORY_UNLOCK_UNIT_PRICE_KRW,
  keywordAccessKey,
} from "./lib/storyUnlockStore";

interface Body {
  keyword?: string;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const uid = await verifyBearerUid(event.headers.authorization);
  if (!uid) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const { keyword } = JSON.parse(event.body ?? "{}") as Body;
  if (!keyword?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "keyword required" }) };
  }

  const db = getAdminDb();
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Server not configured" }) };
  }

  const orderId = `dl-${uid.slice(0, 8)}-${keywordAccessKey(keyword)}-${Date.now()}`.slice(
    0,
    64,
  );
  const amount = STORY_UNLOCK_UNIT_PRICE_KRW;
  const orderName = `"${keyword.trim()}" 한 달 뒤 후기 1건`;

  await db.collection("story_payment_orders").doc(orderId).set({
    uid,
    keyword: keyword.trim(),
    keywordKey: keywordAccessKey(keyword),
    amount,
    status: "pending",
    createdAt: new Date(),
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      amount,
      orderName,
      customerKey: uid,
    }),
  };
};

export { handler };
