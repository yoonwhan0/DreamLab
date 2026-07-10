import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { completeStoryUnlockFromRedirect } from "@/services/storyPaymentService";
import { storyUnlockUnitPrice } from "@/services/storyUnlockService";

export function PaymentStorySuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = Number(params.get("amount"));
    const keyword = params.get("keyword") ?? "";

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setError("결제 정보가 올바르지 않습니다.");
      return;
    }

    void completeStoryUnlockFromRedirect(paymentKey, orderId, amount)
      .then(() => {
        const q = keyword.trim();
        navigate(q ? `/explore?q=${encodeURIComponent(q)}&paid=1` : "/explore?paid=1", {
          replace: true,
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
      });
  }, [navigate, params]);

  if (error) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-text font-semibold">결제 처리 실패</p>
        <p className="text-sm text-text-secondary">{error}</p>
        <button type="button" className="btn-primary" onClick={() => navigate("/explore")}>
          탐색으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <LoadingPulse
      label={`결제 확인 중… (${storyUnlockUnitPrice().toLocaleString("ko-KR")}원)`}
    />
  );
}
