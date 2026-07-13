import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  type DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { ANONYMOUS_STORY_PROFILE } from "@/lib/coherentCommunityStory";
import { normalizePercents } from "@/lib/formatText";
import { isStrictlySimilarDream } from "@/lib/similarDreamMatch";
import {
  MATCH_THRESHOLD,
  collectDreamTags,
  scoreDreamMatch,
  type DreamMatchScore,
} from "@/lib/dreamMatch";
import type { CommunityStory, SimilarDreamSummary } from "@/types";
import type {
  Dream,
  DreamEmotionId,
  DreamFollowUp,
  DreamInterpretation,
  DreamStats,
  OutcomeCategory,
  UserProfile,
} from "@/types";
import { getFollowUpDueDate } from "@/lib/followUpTiming";
import { MIN_REAL_COMMUNITY_COUNT, normalizeOutcomeCategory, OUTCOME_CATEGORIES } from "@/types";

const DREAMS = "dreams";
const USERS = "users";

/** Firestore 읽기 비용 절감 — 유사 꿈 검색 상한 */
const SIMILAR_DREAM_QUERY_LIMIT = 30;
const POPULAR_KEYWORD_QUERY_LIMIT = 500;

function dreamFromDoc(id: string, data: DocumentData): Dream {
  return {
    id,
    userId: data.userId,
    title: data.title ?? "",
    content: data.content,
    emotions: data.emotions ?? [],
    interpretation: data.interpretation,
    embedding: data.embedding,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    followUpDueAt: data.followUpDueAt?.toDate() ?? new Date(),
    followUp: data.followUp
      ? {
          ...data.followUp,
          outcomeCategory: normalizeOutcomeCategory(data.followUp.outcomeCategory),
          answeredAt: data.followUp.answeredAt?.toDate() ?? new Date(),
        }
      : undefined,
    isPublic: data.isPublic ?? true,
    likes: data.likes ?? 0,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    displayName: data.displayName ?? null,
    email: data.email ?? null,
    isPremium: data.isPremium ?? false,
    isAnonymous: data.isAnonymous ?? false,
    fcmTokens: data.fcmTokens ?? [],
    gender: data.gender,
    ageRange: data.ageRange,
    country: data.country,
    role: data.role === "admin" ? "admin" : "user",
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export async function upsertUserProfile(
  uid: string,
  profile: Partial<UserProfile>,
): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, USERS, uid),
    { ...profile, updatedAt: Timestamp.now() },
    { merge: true },
  );
}

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, USERS, uid), {
    fcmTokens: arrayUnion(token),
  });
}

export async function saveDream(
  userId: string,
  title: string,
  content: string,
  emotions: DreamEmotionId[],
  interpretation: DreamInterpretation,
  embedding: number[] = [],
): Promise<string> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");

  const dreamRef = doc(collection(db, DREAMS));
  const now = new Date();

  await setDoc(dreamRef, {
    userId,
    title,
    content,
    emotions,
    interpretation,
    // 256d 축소 임베딩만 저장 — 유사 꿈 코사인 재정렬용 (문서 크기 ~2KB)
    ...(embedding.length > 0 ? { embedding } : {}),
    createdAt: Timestamp.fromDate(now),
    followUpDueAt: Timestamp.fromDate(getFollowUpDueDate(now)),
    followUpReminderSent: false,
    isPublic: true,
    likes: 0,
    keywords: interpretation.keywords,
    category: interpretation.category,
  });

  return dreamRef.id;
}

export async function getDream(dreamId: string): Promise<Dream | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, DREAMS, dreamId));
  if (!snap.exists()) return null;
  return dreamFromDoc(snap.id, snap.data());
}

export async function getUserDreams(userId: string): Promise<Dream[]> {
  if (!db) return [];

  const mapDocs = (docs: { id: string; data: () => DocumentData }[]) =>
    docs.map((d) => dreamFromDoc(d.id, d.data()));

  try {
    const q = query(
      collection(db, DREAMS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const snap = await getDocs(q);
    return mapDocs(snap.docs);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code !== "failed-precondition") throw err;

    console.warn(
      "[dreams] 복합 인덱스 대기 중 — userId만 조회 후 클라이언트 정렬 (firebase deploy --only firestore:indexes)",
    );
    const fallback = query(
      collection(db, DREAMS),
      where("userId", "==", userId),
      limit(50),
    );
    const snap = await getDocs(fallback);
    return mapDocs(snap.docs).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

export async function submitFollowUp(
  dreamId: string,
  followUp: Omit<DreamFollowUp, "answeredAt">,
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  await updateDoc(doc(db, DREAMS, dreamId), {
    followUp: { ...followUp, answeredAt: Timestamp.now() },
  });
}

export async function updateDreamInterpretation(
  dreamId: string,
  interpretation: DreamInterpretation,
): Promise<void> {
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");
  await updateDoc(doc(db, DREAMS, dreamId), {
    interpretation,
    keywords: interpretation.keywords,
    category: interpretation.category,
    reinterpretedAt: Timestamp.now(),
  });
}

/** 공개 꿈 DB에서 키워드 빈도 집계 — 홈 칩 등 */
export async function fetchPopularDreamKeywords(topPool = 48): Promise<string[]> {
  if (!db || !isFirebaseConfigured) return [];

  try {
    const snap = await getDocs(
      query(
        collection(db, DREAMS),
        where("isPublic", "==", true),
        limit(POPULAR_KEYWORD_QUERY_LIMIT),
      ),
    );

    const counts: Record<string, number> = {};
    for (const dreamDoc of snap.docs) {
      const data = dreamDoc.data();
      const fromTop = Array.isArray(data.keywords) ? data.keywords : [];
      const fromInterp = Array.isArray(data.interpretation?.keywords)
        ? data.interpretation.keywords
        : [];
      const merged = [...fromTop, ...fromInterp];
      const seen = new Set<string>();
      for (const raw of merged) {
        if (typeof raw !== "string") continue;
        const kw = raw.trim();
        if (kw.length < 2 || seen.has(kw)) continue;
        seen.add(kw);
        counts[kw] = (counts[kw] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topPool)
      .map(([keyword]) => keyword);
  } catch {
    return [];
  }
}

export interface ScoredDream {
  dream: Dream;
  score: DreamMatchScore;
}

export async function findSimilarDreams(
  queryEmbedding: number[] | undefined,
  keywords: string[],
  category: string,
  queryTags?: string[],
  queryEmotions?: DreamEmotionId[],
): Promise<Dream[]> {
  const scored = await findScoredSimilarDreams(
    queryEmbedding,
    keywords,
    category,
    queryTags,
    queryEmotions,
  );
  return scored.map((s) => s.dream);
}

/**
 * 후보(키워드·카테고리)로 좁힌 뒤 벡터+태그+감정 점수로 재정렬.
 * MATCH_THRESHOLD(70점) 미만은 제외한다. 각 결과에 매칭 점수를 함께 반환.
 */
export async function findScoredSimilarDreams(
  queryEmbedding: number[] | undefined,
  keywords: string[],
  category: string,
  queryTags?: string[],
  queryEmotions?: DreamEmotionId[],
): Promise<ScoredDream[]> {
  if (!db) return [];
  const firestore = db;

  const primaryKeyword = keywords.find((k) => k.length >= 2);
  const seen = new Set<string>();
  const dreams: Dream[] = [];

  const addDocs = (docs: { id: string; data: () => DocumentData }[]) => {
    for (const d of docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      dreams.push(dreamFromDoc(d.id, d.data()));
      if (dreams.length >= SIMILAR_DREAM_QUERY_LIMIT) return true;
    }
    return false;
  };

  const runQuery = async () => {
    if (primaryKeyword) {
      const kwQuery = query(
        collection(firestore, DREAMS),
        where("isPublic", "==", true),
        where("keywords", "array-contains", primaryKeyword),
        orderBy("createdAt", "desc"),
        limit(SIMILAR_DREAM_QUERY_LIMIT),
      );
      const kwSnap = await getDocs(kwQuery);
      if (addDocs(kwSnap.docs)) return;
    }

    if (dreams.length < MIN_REAL_COMMUNITY_COUNT && category) {
      const catQuery = query(
        collection(firestore, DREAMS),
        where("isPublic", "==", true),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(SIMILAR_DREAM_QUERY_LIMIT),
      );
      const catSnap = await getDocs(catQuery);
      addDocs(catSnap.docs);
    }
  };

  try {
    await Promise.race([
      runQuery(),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), 4000);
      }),
    ]);
  } catch {
    return [];
  }

  if (dreams.length === 0 && keywords.length === 0) return [];

  const tags = queryTags && queryTags.length > 0 ? queryTags : keywords;
  const queryInput = {
    embedding: queryEmbedding,
    tags,
    emotions: queryEmotions ?? [],
  };

  return dreams
    .filter((dream) =>
      isStrictlySimilarDream(
        dream.interpretation.keywords,
        dream.interpretation.category,
        keywords,
        category,
      ),
    )
    .map((dream) => ({
      dream,
      score: scoreDreamMatch(queryInput, {
        embedding: dream.embedding,
        tags: collectDreamTags(dream.interpretation),
        emotions: dream.emotions,
      }),
    }))
    .filter((s) => s.score.total >= MATCH_THRESHOLD)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, SIMILAR_DREAM_QUERY_LIMIT);
}

export function buildSimilarDreamSummary(
  dreams: Dream[],
  category: string,
): SimilarDreamSummary {
  const keywordCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  for (const dream of dreams) {
    for (const kw of dream.interpretation.keywords) {
      keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
    }
    for (const em of dream.emotions) {
      emotionCounts[em] = (emotionCounts[em] ?? 0) + 1;
    }
  }

  const keywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);

  const emotionList = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion: emotion as DreamEmotionId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const samples = dreams.slice(0, 5).map((d) => ({
    title:
      d.title ||
      (d.content.length > 40 ? `${d.content.slice(0, 40)}...` : d.content),
    snippet:
      d.content.length > 80 ? `${d.content.slice(0, 80)}...` : d.content,
    emotions: d.emotions,
  }));

  const stories: CommunityStory[] = dreams
    .filter((d) => d.followUp)
    .slice(0, 8)
    .map((d) => dreamToStory(d));

  return {
    totalCount: dreams.length,
    keywords,
    category,
    emotionCounts: emotionList,
    samples,
    stories,
    withFollowUpCount: dreams.filter((d) => d.followUp).length,
    isEstimated: false,
  };
}

function dreamToStory(dream: Dream): CommunityStory {
  const followUp = dream.followUp!;
  const daysAgo = Math.max(
    1,
    Math.ceil(
      (Date.now() - followUp.answeredAt.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return {
    id: dream.id,
    dreamTitle:
      dream.title ||
      (dream.content.length > 36
        ? `${dream.content.slice(0, 36)}...`
        : dream.content),
    dreamSnippet:
      dream.content.length > 100
        ? `${dream.content.slice(0, 100)}...`
        : dream.content,
    emotions: dream.emotions,
    outcomeCategory: followUp.outcomeCategory,
    afterStory: followUp.note,
    recordedDaysAgo: daysAgo,
    profile: ANONYMOUS_STORY_PROFILE,
  };
}

export function computeStats(dreams: Dream[]): DreamStats {
  const totalDreams = dreams.length;
  const withFollowUp = dreams.filter((d) => d.followUp);
  const totalWithFollowUp = withFollowUp.length;
  const survivalRate =
    totalDreams > 0 ? Math.round((totalWithFollowUp / totalDreams) * 100) : 0;

  const outcomes = Object.keys(OUTCOME_CATEGORIES).reduce(
    (acc, key) => {
      acc[key as OutcomeCategory] = 0;
      return acc;
    },
    {} as Record<OutcomeCategory, number>,
  );

  const emotionCounts: Record<string, number> = {};

  for (const dream of withFollowUp) {
    if (!dream.followUp) continue;
    outcomes[normalizeOutcomeCategory(dream.followUp.outcomeCategory)]++;
    for (const emotion of dream.followUp.emotions) {
      emotionCounts[emotion] = (emotionCounts[emotion] ?? 0) + 1;
    }
  }

  const topEmotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalDreams,
    totalWithFollowUp,
    survivalRate,
    outcomes,
    topEmotions,
  };
}

export function getOutcomePercentages(
  stats: DreamStats,
): { category: OutcomeCategory; label: string; percent: number }[] {
  if (stats.totalWithFollowUp === 0) return [];

  const raw = (Object.keys(OUTCOME_CATEGORIES) as OutcomeCategory[])
    .map((category) => ({
      category,
      label: OUTCOME_CATEGORIES[category],
      percent: Math.round(
        (stats.outcomes[category] / stats.totalWithFollowUp) * 100,
      ),
    }))
    .filter((item) => item.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  return normalizePercents(raw);
}

export { isFirebaseConfigured };
