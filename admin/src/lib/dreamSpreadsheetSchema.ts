import * as XLSX from "xlsx";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import type { DreamEmotionId, DreamInterpretation, OutcomeCategory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

/** Admin 시드 데이터 — Firestore dreams.userId */
export const ADMIN_SEED_USER_ID = "dreamlab-seed-data";

/** Firestore dreams 문서 — admin 조회·엑셀 전체 컬럼 */
export const SPREADSHEET_COLUMNS = [
  { key: "docId", header: "문서ID", width: 120 },
  { key: "createdAt", header: "작성일", width: 110 },
  { key: "source", header: "출처", width: 72 },
  { key: "userId", header: "회원UID", width: 100 },
  { key: "userEmail", header: "이메일", width: 140 },
  { key: "title", header: "제목", width: 140 },
  { key: "content", header: "꿈내용", width: 320 },
  { key: "emotions", header: "감정", width: 88 },
  { key: "category", header: "분류", width: 72 },
  { key: "keywords", header: "키워드", width: 120 },
  { key: "anchor", header: "앵커", width: 80 },
  { key: "clusterLabel", header: "클러스터", width: 100 },
  { key: "secondaryAnchors", header: "보조앵커", width: 100 },
  { key: "scenePhrases", header: "장면구문", width: 220 },
  { key: "usualTake", header: "일반해몽", width: 240 },
  { key: "alternativeLens", header: "연구소입장", width: 240 },
  { key: "symbol", header: "상징", width: 160 },
  { key: "psychology", header: "지금상태", width: 200 },
  { key: "reflection", header: "30일갈림", width: 200 },
  { key: "moodAnxiety", header: "불안%", width: 56 },
  { key: "moodHope", header: "희망%", width: 56 },
  { key: "moodLonging", header: "그리움%", width: 56 },
  { key: "labSceneNote", header: "관측장면", width: 200 },
  { key: "labBehaviors", header: "관측행동", width: 200 },
  { key: "labRelatedSearches", header: "관측검색", width: 120 },
  { key: "followUpDueAt", header: "30일예정", width: 110 },
  { key: "followUpReminderSent", header: "알림발송", width: 72 },
  { key: "outcomeCategory", header: "30일결과", width: 96 },
  { key: "afterStory", header: "30일후기", width: 280 },
  { key: "followUpAnsweredAt", header: "후기작성일", width: 110 },
  { key: "followUpEmotions", header: "후기감정", width: 88 },
  { key: "profile", header: "프로필", width: 120 },
  { key: "seedProfile", header: "시드프로필", width: 120 },
  { key: "likes", header: "좋아요", width: 56 },
  { key: "isPublic", header: "공개", width: 56 },
  { key: "seedSource", header: "시드출처", width: 88 },
  { key: "importedBy", header: "업로드UID", width: 100 },
  { key: "importedAt", header: "업로드일", width: 110 },
] as const;

export type SpreadsheetColumnKey = (typeof SPREADSHEET_COLUMNS)[number]["key"];

export interface DreamSpreadsheetRow {
  /** @deprecated docId 사용 — 삭제 API 호환 */
  id?: string;
  docId: string;
  createdAt: string;
  source: string;
  userId: string;
  userEmail: string;
  title: string;
  content: string;
  category: string;
  keywords: string;
  anchor: string;
  clusterLabel: string;
  secondaryAnchors: string;
  scenePhrases: string;
  usualTake: string;
  alternativeLens: string;
  symbol: string;
  psychology: string;
  reflection: string;
  moodAnxiety: string;
  moodHope: string;
  moodLonging: string;
  labSceneNote: string;
  labBehaviors: string;
  labRelatedSearches: string;
  emotions: string;
  followUpDueAt: string;
  followUpReminderSent: string;
  outcomeCategory: string;
  afterStory: string;
  followUpAnsweredAt: string;
  followUpEmotions: string;
  profile: string;
  seedProfile: string;
  likes: string;
  isPublic: string;
  seedSource: string;
  importedBy: string;
  importedAt: string;
  _errors?: string[];
}

const HEADER_ALIASES: Record<string, SpreadsheetColumnKey> = {
  문서id: "docId",
  docId: "docId",
  id: "docId",
  작성일: "createdAt",
  createdAt: "createdAt",
  출처: "source",
  source: "source",
  회원uid: "userId",
  userId: "userId",
  uid: "userId",
  이메일: "userEmail",
  email: "userEmail",
  userEmail: "userEmail",
  제목: "title",
  title: "title",
  꿈내용: "content",
  content: "content",
  분류: "category",
  category: "category",
  키워드: "keywords",
  keywords: "keywords",
  앵커: "anchor",
  anchor: "anchor",
  클러스터: "clusterLabel",
  clusterLabel: "clusterLabel",
  보조앵커: "secondaryAnchors",
  secondaryAnchors: "secondaryAnchors",
  장면구문: "scenePhrases",
  scenePhrases: "scenePhrases",
  일반해몽: "usualTake",
  usualTake: "usualTake",
  연구소입장: "alternativeLens",
  alternativeLens: "alternativeLens",
  상징: "symbol",
  symbol: "symbol",
  지금상태: "psychology",
  psychology: "psychology",
  "30일갈림": "reflection",
  reflection: "reflection",
  "불안%": "moodAnxiety",
  moodAnxiety: "moodAnxiety",
  "희망%": "moodHope",
  moodHope: "moodHope",
  "그리움%": "moodLonging",
  moodLonging: "moodLonging",
  관측장면: "labSceneNote",
  labSceneNote: "labSceneNote",
  관측행동: "labBehaviors",
  labBehaviors: "labBehaviors",
  관측검색: "labRelatedSearches",
  labRelatedSearches: "labRelatedSearches",
  감정: "emotions",
  emotions: "emotions",
  "30일예정": "followUpDueAt",
  followUpDueAt: "followUpDueAt",
  알림발송: "followUpReminderSent",
  followUpReminderSent: "followUpReminderSent",
  "30일결과": "outcomeCategory",
  outcome: "outcomeCategory",
  outcomeCategory: "outcomeCategory",
  "30일후기": "afterStory",
  afterStory: "afterStory",
  후기작성일: "followUpAnsweredAt",
  followUpAnsweredAt: "followUpAnsweredAt",
  후기감정: "followUpEmotions",
  followUpEmotions: "followUpEmotions",
  프로필: "profile",
  profile: "profile",
  시드프로필: "seedProfile",
  seedProfile: "seedProfile",
  좋아요: "likes",
  likes: "likes",
  공개: "isPublic",
  isPublic: "isPublic",
  public: "isPublic",
  시드출처: "seedSource",
  seedSource: "seedSource",
  업로드uid: "importedBy",
  importedBy: "importedBy",
  업로드일: "importedAt",
  importedAt: "importedAt",
};

const EMOTION_ALIASES: Record<string, DreamEmotionId> = {
  scared: "scared",
  무서움: "scared",
  무서: "scared",
  weird: "weird",
  이상함: "weird",
  이상: "weird",
  calm: "calm",
  평온: "calm",
  sad: "sad",
  슬픔: "sad",
  슬: "sad",
  happy: "happy",
  행복: "happy",
};

const OUTCOME_ALIASES: Record<string, OutcomeCategory> = {
  nothing: "nothing",
  별일없었음: "nothing",
  "별일 없었음": "nothing",
  good: "good",
  "좋은 일": "good",
  좋은일: "good",
  bad: "bad",
  "나쁜 일": "bad",
  나쁜일: "bad",
  love: "love",
  연애: "love",
  job: "job",
  직장: "job",
  health: "health",
  건강: "health",
  family: "family",
  가족: "family",
  money: "money",
  돈: "money",
  other: "other",
  기타: "other",
};

export function parseEmotions(raw: string): DreamEmotionId[] {
  const parts = raw
    .split(/[,，、/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ids = parts
    .map((p) => EMOTION_ALIASES[p] ?? EMOTION_ALIASES[p.toLowerCase()])
    .filter((v): v is DreamEmotionId => Boolean(v));
  return ids.length > 0 ? [...new Set(ids)] : ["weird"];
}

export function parseOutcome(raw: string): OutcomeCategory {
  const key = raw.trim();
  if (!key) return "nothing";
  const direct = OUTCOME_ALIASES[key] ?? OUTCOME_ALIASES[key.replace(/\s/g, "")];
  if (direct) return direct;
  const fromLabel = (Object.entries(OUTCOME_CATEGORIES) as [OutcomeCategory, string][]).find(
    ([, label]) => label === key,
  );
  return fromLabel?.[0] ?? "nothing";
}

export function parseIsPublic(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v || v === "y" || v === "yes" || v === "true" || v === "1" || v === "공개") return true;
  return false;
}

function cellStr(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeHeader(h: string): string {
  return h.replace(/\s/g, "").toLowerCase();
}

function blankRowFields(): Omit<DreamSpreadsheetRow, "_errors"> {
  const row = {} as Omit<DreamSpreadsheetRow, "_errors">;
  for (const col of SPREADSHEET_COLUMNS) {
    row[col.key] = "";
  }
  return row;
}

export function emptyRow(): DreamSpreadsheetRow {
  return {
    ...blankRowFields(),
    source: "seed",
    emotions: "weird",
    profile: "익명 · 29 · 서울",
    likes: "0",
    isPublic: "Y",
  };
}

export function validateRow(row: DreamSpreadsheetRow, index: number): DreamSpreadsheetRow {
  const errors: string[] = [];
  if (!row.content || row.content.length < 8) {
    errors.push(`${index + 1}행: 꿈내용 8자 이상`);
  }
  if (row.afterStory && !row.outcomeCategory) {
    errors.push(`${index + 1}행: 30일후기 있으면 30일결과 필요`);
  }
  return { ...row, _errors: errors.length ? errors : undefined };
}

function rowFromRecord(get: (key: SpreadsheetColumnKey) => string): DreamSpreadsheetRow {
  const base = emptyRow();
  for (const col of SPREADSHEET_COLUMNS) {
    const v = get(col.key);
    if (v) base[col.key] = v;
  }
  if (!base.source) base.source = "seed";
  if (!base.emotions) base.emotions = "weird";
  if (!base.likes) base.likes = "0";
  if (!base.isPublic) base.isPublic = "Y";
  return base;
}

export function parseWorkbookToRows(file: ArrayBuffer): DreamSpreadsheetRow[] {
  const wb = XLSX.read(file, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) return [];

  const first = matrix[0]!;
  const colMap = new Map<SpreadsheetColumnKey, string>();
  for (const header of Object.keys(first)) {
    const norm = normalizeHeader(header);
    const key = HEADER_ALIASES[norm] ?? HEADER_ALIASES[header.trim()];
    if (key) colMap.set(key, header);
  }

  return matrix
    .map((record) => {
      const get = (key: SpreadsheetColumnKey) => {
        const h = colMap.get(key);
        return h ? cellStr(record[h]) : "";
      };
      return validateRow(rowFromRecord(get), 0);
    })
    .filter((row) => row.content.length > 0)
    .map((row, i) => validateRow(row, i));
}

export function rowsToSheet(rows: DreamSpreadsheetRow[]): XLSX.WorkBook {
  const data = rows.map((r) => {
    const record: Record<string, string> = {};
    for (const col of SPREADSHEET_COLUMNS) {
      record[col.header] = String(r[col.key] ?? "");
    }
    return record;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = SPREADSHEET_COLUMNS.map((c) => ({ wch: Math.max(12, Math.round(c.width / 7)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "꿈DB");
  return wb;
}

export function downloadTemplate(filename = "dreamlab-DB-양식.xlsx"): void {
  const sample: DreamSpreadsheetRow[] = [
    {
      ...emptyRow(),
      title: "현관문 반쯤 열린 새벽",
      content:
        "새벽 네 시쯤 깼는데 현관문이 반쯤 열린 채였어요. 바깥은 안개였고 누군가 이름을 부르는데 제 목소리 같았습니다.",
      category: "일반",
      keywords: "집,현관,새벽",
      anchor: "집",
      emotions: "scared,weird",
      outcomeCategory: "별일 없었음",
      afterStory: "30일 지나도 큰 사건은 없었어요. 그런데 꿈 장면만큼은 자주 떠올랐습니다.",
      followUpEmotions: "calm",
      profile: "익명 · 28 · 수원",
    },
    {
      ...emptyRow(),
      title: "로또 번호가 사라진 날",
      content:
        "로또 번호가 하늘에 떠 있다가 하나씩 사라졌어요. 깨자마자 번호를 적으려다 손가락이 안 움직였습니다.",
      category: "재물",
      keywords: "로또,돈,번호",
      anchor: "로또",
      emotions: "weird,happy",
      outcomeCategory: "좋은 일",
      afterStory: "작은 행운이 있었어요. 로또 당첨은 아니지만 미뤄두던 일이 순조로워졌습니다.",
      followUpEmotions: "calm",
      profile: "익명 · 33 · 마포",
    },
  ];
  XLSX.writeFile(rowsToSheet(sample), filename);
}

export function downloadRowsAsXlsx(rows: DreamSpreadsheetRow[], filename: string): void {
  XLSX.writeFile(rowsToSheet(rows), filename);
}

export function dbExportFilename(): string {
  return `dreamlab-DB-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export function buildSeedInterpretation(row: DreamSpreadsheetRow): DreamInterpretation {
  const keywords = row.keywords
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const anchor = row.anchor.trim() || keywords[0] || "꿈";
  const kw = keywords.length > 0 ? keywords : [anchor];
  const secondary = row.secondaryAnchors
    .split(/[,，、|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const scenePhrases = row.scenePhrases
    .split(/\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    usualTake: row.usualTake.trim(),
    alternativeLens: row.alternativeLens.trim(),
    symbol: row.symbol.trim(),
    psychology: row.psychology.trim(),
    reflection: row.reflection.trim(),
    keywords: kw,
    category: row.category.trim() || inferCategoryFromKeyword(anchor),
    mood: {
      anxiety: Number.parseInt(row.moodAnxiety, 10) || 0,
      hope: Number.parseInt(row.moodHope, 10) || 0,
      longing: Number.parseInt(row.moodLonging, 10) || 0,
    },
    labObservations: row.labSceneNote.trim()
      ? {
          sceneNote: row.labSceneNote.trim(),
          commonBehaviors: row.labBehaviors
            .split(/\||\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          relatedSearches: row.labRelatedSearches
            .split(/[,，、|]/)
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : undefined,
    researchAnchor: {
      primary: anchor,
      secondary: secondary.length > 0 ? secondary : undefined,
      scenePhrases: scenePhrases.length > 0 ? scenePhrases : undefined,
      clusterLabel: row.clusterLabel.trim() || `${anchor} 관련 꿈`,
    },
  };
}

export function outcomeLabel(cat: OutcomeCategory): string {
  return OUTCOME_CATEGORIES[cat];
}

/** textarea 행 수 — 내용 전체가 보이도록 */
export function spreadsheetTextareaRows(key: SpreadsheetColumnKey, value: string): number {
  const longKeys: SpreadsheetColumnKey[] = [
    "content",
    "afterStory",
    "usualTake",
    "alternativeLens",
    "symbol",
    "psychology",
    "reflection",
    "scenePhrases",
    "labSceneNote",
    "labBehaviors",
  ];
  const min = longKeys.includes(key) ? 4 : key === "docId" ? 2 : 2;
  if (!value) return min;
  const lineCount = value.split("\n").length;
  const wrapLines = Math.ceil(value.length / 42);
  return Math.min(32, Math.max(min, lineCount, wrapLines));
}
