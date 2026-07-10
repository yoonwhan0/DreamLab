import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (db && typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {
    // 멀티탭 등으로 실패해도 앱은 동작
  });
}

export async function getMessagingInstance() {
  if (!app) return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export { app };
