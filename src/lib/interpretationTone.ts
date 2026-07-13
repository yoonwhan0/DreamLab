/** AI·폴백 해몽 — 담백한 관찰·후기 비교 톤 */

import { INTERPRETATION_IDEA_GUIDE } from "@/lib/productIdeas";

export { INTERPRETATION_IDEA_GUIDE as INTERPRETATION_TONE_GUIDE };

export function buildMockUsualTake(keyword: string): string {
  return [
    `전통·인터넷 해몽은 "${keyword}" 꿈을 변화·압박·관계의 신호로 분류해요.`,
    `대부분은 장면에 뜻 하나를 붙이고 여기서 멈춰요.`,
    `연구소는 여기서 멈추지 않고, 아래에서 장면 그대로를 짚어 볼게요.`,
  ].join("\n");
}

export function buildMockAlternativeLens(keyword: string): string {
  return [
    `흔한 해몽은 여기서 멈춰요.`,
    `관찰: 이 꿈에는 "${keyword}"이(가) 있었고, 같은 구도가 반복해서 지나갔어요.`,
    `상징: 그런 장면은 흔히 '통제와 해방', '올려다봄'의 상징으로 등장해요.`,
    `가능성: 같은 구도의 꿈은 미뤄둔 감정을 정리하는 과정일 때가 많아요 (단정은 아니에요).`,
    `다만 꿈 하나만으로 지금 상태를 판단할 수는 없어요.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 장면의 상징 — 선택, 경계, 통제와 해방.\n뜻을 서둘러 붙이지 말고 이미지 그대로 적어 두세요. 30일 뒤 기록과 겹쳐 보면 선명해져요.`;
}

export function buildMockPsychology(): string {
  return `이 꿈이 보여주는 감정의 형태예요 — 압력과 긴장이 함께 걸려 있어요.\n꿈은 말로 정리되지 않은 감정을 상징으로 밀어 올릴 때가 있어요.\n무엇이 건드려졌는지, 그 감정만 적어 두면 충분해요.`;
}

export function buildMockReflection(): string {
  return [
    "깬 뒤에도 그 장면이 몸에 남았나요? 어디에 남았나요?",
    "그 장면에서 당신은 보는 쪽이었나요, 보이는 쪽이었나요?",
    "꿈 속에서 가장 크게 느낀 감정은 지금 어디로 갔나요?",
    "이 꿈에서 가장 오래 남은 한 장면은 무엇인가요?",
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
