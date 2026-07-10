import { useState } from "react";
import { PageHeader, SaveBar, StatusBanner } from "@admin/components/AdminUi";
import { LabMetricsEditor } from "@admin/LabMetricsEditor";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { useOpsConfig } from "@admin/hooks/useOpsConfig";
import type { LabMetricsConfig } from "@/lib/labMetricsConfig";

export function LabMetricsPage() {
  const { user } = useAdminAuth();
  const { saveLab, status, setStatus } = useOpsConfig(user?.uid);
  const [pending, setPending] = useState<LabMetricsConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveFirestore = async () => {
    if (!pending) {
      setStatus("먼저 LabMetricsEditor에서 값을 조정하세요.");
      return;
    }
    setSaving(true);
    try {
      await saveLab(pending);
    } catch {
      setStatus("Firestore 저장 실패 — admin 권한 확인");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="홈 KPI 설정"
        desc="사용자 홈 연구소 숫자 — Firestore 저장 시 재배포 없이 반영됩니다."
      />

      <StatusBanner type="info">
        JSON export는 백업용입니다. 운영 반영은 <strong>Firestore에 저장</strong>을
        사용하세요.
      </StatusBanner>

      <LabMetricsEditor
        onConfigChange={setPending}
        showHeader={false}
      />

      <SaveBar
        onSave={() => void handleSaveFirestore()}
        saving={saving}
        status={status}
      />
    </div>
  );
}
