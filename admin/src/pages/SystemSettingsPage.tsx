import { useState } from "react";
import { DEFAULT_SYSTEM_OPS, type SystemOpsConfig } from "@/lib/opsConfig";
import { ConfigField, PageHeader, SaveBar } from "@admin/components/AdminUi";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { useOpsConfig } from "@admin/hooks/useOpsConfig";

export function SystemSettingsPage() {
  const { user } = useAdminAuth();
  const { system, loading, status, setStatus, saveSystemConfig } = useOpsConfig(user?.uid);
  const [draft, setDraft] = useState<SystemOpsConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const config = draft ?? system ?? DEFAULT_SYSTEM_OPS;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSystemConfig(config);
      setDraft(null);
    } catch {
      setStatus("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="시스템 설정" desc="점검 모드, API 제한, 운영 메모" />

      {loading ? (
        <p className="text-sm text-text-muted">불러오는 중…</p>
      ) : (
        <div className="card p-5 space-y-5 max-w-2xl">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) => setDraft({ ...config, maintenanceMode: e.target.checked })}
              className="accent-accent"
            />
            점검 모드 (앱 연동 예정)
          </label>

          <ConfigField label="해몽 API 시간당 제한 (유저)" hint="서버 rate limit 연동 예정">
            <input
              type="number"
              min={1}
              max={200}
              value={config.interpretRateLimitPerHour}
              onChange={(e) =>
                setDraft({
                  ...config,
                  interpretRateLimitPerHour: Number(e.target.value) || 30,
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </ConfigField>

          <ConfigField label="운영 메모">
            <textarea
              rows={4}
              value={config.adminNotes}
              onChange={(e) => setDraft({ ...config, adminNotes: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y"
            />
          </ConfigField>
        </div>
      )}

      <SaveBar onSave={() => void handleSave()} saving={saving} status={status} />
    </div>
  );
}
