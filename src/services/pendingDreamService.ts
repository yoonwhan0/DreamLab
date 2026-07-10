import {
  clearPendingDream,
  getPendingDreamRaw,
} from "@/lib/pendingDreamStorage";
import { saveDream } from "@/services/dreamService";
import type { DreamEmotionId, DreamInterpretation } from "@/types";

export interface PendingDreamPayload {
  title?: string;
  content: string;
  emotions?: DreamEmotionId[];
  interpretation: DreamInterpretation;
  embedding?: number[];
}

export function parsePendingDreamRaw(raw: string): PendingDreamPayload | null {
  try {
    const data = JSON.parse(raw) as PendingDreamPayload;
    if (!data?.content || !data?.interpretation) return null;
    return data;
  } catch {
    return null;
  }
}

/** localStorage 미저장 꿈 → 회원 계정 Firestore 저장 */
export async function flushPendingDream(userId: string): Promise<string | null> {
  const raw = getPendingDreamRaw();
  if (!raw) return null;

  const data = parsePendingDreamRaw(raw);
  if (!data) {
    clearPendingDream();
    return null;
  }

  const dreamId = await saveDream(
    userId,
    data.title ?? "",
    data.content,
    data.emotions ?? [],
    data.interpretation,
    data.embedding ?? [],
  );
  clearPendingDream();
  return dreamId;
}
