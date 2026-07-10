import { useState } from "react";
import { DEFAULT_FOLLOW_UP_PUSH, type FollowUpPushConfig } from "@/lib/opsConfig";
import { ConfigField, PageHeader, SaveBar } from "@admin/components/AdminUi";
import { useAdminAuth } from "@admin/hooks/useAdminAuth";
import { useOpsConfig } from "@admin/hooks/useOpsConfig";

export function PushSettingsPage() {
  const { user } = useAdminAuth();
  const { followUpPush, loading, status, setStatus, savePush } = useOpsConfig(user?.uid);
  const [draft, setDraft] = useState<FollowUpPushConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const config = draft ?? followUpPush ?? DEFAULT_FOLLOW_UP_PUSH;

  const patch = (partial: Partial<FollowUpPushConfig>) => {
    setDraft({ ...config, ...partial });
    setStatus(null);
  };

  const patchTest = (partial: Partial<FollowUpPushConfig["testMode"]>) => {
    setDraft({
      ...config,
      testMode: { ...config.testMode, ...partial },
    });
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePush(config);
      setDraft(null);
    } catch {
      setStatus("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="푸시 설정"
        desc="15·30일 마일스톤, 테스트 모드(분 단위). Functions가 config를 읽도록 연동 예정."
      />

      {loading ? (
        <p className="text-sm text-text-muted">불러오는 중…</p>
      ) : (
        <div className="card p-5 space-y-5 max-w-2xl">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
              className="accent-accent"
            />
            푸시 발송 활성화
          </label>

          <ConfigField
            label="마일스톤 (일)"
            hint="쉼표 구분 — 예: 15,30"
          >
            <input
              type="text"
              value={config.milestonesDays.join(",")}
              onChange={(e) =>
                patch({
                  milestonesDays: e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => n > 0),
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </ConfigField>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-text-muted">개발 테스트 모드</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.testMode.enabled}
                onChange={(e) => patchTest({ enabled: e.target.checked })}
                className="accent-accent"
              />
              분 단위 마일스톤 사용 (운영 주의)
            </label>
            <ConfigField label="테스트 마일스톤 (분)" hint="예: 30,60 → 30분·1시간">
              <input
                type="text"
                value={config.testMode.milestonesMinutes.join(",")}
                onChange={(e) =>
                  patchTest({
                    milestonesMinutes: e.target.value
                      .split(",")
                      .map((s) => Number(s.trim()))
                      .filter((n) => n > 0),
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </ConfigField>
          </div>

          {["15", "30"].map((day) => (
            <div key={day} className="space-y-2 border border-border/60 rounded-lg p-3">
              <p className="text-xs font-medium">{day}일 푸시 문구</p>
              <input
                type="text"
                placeholder="제목"
                value={config.messages[day]?.title ?? ""}
                onChange={(e) =>
                  patch({
                    messages: {
                      ...config.messages,
                      [day]: {
                        title: e.target.value,
                        body: config.messages[day]?.body ?? "",
                      },
                    },
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm mb-2"
              />
              <input
                type="text"
                placeholder="본문"
                value={config.messages[day]?.body ?? ""}
                onChange={(e) =>
                  patch({
                    messages: {
                      ...config.messages,
                      [day]: {
                        title: config.messages[day]?.title ?? "",
                        body: e.target.value,
                      },
                    },
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <SaveBar onSave={() => void handleSave()} saving={saving} status={status} />
    </div>
  );
}
