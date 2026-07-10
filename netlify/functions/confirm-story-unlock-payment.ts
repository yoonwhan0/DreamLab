import type { Handler } from "@netlify/functions";
import { getAdminDb, verifyBearerUid } from "./lib/firebaseAdmin";
import {
  STORY_UNLOCK_UNIT_PRICE_KRW,
  grantPaidStoryUnlock,
  keywordAccessKey,
} from "./lib/storyUnlockStore";

interface Body {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
}

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<{ ok: boolean; error?: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: "TOSS_SECRET_KEY not configured" };
  }

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: err.message ?? "Payment confirm failed" };
  }

  return { ok: true };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const uid = await verifyBearerUid(event.headers.authorization);
  if (!uid) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const { paymentKey, orderId, amount } = JSON.parse(event.body ?? "{}") as Body;
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid payload" }) };
  }

  if (amount !== STORY_UNLOCK_UNIT_PRICE_KRW) {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid amount" }) };
  }

  const db = getAdminDb();
  if (!db) {
    return { statusCode: 503, body: JSON.stringify({ error: "Server not configured" }) };
  }

  const orderRef = db.collection("story_payment_orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return { statusCode: 404, body: JSON.stringify({ error: "order not found" }) };
  }

  const order = orderSnap.data()!;
  if (order.uid !== uid) {
    return { statusCode: 403, body: JSON.stringify({ error: "forbidden" }) };
  }
  if (order.status === "confirmed") {
    const access = await db
      .collection("users")
      .doc(uid)
      .collection("story_unlocks")
      .doc(keywordAccessKey(order.keyword as string))
      .get();
    const paid = (access.data()?.paidUnlockCount as number) ?? 0;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        alreadyConfirmed: true,
        keyword: order.keyword,
        paidUnlockCount: paid,
      }),
    };
  }

  const toss = await confirmTossPayment(paymentKey, orderId, amount);
  if (!toss.ok) {
    await orderRef.set({ status: "failed", failReason: toss.error }, { merge: true });
    return {
      statusCode: 402,
      body: JSON.stringify({ error: toss.error ?? "payment failed" }),
    };
  }

  const grant = await grantPaidStoryUnlock(
    db,
    uid,
    order.keyword as string,
    orderId,
  );

  await orderRef.set(
    {
      status: "confirmed",
      paymentKey,
      confirmedAt: new Date(),
    },
    { merge: true },
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      keyword: order.keyword,
      paidUnlockCount: grant.paidUnlockCount,
      maxSlots: grant.maxSlots,
    }),
  };
};

export { handler };
