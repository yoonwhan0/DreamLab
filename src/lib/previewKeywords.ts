import { hashSeed } from "@/lib/seededRandom";

/** 호기심·불안을 자극하는 키워드 — 홈·탐색·마이 티저 전용 */
export const PROVOCATIVE_KEYWORDS = [
  "시험",
  "로또",
  "돈",
  "금",
  "전 남친",
  "죽은 사람",
  "불",
  "이별",
  "임신",
  "치아 빠짐",
  "쫓기는 꿈",
  "추락",
  "바람",
  "교통사고",
  "귀신",
  "배신",
  "실직",
  "지진",
  "불륜",
  "암",
] as const;

/** 탐색 인기 검색 — 전부 자극 키워드 */
export const POPULAR_SEARCHES: string[] = [
  "시험",
  "로또",
  "돈",
  "전 남친",
  "죽은 사람",
  "불",
  "이별",
  "임신",
  "치아 빠짐",
  "쫓기는 꿈",
];

/** 홈·탐색 미리보기용 — 일반 풀 (검색 확장용) */
export const PREVIEW_KEYWORD_POOL = [
  ...PROVOCATIVE_KEYWORDS,
  "뱀",
  "비행",
  "엘리베이터",
  "아기",
  "호랑이",
  "결혼",
  "회사",
  "학교",
  "고양이",
  "바다",
  "이사",
  "군대",
  "화장실",
  "집",
  "밥먹는꿈",
  "금니",
  "물에빠지는꿈",
  "치아",
  "죽음",
  "전여친",
  "상사",
  "수능",
  "태몽",
] as const;

function daySeed(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  return hashSeed(`${y}-${m}-${d}-preview`);
}

/** 홈·탐색 키워드 캐러셀 — DB 인기 키워드와 합쳐져 자연스럽게 늘어남 */
export const KEYWORD_RAIL_COUNT = 12;

/** @deprecated use KEYWORD_RAIL_COUNT */
export const HOME_KEYWORD_POOL_SIZE = KEYWORD_RAIL_COUNT;

/** @deprecated */
export const HOME_KEYWORD_VISIBLE_COUNT = KEYWORD_RAIL_COUNT;

/** @deprecated use KEYWORD_RAIL_COUNT */
export const EXPLORE_KEYWORD_POOL_SIZE = KEYWORD_RAIL_COUNT;

/** @deprecated */
export const EXPLORE_KEYWORD_VISIBLE_COUNT = KEYWORD_RAIL_COUNT;

/** @deprecated use HOME_KEYWORD_POOL_SIZE */
export const HOME_KEYWORD_BADGE_COUNT = HOME_KEYWORD_POOL_SIZE;

/** @deprecated use EXPLORE_KEYWORD_POOL_SIZE */
export const EXPLORE_KEYWORD_CHIP_COUNT = EXPLORE_KEYWORD_POOL_SIZE;

/** 탐색 미리보기(후기 카드) 개수 */
export const EXPLORE_DISCOVER_PREVIEW_COUNT = 6;

export function shuffleKeywordPool(
  pool: string[],
  count: number,
  rng: () => number = Math.random,
): string[] {
  const unique = [...new Set(pool.map((k) => k.trim()).filter(Boolean))];
  const copy = [...unique];
  const picked: string[] = [];
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(rng() * copy.length);
    picked.push(copy.splice(idx, 1)[0]!);
  }
  return picked;
}

function pickFromPool(pool: string[], count: number, random: boolean): string[] {
  const copy = [...pool];
  const picked: string[] = [];

  if (random) {
    while (picked.length < count && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]!);
    }
  } else {
    const seed = daySeed();
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = (seed + i * 17) % copy.length;
      picked.push(copy.splice(idx, 1)[0]!);
    }
  }

  return picked;
}

/** 방문마다 다른 자극 키워드 — 홈 칩 */
export function getRandomProvocativeKeywords(count = 4): string[] {
  return pickFromPool([...PROVOCATIVE_KEYWORDS], count, true);
}

/** 탐색 진입 시 기본 노출 키워드 */
export function getExploreDefaultKeyword(): string {
  return getRandomProvocativeKeywords(1)[0] ?? "시험";
}

/** 탐색 검색 전 미리보기 — 홈 키워드와 겹치지 않게 섞어서 노출 */
export const EXPLORE_DISCOVER_KEYWORDS = [
  "비행",
  "로또",
  "쫓기는 꿈",
  "전 남친",
] as const;

/** @deprecated use getRandomProvocativeKeywords */
export function getRandomPreviewKeywords(count = 4): string[] {
  return getRandomProvocativeKeywords(count);
}

export function getDailyPreviewKeywords(count = 3): string[] {
  return pickFromPool([...PROVOCATIVE_KEYWORDS], count, false);
}

export function getDailyPreviewKeyword(): string {
  return getExploreDefaultKeyword();
}

export function previewKeywordLabel(keyword: string): string {
  if (keyword.includes("꿈")) return keyword;
  return `${keyword} 꿈`;
}

export function provocativeSearchPlaceholder(): string {
  const samples = ["시험 망친 꿈", "로또 당첨 꿈", "전 남친이 돌아온 꿈"];
  return `예: ${samples[Math.floor(Math.random() * samples.length)]}`;
}
