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
    `겉으로는 "${keyword}" 꿈이 불길하게 느껴질 수 있지만, 연구소는 **당신 꿈 장면**만 놓고 봅니다.`,
    `선택·경쟁·죄책감·흥분이 한꺼번에 섞였다면, 억눌린 욕망이나 통제 욕구의 신호일 수 있어요.`,
    `몸이 느낀 황홀함은 부끄럽지만, 꿈이 건드린 감정 그대로일 수 있습니다.`,
    `단정하기보다, **지금 마음 상태**와 맞닿아 있는지 스스로 짚어보는 게 연구소식 접근입니다.`,
    `해몽은 여기까지 — **당신**의 30일 뒤 기록이 이 꿈의 결말을 완성합니다.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 장면의 상징 — 선택, 몸, 죽음·생존, 쾌감과 공포의 공존.\n꿈이 던진 이미지를 메모해 두면 한 달 뒤 비교하기 좋습니다.`;
}

export function buildMockPsychology(): string {
  return `지금 강한 감정(흥분·황홀·불안)이 남아 있다면 정상입니다.\n꿈은 종종 말하기 어려운 욕망·경쟁 심리를 상징으로 보여줍니다.\n스스로를 탓하기보다, **무엇이 건드려졌는지** 적어 두는 게 도움이 됩니다.`;
}

export function buildMockReflection(): string {
  return `30일 뒤, 이 꿈 이후 실제로 어떤 일이 있었나요?\n지금 느낀 감정과 그때의 결말을 겹쳐 보면\n이 꿈이 **당신**에게 어떤 의미였는지 선명해집니다.`;
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
