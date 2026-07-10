/**
 * 최소 비용 모델 + 대량 토큰 — 미리보기·후기 풍부·생생 생성.
 */

import { mergeAiKeywords, normalizeKoreanToken, resolveResearchAnchor, sanitizeDreamContent } from "./dreamAnchor";
import { COMMUNITY_REVIEW_SLOT_SYSTEM, buildCommunityReviewUserHint, EXPLORE_COMMUNITY_REVIEW_SYSTEM, buildExploreCommunityReviewUserHint } from "./communityReviewPrompt";

export const INTERPRET_MODEL = "gpt-4.1-nano";
export const EMBED_MODEL = "text-embedding-3-small";

export const INTERPRET_GENERATION = {
  temperature: 0.94,
  max_tokens: 4096,
  presence_penalty: 0.55,
  frequency_penalty: 0.15,
} as const;

export const SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)" 미리보기·후기 생성 AI입니다.
해몽을 예언처럼 단정하지 말고, 꿈 장면과 30일 뒤 실제 기록을 비교할 수 있게 돕는 것이 목적입니다.

## 톤 (가장 중요)
- 사람이 커뮤니티·카톡·블로그에 **직접 쓴 것처럼** 생생하게
- 시간·장소·감각·대사·몸 반응(손 떨림, 심장, 잠에서 깬 뒤 느낌) 구체적으로
- usualTake: 일반 해몽에서 흔히 보는 해석을 소개하되 **대박·손재·불행을 단정하지 말 것** — **이 꿈 장면만** 5~7줄
- alternativeLens: 연구소 **심리·상징** 관점 — **이 꿈만** 풀어 쓰기. 다른 사람 후기·통계·"비슷한 꿈 꾼 사람" **언급 금지**
- psychology, symbol — **당신 꿈** 감정·상징만. communityEstimate·labObservations에만 타인 데이터
- reflection — **연구소 해몽과 완전히 다른 톤**. 친한 사람이 카톡으로 편하게 묻듯이. **질문 2~4개**(각 줄이 ?로 끝나게). 예: "평소엔 이런 꿈 잘 안 꾸시죠?", "불안했던 장면이 현실에선 반대로 풀리는 경우도 있어요 — 그때 마음은 어땠을까요?", "주변 사람과의 관계를 더 깊게 보고 싶은 마음은 없으세요?" 꿈은 종종 **반대로** 읽힌다는 점을 부드럽게 언급 가능. 단정·예언·연구소 말투 금지
- communityEstimate.stories **10~12건**, dreamSnippet **3~4문장**, afterStory **2~4문장**

## 금지 (AI 티)
- "복잡한 상황", "새로운 시작", "긍정적인 변화", "성장과 변화", "의미로 다가"
- "관련된 장면", "비슷한 분위기", "선명하게 남은 꿈이었어요" 템플릿
- "대박", "손재", "소름", "불행이 닥친다", "예언", "금단", "당신만 모른다"
- stories에 사용자 원문·scenePhrases 복붙 / 사용자와 **같은 장면**

## researchAnchor (DB용)
- primary, secondary 2~4, scenePhrases, clusterLabel

## 해몽 (생생·길게, usualTake·alternativeLens 각 5~8줄)
usualTake, alternativeLens, symbol, psychology, reflection — **이 꿈 장면만**. 타인 후기는 labObservations·communityEstimate에만

## labObservations (타인·커뮤니티 패턴)
sceneNote 생생 1~2줄, commonBehaviors 구체적 3~4, relatedSearches

## communityEstimate
- stories **10~12** — profile은 항상 "익명 기록", dreamTitle 한 줄
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

export const EXPLORE_SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)" 탐색 미리보기 AI입니다.
해몽을 예언처럼 단정하지 말고, 꿈 장면과 30일 뒤 실제 기록을 비교할 수 있게 돕는 것이 목적입니다.

## 톤
- usualTake: 일반 해몽 5~7줄 — **이 꿈 장면만**
- alternativeLens: 심리·상징 5~8줄 — **이 꿈만**, 타인 후기 언급 금지
- reflection: **친구가 카톡으로 편하게 묻듯** 질문 2~4개 (각 줄 ?로 끝). 연구소 말투 금지. 꿈이 반대로 읽힐 수 있음을 부드럽게
- psychology, symbol — 이 꿈만

${EXPLORE_COMMUNITY_REVIEW_SYSTEM}

JSON만:
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
  "communityEstimate": { "stories": [ 1건만 ], "totalCount": 0, "withFollowUpCount": 0, "keywords": [], "emotionCounts": [], "outcomes": {} }
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
      `${anchor} 해몽을 찾아본 뒤 꿈 내용을 메모로 다시 정리함`,
      "며칠 뒤 비슷한 장면이 떠올라 친구나 가족에게 짧게 말함",
      "30일 뒤 실제로 달라진 감정·일정을 후기에 남김",
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

const CONVERSATIONAL_REFLECTION_CLOSERS = [
  "평소엔 이런 꿈 잘 안 꾸시죠? 깬 뒤에도 그 장면이 남아 있나요?",
  "불안했던 장면이 현실에선 반대로 풀리는 경우도 있어요. 그때 마음은 어땠을까요?",
  "주변 사람과의 관계를 더 깊게 보고 싶은 마음은 없으세요?",
  "이 꿈이 당신에게 어떤 메시지를 전한다고 느껴지나요?",
  "한 달 뒤, 실제로는 어떤 일이 있었는지 기억나시나요?",
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

function ensureConversationalReflection(reflection: string, seed: number): string {
  const lines = reflection
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const questionLines = lines.filter((l) => /[?？]$/.test(l) || l.includes("?"));
  if (questionLines.length >= 2) {
    return ensureMultiline(questionLines.slice(0, 4).join("\n"), 4);
  }
  const opener =
    lines.find((l) => /[?？]$/.test(l)) ??
    pick(CONVERSATIONAL_REFLECTION_CLOSERS, seed);
  const second = pick(CONVERSATIONAL_REFLECTION_CLOSERS, seed, 1);
  const third = pick(CONVERSATIONAL_REFLECTION_CLOSERS, seed, 2);
  const merged = [opener, second, third].filter((v, i, a) => a.indexOf(v) === i);
  return ensureMultiline(merged.join("\n"), 4);
}

function buildFallbackUsualTake(keyword: string, anchor: string): string {
  return ensureMultiline(
    `전통·인터넷 해몽에서 "${anchor}"은(는) 종종 변화나 메시지의 상징으로 읽힙니다.\n` +
      `"${keyword}"이(가) 등장하는 꿈은 흔히 감정의 압력, 관계의 변화, 미뤄둔 선택과 연결해 설명되기도 합니다.\n` +
      `다만 같은 키워드라도 꿈속 분위기와 깬 뒤 몸에 남은 느낌에 따라 해석은 달라집니다.\n` +
      `해몽 사이트마다 말은 다르지만, 대체로 '${anchor}'에 큰 의미를 부여하는 편입니다.`,
    6,
  );
}

function buildFallbackAlternativeLens(keyword: string, anchor: string, seed: number): string {
  const opener = pick(PIVOT_OPENERS, seed, 3);
  return ensureMultiline(
    `${opener}\n` +
      `"${anchor}" 장면은 단순히 '나쁜 꿈'이라고만 읽기 어렵습니다.\n` +
      `꿈속 "${keyword}"은(는) 선택·경쟁·욕망·죄책감이 겹친 심리 드라마로도 읽힙니다.\n` +
      `몸이 먼저 긴장하거나 이상하게 편안했다면, 그 반응 자체가 중요한 단서일 수 있어요.\n` +
      `남의 장면과 내 반응이 동시에 보였다면, '통제 vs 해방' 축을 짚어볼 만합니다.\n` +
      `연구소는 이 꿈을 **당신 마음의 압력**과 연결해 봅니다 — 단정은 하지 않습니다.`,
    8,
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

  let psychology = ensureMultiline(raw.psychology, 6);

  const symbol = ensureMultiline(raw.symbol, 6);
  let reflection = ensureConversationalReflection(raw.reflection, seed);
  reflection = reflection.replace(/비슷한 꿈[^.\n]{0,40}(보면|읽다 보면|기록)/g, "이 꿈의 여운");

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

export function buildUserMessage(title: string, content: string, exploreMode = false): string {
  const cleaned = sanitizeDreamContent(content);
  return [
    `꿈 제목: ${title}`,
    `꿈 내용: ${cleaned}`,
    "",
    "researchAnchor.primary — 이 꿈을 DB·유사 꿈 통계에 묶을 **대표 키**를 당신이 결정하세요.",
    "우리 사전/목록에 없는 표현도 OK. 꿈에 가장 핵심인 장면·상징을 고르세요.",
    "scenePhrases에는 원문 문장을 그대로 넣으세요.",
    exploreMode ? buildExploreCommunityReviewUserHint() : buildCommunityReviewUserHint(),
    exploreMode
      ? "reflection — 연구소 말투 말고, 친구가 카톡으로 편하게 묻듯 질문 2~4개."
      : "",
    "JSON만 출력.",
  ]
    .filter(Boolean)
    .join("\n");
}
