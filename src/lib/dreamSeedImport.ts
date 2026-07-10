import { Timestamp } from "firebase/firestore";
import {
  ADMIN_SEED_USER_ID,
  buildSeedInterpretation,
  type DreamSpreadsheetRow,
  parseEmotions,
  parseOutcome,
} from "@admin/lib/dreamSpreadsheetSchema";

/** Admin 시드 업로드 — Firestore dreams 문서 페이로드 (프로필 열까지) */
export function rowToFirestorePayload(row: DreamSpreadsheetRow) {
  const now = new Date();
  const hasFollowUp = row.afterStory.trim().length > 0;
  const emotions = parseEmotions(row.emotions);
  const interpretation = buildSeedInterpretation(row);
  const outcome = parseOutcome(row.outcomeCategory);
  const profile = row.profile.trim();

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
    isPublic: true,
    ...(profile ? { seedProfile: profile } : {}),
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

/** Netlify Function — Admin SDK용 plain JSON (Timestamp 직렬화) */
export function rowToAdminImportPayload(row: DreamSpreadsheetRow) {
  const payload = rowToFirestorePayload(row);
  const toMillis = (ts: Timestamp) => ts.toMillis();

  return {
    ...payload,
    createdAt: toMillis(payload.createdAt),
    followUpDueAt: toMillis(payload.followUpDueAt),
    ...(payload.followUp
      ? {
          followUp: {
            ...payload.followUp,
            answeredAt: toMillis(payload.followUp.answeredAt),
          },
        }
      : {}),
  };
}
