import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Dream } from "@/types";
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

function dreamToRow(d: Dream & { seedProfile?: string }): DreamSpreadsheetRow {
  const anchor = d.interpretation?.researchAnchor?.primary ?? "";
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    keywords: (d.interpretation?.keywords ?? []).join(","),
    anchor,
    emotions: (d.emotions ?? []).join(","),
    outcomeCategory: d.followUp
      ? outcomeLabel(d.followUp.outcomeCategory)
      : "",
    afterStory: d.followUp?.note ?? "",
    profile: d.seedProfile ?? "",
    isPublic: d.isPublic !== false ? "Y" : "N",
    createdAt: d.createdAt.toLocaleDateString("ko-KR"),
  };
}

export async function fetchDreamSpreadsheetRows(): Promise<DreamSpreadsheetRow[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "dreams"), orderBy("createdAt", "desc"), limit(QUERY_LIMIT)),
  );

  return snap.docs.map((d) => {
    const data = d.data();
    const dream: Dream & { seedProfile?: string } = {
      id: d.id,
      userId: data.userId,
      title: data.title ?? "",
      content: data.content,
      emotions: data.emotions ?? [],
      interpretation: data.interpretation,
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
      seedProfile: data.seedProfile as string | undefined,
    };
    return dreamToRow(dream);
  });
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
    followUpReminderSent: hasFollowUp,
    isPublic: parseIsPublic(row.isPublic),
    likes: 0,
    seedProfile: row.profile.trim() || null,
    seedSource: "admin-import",
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

export async function updateSpreadsheetRow(
  row: DreamSpreadsheetRow,
  adminUid: string,
): Promise<void> {
  if (!db || !row.id) throw new Error("ID 없음");
  await setDoc(doc(db, "dreams", row.id), rowToFirestorePayload(row, adminUid), {
    merge: false,
  });
}

export async function deleteSpreadsheetRow(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "dreams", id));
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
