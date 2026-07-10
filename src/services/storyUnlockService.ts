import { auth } from "@/lib/firebase";
import type { StoryKeywordAccess } from "@/types";
import { MEMBER_FREE_STORY_VIEWS, maxStorySlots } from "@/lib/storyAccessPricing";

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

export function computeMaxVisible(access: StoryKeywordAccess | null): number {
  if (!access) return MEMBER_FREE_STORY_VIEWS;
  return maxStorySlots(access.freeCap, access.paidUnlockCount);
}
