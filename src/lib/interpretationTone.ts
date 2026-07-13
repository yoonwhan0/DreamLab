/** AI·폴백 해몽 — 담백한 관측·후기 비교 톤 */

import { INTERPRETATION_IDEA_GUIDE } from "@/lib/productIdeas";

export { INTERPRETATION_IDEA_GUIDE as INTERPRETATION_TONE_GUIDE };

export function buildMockUsualTake(keyword: string): string {
  return [
    `전통·인터넷 해몽은 "${keyword}" 꿈을 변화·압박·관계의 신호로 분류한다.`,
    `대부분은 장면에 뜻 하나를 붙이고 여기서 멈춘다.`,
    `우리는 여기서 멈추지 않는다 — 아래는 장면 그대로를 겨눈 관측이다.`,
  ].join("\n");
}

export function buildMockAlternativeLens(keyword: string): string {
  return [
    `흔한 해몽은 여기서 멈춘다.`,
    `관측: 이 꿈에는 "${keyword}"이(가) 있었고, 같은 구도가 반복해서 지나갔다.`,
    `상징: 그 구성은 '통제와 해방', '올려다봄'의 계열로 분류된다.`,
    `수렴: 같은 좌표를 기록한 꿈들은 위안이 아니라 응시로 수렴했다.`,
    `꿈 하나로 현실을 확정할 수는 없다.`,
  ].join("\n");
}

export function buildMockSymbol(keyword: string): string {
  return `"${keyword}" 장면의 상징 계열 — 선택, 경계, 통제와 해방.\n뜻을 붙이지 말고 이미지 그대로 기록해 두라. 30일 뒤 좌표가 겹친다.`;
}

export function buildMockPsychology(): string {
  return `관측된 감정의 구조: 압력과 응시가 함께 걸려 있다.\n꿈은 말로 정리되지 않은 긴장을 상징으로 밀어 올린다.\n무엇이 건드려졌는지, 감정의 좌표만 적어 두라.`;
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
