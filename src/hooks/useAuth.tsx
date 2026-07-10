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
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  clearAuthRedirectPending,
  isAuthRedirectPending,
  isInAppBrowser,
  startGoogleRedirect,
} from "@/lib/authPlatform";
import { getAuthRedirectResult, resetAuthRedirectResult } from "@/lib/authRedirectBootstrap";
import { isLinkedAuthUser } from "@/lib/authUser";
import { isMasterAccountEmail } from "@/lib/masterAccounts";
import { getUserProfile, upsertUserProfile } from "@/services/dreamService";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
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
  return refreshed;
}

async function clearLegacyAnonymousSession(): Promise<void> {
  if (!auth?.currentUser?.isAnonymous) return;
  await signOut(auth);
}

async function handleRedirectSignIn(
  syncProfile: (u: User) => Promise<void>,
): Promise<{ user: User | null; error: string | null }> {
  if (!auth) return { user: null, error: null };

  const hadPendingRedirect = isAuthRedirectPending();

  try {
    const redirectResult = await getAuthRedirectResult();

    if (redirectResult?.user) {
      clearAuthRedirectPending();
      const linked = await finalizeGoogleUser(redirectResult.user, syncProfile);
      return { user: linked, error: null };
    }

    const current = auth.currentUser;
    if (current && isLinkedAuthUser(current)) {
      clearAuthRedirectPending();
      return { user: await finalizeGoogleUser(current, syncProfile), error: null };
    }

    // redirect 시도했는데 세션 없음 — stale pending 정리 (PC·모바일 공통)
    if (hadPendingRedirect) {
      clearAuthRedirectPending();
      resetAuthRedirectResult();
      return { user: null, error: null };
    }

    clearAuthRedirectPending();
    await clearLegacyAnonymousSession();
    return { user: auth.currentUser, error: null };
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
        const linked = await finalizeGoogleUser(result.user, syncProfile);
        return { user: linked, error: null };
      }
    }

    console.error("Google redirect sign-in failed:", err);
    await clearLegacyAnonymousSession();
    return {
      user: null,
      error: "Google 로그인에 실패했습니다. Firebase 승인 도메인을 확인해 주세요.",
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncProfile = useCallback(async (firebaseUser: User) => {
    if (!isLinkedAuthUser(firebaseUser)) return;

    const masterPremium = isMasterAccountEmail(firebaseUser.email);
    const masterAdmin = masterPremium;
    const existing = await getUserProfile(firebaseUser.uid);

    if (existing) {
      const nextPremium = existing.isPremium || masterPremium;
      const needsRoleSync = masterAdmin && existing.role !== "admin";

      if (
        existing.isAnonymous ||
        (masterPremium && !existing.isPremium) ||
        needsRoleSync ||
        existing.email !== firebaseUser.email
      ) {
        await upsertUserProfile(firebaseUser.uid, {
          isAnonymous: false,
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
        isAnonymous: false,
        isPremium: nextPremium,
        role: masterAdmin ? "admin" : existing.role,
      });
      return;
    }

    const profileData: Partial<UserProfile> = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      isAnonymous: false,
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
      isAnonymous: false,
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
      const { user: redirectUser, error } = await handleRedirectSignIn(syncProfile);
      if (!mounted) return;

      if (error) setAuthError(error);
      if (redirectUser && isLinkedAuthUser(redirectUser)) {
        setUser(redirectUser);
        setLoading(false);
      }

      unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (!mounted) return;

        if (firebaseUser?.isAnonymous) {
          await clearLegacyAnonymousSession();
          if (!mounted) return;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (firebaseUser && isLinkedAuthUser(firebaseUser)) {
          clearAuthRedirectPending();
          const refreshed = await reloadAuthUser(firebaseUser);
          setUser(refreshed);
          await syncProfile(refreshed);
          setLoading(false);
          return;
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

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    clearAuthRedirectPending();
    resetAuthRedirectResult();
    setAuthError(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    if (auth.currentUser?.isAnonymous) {
      await signOut(auth);
    }

    try {
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
        if (isInAppBrowser()) {
          const msg =
            "카카오톡·인스타 등 앱 안 브라우저에서는 Google 로그인이 막히는 경우가 많아요. Safari·Chrome에서 이 사이트를 열어 주세요.";
          setAuthError(msg);
          throw new Error(msg);
        }
        await startGoogleRedirect();
        return;
      }
      setAuthError("Google 로그인에 실패했습니다. 다시 시도해 주세요.");
      throw err;
    }
  }, [syncProfile]);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getUserProfile(user.uid));
  }, [user]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isConfigured: isFirebaseConfigured,
      authError,
      signInGoogle,
      logout,
      refreshProfile,
      clearAuthError,
    }),
    [
      user,
      profile,
      loading,
      authError,
      signInGoogle,
      logout,
      refreshProfile,
      clearAuthError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
