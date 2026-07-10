import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { isMasterAccountEmail } from "@/lib/masterAccounts";
import { upsertUserProfile } from "@/services/dreamService";

export interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

export function useAdminAuth(): AdminAuthState & {
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setError(null);

      if (!nextUser || !db) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", nextUser.uid));
        const master = isMasterAccountEmail(nextUser.email);
        const roleAdmin = snap.exists() && snap.data()?.role === "admin";
        setIsAdmin(master || roleAdmin);

        if (master && !roleAdmin) {
          await upsertUserProfile(nextUser.uid, {
            email: nextUser.email,
            displayName: nextUser.displayName,
            role: "admin",
          });
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signInGoogle = async () => {
    if (!auth) throw new Error("Firebase 미설정");
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
      throw err;
    }
  };

  const signInEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase 미설정");
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return {
    user,
    isAdmin,
    loading,
    error,
    signInGoogle,
    signInEmail,
    logout,
    configured: isFirebaseConfigured,
  };
}
