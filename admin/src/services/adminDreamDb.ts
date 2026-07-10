import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import {
  ADMIN_SEED_USER_ID,
  buildSeedInterpretation,
  type DreamSpreadsheetRow,
  outcomeLabel,
  parseEmotions,
  parseIsPublic,
  parseOutcome,
} from "@admin/lib/dreamSpreadsheetSchema";

const QUERY_LIMIT = 500;
const BATCH_SIZE = 20;

function tsToDate(value: { toDate?: () => Date } | undefined): Date | null {
  return value?.toDate?.() ?? null;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function joinList(value: unknown, sep = ", "): string {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(sep);
  if (typeof value === "string") return value;
  return "";
}

function yn(value: unknown): string {
  if (value === true) return "Y";
  if (value === false) return "N";
  return "";
}

function resolveSource(data: Record<string, unknown>, userId: string): string {
  const seedSource = typeof data.seedSource === "string" ? data.seedSource : "";
  if (seedSource) return seedSource;
  if (userId === ADMIN_SEED_USER_ID) return "seed";
  return "user";
}

function profileFromUser(user: UserProfile | undefined, seedProfile?: string): string {
  if (seedProfile?.trim()) return seedProfile.trim();
  if (!user) return "";
  const parts = [
    user.isAnonymous ? "익명" : (user.displayName ?? "회원"),
    user.ageRange,
    user.country,
  ].filter(Boolean);
  return parts.join(" · ");
}

function dreamDocToRow(
  docId: string,
  data: Record<string, unknown>,
  user?: UserProfile,
): DreamSpreadsheetRow {
  const interp = (data.interpretation ?? {}) as Record<string, unknown>;
  const anchorObj = (interp.researchAnchor ?? {}) as Record<string, unknown>;
  const mood = (interp.mood ?? {}) as Record<string, unknown>;
  const lab = (interp.labObservations ?? {}) as Record<string, unknown>;
  const followUp = (data.followUp ?? {}) as Record<string, unknown>;
  const userId = String(data.userId ?? "");
  const seedProfile = typeof data.seedProfile === "string" ? data.seedProfile : "";

  const rootKeywords = joinList(data.keywords);
  const interpKeywords = joinList(interp.keywords);

  return {
    id: docId,
    docId,
    createdAt: formatDate(tsToDate(data.createdAt as { toDate?: () => Date })),
    source: resolveSource(data, userId),
    userId,
    userEmail: user?.email ?? (user?.isAnonymous ? "(익명)" : ""),
    title: String(data.title ?? ""),
    content: String(data.content ?? ""),
    emotions: joinList(data.emotions),
    category: String(data.category ?? interp.category ?? ""),
    keywords: rootKeywords || interpKeywords,
    anchor: String(anchorObj.primary ?? ""),
    clusterLabel: String(anchorObj.clusterLabel ?? ""),
    secondaryAnchors: joinList(anchorObj.secondary, " | "),
    scenePhrases: joinList(anchorObj.scenePhrases, " | "),
    usualTake: String(interp.usualTake ?? ""),
    alternativeLens: String(interp.alternativeLens ?? ""),
    symbol: String(interp.symbol ?? ""),
    psychology: String(interp.psychology ?? ""),
    reflection: String(interp.reflection ?? ""),
    moodAnxiety: mood.anxiety != null ? String(mood.anxiety) : "",
    moodHope: mood.hope != null ? String(mood.hope) : "",
    moodLonging: mood.longing != null ? String(mood.longing) : "",
    labSceneNote: String(lab.sceneNote ?? ""),
    labBehaviors: joinList(lab.commonBehaviors, " | "),
    labRelatedSearches: joinList(lab.relatedSearches, ", "),
    followUpDueAt: formatDate(tsToDate(data.followUpDueAt as { toDate?: () => Date })),
    followUpReminderSent: yn(data.followUpReminderSent),
    outcomeCategory:
      followUp.outcomeCategory != null
        ? outcomeLabel(followUp.outcomeCategory as Parameters<typeof outcomeLabel>[0])
        : "",
    afterStory: String(followUp.note ?? ""),
    followUpAnsweredAt: formatDate(
      tsToDate(followUp.answeredAt as { toDate?: () => Date } | undefined),
    ),
    followUpEmotions: joinList(followUp.emotions),
    profile: profileFromUser(user, seedProfile),
    seedProfile,
    likes: String(data.likes ?? 0),
    isPublic: data.isPublic === false ? "N" : "Y",
    seedSource: typeof data.seedSource === "string" ? data.seedSource : "",
    importedBy: typeof data.importedBy === "string" ? data.importedBy : "",
    importedAt: formatDate(tsToDate(data.importedAt as { toDate?: () => Date })),
  };
}

async function fetchUserLookup(): Promise<Map<string, UserProfile>> {
  if (!db) return new Map();
  const snap = await getDocs(query(collection(db, "users"), limit(QUERY_LIMIT)));
  const map = new Map<string, UserProfile>();
  for (const d of snap.docs) {
    const data = d.data();
    map.set(d.id, {
      uid: d.id,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      isPremium: data.isPremium ?? false,
      isAnonymous: data.isAnonymous ?? false,
      fcmTokens: data.fcmTokens ?? [],
      gender: data.gender,
      ageRange: data.ageRange,
      country: data.country,
      role: data.role === "admin" ? "admin" : "user",
      createdAt: tsToDate(data.createdAt) ?? new Date(),
    });
  }
  return map;
}

export async function fetchDreamSpreadsheetRows(): Promise<DreamSpreadsheetRow[]> {
  if (!db) return [];

  const [snap, users] = await Promise.all([
    getDocs(query(collection(db, "dreams"), orderBy("createdAt", "desc"), limit(QUERY_LIMIT))),
    fetchUserLookup(),
  ]);

  return snap.docs.map((d) => dreamDocToRow(d.id, d.data(), users.get(String(d.data().userId ?? ""))));
}

function rowToFirestorePayload(row: DreamSpreadsheetRow, adminUid: string) {
  const now = new Date();
  const hasFollowUp = row.afterStory.trim().length > 0;
  const emotions = parseEmotions(row.emotions);
  const interpretation = buildSeedInterpretation(row);
  const outcome = parseOutcome(row.outcomeCategory);

  return {
    userId: ADMIN_SEED_USER_ID,
    title: row.title.trim() || row.content.slice(0, 40),
    content: row.content.trim(),
    emotions,
    interpretation,
    keywords: interpretation.keywords,
    category: interpretation.category,
    createdAt: Timestamp.fromDate(now),
    followUpDueAt: Timestamp.fromDate(
      hasFollowUp ? new Date(now.getTime() - 86_400_000) : new Date(now.getTime() + 30 * 86_400_000),
    ),
    followUpReminderSent: row.followUpReminderSent === "Y" || hasFollowUp,
    isPublic: parseIsPublic(row.isPublic),
    likes: Number.parseInt(row.likes, 10) || 0,
    seedProfile: row.seedProfile.trim() || row.profile.trim() || null,
    seedSource: row.seedSource.trim() || "admin-import",
    importedBy: adminUid,
    importedAt: Timestamp.now(),
    ...(hasFollowUp
      ? {
          followUp: {
            outcomeCategory: outcome,
            note: row.afterStory.trim(),
            emotions: ["calm" as const],
            answeredAt: Timestamp.now(),
          },
        }
      : {}),
  };
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export async function importSpreadsheetRows(
  rows: DreamSpreadsheetRow[],
  adminUid: string,
): Promise<ImportResult> {
  if (!db) throw new Error("Firebase 미설정");

  const valid = rows.filter((r) => r.content.trim().length >= 8);
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const chunk = valid.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const row of chunk) {
      if (row._errors?.length) {
        failed += 1;
        errors.push(...row._errors);
        continue;
      }
      try {
        const ref = doc(collection(db, "dreams"));
        batch.set(ref, rowToFirestorePayload(row, adminUid));
        imported += 1;
      } catch (e) {
        failed += 1;
        errors.push(e instanceof Error ? e.message : "저장 실패");
      }
    }

    await batch.commit();
  }

  return { imported, failed, errors };
}

export async function deleteSpreadsheetRows(ids: string[]): Promise<number> {
  if (!db || ids.length === 0) return 0;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = ids.slice(i, i + BATCH_SIZE);
    for (const id of chunk) {
      batch.delete(doc(db, "dreams", id));
      deleted += 1;
    }
    await batch.commit();
  }
  return deleted;
}

export function countRowsBySource(rows: DreamSpreadsheetRow[]): {
  total: number;
  user: number;
  seed: number;
} {
  let user = 0;
  let seed = 0;
  for (const row of rows) {
    if (row.source === "user") user += 1;
    else seed += 1;
  }
  return { total: rows.length, user, seed };
}
