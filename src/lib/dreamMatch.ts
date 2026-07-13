/**
 * 유사 꿈 매칭 점수 — 벡터(임베딩) + 태그 + 감정을 합산.
 *   score = 0.4 * vector + 0.4 * tag + 0.2 * emotion  (0~100)
 * 임계값(MATCH_THRESHOLD) 미만은 노출하지 않는다.
 */

import type { DreamElements, DreamEmotionId, DreamInterpretation } from "@/types";
import { normalizeKeywordToken } from "@/lib/similarDreamMatch";

export const MATCH_WEIGHTS = { vector: 0.4, tag: 0.4, emotion: 0.2 } as const;
export const MATCH_THRESHOLD = 70;

export interface DreamMatchInput {
  /** 256d 임베딩 (없으면 벡터 점수는 태그로 근사) */
  embedding?: number[];
  /** 태그 집합 (요소 + 키워드) */
  tags: string[];
  emotions: DreamEmotionId[];
}

export interface DreamMatchScore {
  /** 0~100 */
  total: number;
  vector: number;
  tag: number;
  emotion: number;
}

function flattenElements(elements?: DreamElements): string[] {
  if (!elements) return [];
  return [
    ...elements.people,
    ...elements.places,
    ...elements.actions,
    ...elements.emotions,
    ...elements.objects,
    ...elements.events,
    ...elements.symbols,
  ];
}

/** 해석에서 태그 집합 추출 (요소 + 키워드 + 앵커) */
export function collectDreamTags(interpretation: DreamInterpretation): string[] {
  const raw = [
    interpretation.researchAnchor?.primary ?? "",
    ...(interpretation.researchAnchor?.secondary ?? []),
    ...interpretation.keywords,
    ...flattenElements(interpretation.elements),
  ];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of raw) {
    const n = normalizeKeywordToken(t);
    if (n.length < 2 || seen.has(n)) continue;
    seen.add(n);
    tags.push(n);
  }
  return tags;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  const sim = dot / (Math.sqrt(na) * Math.sqrt(nb));
  return Math.max(0, Math.min(1, sim));
}

/** 태그 겹침 — 부분 포함까지 인정하는 완화된 Jaccard */
export function tagOverlap(aTags: string[], bTags: string[]): number {
  if (aTags.length === 0 || bTags.length === 0) return 0;
  const bSet = new Set(bTags);
  let hits = 0;
  for (const a of aTags) {
    if (bSet.has(a)) {
      hits += 1;
      continue;
    }
    if (bTags.some((b) => b.includes(a) || a.includes(b))) hits += 0.5;
  }
  const denom = Math.max(aTags.length, bTags.length);
  return Math.max(0, Math.min(1, hits / denom));
}

export function emotionOverlap(
  a: DreamEmotionId[],
  b: DreamEmotionId[],
): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bSet = new Set(b);
  const hits = a.filter((e) => bSet.has(e)).length;
  return Math.max(0, Math.min(1, hits / Math.max(a.length, b.length)));
}

/**
 * 매칭 점수 계산. 임베딩이 양쪽에 있으면 코사인, 없으면 태그 점수로 벡터를 근사.
 */
export function scoreDreamMatch(
  query: DreamMatchInput,
  candidate: DreamMatchInput,
): DreamMatchScore {
  const tag = tagOverlap(query.tags, candidate.tags);
  const emotion = emotionOverlap(query.emotions, candidate.emotions);

  const hasVectors =
    (query.embedding?.length ?? 0) > 0 && (candidate.embedding?.length ?? 0) > 0;
  const vector = hasVectors
    ? cosineSimilarity(query.embedding!, candidate.embedding!)
    : tag; // 임베딩 없으면 태그로 근사

  const total =
    (vector * MATCH_WEIGHTS.vector +
      tag * MATCH_WEIGHTS.tag +
      emotion * MATCH_WEIGHTS.emotion) *
    100;

  return {
    total: Math.round(total),
    vector: Math.round(vector * 100),
    tag: Math.round(tag * 100),
    emotion: Math.round(emotion * 100),
  };
}

export function passesThreshold(score: DreamMatchScore): boolean {
  return score.total >= MATCH_THRESHOLD;
}
