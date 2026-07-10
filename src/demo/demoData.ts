import type { Dream } from "@/types";
import { generateSyntheticCommunity } from "@/services/syntheticCommunityService";

const snakeInterpretation = {
  usualTake:
    '흔한 해몽 사이트라면 "뱀 = 재물·대박"\n또는 "곧 큰 불행·배신이 닥친다"고 단정했을 거예요.\n"조심하지 않으면 손재 본다" — 짧고 겁을 줍니다.',
  symbol:
    "뱀 해몽은 여기서 끝이 아닙니다.\n같은 키워드를 꾼 사람들의\n한 달 뒤 이야기와 비교해 보세요.",
  psychology:
    "지금 무섭게 느껴질 수 있습니다.\n한 달 뒤 같은 꿈을 꾼 사람들의 답변 —\n결말이 제각각입니다.",
  reflection:
    "30일 뒤 알림이 옵니다.\n'그때 그 꿈, 이후 어땠어?'\n답이 쌓이면 통계가 열리고, 다음 사람이 볼 수 있습니다.",
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
