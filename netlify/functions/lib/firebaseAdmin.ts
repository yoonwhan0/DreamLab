import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { isMasterAccountEmail } from "../../../src/lib/masterAccounts";
import { normalizePrivateKey } from "./firebasePrivateKey";

let initError: string | null = null;

export function getAdminInitError(): string | null {
  return initError;
}

export function getAdminApp(): App | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.FIREBASE_PRIVATE_KEY?.trim()) {
      initError =
        "FIREBASE_PRIVATE_KEY 형식 오류 — JSON 전체가 아니라 private_key 문자열만 넣으세요.";
    }
    return null;
  }

  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      initError = null;
    } catch (e) {
      initError =
        e instanceof Error
          ? `Firebase Admin 초기화 실패: ${e.message}`
          : "Firebase Admin 초기화 실패";
      console.error("[firebaseAdmin]", initError);
      return null;
    }
  }

  return getApps()[0] ?? null;
}

export function isAdminServerConfigured(): boolean {
  return getAdminApp() !== null;
}

export function getAdminDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

function tokenEmail(decoded: {
  email?: string;
  firebase?: { identities?: Record<string, string[]> };
}): string | null {
  if (typeof decoded.email === "string" && decoded.email.trim()) {
    return decoded.email.trim().toLowerCase();
  }
  const fromIdentities = decoded.firebase?.identities?.email?.[0];
  if (typeof fromIdentities === "string" && fromIdentities.trim()) {
    return fromIdentities.trim().toLowerCase();
  }
  return null;
}

/** 로그인 회원 — Admin SDK로 ID 토큰만 검증 */
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

/** 슈퍼어드민 API — 마스터 이메일 또는 users.role=admin */
export async function verifyBearerAdmin(
  authorization: string | undefined,
): Promise<{ uid: string; email: string | null } | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return null;

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    if (!uid) return null;

    const email = tokenEmail(decoded);
    if (isMasterAccountEmail(email)) {
      return { uid, email };
    }

    const snap = await db.doc(`users/${uid}`).get();
    if (snap.exists && snap.data()?.role === "admin") {
      return { uid, email };
    }

    return null;
  } catch {
    return null;
  }
}
