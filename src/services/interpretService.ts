import { generateSyntheticCommunity } from "@/services/syntheticCommunityService";
import {
  buildMockAlternativeLens,
  buildMockPsychology,
  buildMockReflection,
  buildMockSymbol,
  buildMockUsualTake,
} from "@/lib/interpretationTone";
import { extractMeaningfulKeywords } from "@/lib/dreamAnchor";
import type { CommunityEstimate, DreamInterpretation } from "@/types";

export interface InterpretResult {
  interpretation: DreamInterpretation;
  embedding: number[];
  communityEstimate: CommunityEstimate;
}

const INTERPRET_TIMEOUT_MS = 90_000;
const CACHE_PREFIX = "dreamlab-interpret:";

function cacheKey(title: string, content: string): string {
  return `${CACHE_PREFIX}${title}\n${content}`;
}

function readCache(title: string, content: string): InterpretResult | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(title, content));
    if (!raw) return null;
    return JSON.parse(raw) as InterpretResult;
  } catch {
    return null;
  }
}

function writeCache(title: string, content: string, result: InterpretResult): void {
  try {
    sessionStorage.setItem(cacheKey(title, content), JSON.stringify(result));
  } catch {
    // quota exceeded — 무시
  }
}

export async function interpretDream(
  title: string,
  content: string,
  opts?: { skipAi?: boolean },
): Promise<InterpretResult> {
  const cached = readCache(title, content);
  if (cached) return cached;

  if (opts?.skipAi) {
    const interpretation = mockInterpretation(title, content);
    const result: InterpretResult = {
      interpretation,
      embedding: [],
      communityEstimate: generateSyntheticCommunity(interpretation, title, content, 1),
    };
    writeCache(title, content, result);
    return result;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTERPRET_TIMEOUT_MS);

    const response = await fetch("/api/interpret-dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
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
      writeCache(title, content, result);
      return result;
    }

    console.warn("interpret-dream failed:", response.status, await response.text());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI 해석이 시간 초과됐어요. 잠시 후 다시 시도해주세요.");
    }
    console.warn("interpret-dream unavailable, using mock:", err);
  }

  const interpretation = mockInterpretation(title, content);
  const result: InterpretResult = {
    interpretation,
    embedding: [],
    communityEstimate: generateSyntheticCommunity(interpretation, title, content, 1),
  };
  writeCache(title, content, result);
  return result;
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
