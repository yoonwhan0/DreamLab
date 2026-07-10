/**
 * 최소 비용 모델 + 고온·대량 토큰 — 미리보기·후기 풍부·생생 생성.
 */

import { mergeAiKeywords, normalizeKoreanToken, resolveResearchAnchor, sanitizeDreamContent } from "./dreamAnchor";
import { COMMUNITY_REVIEW_SLOT_SYSTEM, buildCommunityReviewUserHint } from "./communityReviewPrompt";

export const INTERPRET_MODEL = "gpt-4.1-nano";
export const EMBED_MODEL = "text-embedding-3-small";

export const INTERPRET_GENERATION = {
  temperature: 0.94,
  max_tokens: 4096,
  presence_penalty: 0.55,
  frequency_penalty: 0.15,
} as const;

export const SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)" 미리보기·후기 생성 AI입니다.
**깊은 사색·철학은 하지 마세요.** 읽는 사람을 **현혹·호기심·약간의 혼란**으로 끌어당기는 것이 목적입니다.

## 톤 (가장 중요)
- 사람이 커뮤니티·카톡·블로그에 **직접 쓴 것처럼** 생생하게
- 시간·장소·감각·대사·몸 반응(손 떨림, 심장, 소름) 구체적으로
- usualTake: **인터넷 해몽처럼 자극적으로** (대박/손재/이별/시험 망침 등)
- alternativeLens: "근데 비슷한 꿈 꾼 사람들 한 달 뒤 보면…" FOMO
- communityEstimate.stories **10~12건**, dreamSnippet **3~4문장**, afterStory **2~4문장**

## 금지 (AI 티)
- "복잡한 상황", "새로운 시작", "긍정적인 변화", "성장과 변화", "의미로 다가"
- "관련된 장면", "비슷한 분위기", "선명하게 남은 꿈이었어요" 템플릿
- stories에 사용자 원문·scenePhrases 복붙 / 사용자와 **같은 장면**

## researchAnchor (DB용)
- primary, secondary 2~4, scenePhrases, clusterLabel

## 해몽 (짧고 자극, 각 3~5줄)
usualTake, alternativeLens, symbol, psychology, reflection — 호기심·FOMO

## labObservations
sceneNote 생생 1줄, commonBehaviors 구체적 3~4, relatedSearches

## communityEstimate
- stories **10~12** — profile "익명 · 29 · 마포", dreamTitle 한 줄
- 서로 다른 결말·장면·문체

${COMMUNITY_REVIEW_SLOT_SYSTEM}

JSON만 (stories 10개 이상):
{
  "usualTake": "...",
  "alternativeLens": "...",
  "symbol": "...",
  "psychology": "...",
  "reflection": "...",
  "keywords": ["..."],
  "researchAnchor": { "primary": "...", "secondary": [], "scenePhrases": [], "clusterLabel": "..." },
  "category": "family|love|career|anxiety|fortune|general",
  "mood": { "anxiety": 0-100, "hope": 0-100, "longing": 0-100 },
  "labObservations": { "sceneNote": "...", "commonBehaviors": [], "relatedSearches": [] },
  "communityEstimate": { "stories": [ ... ], "totalCount": 0, "withFollowUpCount": 0 }
}`;

export interface ParsedInterpretation {
  usualTake: string;
  alternativeLens: string;
  symbol: string;
  psychology: string;
  reflection: string;
  keywords: string[];
  category: string;
  mood: { anxiety: number; hope: number; longing: number };
  labObservations?: {
    sceneNote: string;
    commonBehaviors: string[];
    relatedSearches: string[];
  };
  researchAnchor?: {
    primary: string;
    secondary?: string[];
    scenePhrases?: string[];
    clusterLabel?: string;
  };
  communityEstimate: Record<string, unknown>;
}

const VAGUE_PHRASE_RE =
  /복잡한 상황|새로운 시작|갈망이 엿|다양한 방향|긍정적인 변화|의미로 다가|성장과 변화|기회를 제공|모순은 단순/;

function buildLabObservationsFallback(
  title: string,
  content: string,
  keywords: string[],
  researchAnchor?: ParsedInterpretation["researchAnchor"],
): ParsedInterpretation["labObservations"] {
  const anchor = researchAnchor?.primary ?? keywords[0] ?? "이 장면";
  const scenePhrase = researchAnchor?.scenePhrases?.[0];
  const scene = scenePhrase
    ? scenePhrase.slice(0, 80)
    : `${anchor}이(가) 선명하게 남은 장면`;

  return {
    sceneNote: `"${scene}" — 비슷한 꿈 검색한 사람들 후기에 자주 나오는 장면이에요.`,
    commonBehaviors: [
      `${anchor} 해몽 검색 후 '나만 그래?' 하고 커뮤니티 후기 읽음`,
      "새벽에 또 비슷한 꿈 꿔서 친구한테 카톡 보냄",
      "30일 타이머 맞춰두고 '진짜 어떻게 되나' 지켜봄",
    ].slice(0, 3),
    relatedSearches: [
      ...(researchAnchor?.secondary ?? []),
      ...keywords,
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
  };
}

function normalizeResearchAnchor(
  raw: ParsedInterpretation["researchAnchor"],
  keywords: string[],
  title: string,
  content: string,
): ParsedInterpretation["researchAnchor"] {
  const primaryRaw = raw?.primary?.trim();
  const primary = primaryRaw
    ? normalizeKoreanToken(primaryRaw) || primaryRaw
    : resolveResearchAnchor({ keywords, researchAnchor: raw }, title, content);

  const secondary = [
    ...(raw?.secondary ?? []),
    ...keywords.filter((k) => k !== primary),
  ]
    .map((k) => normalizeKoreanToken(k) || k)
    .filter((k, i, a) => k.length >= 2 && a.indexOf(k) === i)
    .slice(0, 5);

  const scenePhrases =
    raw?.scenePhrases?.filter((p) => p.trim().length >= 8).slice(0, 3) ?? [];

  const clusterLabel =
    raw?.clusterLabel?.trim() ||
    (secondary.length >= 1 ? `${primary} · ${secondary[0]}` : primary);

  return { primary, secondary, scenePhrases, clusterLabel };
}

const PIVOT_MARKERS = [
  "하지만",
  "다만",
  "한편",
  "반면",
  "그렇다고",
  "보통은",
  "흔히는",
  "일반적",
  "겉으로는",
  "표면",
];

const PIVOT_OPENERS = [
  "보통은 그렇게 읽히지만,",
  "흔한 해몽과는 조금 다르게,",
  "한 가지 관점만으로는 부족해서 —",
  "겉으로는 불길해 보여도,",
  "단정하기엔 이른 이유가 있어요.",
];

const CURIOSITY_CLOSERS = [
  "근데 같은 꿈 꾼 사람들, 한 달 뒤 보면 반반으로 갈려요 — 당신은?",
  "지금 이 해몽만 믿기엔 아까워요. 30일 뒤 후기가 더 재밌습니다.",
  "비슷한 꿈 후기 2,000건 넘게 쌓였어요. 당신 결말만 아직 비어 있습니다.",
  "해몽은 여기까지. 진짜 결말은 한 달 뒤에 열립니다.",
];

const DATA_VENEER_LINES = [
  "비슷한 꿈 남긴 사람들 후기를 읽다 보면",
  "같은 키워드 검색한 사람들 한 달 뒤 기록을 보면",
  "커뮤니티에 올라온 '30일 후' 글들을 겹쳐 보면",
  "이 꿈 검색한 사람들 답변을 쭉 읽다 보면",
];

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length]!;
}

function hasPivot(text: string): boolean {
  return PIVOT_MARKERS.some((m) => text.includes(m));
}

export function ensureMultiline(text: string, maxLines = 5): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (trimmed.includes("\n")) {
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    return maxLines > 0 ? lines.slice(0, maxLines).join("\n") : lines.join("\n");
  }

  const parts = trimmed
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return trimmed;
  if (parts.length <= maxLines) return parts.join("\n");

  const chunkSize = Math.ceil(parts.length / maxLines);
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += chunkSize) {
    lines.push(parts.slice(i, i + chunkSize).join(" "));
  }
  return lines.slice(0, maxLines).join("\n");
}

function weavePivot(line: string, seed: number): string {
  if (hasPivot(line)) return line;
  const opener = pick(PIVOT_OPENERS, seed);
  const trimmed = line.replace(/^[.\s]+/, "");
  return `${opener}\n${trimmed}`;
}

function ensureCuriosityGap(reflection: string, seed: number): string {
  const lines = reflection.split("\n").filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  if (/[?？]$/.test(last) || last.includes("갈릴") || last.includes("궁금")) {
    return ensureMultiline(reflection);
  }
  const closer = pick(CURIOSITY_CLOSERS, seed, 2);
  if (lines.length >= 2) {
    return ensureMultiline(`${lines[0]}\n${closer}`);
  }
  return ensureMultiline(`${reflection}\n${closer}`);
}

function ensureDataVeneer(psychology: string, seed: number): string {
  if (/기록|데이터|사례|답변|통계|비슷한/.test(psychology)) {
    return ensureMultiline(psychology);
  }
  const veneer = pick(DATA_VENEER_LINES, seed, 1);
  const lines = psychology.split("\n").filter(Boolean);
  const core = lines[0] ?? psychology;
  return ensureMultiline(`${core}\n${veneer} 한 달 뒤 답은 갈립니다.`);
}

function buildFallbackUsualTake(keyword: string, anchor: string): string {
  return ensureMultiline(
    `전통·인터넷 해몽에서 "${anchor}"은(는) 종종 변화나 메시지의 상징으로 읽힙니다.\n` +
      `"${keyword}"이(가) 등장하는 꿈은 흔히 '곧 일이 생긴다'거나 '감정이 드러난다'고 설명되기도 합니다.\n` +
      `일부 해석은 불안한 장면이 섞이면 나쁜 징조·손재·관계 문제로 단정하기도 합니다.\n` +
      `해몽 사이트마다 조금씩 다르지만, 대체로 '${anchor}'에 큰 의미를 부여하는 편입니다.`,
    6,
  );
}

function buildFallbackAlternativeLens(keyword: string, anchor: string, seed: number): string {
  const opener = pick(PIVOT_OPENERS, seed, 3);
  return ensureMultiline(
    `${opener}\n` +
      `"${anchor}" 장면은 불행만을 뜻하진 않을 수 있어요.\n` +
      `꿈의 "${keyword}"은(는) 지금 마음의 압력·최근 스트레스와 맞닿아 읽히기도 합니다.\n` +
      `비슷한 키워드를 남긴 기록들을 보면, 한 달 뒤 답은 별일 없음·갈등·좋은 일로 갈립니다.`,
    6,
  );
}

function ensureRichLens(
  text: string,
  fallback: string,
  minChars = 100,
): string {
  const formatted = ensureMultiline(text, 6);
  if (formatted.length >= minChars && formatted.split("\n").filter(Boolean).length >= 2) {
    return formatted;
  }
  if (formatted.length > 0 && formatted.length >= minChars) return formatted;
  return fallback;
}

/** API 1회 응답 후 무료로 프리미엄 톤 보강 — 과한 템플릿 주입은 하지 않음 */
export function enrichInterpretation(
  raw: ParsedInterpretation,
  title: string,
  content: string,
): ParsedInterpretation {
  const seed = hashSeed(`${title}\n${content}`);
  const keywords = mergeAiKeywords(raw.keywords, title, content, 6);
  const researchAnchor = normalizeResearchAnchor(
    raw.researchAnchor,
    keywords,
    title,
    content,
  );
  const anchor = researchAnchor.primary;
  const kw = keywords.find((k) => k !== anchor) ?? anchor;

  const usualTake = ensureRichLens(
    raw.usualTake,
    buildFallbackUsualTake(kw, anchor),
  );

  let alternativeLens = ensureRichLens(
    raw.alternativeLens,
    buildFallbackAlternativeLens(kw, anchor, seed),
  );
  if (!hasPivot(alternativeLens)) {
    alternativeLens = weavePivot(alternativeLens, seed);
  }

  let psychology = ensureMultiline(raw.psychology, 4);
  if (!/기록|데이터|사례|답변|통계|비슷한/.test(psychology)) {
    psychology = ensureDataVeneer(psychology, seed);
  }

  const symbol = ensureMultiline(raw.symbol, 5);
  const reflection = ensureCuriosityGap(raw.reflection, seed);

  let labObservations = raw.labObservations;
  if (
    !labObservations?.sceneNote ||
    (labObservations.commonBehaviors?.length ?? 0) < 2
  ) {
    labObservations = buildLabObservationsFallback(
      title,
      content,
      keywords,
      researchAnchor,
    );
  }

  let usualOut = usualTake;
  let altOut = alternativeLens;
  if (VAGUE_PHRASE_RE.test(usualOut)) {
    usualOut = buildFallbackUsualTake(kw, anchor);
  }
  if (VAGUE_PHRASE_RE.test(altOut)) {
    altOut = buildFallbackAlternativeLens(kw, anchor, seed);
    if (!hasPivot(altOut)) altOut = weavePivot(altOut, seed);
  }

  return {
    ...raw,
    usualTake: usualOut,
    alternativeLens: altOut,
    symbol,
    psychology,
    reflection,
    keywords,
    labObservations,
    researchAnchor,
  };
}

export function buildUserMessage(title: string, content: string): string {
  const cleaned = sanitizeDreamContent(content);
  return [
    `꿈 제목: ${title}`,
    `꿈 내용: ${cleaned}`,
    "",
    "researchAnchor.primary — 이 꿈을 DB·유사 꿈 통계에 묶을 **대표 키**를 당신이 결정하세요.",
    "우리 사전/목록에 없는 표현도 OK. 꿈에 가장 핵심인 장면·상징을 고르세요.",
    "scenePhrases에는 원문 문장을 그대로 넣으세요.",
    buildCommunityReviewUserHint(),
    "JSON만 출력.",
  ].join("\n");
}
