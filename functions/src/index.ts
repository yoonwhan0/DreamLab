import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

initializeApp();

const db = getFirestore();
const REMINDER_BATCH_LIMIT = 100;

/**
 * 매일 1회(KST 자정) — followUpDueAt 지난 꿈에 푸시 1회만 발송
 * - followUpReminderSent 로 중복 발송 방지 (기존 문서는 필드 없으면 1회 발송)
 * - 사용자 문서 batch 조회로 N+1 읽기 제거
 */
export const sendFollowUpReminders = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "Asia/Seoul",
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();

    const dreamsSnap = await db
      .collection("dreams")
      .where("followUpDueAt", "<=", now)
      .where("followUp", "==", null)
      .limit(REMINDER_BATCH_LIMIT)
      .get();

    if (dreamsSnap.empty) return;

    const pendingDocs = dreamsSnap.docs.filter(
      (d) => d.data().followUpReminderSent !== true,
    );
    if (pendingDocs.length === 0) return;

    const userIds = [
      ...new Set(
        pendingDocs.map((d) => d.data().userId as string).filter(Boolean),
      ),
    ];

    const tokenMap = new Map<string, string[]>();
    const userRefs = userIds.map((id) => db.collection("users").doc(id));
    const userSnaps = userRefs.length > 0 ? await db.getAll(...userRefs) : [];

    for (const snap of userSnaps) {
      if (!snap.exists) continue;
      const data = snap.data();
      if (data?.isAnonymous === true) continue;
      tokenMap.set(snap.id, (data?.fcmTokens as string[]) ?? []);
    }

    for (const dreamDoc of pendingDocs) {
      const dream = dreamDoc.data();
      const userId = dream.userId as string;
      const tokens = tokenMap.get(userId) ?? [];

      if (tokens.length === 0) {
        const userSnap = userSnaps.find((s) => s.id === userId);
        const isAnonymous = userSnap?.data()?.isAnonymous === true;
        if (!isAnonymous) {
          await dreamDoc.ref.update({ followUpReminderSent: true });
        }
        continue;
      }

      const contentPreview = (dream.content as string).slice(0, 30);

      try {
        await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "그 꿈 이후, 어떤 일이 있었나요?",
            body: `"${contentPreview}..." — 1개월이 지났어요. 답변하면 구독 할인!`,
          },
          data: {
            dreamId: dreamDoc.id,
            type: "follow_up",
            url: `/follow-up/${dreamDoc.id}`,
          },
          webpush: {
            fcmOptions: {
              link: `/follow-up/${dreamDoc.id}`,
            },
          },
        });
        await dreamDoc.ref.update({ followUpReminderSent: true });
      } catch (err) {
        console.error("FCM send failed for dream", dreamDoc.id, err);
      }
    }
  },
);

export const onFollowUpSubmitted = onDocumentUpdated(
  "dreams/{dreamId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.followUp || !after.followUp) return;

    const userId = after.userId as string;
    await db.collection("users").doc(userId).set(
      {
        hasFollowUpDiscount: true,
        lastFollowUpAt: Timestamp.now(),
      },
      { merge: true },
    );
  },
);
