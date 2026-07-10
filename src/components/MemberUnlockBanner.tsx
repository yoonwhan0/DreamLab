import { useEffect, useRef, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { MEMBER_FREE_STORY_VIEWS } from "@/lib/storyAccessPricing";

const STORAGE_KEY = "dreamlab-member-unlock-banner";

/** 가입 직후 — 무엇이 열렸는지 한 번 알려줌 */
export function MemberUnlockBanner() {
  const access = useAccessPolicy();
  const wasGuest = useRef(true);
  const [freshUnlock, setFreshUnlock] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1",
  );

  useEffect(() => {
    if (wasGuest.current && access.isMember && !access.isPremium) {
      setFreshUnlock(true);
    }
    wasGuest.current = access.isGuest;
  }, [access.isGuest, access.isMember, access.isPremium]);

  if (!access.isMember || access.isPremium || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="card-highlight card-bezel p-4 flex items-start gap-3">
      <span className="text-primary text-lg leading-none mt-0.5" aria-hidden>
        ✓
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-text">
          {freshUnlock ? "가입 완료 — 열람이 열렸어요" : "회원 혜택"}
        </p>
        <p className="text-xs text-text-secondary copy-lines leading-relaxed">
          <AppLink to="/explore" className="text-primary font-medium hover:underline">
            탐색
          </AppLink>
          에서 같은 꿈 후기를 <strong className="text-primary">{MEMBER_FREE_STORY_VIEWS}건 무료</strong>로 볼 수 있어요.
          통계·전체 결말은 <strong className="text-primary">프리미엄 구독</strong> (앱스토어·Play)입니다.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-text-muted text-xs shrink-0 px-1"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
