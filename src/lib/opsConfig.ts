import {
  mergeLabMetricsConfig,
  type LabMetricsConfig,
} from "@/lib/labMetricsConfig";
import { MIN_REAL_COMMUNITY_COUNT } from "@/types";

export const OPS_CONFIG_COLLECTION = "config";

export type OpsConfigDocId =
  | "labMetrics"
  | "dataExposure"
  | "followUpPush"
  | "system";

export type DataBlendMode = "real_first" | "synthetic_only" | "organic_only";

export interface DataExposureConfig {
  version: 1;
  /** Firestore 유사 꿈 N건 이상이면 실데이터 */
  minRealCommunityCount: number;
  blendMode: DataBlendMode;
  /** 사용자에게 추정 데이터 배지 표시 */
  showEstimatedBadge: boolean;
  /** 홈 '많이 찾는 꿈' 합성 미리보기 */
  homePreviewsSynthetic: boolean;
  /** 탐색·상세에서 AI communityEstimate 병합 허용 */
  allowAiCommunityEstimate: boolean;
  /** 운영 참고용 — 목표 오가닉 노출 비율(%) */
  targetOrganicPercent: number;
}

export interface FollowUpPushConfig {
  version: 1;
  enabled: boolean;
  milestonesDays: number[];
  testMode: {
    enabled: boolean;
    milestonesMinutes: number[];
  };
  messages: Record<string, { title: string; body: string }>;
}

export interface SystemOpsConfig {
  version: 1;
  maintenanceMode: boolean;
  interpretRateLimitPerHour: number;
  adminNotes: string;
}

export const DEFAULT_DATA_EXPOSURE: DataExposureConfig = {
  version: 1,
  minRealCommunityCount: MIN_REAL_COMMUNITY_COUNT,
  blendMode: "real_first",
  showEstimatedBadge: false,
  homePreviewsSynthetic: true,
  allowAiCommunityEstimate: true,
  targetOrganicPercent: 30,
};

export const DEFAULT_FOLLOW_UP_PUSH: FollowUpPushConfig = {
  version: 1,
  enabled: true,
  milestonesDays: [30],
  testMode: {
    enabled: false,
    milestonesMinutes: [30, 60],
  },
  messages: {
    "30": {
      title: "그 꿈 이후, 어떤 일이 있었나요?",
      body: "1개월이 지났어요. 답변하면 구독 할인!",
    },
    "15": {
      title: "그때 꿈, 아직 기억나요?",
      body: "한 달의 절반이 지났어요. 기록을 이어가 보세요.",
    },
  },
};

export const DEFAULT_SYSTEM_OPS: SystemOpsConfig = {
  version: 1,
  maintenanceMode: false,
  interpretRateLimitPerHour: 30,
  adminNotes: "",
};

export function mergeDataExposureConfig(
  partial: Partial<DataExposureConfig> | null | undefined,
): DataExposureConfig {
  if (!partial) return { ...DEFAULT_DATA_EXPOSURE };
  return { ...DEFAULT_DATA_EXPOSURE, ...partial };
}

export function mergeFollowUpPushConfig(
  partial: Partial<FollowUpPushConfig> | null | undefined,
): FollowUpPushConfig {
  if (!partial) return { ...DEFAULT_FOLLOW_UP_PUSH };
  return {
    ...DEFAULT_FOLLOW_UP_PUSH,
    ...partial,
    testMode: {
      ...DEFAULT_FOLLOW_UP_PUSH.testMode,
      ...partial.testMode,
    },
    messages: {
      ...DEFAULT_FOLLOW_UP_PUSH.messages,
      ...partial.messages,
    },
  };
}

export function mergeSystemOpsConfig(
  partial: Partial<SystemOpsConfig> | null | undefined,
): SystemOpsConfig {
  if (!partial) return { ...DEFAULT_SYSTEM_OPS };
  return { ...DEFAULT_SYSTEM_OPS, ...partial };
}

export function mergeLabMetricsOpsConfig(
  partial: Partial<LabMetricsConfig> | null | undefined,
): LabMetricsConfig {
  return mergeLabMetricsConfig(partial);
}

export interface AiUsageDailyDoc {
  date: string;
  totalCalls: number;
  openaiCalls?: number;
  geminiCalls?: number;
  fallbackCalls?: number;
  errorCalls?: number;
  updatedAt?: Date;
}

export interface KpiSnapshot {
  computedAt: Date;
  totalUsers: number;
  anonymousUsers: number;
  /** 가입 회원 (익명·프리미엄 제외) */
  memberUsers: number;
  premiumUsers: number;
  totalDreams: number;
  dreamsToday: number;
  followUpCompleted: number;
  followUpPending: number;
  followUpDueToday: number;
  responseRatePercent: number;
  organicCommunityViews: number;
  syntheticCommunityViews: number;
}
