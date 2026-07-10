import { useAuth } from "@/hooks/useAuth";

import { useDemo } from "@/demo/DemoProvider";

import { isFirebaseConfigured } from "@/lib/firebase";
import { isLinkedAuthUser } from "@/lib/authUser";
import { isMasterAccountEmail } from "@/lib/masterAccounts";



export type AccessTier = "guest" | "member" | "premium";



export interface AccessPolicy {

  tier: AccessTier;

  isGuest: boolean;

  isMember: boolean;

  isPremium: boolean;

  canInterpret: boolean;

  canSaveDream: boolean;

  canViewSimilarTypes: boolean;

  canViewOutcomeStats: boolean;

  canWriteFollowUp: boolean;

  canExplore: boolean;

}



export function useAccessPolicy(): AccessPolicy & { loading: boolean } {

  const { user, profile, loading } = useAuth();

  const { enabled: demoEnabled, demoTier } = useDemo();



  if (demoEnabled && demoTier) {

    const isGuest = demoTier === "guest";

    const isMember = demoTier === "member" || demoTier === "premium";

    const isPremium = demoTier === "premium";



    return {

      tier: demoTier,

      isGuest,

      isMember,

      isPremium,

      canInterpret: true,

      canSaveDream: Boolean(user) && isFirebaseConfigured,

      canViewSimilarTypes: isMember,

      canViewOutcomeStats: isPremium,

      canWriteFollowUp: isMember,

      canExplore: isMember,

      loading: false,

    };

  }



  const isMember =
    isLinkedAuthUser(user) ||
    Boolean(profile?.email && profile.isAnonymous === false);
  const isGuest = !isMember;

  const isMasterPremium = isMasterAccountEmail(user?.email ?? profile?.email);

  const isPremium = isMasterPremium || (isMember && Boolean(profile?.isPremium));



  let tier: AccessTier = "guest";

  if (isPremium) tier = "premium";

  else if (isMember) tier = "member";



  return {

    tier,

    isGuest,

    isMember,

    isPremium,

    canInterpret: true,

    canSaveDream: Boolean(user) && isFirebaseConfigured,

    canViewSimilarTypes: isMember,

    canViewOutcomeStats: isPremium,

    canWriteFollowUp: isMember,

    canExplore: isMember,

    loading,

  };

}
