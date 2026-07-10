import { useEffect, useState } from "react";
import { HOME_KEYWORD_BADGE_COUNT } from "@/lib/previewKeywords";
import { useFeaturedKeywords } from "@/hooks/useFeaturedKeywords";

function randomIndex(length: number): number {
  return length > 0 ? Math.floor(Math.random() * length) : 0;
}

export function useHomeFeaturedKeywords(count = HOME_KEYWORD_BADGE_COUNT) {
  const keywords = useFeaturedKeywords(count);
  const [activeIdx, setActiveIdx] = useState(() => randomIndex(count));

  useEffect(() => {
    setActiveIdx(randomIndex(keywords.length));
  }, [keywords]);

  return { keywords, activeIdx, setActiveIdx };
}
