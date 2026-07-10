import { useEffect, useState } from "react";
import { PREVIEW_KEYWORD_POOL, shuffleKeywordPool } from "@/lib/previewKeywords";
import { fetchPopularDreamKeywords } from "@/services/dreamService";

function initialKeywords(count: number): string[] {
  return shuffleKeywordPool([...PREVIEW_KEYWORD_POOL], count);
}

/** DB 키워드 우선 + 방문마다 랜덤 — 홈·탐색 칩 공용 */
export function useFeaturedKeywords(count: number): string[] {
  const [keywords, setKeywords] = useState(() => initialKeywords(count));

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const topPool = Math.max(60, count * 4);
      const fromDb = await fetchPopularDreamKeywords(topPool);
      if (cancelled) return;

      const pool =
        fromDb.length >= count
          ? fromDb
          : [...new Set([...fromDb, ...PREVIEW_KEYWORD_POOL])];

      const shuffled = shuffleKeywordPool(pool, count);
      if (shuffled.length === 0) return;

      setKeywords(shuffled);
    })();

    return () => {
      cancelled = true;
    };
  }, [count]);

  return keywords;
}
