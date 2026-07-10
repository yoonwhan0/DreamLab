/** 회원 — 키워드당 무료 후기 열람 */
export const MEMBER_FREE_STORY_VIEWS = 2;

/** 유료 추가 열람 1건당 (원) */
export const STORY_PAID_UNLOCK_PRICE_WON = 200;

/** 프리미엄 — 검색 직후 집중 노출 */
export const PREMIUM_INITIAL_STORY_VIEWS = 2;

/** 무료·유료 구간 모두 1건씩 (주제 집중) */
export const STORY_LOAD_CHUNK_FREE = 1;
export const STORY_LOAD_CHUNK_PAID = 1;

export function keywordAccessKey(keyword: string): string {
  const k = keyword.trim().toLowerCase().replace(/\s+/g, "-");
  return k.slice(0, 80) || "dream";
}

/** 회원(비프리미엄) — 볼 수 있는 후기 상한 */
export function maxStorySlots(freeCap: number, paidUnlockCount: number): number {
  return freeCap + Math.max(0, paidUnlockCount);
}

export function storyLoadChunk(_visibleCount: number): number {
  return STORY_LOAD_CHUNK_FREE;
}

/** 검색 직후 첫 노출 건수 */
export function initialStoryVisibleCount(
  isPremium: boolean,
  restoredCount: number,
): number {
  if (restoredCount > 0) return restoredCount;
  return isPremium ? PREMIUM_INITIAL_STORY_VIEWS : 1;
}
