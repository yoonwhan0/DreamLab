import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

export const MEMBER_FREE_STORY_VIEWS = 2;

function keywordAccessKey(keyword: string): string {
  const k = keyword.trim().toLowerCase().replace(/\s+/g, "-");
  return k.slice(0, 80) || "dream";
}

export { keywordAccessKey };

export interface StoryKeywordAccessDoc {
  keyword: string;
  paidUnlockCount: number;
  viewedStoryIds: string[];
  aiBlocked: boolean;
  updatedAt: Timestamp;
}

export function unlockDocRef(db: Firestore, uid: string, keyword: string) {
  const key = keywordAccessKey(keyword);
  return db.collection("users").doc(uid).collection("story_unlocks").doc(key);
}

export async function getStoryAccess(
  db: Firestore,
  uid: string,
  keyword: string,
): Promise<{
  keyword: string;
  paidUnlockCount: number;
  viewedStoryIds: string[];
  aiBlocked: boolean;
  maxSlots: number;
}> {
  const snap = await unlockDocRef(db, uid, keyword).get();
  const data = snap.data() as StoryKeywordAccessDoc | undefined;
  const paidUnlockCount = data?.paidUnlockCount ?? 0;
  return {
    keyword: keyword.trim(),
    paidUnlockCount,
    viewedStoryIds: data?.viewedStoryIds ?? [],
    aiBlocked: data?.aiBlocked ?? false,
    maxSlots: MEMBER_FREE_STORY_VIEWS + paidUnlockCount,
  };
}

export async function registerStoryViews(
  db: Firestore,
  uid: string,
  keyword: string,
  storyIds: string[],
): Promise<{ ok: boolean; reason?: string; access: Awaited<ReturnType<typeof getStoryAccess>> }> {
  const access = await getStoryAccess(db, uid, keyword);
  const unique = [...new Set([...access.viewedStoryIds, ...storyIds])];
  const maxSlots = access.maxSlots;

  if (unique.length > maxSlots) {
    return { ok: false, reason: "PAYMENT_REQUIRED", access };
  }

  const aiBlocked = unique.length >= MEMBER_FREE_STORY_VIEWS || access.aiBlocked;

  await unlockDocRef(db, uid, keyword).set(
    {
      keyword: keyword.trim(),
      paidUnlockCount: access.paidUnlockCount,
      viewedStoryIds: unique,
      aiBlocked,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ok: true,
    access: {
      ...access,
      viewedStoryIds: unique,
      aiBlocked,
    },
  };
}

export async function grantPaidStoryUnlock(
  db: Firestore,
  uid: string,
  keyword: string,
  orderId: string,
): Promise<{ paidUnlockCount: number; maxSlots: number }> {
  const ref = unlockDocRef(db, uid, keyword);
  const snap = await ref.get();
  const data = snap.data() as StoryKeywordAccessDoc | undefined;
  const nextPaid = (data?.paidUnlockCount ?? 0) + 1;

  await ref.set(
    {
      keyword: keyword.trim(),
      paidUnlockCount: nextPaid,
      viewedStoryIds: data?.viewedStoryIds ?? [],
      aiBlocked: true,
      lastOrderId: orderId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    paidUnlockCount: nextPaid,
    maxSlots: MEMBER_FREE_STORY_VIEWS + nextPaid,
  };
}
