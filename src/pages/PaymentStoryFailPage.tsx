import { useNavigate, useSearchParams } from "react-router-dom";
import { formatStoryUnlockPrice } from "@/lib/storyAccessPricing";

export function PaymentStoryFailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const keyword = params.get("keyword") ?? "";
  const code = params.get("code");
  const message = params.get("message");

  return (
    <div className="space-y-4 text-center py-12 card p-6">
      <p className="text-text font-semibold">결제가 완료되지 않았습니다</p>
      <p className="text-sm text-text-secondary copy-lines">
        {message ?? "카드 승인이 취소되었거나 실패했습니다."}
        {code ? ` (${code})` : ""}
      </p>
      <p className="text-xs text-text-muted">
        후기 1건 추가 열람: {formatStoryUnlockPrice()}
      </p>
      <button
        type="button"
        className="btn-primary w-full"
        onClick={() =>
          navigate(
            keyword.trim()
              ? `/explore?q=${encodeURIComponent(keyword.trim())}`
              : "/explore",
          )
        }
      >
        탐색으로 돌아가기
      </button>
    </div>
  );
}
