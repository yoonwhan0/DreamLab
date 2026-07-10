import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

type AiProvider = "openai" | "gemini" | "fallback";

export async function recordAiUsage(opts: {
  provider: AiProvider;
  success: boolean;
}): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const today = new Date().toISOString().slice(0, 10);
  const ref = db.collection("ai_usage").doc(today);

  const patch: Record<string, unknown> = {
    date: today,
    totalCalls: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (opts.provider === "openai") patch.openaiCalls = FieldValue.increment(1);
  if (opts.provider === "gemini") patch.geminiCalls = FieldValue.increment(1);
  if (opts.provider === "fallback") patch.fallbackCalls = FieldValue.increment(1);
  if (!opts.success) patch.errorCalls = FieldValue.increment(1);

  await ref.set(patch, { merge: true });
}
