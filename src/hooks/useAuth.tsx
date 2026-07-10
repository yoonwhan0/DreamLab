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
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  clearAuthRedirectPending,
  clearPreAuthUid,
  isAuthRedirectPending,
  prefersAuthRedirect,
  startGoogleRedirect,
} from "@/lib/authPlatform";
import { isLinkedAuthUser } from "@/lib/authUser";
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

async function reloadAuthUser(user: User): Promise<User> {
  try {
    await user.reload();
  } catch {
    /* ignore */
  }
  return auth?.currentUser ?? user;
}

async function finalizeGoogleUser(
  firebaseUser: User,
  syncProfile: (u: User) => Promise<void>,
): Promise<User> {
  const refreshed = await reloadAuthUser(firebaseUser);
  if (!isLinkedAuthUser(refreshed)) return refreshed;

  await upsertUserProfile(refreshed.uid, {
    isAnonymous: false,
    displayName: refreshed.displayName,
    email: refreshed.email,
  });
  await syncProfile(refreshed);
  clearPreAuthUid();
  return refreshed;
}

async function handleRedirectSignIn(
  syncProfile: (u: User) => Promise<void>,
): Promise<User | null> {
  if (!auth) return null;

  try {
    const redirectResult = await getRedirectResult(auth);
    clearAuthRedirectPending();

    if (redirectResult?.user) {
      return finalizeGoogleUser(redirectResult.user, syncProfile);
    }
    return auth.currentUser;
  } catch (err: unknown) {
    clearAuthRedirectPending();
    const fbErr = err as FirebaseError;
    const code = fbErr?.code ?? "";

    if (
      code === "auth/credential-already-in-use" ||
      code === "auth/email-already-in-use"
    ) {
      const credential = GoogleAuthProvider.credentialFromError(fbErr);
      if (credential && auth) {
        const result = await signInWithCredential(auth, credential);
        return finalizeGoogleUser(result.user, syncProfile);
      }
    }

    console.error("Google redirect sign-in failed:", err);
    return auth.currentUser;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async (firebaseUser: User) => {
    const linked = isLinkedAuthUser(firebaseUser);
    const masterPremium = isMasterAccountEmail(firebaseUser.email);
    const masterAdmin = masterPremium;
    const existing = await getUserProfile(firebaseUser.uid);

    if (existing) {
      const nextPremium = existing.isPremium || masterPremium;
      const needsRoleSync = masterAdmin && existing.role !== "admin";
      const profileAnonymous = linked ? false : firebaseUser.isAnonymous;

      if (
        existing.isAnonymous !== profileAnonymous ||
        (masterPremium && !existing.isPremium) ||
        needsRoleSync ||
        (linked && existing.email !== firebaseUser.email)
      ) {
        await upsertUserProfile(firebaseUser.uid, {
          isAnonymous: profileAnonymous,
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
        isAnonymous: profileAnonymous,
        isPremium: nextPremium,
        role: masterAdmin ? "admin" : existing.role,
      });
      return;
    }

    const profileAnonymous = linked ? false : firebaseUser.isAnonymous;
    const profileData: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      isAnonymous: profileAnonymous,
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
      isAnonymous: profileAnonymous,
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
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const redirectUser = await handleRedirectSignIn(syncProfile);
      if (!mounted) return;

      if (redirectUser && isLinkedAuthUser(redirectUser)) {
        setUser(redirectUser);
        setLoading(false);
      }

      unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (!mounted) return;

        if (firebaseUser) {
          const refreshed = await reloadAuthUser(firebaseUser);
          setUser(refreshed);
          await syncProfile(refreshed);
          if (isLinkedAuthUser(refreshed)) {
            clearPreAuthUid();
          }
          setLoading(false);
          return;
        }

        if (isAuthRedirectPending()) {
          setLoading(true);
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
    })();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [syncProfile]);

  const signInGuest = useCallback(async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await signInAnonymously(auth);
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const current = auth.currentUser;

    if (prefersAuthRedirect()) {
      await startGoogleRedirect(Boolean(current?.isAnonymous));
      return;
    }

    try {
      if (current?.isAnonymous) {
        try {
          const result = await linkWithPopup(current, provider);
          const linked = await finalizeGoogleUser(result.user, syncProfile);
          setUser(linked);
          return;
        } catch (err: unknown) {
          const code =
            err && typeof err === "object" && "code" in err
              ? String((err as { code: string }).code)
              : "";
          if (
            code === "auth/credential-already-in-use" ||
            code === "auth/email-already-in-use"
          ) {
            const result = await signInWithPopup(auth, provider);
            const linked = await finalizeGoogleUser(result.user, syncProfile);
            setUser(linked);
            return;
          }
          if (
            code === "auth/popup-blocked" ||
            code === "auth/popup-closed-by-user" ||
            code === "auth/cancelled-popup-request"
          ) {
            await startGoogleRedirect(true);
            return;
          }
          throw err;
        }
      }

      const result = await signInWithPopup(auth, provider);
      const linked = await finalizeGoogleUser(result.user, syncProfile);
      setUser(linked);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        await startGoogleRedirect(Boolean(current?.isAnonymous));
        return;
      }
      throw err;
    }
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
