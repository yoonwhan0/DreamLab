import { generateSyntheticCommunity } from "@/services/syntheticCommunityService";
import {
  buildMockAlternativeLens,
  buildMockPsychology,
  buildMockReflection,
  buildMockSymbol,
  buildMockUsualTake,
} from "@/lib/interpretationTone";
import { extractMeaningfulKeywords } from "@/lib/dreamAnchor";
import type { CommunityEstimate, DreamInterpretation, CommunityStory } from "@/types";

export interface InterpretResult {
  interpretation: DreamInterpretation;
  embedding: number[];
  communityEstimate: CommunityEstimate;
}

const INTERPRET_TIMEOUT_MS = 90_000;
const STORY_SLOT_TIMEOUT_MS = 45_000;
const CACHE_PREFIX = "dreamlab-interpret:";
const STORY_SLOT_CACHE_PREFIX = "dreamlab-explore-story:";

function cacheKey(title: string, content: string): string {
  return `${CACHE_PREFIX}${title}\n${content}`;
}

export async function interpretDream(
  title: string,
  content: string,
  opts?: { skipAi?: boolean; exploreMode?: boolean },
): Promise<InterpretResult> {
  const exploreMode = opts?.exploreMode === true;
  const storageKey = exploreMode ? `${cacheKey(title, content)}:explore` : cacheKey(title, content);
  const cached = readCacheByKey(storageKey);
  if (cached) return cached;

  if (opts?.skipAi) {
    const interpretation = mockInterpretation(title, content);
    const result: InterpretResult = {
      interpretation,
      embedding: [],
      communityEstimate: generateSyntheticCommunity(interpretation, title, content, 1),
    };
    writeCacheByKey(storageKey, result);
    return result;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTERPRET_TIMEOUT_MS);

    const response = await fetch("/api/interpret-dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, exploreMode }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const data = (await response.json()) as InterpretResult;
      const result: InterpretResult = {
        interpretation: data.interpretation,
        embedding: data.embedding ?? [],
        communityEstimate:
          data.communityEstimate ??
          generateSyntheticCommunity(data.interpretation, title, content, 1),
      };
      writeCacheByKey(storageKey, result);
      return result;
    }

    console.warn("interpret-dream failed:", response.status, await response.text());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("해몽이 시간 초과됐어요. 잠시 후 다시 시도해 주세요.");
    }
    console.warn("interpret-dream unavailable, using mock:", err);
  }

  const interpretation = mockInterpretation(title, content);
  const result: InterpretResult = {
    interpretation,
    embedding: [],
    communityEstimate: generateSyntheticCommunity(interpretation, title, content, 1),
  };
  writeCacheByKey(storageKey, result);
  return result;
}

function readCacheByKey(key: string): InterpretResult | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as InterpretResult;
  } catch {
    return null;
  }
}

function writeCacheByKey(key: string, result: InterpretResult): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(result));
  } catch {
    // quota exceeded — 무시
  }
}

/** 탐색 — 추가 후기 1건 AI 생성 */
export async function generateExploreStorySlot(
  title: string,
  content: string,
  storyIndex: number,
  avoidTitles: string[] = [],
): Promise<CommunityStory> {
  const slotKey = `${STORY_SLOT_CACHE_PREFIX}${title}\n${content}:${storyIndex}`;
  try {
    const raw = sessionStorage.getItem(slotKey);
    if (raw) return JSON.parse(raw) as CommunityStory;
  } catch {
    /* ignore */
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STORY_SLOT_TIMEOUT_MS);

  const response = await fetch("/api/generate-community-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, storyIndex, avoidTitles }),
    signal: controller.signal,
  });

  clearTimeout(timer);

  if (!response.ok) {
    throw new Error("후기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const data = (await response.json()) as { story: CommunityStory };
  try {
    sessionStorage.setItem(slotKey, JSON.stringify(data.story));
  } catch {
    /* ignore */
  }
  return data.story;
}

function mockInterpretation(
  title: string,
  content: string,
): DreamInterpretation {
  const text = `${title} ${content}`;
  const keywords = extractMeaningfulKeywords(text, 5);

  let category = "general";
  if (/부모|어머니|아버지|할머|할아버|돌아가/.test(text)) category = "family";
  else if (/연애|남친|여친|결혼|이별/.test(text)) category = "love";
  else if (/직장|회사|시험|학교|취업|이직/.test(text)) category = "career";
  else if (/뱀|죽|피|추락|쫓/.test(text)) category = "anxiety";
  else if (/돈|재물|황금|복권/.test(text)) category = "fortune";

  const kw = keywords[0] ?? "꿈";

  return {
    usualTake: buildMockUsualTake(kw),
    alternativeLens: buildMockAlternativeLens(kw),
    symbol: buildMockSymbol(kw),
    psychology: buildMockPsychology(),
    reflection: buildMockReflection(),
    keywords: keywords.length > 0 ? keywords : ["꿈", "마음", "변화"],
    category,
    mood: { anxiety: 48, hope: 32, longing: 20 },
  };
}
