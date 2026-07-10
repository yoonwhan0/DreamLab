import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getAdminApp(): App | null {
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

  return getApps()[0]!;
}

export function getAdminDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export async function verifyBearerUid(
  authorization: string | undefined,
): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const auth = getAdminAuth();
  if (!auth) return null;

  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid ?? null;
  } catch {
    return null;
  }
}
