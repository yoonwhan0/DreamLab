/** 앵커·키워드 — AI 1차, 규칙은 정리·폴백만 */

export const ANCHOR_STOP_WORDS = new Set([
  "제목",
  "내용",
  "꿈",
  "꿈내용",
  "기록",
  "마음",
  "변화",
  "general",
  "anxiety",
  "장본인",
  "연구소",
  "태생",
]);

const METADATA_LINE_RE =
  /^\s*(\d{4}\s*년|\d{1,2}\s*월|\d{1,2}\s*일|\d{1,2}\s*시|\d{1,2}\s*분|태생|생년|장본인|연구소를\s*만든)/;

const BIRTH_BLOCK_RE =
  /\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일[\s\S]*?\d{1,2}\s*시\s*\d{1,2}\s*분/g;

/** 생년월일·운영 메타는 해석 보조에서만 제외 */
export function sanitizeDreamContent(text: string): string {
  return text
    .replace(BIRTH_BLOCK_RE, " ")
    .split("\n")
    .filter((line) => !METADATA_LINE_RE.test(line.trim()))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeDreamText(text: string): string[] {
  return sanitizeDreamContent(text)
    .replace(/[^\w\s가-힣·]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
}

/** 조사·어미만 가볍게 제거 — AI·사용자 명사는 막지 않음 */
export function normalizeKoreanToken(raw: string): string {
  let t = raw.trim();
  if (!t) return "";
  t = t.replace(/(이)?(였|었)(다고|다|어요|습니다|어|네요|죠|요|고)?$/u, "");
  t = t.replace(/(하|꿔|전해|말씀|해|받)(셨|았|였|으)?(어|다|고|요)?$/u, "");
  t = t.replace(/(이라|라)(고|며|서)?$/u, "");
  t = t.replace(/[이가을를은는과와도에의]$/u, "");
  if (t.startsWith("내태") && t.includes("몽")) return "내태몽";
  return t;
}

export function isValidKeywordToken(token: string): boolean {
  const n = normalizeKoreanToken(token);
  if (n.length < 2 || n.length > 20) return false;
  if (ANCHOR_STOP_WORDS.has(n)) return false;
  if (/^\d+$/.test(n)) return false;
  if (/^\d{4}$/.test(n)) return false;
  return true;
}

/** AI 없을 때만 — 토큰 분리 폴백 */
export function extractHeuristicKeywords(text: string, limit = 6): string[] {
  const cleaned = sanitizeDreamContent(text);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tokenizeDreamText(cleaned)) {
    for (const part of raw.split(/[와과및·]/).filter((p) => p.length >= 2)) {
      const n = normalizeKoreanToken(part);
      if (!isValidKeywordToken(n) || seen.has(n)) continue;
      seen.add(n);
      result.push(n);
      if (result.length >= limit) return result;
    }
  }
  return result;
}

/** @deprecated AI mergeAiKeywords 사용 */
export function extractMeaningfulKeywords(text: string, limit = 6): string[] {
  return extractHeuristicKeywords(text, limit);
}

/** AI keywords 우선 — 부족할 때만 휴리스틱 보충 */
export function mergeAiKeywords(
  aiKeywords: string[],
  title: string,
  content: string,
  limit = 6,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of aiKeywords) {
    const n = normalizeKoreanToken(raw);
    if (!isValidKeywordToken(n) || seen.has(n)) continue;
    seen.add(n);
    result.push(n);
  }

  if (result.length < 3) {
    for (const k of extractHeuristicKeywords(`${title} ${content}`, limit)) {
      if (seen.has(k)) continue;
      seen.add(k);
      result.push(k);
      if (result.length >= limit) break;
    }
  }

  return result.slice(0, limit);
}

/** @deprecated mergeAiKeywords */
export function refineDisplayKeywords(
  aiKeywords: string[],
  title: string,
  content: string,
  limit = 6,
): string[] {
  return mergeAiKeywords(aiKeywords, title, content, limit);
}

export interface ResearchAnchorLike {
  primary?: string;
  secondary?: string[];
  scenePhrases?: string[];
  clusterLabel?: string;
}

export interface InterpretationAnchorInput {
  keywords?: string[];
  researchAnchor?: ResearchAnchorLike;
}

/** 통계·DB·유사 꿈 — AI researchAnchor.primary 최우선 */
export function resolveResearchAnchor(
  interpretation: InterpretationAnchorInput,
  title: string,
  content: string,
): string {
  const primary = interpretation.researchAnchor?.primary?.trim();
  if (primary) {
    const n = normalizeKoreanToken(primary);
    if (isValidKeywordToken(n)) return n;
    if (n.length >= 2) return n;
  }

  for (const k of interpretation.keywords ?? []) {
    const n = normalizeKoreanToken(k);
    if (isValidKeywordToken(n)) return n;
  }

  for (const k of interpretation.researchAnchor?.secondary ?? []) {
    const n = normalizeKoreanToken(k);
    if (isValidKeywordToken(n)) return n;
  }

  return extractHeuristicKeywords(`${title} ${content}`, 1)[0] ?? "꿈";
}

export function resolveAnchorFromText(
  title: string,
  keywords: string[] = [],
  content = "",
): string {
  return resolveResearchAnchor({ keywords }, title, content);
}

export interface ParsedDreamInput {
  title: string;
  content: string;
}

export function parseDreamInput(raw: string): ParsedDreamInput {
  const trimmed = raw.trim();
  if (!trimmed) return { title: "꿈 기록", content: "" };

  const inline = trimmed.match(
    /^\s*제목\s*[:：]?\s*(.+?)\s+꿈\s*내용\s*[:：]?\s*(.+)$/s,
  );
  if (inline) {
    const title = inline[1]!.trim().replace(/\s*꿈\s*$/, "").trim();
    const content = inline[2]!.trim();
    return {
      title: title || extractTitleFromContent(content),
      content,
    };
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const first = lines[0]!.replace(/^\s*제목\s*[:：]?\s*/, "").trim();
    const rest = lines
      .slice(1)
      .join("\n")
      .replace(/^\s*꿈\s*내용\s*[:：]?\s*/i, "")
      .trim();
    if (rest.length >= 5) {
      return {
        title: first.replace(/\s*꿈\s*$/, "").trim() || extractTitleFromContent(rest),
        content: rest,
      };
    }
  }

  const titleOnly = trimmed.replace(/^\s*제목\s*[:：]?\s*/, "").trim();
  if (titleOnly.length <= 40 && !titleOnly.includes("도로") && !titleOnly.includes("꿈")) {
    return { title: titleOnly, content: trimmed };
  }

  return {
    title: extractTitleFromContent(trimmed),
    content: trimmed,
  };
}

export function extractTitleFromContent(content: string): string {
  const keywords = extractHeuristicKeywords(content, 3);
  if (keywords.length >= 2) {
    return `${keywords[0]}와 ${keywords[1]}`.slice(0, 40);
  }
  if (keywords[0]) return keywords[0].slice(0, 40);

  const firstLine = sanitizeDreamContent(content).split("\n")[0]?.trim() ?? "";
  if (firstLine.length < 2) return "꿈 기록";
  const cleaned = firstLine.replace(/^\s*제목\s*[:：]?\s*/, "").trim();
  if (cleaned.length <= 40) return cleaned;
  return `${cleaned.slice(0, 40)}…`;
}

/** @deprecated lexicon 제거 — 폴백 없음 */
export function extractDreamSymbols(_text: string): string[] {
  return [];
}

export function isStrongAnchor(token: string): boolean {
  return isValidKeywordToken(token);
}

export function extractDreamAnchor(content: string): string | null {
  return extractHeuristicKeywords(content, 1)[0] ?? null;
}
