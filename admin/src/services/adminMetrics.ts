import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AiUsageDailyDoc, KpiSnapshot } from "@/lib/opsConfig";
import type { Dream, UserProfile } from "@/types";

const QUERY_LIMIT = 500;

function tsToDate(value: Timestamp | undefined): Date | null {
  return value?.toDate() ?? null;
}

function startOfTodayKst(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  return new Date(Date.UTC(y, m, d) - 9 * 60 * 60 * 1000);
}

export async function fetchKpiSnapshot(): Promise<KpiSnapshot | null> {
  if (!db) return null;

  const [usersSnap, dreamsSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), limit(QUERY_LIMIT))),
    getDocs(query(collection(db, "dreams"), orderBy("createdAt", "desc"), limit(QUERY_LIMIT))),
  ]);

  const todayStart = startOfTodayKst();
  const now = new Date();

  let anonymousUsers = 0;
  let premiumUsers = 0;

  usersSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.isAnonymous === true) anonymousUsers += 1;
    if (data.isPremium === true) premiumUsers += 1;
  });

  let dreamsToday = 0;
  let followUpCompleted = 0;
  let followUpPending = 0;
  let followUpDueToday = 0;

  dreamsSnap.docs.forEach((d) => {
    const data = d.data();
    const createdAt = tsToDate(data.createdAt);
    const dueAt = tsToDate(data.followUpDueAt);

    if (createdAt && createdAt >= todayStart) dreamsToday += 1;
    if (data.followUp) {
      followUpCompleted += 1;
    } else if (dueAt && dueAt <= now) {
      followUpPending += 1;
    }
    if (dueAt && dueAt >= todayStart && dueAt <= now) {
      followUpDueToday += 1;
    }
  });

  const totalDreams = dreamsSnap.size;
  const dueOrDone = followUpCompleted + followUpPending;
  const responseRatePercent =
    dueOrDone > 0 ? Math.round((followUpCompleted / dueOrDone) * 1000) / 10 : 0;

  return {
    computedAt: new Date(),
    totalUsers: usersSnap.size,
    anonymousUsers,
    premiumUsers,
    totalDreams,
    dreamsToday,
    followUpCompleted,
    followUpPending,
    followUpDueToday,
    responseRatePercent,
    organicCommunityViews: 0,
    syntheticCommunityViews: 0,
  };
}

export async function fetchMembers(): Promise<UserProfile[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "users"), limit(QUERY_LIMIT)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      isPremium: data.isPremium ?? false,
      isAnonymous: data.isAnonymous ?? false,
      fcmTokens: data.fcmTokens ?? [],
      gender: data.gender,
      ageRange: data.ageRange,
      country: data.country,
      createdAt: tsToDate(data.createdAt) ?? new Date(),
      role: data.role === "admin" ? "admin" : "user",
    };
  });
}

export async function fetchDreams(): Promise<Dream[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "dreams"), orderBy("createdAt", "desc"), limit(QUERY_LIMIT)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      title: data.title ?? "",
      content: data.content,
      emotions: data.emotions ?? [],
      interpretation: data.interpretation,
      embedding: data.embedding,
      createdAt: tsToDate(data.createdAt) ?? new Date(),
      followUpDueAt: tsToDate(data.followUpDueAt) ?? new Date(),
      followUp: data.followUp
        ? {
            ...data.followUp,
            answeredAt: tsToDate(data.followUp.answeredAt) ?? new Date(),
          }
        : undefined,
      isPublic: data.isPublic ?? true,
      likes: data.likes ?? 0,
    };
  });
}

export async function fetchFollowUpQueue(): Promise<Dream[]> {
  const dreams = await fetchDreams();
  const now = new Date();
  return dreams.filter((d) => !d.followUp && d.followUpDueAt <= now);
}

export async function fetchAiUsage(days = 14): Promise<AiUsageDailyDoc[]> {
  if (!db) return [];
  const results: AiUsageDailyDoc[] = [];

  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const snap = await getDoc(doc(db, "ai_usage", key));
    if (!snap.exists()) continue;
    const data = snap.data();
    results.push({
      date: key,
      totalCalls: Number(data.totalCalls ?? 0),
      openaiCalls: Number(data.openaiCalls ?? 0),
      geminiCalls: Number(data.geminiCalls ?? 0),
      fallbackCalls: Number(data.fallbackCalls ?? 0),
      errorCalls: Number(data.errorCalls ?? 0),
      updatedAt: tsToDate(data.updatedAt) ?? undefined,
    });
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchLatestKpiSnapshotDoc(): Promise<KpiSnapshot | null> {
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, "kpi_snapshots"), orderBy("computedAt", "desc"), limit(1)),
  );
  if (snap.empty) return null;
  const data = snap.docs[0]!.data();
  return {
    ...data,
    computedAt: tsToDate(data.computedAt) ?? new Date(),
  } as KpiSnapshot;
}

export async function countDreamsByKeyword(keyword: string): Promise<number> {
  if (!db) return 0;
  const snap = await getDocs(
    query(
      collection(db, "dreams"),
      where("interpretation.keywords", "array-contains", keyword),
      limit(50),
    ),
  );
  return snap.size;
}
