/** 회원 — 키워드당 무료 후기 열람 */
export const MEMBER_FREE_STORY_VIEWS = 4;

/** 무료 구간 — 2건씩 / 유료 구간 — 1건씩 */
export const STORY_LOAD_CHUNK_FREE = 2;
export const STORY_LOAD_CHUNK_PAID = 1;

export function keywordAccessKey(keyword: string): string {
  const k = keyword.trim().toLowerCase().replace(/\s+/g, "-");
  return k.slice(0, 80) || "dream";
}

/** 회원(비프리미엄) — 볼 수 있는 후기 상한 */
export function maxStorySlots(freeCap: number, paidUnlockCount: number): number {
  return freeCap + Math.max(0, paidUnlockCount);
}

export function storyLoadChunk(visibleCount: number): number {
  return visibleCount >= MEMBER_FREE_STORY_VIEWS
    ? STORY_LOAD_CHUNK_PAID
    : STORY_LOAD_CHUNK_FREE;
}
