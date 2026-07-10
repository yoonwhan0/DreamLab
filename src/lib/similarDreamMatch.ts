/** 비슷한 꿈 매칭 — 키워드 겹침 기준 (카테고리만으로는 통과하지 않음) */

const WEAK_ANCHORS = new Set(["꿈", "일반", "기타", "dream", ""]);

export function normalizeKeywordToken(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/\s+/g, "");
}

export function isStrongAnchor(anchor: string): boolean {
  const k = anchor.trim();
  return k.length >= 2 && !WEAK_ANCHORS.has(k);
}

/** Firestore·후기 풀 — 검색 키워드와 실제로 겹치는지 */
export function isStrictlySimilarDream(
  dreamKeywords: string[],
  dreamCategory: string,
  searchKeywords: string[],
  searchCategory: string,
): boolean {
  const anchors = searchKeywords.map((k) => k.trim()).filter((k) => k.length >= 2);
  if (anchors.length === 0) {
    return dreamCategory === searchCategory;
  }

  const dreamSet = new Set(dreamKeywords.map(normalizeKeywordToken));
  const overlaps = anchors.filter((anchor) => {
    const na = normalizeKeywordToken(anchor);
    if (dreamSet.has(na)) return true;
    return [...dreamSet].some((d) => d.includes(na) || na.includes(d));
  });

  if (overlaps.length >= 2) return true;
  if (overlaps.length === 1 && dreamCategory === searchCategory) return true;
  return false;
}

/** 후기 본문이 앵커 키워드와 맥락상 연결되는지 */
export function storyRelatesToAnchorStrict(text: string, anchor: string): boolean {
  const k = anchor.trim();
  if (!isStrongAnchor(k)) return false;
  if (text.includes(k)) return true;
  const tokens = k.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.some((t) => text.includes(t));
}
