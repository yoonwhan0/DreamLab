import type { Dream } from "@/types";
import { generateSyntheticCommunity } from "@/services/syntheticCommunityService";

const snakeInterpretation = {
  usualTake:
    '일반 해몽에서 뱀은 재물, 변화, 숨겨진 감정처럼 여러 방향으로 읽힙니다.\n하지만 같은 뱀 꿈이라도 쫓아왔는지, 가만히 있었는지, 어디에 있었는지에 따라 결이 달라져요.\n이 꿈은 "집 안으로 들어왔지만 공격하지 않은 뱀"이라는 점이 중요합니다.',
  symbol:
    "현관을 지나 집 안으로 들어온 뱀은\n낯선 감정이나 미뤄둔 문제가\n내 생활권 안으로 들어온 장면처럼 보입니다.",
  psychology:
    "무서웠지만 도망치거나 물리는 장면은 없었습니다.\n그래서 이 꿈은 위험 자체보다\n불편한 대상을 가까이 두고 지켜보는 마음에 가깝습니다.",
  reflection:
    "30일 뒤에 실제로 어떤 일이 있었는지 적어보세요.\n큰 사건이 아니어도 좋습니다.\n그동안 집, 가족, 일상에서 무엇을 더 신경 쓰게 됐는지가 이 꿈의 중요한 후기가 됩니다.",
  keywords: ["뱀", "집", "초록색", "변화", "불안"],
  category: "anxiety",
  mood: { anxiety: 72, hope: 18, longing: 10 },
};

const snakeCommunity = generateSyntheticCommunity(
  snakeInterpretation,
  "초록색 큰 뱀이 집으로 들어오는 꿈",
);

export const DEMO_DREAM: Dream = {
  id: "demo",
  userId: "demo-user",
  title: "초록색 큰 뱀이 집으로 들어오는 꿈",
  content:
    "옛날 살던 집인데 초록색 큰 뱀이 현관문을 열고 들어왔어요. 나는 무서웠는데 뱀은 나를 쫓지 않고 거실에 누워있었습니다.",
  emotions: ["scared", "weird"],
  interpretation: snakeInterpretation,
  createdAt: new Date(),
  followUpDueAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
  isPublic: true,
  likes: 0,
};

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
export const showDemoUi = import.meta.env.VITE_SHOW_DEMO_UI === "true";

export { snakeCommunity };
