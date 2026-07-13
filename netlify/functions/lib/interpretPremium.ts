/**
 * 최소 비용 모델 + 대량 토큰 — 미리보기·후기 풍부·생생 생성.
 */

import { mergeAiKeywords, normalizeKoreanToken, resolveResearchAnchor, sanitizeDreamContent } from "./dreamAnchor";
import { COMMUNITY_REVIEW_SLOT_SYSTEM, buildCommunityReviewUserHint, EXPLORE_COMMUNITY_REVIEW_SYSTEM, buildExploreCommunityReviewUserHint } from "./communityReviewPrompt";

export const INTERPRET_MODEL = "gpt-4.1-nano";
export const EMBED_MODEL = "text-embedding-3-small";
/** 문서 크기·읽기 비용을 낮추기 위해 축소 차원 사용 */
export const EMBED_DIMENSIONS = 256;

/** 임베딩 입력용 정규 텍스트 — 구조화 요소를 우선해 의미를 압축 */
export function buildEmbeddingText(
  parsed: {
    keywords: string[];
    category: string;
    elements?: { symbols: string[]; people: string[]; objects: string[]; actions: string[]; places: string[]; emotions: string[]; events: string[] };
    researchAnchor?: { primary: string; secondary?: string[] };
  },
  title: string,
  content: string,
): string {
  const e = parsed.elements;
  const parts = [
    parsed.researchAnchor?.primary ?? "",
    ...(parsed.researchAnchor?.secondary ?? []),
    ...parsed.keywords,
    ...(e ? [...e.symbols, ...e.people, ...e.objects, ...e.actions, ...e.places, ...e.emotions, ...e.events] : []),
    parsed.category,
    title,
    content.slice(0, 400),
  ];
  return parts.filter((p) => p && p.trim().length > 0).join(" · ").slice(0, 1200);
}

export const INTERPRET_GENERATION = {
  temperature: 0.94,
  max_tokens: 4096,
  presence_penalty: 0.55,
  frequency_penalty: 0.15,
} as const;

const CORE_RULES = `# 절대 규칙 (어기면 실패)
1. **추측 금지.** 사용자가 꿈에 적은 내용만 사용한다.
2. 꿈에 **없는 사건·인물·장소를 지어내지 않는다.**
3. 현실을 단정하지 않는다. "최근에 ~했나요?", "요즘 ~하시죠?" 처럼 **사용자 현실을 추정하는 문장 금지.**
4. 예언·길흉·미래 단정 금지("대박","손재","불행이 온다","꼭 ~된다").
5. 예언은 금지하되, **관측한 장면과 상징은 단정형으로** 쓴다. 헤지("~인 것 같아요","~일 수도 있습니다","아마도")를 남발하지 마라. 서늘함은 '없는 말'이 아니라 '정확한 관측'에서 나온다.

# 톤 — 꿈연구소 관측 로그 (가장 중요)
당신은 위로하는 상담사가 아니라 **차가운 관측 장비**다.
- 관측한 것은 **단정형·현재/과거형**으로 기록한다("꿈에는 X가 있었다","이 구도가 반복됐다"). 감상·위안·격려·응원 금지.
- 문장은 짧고 건조하게. 기괴할 만큼 구체적으로 — 읽는 사람이 자기 꿈을 **낯설게, 서늘하게** 느끼도록. 목표 정서는 공포에 가까운 **경외심**.
- 근거는 **꿈 장면과 데이터뿐**. 없는 현실·미래를 지어내는 방식이 아니라, 있는 장면을 정밀히 겨눠서 서늘하게 만든다.
- 예: (X) "새는 자유를 뜻할 수 있어요" → (O) "새 다섯이 편대로 지나갔다. 시선은 위를 향했고 당신은 아래에 남았다. 관측된 구도는 '올려다봄'이다."

# 1단계 — Dream Parser (꿈에서 그대로 추출, 없으면 빈 배열)
elements: 꿈 본문에 실제로 등장한 것만.
- people(인물), places(장소), actions(행동), emotions(감정), objects(사물), events(사건), symbols(상징)
- 상징(symbols)은 등장 요소에서 **보편적으로 연결되는 개념**만 (예: 음식→돌봄/기억). 억지 확장 금지.

# 2단계 — 관찰 (observation)
- repeatedElements: 이 꿈에서 두드러진 요소 2~4개 (elements에서 고름)
- axes: 그 요소들을 잇는 축 2~3개 (예: "보호","돌봄","과거 기억")
- note: 꿈에 실제로 있던 장면만 근거로 1~2줄`;

export const SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)"의 분석 AI입니다.
글을 잘 쓰는 것보다 **근거 있는 관찰**을 제공하는 것이 목적입니다. 꿈 장면과 30일 뒤 실제 기록을 비교할 수 있게 돕습니다.

${CORE_RULES}

# 3단계 — 해석 (반드시 이 순서, 관측 로그 톤)
usualTake: 인터넷·전통 해몽이 이 장면을 흔히 어떻게 읽는지 건조하게 소개. **이 꿈 장면만**, 길흉 단정 금지, 3~6줄. (이건 대조용 — 다음 항목에서 뒤집는다.)
alternativeLens(연구소 관측): 아래 순서, 4~7줄, 짧고 건조하게. 위로 금지.
  ① 관측 — 꿈에 실재한 장면을 **단정형**으로 다시 기록한다(관측 사실).
  ② 상징 — 그 요소가 어떤 상징 계열로 분류되는지. 억지 확장 금지.
  ③ 수렴 — 같은 구성의 꿈이 어떤 감정 좌표로 수렴하는지, **데이터 관측 톤**으로. 격려·위안 금지.
  ④ 한계 — 딱 한 줄, 차갑게: "꿈 하나로 현실을 확정할 수는 없다."
symbol: 핵심 상징 2~4개, 명사로 짧게.
psychology: 꿈이 드러낸 감정의 **구조**만 건조하게 관측. 현실 추정·위안 금지, 2~4줄.
reflection: 서늘하고 정확한 질문 2~3개(각 줄 ?로 끝). 위로하지 말 것. **꿈과 감정에 대해서만**, 현실 사건 추정 금지.

# 4단계 — 재미 신호 (signals)
- oneLiner: 이 꿈을 한 줄로, 서늘하게 (예: "당신은 올려다보는 쪽에 남아 있었다.")
- directorNote: 연구소장 관측 메모. 매번 말투 다르게, 1~2줄. 건조하게, 위로·예언 금지.
- movies: 이 꿈의 정서와 닮은 영화 1~3편 (title, reason 짧게). 실제 영화만.
- symbolChain: 상징 흐름을 화살표 순서 배열로 (예: ["어머니","음식","집","안정"]) 3~5개.

# labObservations (타인·커뮤니티 패턴 — 여기서만 타인 데이터)
sceneNote 1~2줄, commonBehaviors 3~4개, relatedSearches.

# researchAnchor (DB 색인용)
primary, secondary 2~4, scenePhrases(원문 문장 그대로), clusterLabel.

# communityEstimate
stories 10~12건, profile은 항상 "익명 기록", dreamSnippet 3~4문장, afterStory 2~4문장, 서로 다른 결말.
사용자 원문·scenePhrases를 stories에 복붙하지 말 것.

# 금지 표현 (AI 티)
"복잡한 상황","새로운 시작","긍정적인 변화","성장과 변화","의미로 다가","관련된 장면","비슷한 분위기".

${COMMUNITY_REVIEW_SLOT_SYSTEM}

JSON만 출력 (stories 10개 이상):
{
  "elements": { "people": [], "places": [], "actions": [], "emotions": [], "objects": [], "events": [], "symbols": [] },
  "observation": { "repeatedElements": [], "axes": [], "note": "..." },
  "usualTake": "...",
  "alternativeLens": "...",
  "symbol": "...",
  "psychology": "...",
  "reflection": "...",
  "signals": { "oneLiner": "...", "directorNote": "...", "movies": [{ "title": "...", "reason": "..." }], "symbolChain": [] },
  "keywords": ["..."],
  "researchAnchor": { "primary": "...", "secondary": [], "scenePhrases": [], "clusterLabel": "..." },
  "category": "family|love|career|anxiety|fortune|general",
  "mood": { "anxiety": 0-100, "hope": 0-100, "longing": 0-100 },
  "labObservations": { "sceneNote": "...", "commonBehaviors": [], "relatedSearches": [] },
  "communityEstimate": { "stories": [ ... ], "totalCount": 0, "withFollowUpCount": 0 }
}`;

export const EXPLORE_SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)" 탐색 분석 AI입니다.
글솜씨보다 **근거 있는 관찰**이 목적입니다. 꿈 장면과 30일 뒤 기록을 비교할 수 있게 돕습니다.

${CORE_RULES}

# 해석 (순서 준수, 관측 로그 톤 — 위로 금지)
- usualTake: 일반 해몽 3~6줄 — 이 꿈 장면만, 길흉 단정 금지 (대조용)
- alternativeLens: ① 관측(단정형) → ② 상징 계열 → ③ 수렴(데이터 톤) → ④ 한 줄 한계 순서로 4~7줄. 짧고 건조하게. 타인 후기 언급 금지
- symbol, psychology: 이 꿈만, 감정 구조만 건조하게, 현실 추정·위안 금지
- reflection: 서늘하고 정확한 질문 2~3개(각 줄 ?로 끝). 꿈·감정에 대해서만, 현실 단정 금지

# signals
oneLiner, directorNote(매번 말투 다르게), movies 1~3편(실제 영화), symbolChain 3~5개.

${EXPLORE_COMMUNITY_REVIEW_SYSTEM}

JSON만:
{
  "elements": { "people": [], "places": [], "actions": [], "emotions": [], "objects": [], "events": [], "symbols": [] },
  "observation": { "repeatedElements": [], "axes": [], "note": "..." },
  "usualTake": "...",
  "alternativeLens": "...",
  "symbol": "...",
  "psychology": "...",
  "reflection": "...",
  "signals": { "oneLiner": "...", "directorNote": "...", "movies": [{ "title": "...", "reason": "..." }], "symbolChain": [] },
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
  elements?: {
    people: string[];
    places: string[];
    actions: string[];
    emotions: string[];
    objects: string[];
    events: string[];
    symbols: string[];
  };
  observation?: {
    repeatedElements: string[];
    axes: string[];
    note: string;
  };
  signals?: {
    oneLiner: string;
    directorNote: string;
    movies: { title: string; reason?: string }[];
    symbolChain: string[];
  };
  communityEstimate: Record<string, unknown>;
}

const VAGUE_PHRASE_RE =
  /복잡한 상황|새로운 시작|갈망이 엿|다양한 방향|긍정적인 변화|의미로 다가|성장과 변화|기회를 제공|모순은 단순|괜찮아질|힘내|응원합니다|따뜻하게 감싸/;

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
  "흔한 해몽은 여기서 멈춘다.",
  "관측 기록은 다르게 말한다.",
  "장면을 그대로 두고 겨눠 보면 —",
  "위로를 빼고 관측만 남기면,",
  "데이터는 다른 좌표를 가리킨다.",
];

const CONVERSATIONAL_REFLECTION_CLOSERS = [
  "깬 뒤에도 그 장면이 몸에 남았나요? 어디에 남았나요?",
  "그 장면에서 당신은 보는 쪽이었나요, 보이는 쪽이었나요?",
  "꿈 속에서 가장 크게 느낀 그 감정은 지금 어디로 갔나요?",
  "이 꿈에서 가장 오래 남은 한 장면은 무엇인가요?",
  "같은 꿈을 다시 꾼다면, 어느 지점부터 달라지길 바라나요?",
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
    `전통·인터넷 해몽은 "${anchor}"을(를) 변화나 메시지의 상징으로 분류한다.\n` +
      `"${keyword}"이(가) 나온 꿈은 감정의 압력, 관계의 변화, 미뤄둔 선택으로 묶이곤 한다.\n` +
      `대부분의 해몽은 여기서 멈춘다 — 장면에 뜻 하나를 붙이고 끝낸다.`,
    6,
  );
}

function buildFallbackAlternativeLens(keyword: string, anchor: string, seed: number): string {
  const opener = pick(PIVOT_OPENERS, seed, 3);
  return ensureMultiline(
    `${opener}\n` +
      `관측: 이 꿈에는 "${anchor}"이(가) 있었고, "${keyword}"이(가) 반복해서 지나갔다.\n` +
      `상징: 그 구성은 '통제와 해방', '올려다봄'의 계열로 분류된다.\n` +
      `수렴: 같은 구도를 기록한 꿈들은 흔히 한 방향의 긴장으로 수렴했다 — 위안이 아니라 응시에 가깝다.\n` +
      `꿈 하나로 현실을 확정할 수는 없다.`,
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

  const elements = normalizeElements(raw.elements, keywords, anchor);
  const observation = normalizeObservation(raw.observation, elements, keywords, anchor);
  const signals = normalizeSignals(raw.signals, observation, anchor, seed);

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
    elements,
    observation,
    signals,
  };
}

function cleanList(raw: unknown, limit: number): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((v) => String(v).trim())
    .filter((v) => v.length >= 1)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, limit);
}

function normalizeElements(
  raw: ParsedInterpretation["elements"],
  keywords: string[],
  anchor: string,
): ParsedInterpretation["elements"] {
  const e = (raw ?? {}) as Record<string, unknown>;
  const elements = {
    people: cleanList(e.people, 5),
    places: cleanList(e.places, 5),
    actions: cleanList(e.actions, 5),
    emotions: cleanList(e.emotions, 5),
    objects: cleanList(e.objects, 5),
    events: cleanList(e.events, 5),
    symbols: cleanList(e.symbols, 5),
  };
  // 완전 비었으면 최소한 앵커·키워드로 상징을 채움
  const total = Object.values(elements).reduce((n, arr) => n + arr.length, 0);
  if (total === 0) {
    elements.symbols = [anchor, ...keywords].filter(
      (v, i, a) => v.length >= 2 && a.indexOf(v) === i,
    ).slice(0, 3);
  }
  return elements;
}

function normalizeObservation(
  raw: ParsedInterpretation["observation"],
  elements: ParsedInterpretation["elements"],
  keywords: string[],
  anchor: string,
): ParsedInterpretation["observation"] {
  const o = (raw ?? {}) as Record<string, unknown>;
  const pool = elements
    ? [
        ...elements.people,
        ...elements.objects,
        ...elements.symbols,
        ...elements.actions,
      ]
    : [];
  const repeatedElements = cleanList(o.repeatedElements, 4);
  const axes = cleanList(o.axes, 3);
  return {
    repeatedElements:
      repeatedElements.length > 0
        ? repeatedElements
        : [...pool, anchor, ...keywords]
            .filter((v, i, a) => v.length >= 2 && a.indexOf(v) === i)
            .slice(0, 3),
    axes: axes.length > 0 ? axes : elements?.symbols.slice(0, 3) ?? [anchor],
    note:
      typeof o.note === "string" && o.note.trim().length >= 4
        ? String(o.note).trim()
        : `관측: 이 꿈에서 ${anchor} 요소가 반복해서 나타났다.`,
  };
}

const DIRECTOR_NOTES = [
  "관측 종료. 이 꿈은 해석보다 기록으로 남길 값이 큽니다.",
  "이 구성은 흔치 않습니다. 30일 뒤 기록과 겹쳐 보면 좌표가 선명해집니다.",
  "꿈은 예고하지 않습니다. 다만 지금 무엇이 큰지 정확히 가리킵니다.",
  "뜻을 찾지 마세요. 남은 감정의 좌표만 기록해 두면 됩니다.",
];

function normalizeSignals(
  raw: ParsedInterpretation["signals"],
  observation: ParsedInterpretation["observation"],
  anchor: string,
  seed: number,
): ParsedInterpretation["signals"] {
  const s = (raw ?? {}) as Record<string, unknown>;
  const movies = Array.isArray(s.movies)
    ? (s.movies as unknown[])
        .map((m) => {
          const mm = (m ?? {}) as Record<string, unknown>;
          return {
            title: String(mm.title ?? "").trim(),
            reason: mm.reason ? String(mm.reason).trim() : undefined,
          };
        })
        .filter((m) => m.title.length >= 1)
        .slice(0, 3)
    : [];
  const symbolChain = cleanList(s.symbolChain, 5);
  return {
    oneLiner:
      typeof s.oneLiner === "string" && s.oneLiner.trim().length >= 4
        ? String(s.oneLiner).trim()
        : `${anchor}이(가) 지나간 자리에 감정의 좌표만 남았다.`,
    directorNote:
      typeof s.directorNote === "string" && s.directorNote.trim().length >= 6
        ? String(s.directorNote).trim()
        : pick(DIRECTOR_NOTES, seed),
    movies,
    symbolChain:
      symbolChain.length >= 2
        ? symbolChain
        : (observation?.repeatedElements ?? [anchor]).slice(0, 4),
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
