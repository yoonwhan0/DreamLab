import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type AiProvider = "openai" | "gemini" | "fallback";

function getAdminDb() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getFirestore();
}

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
