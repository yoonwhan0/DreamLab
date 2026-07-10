/** AI 해석 — 해몽=입구, 30일 데이터=본체 */

import { INTERPRETATION_IDEA_GUIDE } from "@/lib/productIdeas";

export { INTERPRETATION_IDEA_GUIDE as INTERPRETATION_TONE_GUIDE };

export function buildMockUsualTake(keyword: string): string {
  return [
    `전통·인터넷 해몽에서 "${keyword}"은(는) 변화나 메시지의 상징으로 자주 언급됩니다.`,
    `"${keyword}"이(가) 나오는 꿈은 '곧 일이 생긴다'거나 '감정이 드러난다'고 설명되기도 합니다.`,
    `일부 해석은 불안한 장면이 섞이면 나쁜 징조·관계 문제로 단정하기도 합니다.`,
    `해몽 사이트마다 조금씩 다르지만, 대체로 '${keyword}'에 꽤 큰 의미를 부여합니다.`,
  ].join("\n");
}

export function buildMockAlternativeLens(keyword: string): string {
  return [
    `보통은 불길한 징조로 읽히지만, "${keyword}" 장면은 지금 마음의 압력과 겹쳐 보일 때가 많습니다.`,
    `꿈의 분위기·감정이 상징보다 먼저일 수 있어요.`,
    `비슷한 키워드를 남긴 기록들을 보면, 한 달 뒤 답은 별일 없음·갈등·좋은 일로 갈립니다.`,
    `한 가지 해몽만으로는 부족합니다 — 30일 뒤 기록과 겹쳐 봐야 합니다.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 해몽은 여기서 끝이 아닙니다.\n한 달 뒤 같은 키워드 꾼 사람들의 실제 이야기와 비교해 보세요.`;
}

export function buildMockPsychology(): string {
  return `지금 불안하거나 무섭게 느껴질 수 있어요.\n비슷한 키워드를 남긴 기록들을 보면\n별일 없음·갈등·좋은 일이 섞여 나옵니다.`;
}

export function buildMockReflection(): string {
  return `30일 뒤 한 줄 답이 쌓이면\n이 꿈의 갈릴 지점이 보입니다.\n당신은 어느 쪽에 가까울까요?`;
}

/** AI·카피 문자열 — 줄바꿈 보존 (표시용) */
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
