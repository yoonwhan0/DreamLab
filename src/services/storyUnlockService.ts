import { auth } from "@/lib/firebase";
import type { StoryKeywordAccess } from "@/types";
import {
  MEMBER_FREE_STORY_VIEWS,
  STORY_UNLOCK_UNIT_PRICE_KRW,
  maxStorySlots,
} from "@/lib/storyAccessPricing";

const API = "/api";

async function authHeaders(): Promise<HeadersInit> {
  const user = auth?.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchStoryAccess(keyword: string): Promise<StoryKeywordAccess> {
  const headers = await authHeaders();
  const q = encodeURIComponent(keyword.trim());
  const res = await fetch(`${API}/story-access?keyword=${q}`, { headers });
  if (!res.ok) throw new Error("열람 정보를 불러오지 못했습니다.");

  const data = (await res.json()) as {
    keyword: string;
    paidUnlockCount: number;
    viewedStoryIds: string[];
    aiBlocked: boolean;
    maxSlots: number;
  };

  return {
    keyword: data.keyword,
    paidUnlockCount: data.paidUnlockCount,
    viewedStoryIds: data.viewedStoryIds,
    aiBlocked: data.aiBlocked,
    maxSlots: data.maxSlots,
    freeCap: MEMBER_FREE_STORY_VIEWS,
  };
}

export async function registerStoryViews(
  keyword: string,
  storyIds: string[],
): Promise<{ ok: boolean; access: StoryKeywordAccess; reason?: string }> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/register-story-views`, {
    method: "POST",
    headers,
    body: JSON.stringify({ keyword: keyword.trim(), storyIds }),
  });

  const data = (await res.json()) as {
    ok: boolean;
    reason?: string;
    access: {
      keyword: string;
      paidUnlockCount: number;
      viewedStoryIds: string[];
      aiBlocked: boolean;
      maxSlots: number;
    };
  };

  return {
    ok: data.ok,
    reason: data.reason,
    access: {
      keyword: data.access.keyword,
      paidUnlockCount: data.access.paidUnlockCount,
      viewedStoryIds: data.access.viewedStoryIds,
      aiBlocked: data.access.aiBlocked,
      maxSlots: data.access.maxSlots,
      freeCap: MEMBER_FREE_STORY_VIEWS,
    },
  };
}

export interface StoryUnlockOrder {
  orderId: string;
  amount: number;
  orderName: string;
  customerKey: string;
}

export async function createStoryUnlockOrder(keyword: string): Promise<StoryUnlockOrder> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/create-story-unlock-order`, {
    method: "POST",
    headers,
    body: JSON.stringify({ keyword: keyword.trim() }),
  });

  if (!res.ok) {
    throw new Error("결제 주문을 만들지 못했습니다.");
  }

  return (await res.json()) as StoryUnlockOrder;
}

export async function confirmStoryUnlockPayment(opts: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<{
  ok: boolean;
  keyword: string;
  paidUnlockCount: number;
  maxSlots: number;
}> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/confirm-story-unlock-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(opts),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "결제 승인에 실패했습니다.");
  }

  return (await res.json()) as {
    ok: boolean;
    keyword: string;
    paidUnlockCount: number;
    maxSlots: number;
  };
}

export function isTossPaymentsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_TOSS_CLIENT_KEY);
}

export function storyUnlockUnitPrice(): number {
  return STORY_UNLOCK_UNIT_PRICE_KRW;
}

export function computeMaxVisible(access: StoryKeywordAccess | null): number {
  if (!access) return MEMBER_FREE_STORY_VIEWS;
  return maxStorySlots(access.freeCap, access.paidUnlockCount);
}
