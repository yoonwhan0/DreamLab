import { loadTossPayments, type TossPaymentsSDK } from "@tosspayments/tosspayments-sdk";
import {
  confirmStoryUnlockPayment,
  createStoryUnlockOrder,
  isTossPaymentsConfigured,
  storyUnlockUnitPrice,
} from "@/services/storyUnlockService";

let tossPromise: Promise<TossPaymentsSDK> | null = null;

function getToss(): Promise<TossPaymentsSDK> {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;
  if (!clientKey) {
    throw new Error("결제 키가 설정되지 않았습니다. (VITE_TOSS_CLIENT_KEY)");
  }
  if (!tossPromise) {
    tossPromise = loadTossPayments(clientKey);
  }
  return tossPromise;
}

export async function payForStoryUnlock(keyword: string): Promise<{
  keyword: string;
  paidUnlockCount: number;
  maxSlots: number;
}> {
  const order = await createStoryUnlockOrder(keyword);
  const amount = storyUnlockUnitPrice();

  if (!isTossPaymentsConfigured()) {
    throw new Error("토스페이먼츠 클라이언트 키가 없습니다.");
  }

  const toss = await getToss();
  const payment = toss.payment({ customerKey: order.customerKey });

  const origin = window.location.origin;
  const successUrl = `${origin}/payment/story-success?keyword=${encodeURIComponent(keyword)}`;
  const failUrl = `${origin}/payment/story-fail?keyword=${encodeURIComponent(keyword)}`;

  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: amount },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl,
    failUrl,
  });

  // requestPayment redirects — unreachable
  throw new Error("결제 창이 열리지 않았습니다.");
}

/** successUrl 복귀 후 쿼리로 승인 */
export async function completeStoryUnlockFromRedirect(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<{ keyword: string; paidUnlockCount: number; maxSlots: number }> {
  return confirmStoryUnlockPayment({ paymentKey, orderId, amount });
}
