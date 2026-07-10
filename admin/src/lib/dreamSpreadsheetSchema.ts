import * as XLSX from "xlsx";
import { inferCategoryFromKeyword } from "@/lib/keywordNarratives";
import type { DreamEmotionId, DreamInterpretation, OutcomeCategory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

/** Admin 시드 데이터 — Firestore dreams.userId */
export const ADMIN_SEED_USER_ID = "dreamlab-seed-data";

export const SPREADSHEET_COLUMNS = [
  { key: "title", header: "제목", width: 140 },
  { key: "content", header: "꿈내용", width: 280 },
  { key: "keywords", header: "키워드", width: 120 },
  { key: "anchor", header: "앵커", width: 80 },
  { key: "emotions", header: "감정", width: 90 },
  { key: "outcomeCategory", header: "30일결과", width: 100 },
  { key: "afterStory", header: "30일후기", width: 240 },
  { key: "profile", header: "프로필", width: 120 },
  { key: "isPublic", header: "공개", width: 56 },
] as const;

export type SpreadsheetColumnKey = (typeof SPREADSHEET_COLUMNS)[number]["key"];

export interface DreamSpreadsheetRow {
  id?: string;
  title: string;
  content: string;
  keywords: string;
  anchor: string;
  emotions: string;
  outcomeCategory: string;
  afterStory: string;
  profile: string;
  isPublic: string;
  createdAt?: string;
  _errors?: string[];
}

const HEADER_ALIASES: Record<string, SpreadsheetColumnKey> = {
  제목: "title",
  title: "title",
  꿈내용: "content",
  꿈내용스니펫: "content",
  content: "content",
  snippet: "content",
  키워드: "keywords",
  keywords: "keywords",
  앵커: "anchor",
  anchor: "anchor",
  감정: "emotions",
  emotions: "emotions",
  "30일결과": "outcomeCategory",
  outcome: "outcomeCategory",
  outcomeCategory: "outcomeCategory",
  "30일후기": "afterStory",
  afterstory: "afterStory",
  afterStory: "afterStory",
  프로필: "profile",
  profile: "profile",
  공개: "isPublic",
  isPublic: "isPublic",
  public: "isPublic",
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

export function emptyRow(): DreamSpreadsheetRow {
  return {
    title: "",
    content: "",
    keywords: "",
    anchor: "",
    emotions: "weird",
    outcomeCategory: "",
    afterStory: "",
    profile: "익명 · 29 · 서울",
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
      return validateRow(
        {
          title: get("title"),
          content: get("content"),
          keywords: get("keywords"),
          anchor: get("anchor"),
          emotions: get("emotions") || "weird",
          outcomeCategory: get("outcomeCategory"),
          afterStory: get("afterStory"),
          profile: get("profile"),
          isPublic: get("isPublic") || "Y",
        },
        0,
      );
    })
    .filter((row) => row.content.length > 0)
    .map((row, i) => validateRow(row, i));
}

export function rowsToSheet(rows: DreamSpreadsheetRow[]): XLSX.WorkBook {
  const data = rows.map((r) => ({
    제목: r.title,
    꿈내용: r.content,
    키워드: r.keywords,
    앵커: r.anchor,
    감정: r.emotions,
    "30일결과": r.outcomeCategory,
    "30일후기": r.afterStory,
    프로필: r.profile,
    공개: r.isPublic,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = SPREADSHEET_COLUMNS.map((c) => ({ wch: Math.round(c.width / 8) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "꿈DB");
  return wb;
}

export function downloadTemplate(filename = "dreamlab-꿈DB-템플릿.xlsx"): void {
  const sample: DreamSpreadsheetRow[] = [
    {
      title: "현관문 반쯤 열린 새벽",
      content:
        "새벽 네 시쯤 깼는데 현관문이 반쯤 열린 채였어요. 바깥은 안개였고 누군가 이름을 부르는데 제 목소리 같았습니다.",
      keywords: "집,현관,새벽",
      anchor: "집",
      emotions: "scared,weird",
      outcomeCategory: "별일 없었음",
      afterStory: "30일 지나도 큰 사건은 없었어요. 그런데 꿈 장면만큼은 자주 떠올랐습니다.",
      profile: "익명 · 28 · 수원",
      isPublic: "Y",
    },
    {
      title: "로또 번호가 사라진 날",
      content: "로또 번호가 하늘에 떠 있다가 하나씩 사라졌어요. 깨자마자 번호를 적으려다 손가락이 안 움직였습니다.",
      keywords: "로또,돈,번호",
      anchor: "로또",
      emotions: "weird,happy",
      outcomeCategory: "좋은 일",
      afterStory: "작은 행운이 있었어요. 로또 당첨은 아니지만 미뤄두던 일이 순조로워졌습니다.",
      profile: "익명 · 33 · 마포",
      isPublic: "Y",
    },
  ];
  const wb = rowsToSheet(sample);
  XLSX.writeFile(wb, filename);
}

export function downloadRowsAsXlsx(rows: DreamSpreadsheetRow[], filename: string): void {
  XLSX.writeFile(rowsToSheet(rows), filename);
}

export function buildSeedInterpretation(row: DreamSpreadsheetRow): DreamInterpretation {
  const keywords = row.keywords
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const anchor = row.anchor.trim() || keywords[0] || "꿈";
  const kw = keywords.length > 0 ? keywords : [anchor];

  return {
    usualTake: "",
    alternativeLens: "",
    symbol: "",
    psychology: "",
    reflection: "",
    keywords: kw,
    category: inferCategoryFromKeyword(anchor),
    researchAnchor: {
      primary: anchor,
      clusterLabel: `${anchor} 관련 꿈`,
    },
  };
}

export function outcomeLabel(cat: OutcomeCategory): string {
  return OUTCOME_CATEGORIES[cat];
}
