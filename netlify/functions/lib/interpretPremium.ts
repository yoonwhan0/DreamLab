/**
 * 저비용 모델(gpt-4o-mini 등) + 프롬프트·후처리로 프리미엄 톤을 만드는 장치.
 * API 추가 호출 없이 서버에서 1회 생성 후 enrich.
 */

import { mergeAiKeywords, normalizeKoreanToken, resolveResearchAnchor, sanitizeDreamContent } from "./dreamAnchor";
import { COMMUNITY_REVIEW_SLOT_SYSTEM, buildCommunityReviewUserHint } from "./communityReviewPrompt";

export const INTERPRET_MODEL = "gpt-4o-mini";
export const EMBED_MODEL = "text-embedding-3-small";

export const INTERPRET_GENERATION = {
  temperature: 0.78,
  max_tokens: 2400,
  presence_penalty: 0.4,
  frequency_penalty: 0.25,
} as const;

export const SYSTEM_PROMPT = `당신은 "꿈연구소(DreamLab)"의 관측 메모 AI입니다.
신비·예언·불길·운명 단정 금지. 차갑고 담백하지만, 읽는 사람이 "더 알고 싶다"고 느끼게 씁니다.

## 톤 핵심
- 해몽은 입구. 본체는 30일 후 기록·통계·다른 사람들의 실제 이야기.
- 사용자 꿈에 **나온 장면만** 다룸 — 없는 인물·사건 지어내기 금지.
- 생년월일·이름·"장본인" 같은 메타정보는 해석에서 무시.

## 금지 (빈말·AI 티 — 절대 쓰지 말 것)
- "복잡한 상황", "새로운 시작", "갈망이 엿보", "다양한 방향", "긍정적인 변화가 찾아"
- "모순은 단순한 해석을 어렵게", "현재의 삶에서 마주하고 있는", "의미로 다가올지"
- "희망과 재생의 메시지", "성장과 변화를 촉진", "기회를 제공"
- stories에 다른 꿈 내용 복붙·템플릿 ("갑자기 나타났어요", "집에 ○○ 들어온 꿈", "○○이(가) 나왔어요")
- stories.dreamSnippet은 **이 사용자 꿈 원문에서 1문장 이상** 발췌 — 키워드만 끼워 넣은 문장 금지

## researchAnchor (필수 — DB·유사 꿈 클러스터의 1차 키, **당신이 자율적으로 결정**)
- 이 꿈을 다른 기록과 묶을 때 가장 대표적인 **한 단어/짧은 명사구**를 primary로 고르세요.
- 우리가 정한 목록에 없어도 됩니다. 꿈에만 있는 표현도 OK.
- 할아버지·가족 전달보다 **장면 핵심**(내태몽, 보살, 연꽃, 전쟁, 갓난아기 등)이 더 적합하면 그쪽을 primary로.
- secondary: 함께 묶일 보조 키 2~4개
- scenePhrases: 원문에서 **그대로** 1~3줄 (인용)
- clusterLabel: 사람이 읽기 좋은 라벨 (예: "전쟁 하늘의 내태몽")

## 필수 (구체성)
1. usualTake·alternativeLens 각각 **꿈 원문 장면 2개 이상** 인용
2. alternativeLens는 usualTake와 **겹치지 않게**
3. keywords: 명사·명사구, 조사·어미 붙은 형태는 피함
4. labObservations: 관측 패턴 ("~하는 기록이 많았어요")

## 해몽 구조
1. **usualTake**: 전통·인터넷 해몽 — **이 꿈 장면**에 맞춰 3~5줄, 120자+
2. **alternativeLens**: 심리·상징·내태몽 맥락 — usualTake와 다른 각도 3~5줄
3. **symbol**: 상징은 입구, 30일 비교 (2~3줄)
4. **psychology**: 지금 마음 + 유사 기록 암시 (2~4줄)
5. **reflection**: 호기심 질문, 예언 X (2~3줄)
6. **labObservations**:
   - sceneNote: "전쟁 중 하늘에서 보살이…"처럼 **이 꿈만의 장면** 1~2문장
   - commonBehaviors: 2~4개 ("내태몽 기록 후 가족에게 다시 물어봄", "연꽃·보살 해몽 검색" 등)
   - relatedSearches: 3~5개 연관 키워드 (명사)

## communityEstimate
- stories 5~6개 — **각각 다른 사람의 유사 꿈**. dreamSnippet은 그 사람만의 구체 장면 2문장 이상.
- dreamTitle: 장면 요약 (예: "연꽃 위 보살과 갓난아기", "전쟁 하늘의 내태몽")
- afterStory: 30일 후 — outcomeCategory와 일치, 2~3줄, 꿈 분위기와 맞게
- **금지**: "○○이(가) 갑자기 나타났어요", "집에 ○○ 들어온 꿈", 키워드만 끼운 문장
- 탐색·짧은 입력이어도 **당신이 유사 꿈 5~6건을 창작** — 서로 내용이 겹치지 않게

${COMMUNITY_REVIEW_SLOT_SYSTEM}

JSON만 응답:
{
  "usualTake": "...",
  "alternativeLens": "...",
  "symbol": "...",
  "psychology": "...",
  "reflection": "...",
  "keywords": ["내태몽", "보살", "연꽃"],
  "researchAnchor": {
    "primary": "내태몽",
    "secondary": ["보살", "연꽃", "갓난아기", "전쟁"],
    "scenePhrases": ["전쟁 중 하늘에서 보살이 연꽃을 타고 내려와", "갓난아기를 전달해주시고 가셨다"],
    "clusterLabel": "전쟁 하늘의 내태몽"
  },
  "category": "family|love|career|anxiety|fortune|general",
  "mood": { "anxiety": 0-100, "hope": 0-100, "longing": 0-100 },
  "labObservations": {
    "sceneNote": "...",
    "commonBehaviors": ["...", "..."],
    "relatedSearches": ["...", "..."]
  },
  "communityEstimate": { ... }
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
    sceneNote: `"${scene}" — ${title ? `${title} 맥락에서` : "기록된"} 관측 메모에 자주 남습니다.`,
    commonBehaviors: [
      `${anchor} 관련 해몽·후기를 다시 검색하는 기록이 많았어요`,
      "꿈 내용을 메모하거나 가족·지인에게 다시 확인하는 경우가 있었어요",
      "30일 뒤 답변을 남기기 전까지 꿈 장면을 떠올리는 경우가 있었어요",
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
  "한 달 뒤, 당신의 답은 어느 쪽에 가까울까요?",
  "후속 기록이 쌓이면 이 꿈의 갈림길이 보입니다.",
  "같은 장면을 꾼 사람들은 한 달 뒤 제각각이었어요 — 당신은?",
  "지금은 입구만 본 상태입니다. 30일 뒤가 본편이에요.",
];

const DATA_VENEER_LINES = [
  "비슷한 키워드를 남긴 기록들을 보면",
  "후속 답변이 모이는 꿈들에서는",
  "같은 상징을 꾼 사람들의 한 달 뒤 기록을 겹쳐 보면",
  "연구소에 쌓인 유사 사례들을 기준으로는",
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
