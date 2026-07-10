import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import {
  MEMBER_FREE_STORY_VIEWS,
  PREMIUM_MAX_STORY_VIEWS,
  STORY_PAID_UNLOCK_PRICE_WON,
} from "@/lib/storyAccessPricing";

interface StoryLoadLimitNoticeProps {
  visibleCount: number;
  tierCap: number;
  isLoadingMore?: boolean;
}

/** 탐색 후기 — 왜 한 건씩만 불러오는지 */
export function StoryLoadLimitNotice({
  visibleCount,
  tierCap,
  isLoadingMore = false,
}: StoryLoadLimitNoticeProps) {
  const access = useAccessPolicy();
  const atCap = visibleCount >= tierCap;

  const tierLabel = access.isPremium
    ? `프리미엄 — 키워드당 최대 ${PREMIUM_MAX_STORY_VIEWS}건`
    : access.isMember
      ? `회원 — 키워드당 ${MEMBER_FREE_STORY_VIEWS}건`
      : "비회원 — 1건 맛보기";

  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/80 p-3.5 space-y-2 text-xs text-text-secondary leading-relaxed">
      <p className="font-semibold text-text text-sm">{tierLabel}</p>
      <p>
        통계·그래프는 한 번에 정리하고, <strong className="text-text">비슷한 꿈 유형의 후기는 한 건씩</strong>{" "}
        불러옵니다. 말투를 정제하고 확실한 정보만 단계적으로 보여 드리기 위한 제한된
        방식이에요.
      </p>
      {isLoadingMore && (
        <p className="text-text-muted">유사한 후기를 찾는 중…</p>
      )}
      {atCap && !access.isPremium && access.isMember && (
        <p>
          무료 {MEMBER_FREE_STORY_VIEWS}건을 모두 보셨어요. 추가 1건은 {STORY_PAID_UNLOCK_PRICE_WON}
          원 · 전체는 프리미엄에서 열립니다.
        </p>
      )}
      {atCap && access.isPremium && (
        <p>이 키워드는 프리미엄 한도 {PREMIUM_MAX_STORY_VIEWS}건까지 불러왔어요.</p>
      )}
      {atCap && access.isGuest && (
        <p>비회원은 1건만 볼 수 있어요. Google 가입하면 같은 꿈 후기를 더 볼 수 있습니다.</p>
      )}
    </div>
  );
}
