import { useState } from "react";
import {
  DEFAULT_DATA_EXPOSURE,
  type DataBlendMode,
  type DataExposureConfig,
} from "@/lib/opsConfig";
import { MIN_REAL_COMMUNITY_COUNT } from "@/types";
import { ConfigField, PageHeader, SaveBar, StatusBanner } from "@admin/components/AdminUi";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { useOpsConfig } from "@admin/hooks/useOpsConfig";

const BLEND_LABELS: Record<DataBlendMode, string> = {
  real_first: "실DB 우선 (부족 시 합성)",
  synthetic_only: "항상 합성",
  organic_only: "실DB만 (부족하면 빈 화면)",
};

export function DataExposurePage() {
  const { user } = useAdminAuth();
  const { dataExposure, loading, status, setStatus, saveExposure } = useOpsConfig(user?.uid);
  const [draft, setDraft] = useState<DataExposureConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const config = draft ?? dataExposure ?? DEFAULT_DATA_EXPOSURE;

  const patch = (partial: Partial<DataExposureConfig>) => {
    setDraft({ ...config, ...partial });
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveExposure(config);
      setDraft(null);
    } catch {
      setStatus("저장 실패 — admin role 확인");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="데이터 노출"
        desc="사용자에게 보이는 커뮤니티·통계가 오가닉인지 합성/AI인지 제어합니다."
      />

      <StatusBanner type="info">
        홈 KPI 숫자는 <strong>합성</strong> · 탐색/상세 커뮤니티는 이 설정 + Firestore
        실데이터로 결정됩니다. 현재 기본 실DB 전환 기준: {MIN_REAL_COMMUNITY_COUNT}건.
      </StatusBanner>

      {loading ? (
        <p className="text-sm text-text-muted">설정 불러오는 중…</p>
      ) : (
        <div className="card p-5 space-y-5 max-w-2xl">
          <ConfigField label="블렌드 모드" hint="앱 communityDataService에 반영">
            <select
              value={config.blendMode}
              onChange={(e) => patch({ blendMode: e.target.value as DataBlendMode })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {(Object.keys(BLEND_LABELS) as DataBlendMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {BLEND_LABELS[mode]}
                </option>
              ))}
            </select>
          </ConfigField>

          <ConfigField
            label="실DB 최소 건수"
            hint="유사 꿈이 이 수 이상이면 isEstimated=false"
          >
            <input
              type="number"
              min={1}
              max={50}
              value={config.minRealCommunityCount}
              onChange={(e) =>
                patch({ minRealCommunityCount: Number(e.target.value) || 5 })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </ConfigField>

          <ConfigField label="목표 오가닉 노출 비율 (%)" hint="운영 참고 KPI — 자동 강제는 안 함">
            <input
              type="range"
              min={0}
              max={100}
              value={config.targetOrganicPercent}
              onChange={(e) => patch({ targetOrganicPercent: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <p className="text-sm font-medium">{config.targetOrganicPercent}%</p>
          </ConfigField>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.homePreviewsSynthetic}
              onChange={(e) => patch({ homePreviewsSynthetic: e.target.checked })}
              className="accent-accent"
            />
            홈 &apos;많이 찾는 꿈&apos; 합성 미리보기 사용
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowAiCommunityEstimate}
              onChange={(e) => patch({ allowAiCommunityEstimate: e.target.checked })}
              className="accent-accent"
            />
            AI interpret communityEstimate 병합 허용
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.showEstimatedBadge}
              onChange={(e) => patch({ showEstimatedBadge: e.target.checked })}
              className="accent-accent"
            />
            사용자에게 &apos;추정 데이터&apos; 배지 표시
          </label>
        </div>
      )}

      <SaveBar onSave={() => void handleSave()} saving={saving} status={status} />
    </div>
  );
}
