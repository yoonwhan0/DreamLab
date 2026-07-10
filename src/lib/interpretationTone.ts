/** AI·폴백 해몽 — 자극·FOMO 톤 (사색 X) */

import { INTERPRETATION_IDEA_GUIDE } from "@/lib/productIdeas";

export { INTERPRETATION_IDEA_GUIDE as INTERPRETATION_TONE_GUIDE };

export function buildMockUsualTake(keyword: string): string {
  return [
    `인터넷 해몽에서 "${keyword}" 꿈은 종종 **대박·행운·큰 변화** 쪽으로 읽힙니다.`,
    `"${keyword}" 나오면 '곧 좋은 소식' 또는 반대로 '손재·주의'라고 단정하는 글도 많아요.`,
    `해몽 카페마다 말이 다르지만, 공통점은 **'그냥 넘기면 아깝다'**는 분위기입니다.`,
    `검색만 해도 "${keyword} 꿈 대박", "${keyword} 꿈 손재" 같은 제목이 잔뜩 나옵니다.`,
  ].join("\n");
}

export function buildMockAlternativeLens(keyword: string): string {
  return [
    `근데 같은 "${keyword}" 꿈을 꾼 사람들 **30일 뒤 후기**를 읽다 보면 이야기가 갈립니다.`,
    `어떤 사람은 별일 없었다고, 어떤 사람은 연애·돈·싸움이 터졌다고 적어요.`,
    `해몽만 믿고 끝내기엔, **한 달 뒤 결말**이 더 재밌습니다.`,
    `비슷한 꿈 후기를 더 보면 '어? 나랑 거의 같은데?' 하는 글이 꽤 있습니다.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 해몽은 입구일 뿐이에요.\n같은 꿈 꾼 사람들 **30일 뒤**가 본편입니다.\n지금은 미리보기만 본 상태예요.`;
}

export function buildMockPsychology(): string {
  return `지금 불안하거나 궁금한 게 정상이에요.\n비슷한 꿈 검색한 사람들 후기를 읽다 보면\n'나만 이런 거 아니구나' 하면서 더 궁금해지는 경우가 많습니다.`;
}

export function buildMockReflection(): string {
  return `30일 뒤, 당신에게는 어떤 일이?\n같은 꿈 꾼 사람들 답변을 겹쳐 보면\n갈림길이 보이기 시작합니다.`;
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
