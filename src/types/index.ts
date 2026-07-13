export const DREAM_EMOTIONS = [
  { id: "happy", label: "행복" },
  { id: "scared", label: "무서움" },
  { id: "sad", label: "슬픔" },
  { id: "calm", label: "평온" },
  { id: "weird", label: "이상함" },
] as const;

export const FOLLOWUP_EMOTIONS = [
  { id: "calm", label: "평온" },
  { id: "grateful", label: "감사" },
  { id: "sad", label: "슬픔" },
  { id: "happy", label: "행복" },
  { id: "anxious", label: "불안" },
  { id: "hopeful", label: "희망" },
] as const;

export const OUTCOME_CATEGORIES = {
  good: "좋은 일",
  bad: "나쁜 일",
  love: "연애",
  job: "직장",
  health: "건강",
  family: "가족",
  money: "돈",
  other: "기타",
} as const;

/** @deprecated DB에 남아 있을 수 있음 — 신규 입력·표시에서 제외 */
export const LEGACY_OUTCOME_NOTHING = "nothing" as const;

export function normalizeOutcomeCategory(raw: string | undefined): OutcomeCategory {
  if (
    !raw ||
    raw === LEGACY_OUTCOME_NOTHING ||
    raw === "별일없었음" ||
    raw === "별일 없었음"
  ) {
    return "other";
  }
  if (raw in OUTCOME_CATEGORIES) {
    return raw as OutcomeCategory;
  }
  return "other";
}

export const LEGAL_DISCLAIMER =
  "비슷한 꿈을 기록한 사용자들의 후기에서\n이런 경향이 보고되었습니다.\n개인의 미래를 예측하거나 보장하지 않습니다.";

export const DISTINCT_INTERPRETATION_NOTE =
  "해몽은 여기서 끝입니다.\n그 너머는 금단의 영역.\n한 달 뒤, 같은 꿈을 꾼 이들의 결말 — 지금 열람 가능합니다.";

export const ESTIMATED_DATA_NOTE =
  "아직 이 키워드의 공개 기록이 쌓이는 중입니다. 숫자는 참고용 미리보기이며, 기록이 늘면 실제 통계로 갱신됩니다.";

export const MIN_REAL_COMMUNITY_COUNT = 5;

export type DreamEmotionId = (typeof DREAM_EMOTIONS)[number]["id"];
export type FollowUpEmotionId = (typeof FOLLOWUP_EMOTIONS)[number]["id"];
export type OutcomeCategory = keyof typeof OUTCOME_CATEGORIES;

export interface LabObservations {
  /** 이 꿈 장면을 직접 인용한 1~2문장 관측 */
  sceneNote: string;
  /** 유사 기록자들이 꿈 직후 자주 하는 행동 (2~4개) */
  commonBehaviors: string[];
  /** 함께 조회되는 연구 키워드 */
  relatedSearches: string[];
}

/** AI가 유사 꿈 클러스터·DB 색인용으로 스스로 정한 앵커 */
export interface ResearchAnchor {
  primary: string;
  secondary?: string[];
  scenePhrases?: string[];
  clusterLabel?: string;
}

/**
 * Dream Parser 결과 — 꿈 본문에서 **추측 없이 추출한** 구조화 요소.
 * 벡터·태그 검색과 재미 요소(상징 연결도 등)의 근거가 된다.
 */
export interface DreamElements {
  /** 등장인물 (예: 어머니(고인)) */
  people: string[];
  /** 장소 (예: 집, 부엌) */
  places: string[];
  /** 행동 (예: 음식을 만들어줌) */
  actions: string[];
  /** 감정 (예: 따뜻함, 그리움) */
  emotions: string[];
  /** 사물 (예: 오므라이스) */
  objects: string[];
  /** 사건 (예: 음식을 남기고 떠남) */
  events: string[];
  /** 상징 (예: 가족, 보살핌, 애도) */
  symbols: string[];
}

/** 연구노트 관찰 — 꿈에서 반복·연결되는 요소 요약 */
export interface DreamObservation {
  /** 이번 꿈에서 두드러진 반복 요소 ①②③ */
  repeatedElements: string[];
  /** 요소들을 잇는 축 (예: 보호 · 돌봄 · 과거 기억) */
  axes: string[];
  /** 관찰 메모 1~2줄 (꿈에 실제로 있던 것만) */
  note: string;
}

/** 재미 요소 중 AI가 쓰는 정성 필드 (정량 필드는 클라이언트에서 결정론적으로 계산) */
export interface DreamSignals {
  /** 꿈 한줄평 */
  oneLiner: string;
  /** 연구소장 한마디 (말투를 매번 다르게) */
  directorNote: string;
  /** 이 꿈을 영화로 만든다면 — 1~3편 */
  movies: { title: string; reason?: string }[];
  /** 상징 연결도 (예: 어머니 → 음식 → 집 → 안정) */
  symbolChain: string[];
}

export interface DreamInterpretation {
  /** 흔한 해몽 사이트가 말했을 법한 해석 */
  usualTake: string;
  /** 보통 해석과 꺾인 다른 관점 — 프리미엄 톤 핵심 */
  alternativeLens?: string;
  symbol: string;
  psychology: string;
  reflection: string;
  keywords: string[];
  category: string;
  mood?: { anxiety: number; hope: number; longing: number };
  labObservations?: LabObservations;
  /** AI 자율 앵커 — DB·통계·유사 꿈의 1차 키 */
  researchAnchor?: ResearchAnchor;
  /** Dream Parser 구조화 추출 */
  elements?: DreamElements;
  /** 연구노트 관찰 (반복 요소·연결 축) */
  observation?: DreamObservation;
  /** 재미 요소 정성 필드 */
  signals?: DreamSignals;
}

export interface CommunityStory {
  id: string;
  dreamTitle: string;
  dreamSnippet: string;
  emotions: DreamEmotionId[];
  outcomeCategory: OutcomeCategory;
  afterStory: string;
  recordedDaysAgo: number;
  profile: string;
}

export interface CommunityEstimate {
  totalCount: number;
  withFollowUpCount: number;
  keywords: { keyword: string; count: number }[];
  emotionCounts: { emotion: DreamEmotionId; count: number }[];
  samples: { title: string; snippet?: string; emotions: DreamEmotionId[] }[];
  stories: CommunityStory[];
  outcomes: Record<OutcomeCategory, number>;
  isEstimated: boolean;
}

export interface DreamFollowUp {
  outcomeCategory: OutcomeCategory;
  note: string;
  emotions: FollowUpEmotionId[];
  answeredAt: Date;
}

export interface Dream {
  id: string;
  userId: string;
  title: string;
  content: string;
  emotions: DreamEmotionId[];
  interpretation: DreamInterpretation;
  embedding?: number[];
  createdAt: Date;
  followUpDueAt: Date;
  followUp?: DreamFollowUp;
  isPublic: boolean;
  likes: number;
}

export interface DreamStats {
  totalDreams: number;
  totalWithFollowUp: number;
  survivalRate: number;
  outcomes: Record<OutcomeCategory, number>;
  topEmotions: { emotion: string; count: number }[];
  isEstimated?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  isPremium: boolean;
  isAnonymous: boolean;
  fcmTokens: string[];
  gender?: string;
  ageRange?: string;
  country?: string;
  createdAt: Date;
  role?: "admin" | "user";
}

/** 키워드별 후기 열람 — Firestore story_unlocks 미러 */
export interface StoryKeywordAccess {
  keyword: string;
  freeCap: number;
  paidUnlockCount: number;
  viewedStoryIds: string[];
  aiBlocked: boolean;
  maxSlots: number;
}

export interface SimilarDreamSummary {
  totalCount: number;
  keywords: { keyword: string; count: number }[];
  category: string;
  emotionCounts: { emotion: DreamEmotionId; count: number }[];
  samples: { title: string; snippet?: string; emotions: DreamEmotionId[] }[];
  stories: CommunityStory[];
  withFollowUpCount: number;
  isEstimated?: boolean;
}

export const FOLLOWUP_DAYS = 30;

export function getEmotionLabel(id: DreamEmotionId | FollowUpEmotionId): string {
  return (
    DREAM_EMOTIONS.find((e) => e.id === id)?.label ??
    FOLLOWUP_EMOTIONS.find((e) => e.id === id)?.label ??
    id
  );
}

export function formatDaysUntil(dueDate: Date): string {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "지금 답변 가능";
  return `${days}일 후`;
}

export function isFollowUpDue(dueDate: Date): boolean {
  return new Date() >= dueDate;
}

/** 후기 미작성이면 기간과 무관하게 작성 가능 (followUpDueAt은 푸시용) */
export function canWriteFollowUpNow(dream: { followUp?: unknown }): boolean {
  return !dream.followUp;
}
