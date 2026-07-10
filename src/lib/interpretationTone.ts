/** AI·폴백 해몽 — 담백한 관측·후기 비교 톤 */

import { INTERPRETATION_IDEA_GUIDE } from "@/lib/productIdeas";

export { INTERPRETATION_IDEA_GUIDE as INTERPRETATION_TONE_GUIDE };

export function buildMockUsualTake(keyword: string): string {
  return [
    `일반 해몽에서 "${keyword}" 꿈은 변화, 압박감, 관계의 신호처럼 읽히는 경우가 많습니다.`,
    `같은 키워드라도 꿈속 분위기가 무서웠는지 편안했는지에 따라 풀이가 달라집니다.`,
    `그래서 한 문장으로 길흉을 단정하기보다, 장면과 감정을 나눠 보는 편이 더 정확합니다.`,
    `꿈연구소는 이 해몽을 출발점으로 두고, 30일 뒤 실제 기록과 함께 비교합니다.`,
  ].join("\n");
}

export function buildMockAlternativeLens(keyword: string): string {
  return [
    `겉으로는 "${keyword}" 꿈이 불길하게 느껴질 수 있지만, 연구소는 **당신 꿈 장면**만 놓고 봅니다.`,
    `선택·경쟁·죄책감·긴장이 한꺼번에 섞였다면, 최근 마음의 압력이 꿈속 이미지로 나온 것일 수 있어요.`,
    `깬 뒤에도 몸이 긴장했거나 이상하게 마음이 가라앉았다면, 그 반응 자체가 중요한 단서입니다.`,
    `단정하기보다, **지금 마음 상태**와 맞닿아 있는지 스스로 짚어보는 게 연구소식 접근입니다.`,
    `해몽은 여기까지 — **당신**의 30일 뒤 기록이 이 꿈의 결말을 완성합니다.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 장면의 상징 — 선택, 경계, 관계의 긴장, 통제와 해방의 흔들림.\n꿈이 던진 이미지를 메모해 두면 한 달 뒤 비교하기 좋습니다.`;
}

export function buildMockPsychology(): string {
  return `지금 강한 감정이나 불안이 남아 있다면 자연스러운 반응입니다.\n꿈은 종종 말로 정리하지 못한 압박·기대·관계 감각을 상징으로 보여줍니다.\n스스로를 탓하기보다, **무엇이 건드려졌는지** 적어 두는 게 도움이 됩니다.`;
}

export function buildMockReflection(): string {
  return [
    "평소엔 이런 꿈 잘 안 꾸시죠? 깬 뒤에도 그 장면이 남아 있나요?",
    "불안했던 장면이 현실에선 반대로 풀리는 경우도 있어요. 그때 마음은 어땠을까요?",
    "이 꿈이 당신에게 어떤 메시지를 전한다고 느껴지나요?",
    "주변 사람과의 관계를 더 깊게 보고 싶은 마음은 없으세요?",
  ].join("\n");
}

/** AI·카피 문자열 — 줄바꿈 보존 */
export function ensureMultiline(text: string, maxLines = 5): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (trimmed.includes("\n")) {
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    return maxLines > 0 ? lines.slice(0, maxLines).join("\n") : lines.join("\n");
  }

  const parts = trimmed
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return trimmed;
  if (parts.length <= maxLines) return parts.join("\n");

  const chunkSize = Math.ceil(parts.length / maxLines);
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += chunkSize) {
    lines.push(parts.slice(i, i + chunkSize).join(" "));
  }
  return lines.slice(0, maxLines).join("\n");
}
