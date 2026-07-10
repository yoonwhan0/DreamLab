import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { isMasterAccountEmail } from "@/lib/masterAccounts";
import { getUserProfile, upsertUserProfile } from "@/services/dreamService";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInGuest: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async (firebaseUser: User) => {
    const masterPremium = isMasterAccountEmail(firebaseUser.email);
    const masterAdmin = masterPremium;
    const existing = await getUserProfile(firebaseUser.uid);
    if (existing) {
      const nextPremium = existing.isPremium || masterPremium;
      const needsRoleSync = masterAdmin && existing.role !== "admin";
      if (
        existing.isAnonymous !== firebaseUser.isAnonymous ||
        (masterPremium && !existing.isPremium) ||
        needsRoleSync
      ) {
        await upsertUserProfile(firebaseUser.uid, {
          isAnonymous: firebaseUser.isAnonymous,
          displayName: firebaseUser.displayName ?? existing.displayName,
          email: firebaseUser.email ?? existing.email,
          ...(masterPremium ? { isPremium: true } : {}),
          ...(masterAdmin ? { role: "admin" } : {}),
        });
      }
      setProfile({
        ...existing,
        displayName: firebaseUser.displayName ?? existing.displayName,
        email: firebaseUser.email ?? existing.email,
        isAnonymous: firebaseUser.isAnonymous,
        isPremium: nextPremium,
        role: masterAdmin ? "admin" : existing.role,
      });
      return;
    }

    const profileData: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      isAnonymous: firebaseUser.isAnonymous,
      isPremium: masterPremium,
      ...(masterAdmin ? { role: "admin" as const } : {}),
      fcmTokens: [],
      createdAt: new Date(),
    };
    await upsertUserProfile(firebaseUser.uid, profileData);
    setProfile({
      ...profileData,
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      isAnonymous: firebaseUser.isAnonymous,
      isPremium: masterPremium,
      role: masterAdmin ? "admin" : profileData.role,
      fcmTokens: [],
      createdAt: profileData.createdAt ?? new Date(),
    } as UserProfile);
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const authInstance = auth;
    let mounted = true;

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        await syncProfile(firebaseUser);
        setLoading(false);
        return;
      }

      if (isFirebaseConfigured) {
        try {
          await signInAnonymously(authInstance);
          return;
        } catch (err) {
          console.error("Anonymous auth failed:", err);
        }
      }

      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncProfile]);

  const signInGuest = useCallback(async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await signInAnonymously(auth);
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    const provider = new GoogleAuthProvider();
    const current = auth.currentUser;

    if (current?.isAnonymous) {
      const result = await linkWithPopup(current, provider);
      await upsertUserProfile(result.user.uid, {
        isAnonymous: false,
        displayName: result.user.displayName,
        email: result.user.email,
      });
      await syncProfile(result.user);
      return;
    }

    await signInWithPopup(auth, provider);
  }, [syncProfile]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    const current = auth.currentUser;

    if (current?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(current, credential);
      await upsertUserProfile(current.uid, {
        isAnonymous: false,
        email,
      });
      await syncProfile(current);
      return;
    }

    await createUserWithEmailAndPassword(auth, email, password);
  }, [syncProfile]);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getUserProfile(user.uid));
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isConfigured: isFirebaseConfigured,
      signInGuest,
      signInGoogle,
      signInEmail,
      signUpEmail,
      logout,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      signInGuest,
      signInGoogle,
      signInEmail,
      signUpEmail,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
