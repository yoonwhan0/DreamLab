import { useState } from "react";
import { AppIcons, Icon } from "@/components/ui/Icon";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationPromptProps {
  className?: string;
}

export function PushNotificationPrompt({ className = "" }: PushNotificationPromptProps) {
  const { permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (dismissed || permission === "granted" || permission === "denied") {
    return null;
  }

  const handleEnable = async () => {
    setBusy(true);
    try {
      const ok = await requestPermission();
      if (ok) setDismissed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`card-highlight p-5 space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
          <Icon icon={AppIcons.bell} size="md" className="text-primary" />
        </div>
        <div className="space-y-1">
          <p className="section-label">30일 뒤 알림 받기</p>
          <p className="text-[0.9375rem] leading-relaxed text-text-secondary">
            한 달 뒤 &lsquo;그 꿈 이후 어땠어?&rsquo; 푸시가 옵니다. 답하면 통계에 더해지고, 구독 할인도 받을 수 있어요.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="btn-primary !w-full sm:flex-1 sm:min-w-0 normal-case tracking-normal disabled:opacity-50"
        >
          {busy ? "설정 중…" : "알림 켜기"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="btn-secondary !w-full sm:!w-auto sm:shrink-0 sm:min-w-[5.5rem] normal-case tracking-normal whitespace-nowrap px-5"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
