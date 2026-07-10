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
  "유사한 꿈을 기록한 사용자들의 후기에서\n이런 경향이 보고되었습니다.\n개인의 미래를 예측하거나 보장하지 않습니다.";

export const DISTINCT_INTERPRETATION_NOTE =
  "해몽은 여기서 끝입니다.\n그 너머는 금단의 영역.\n한 달 뒤, 같은 꿈을 꾼 이들의 결말 — 지금 열람 가능합니다.";

export const ESTIMATED_DATA_NOTE =
  "아직 충분한 답변이 쌓이지 않아 AI가 추정한 수치입니다. 데이터가 모이면 실제 통계로 바뀝니다.";

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
