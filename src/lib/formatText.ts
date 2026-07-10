/** 긴 문단을 읽기 좋은 줄바꿈으로 나눔 (AI 해몽·꿈 본문 공통) */
export function formatReadableParagraphs(text: string, maxLines = 6): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (trimmed.includes("\n")) {
    const lines = trimmed
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
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

export function splitReadableParagraphs(text: string, maxLines = 8): string[] {
  return formatReadableParagraphs(text, maxLines)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** 퍼센트 배열이 100%를 넘지 않도록 정규화 (반올림 오차 보정) */
export function normalizePercents<T extends { percent: number }>(items: T[]): T[] {
  if (items.length === 0) return [];

  const capped = items.map((item) => ({
    ...item,
    percent: Math.min(100, Math.max(0, item.percent)),
  }));

  const total = capped.reduce((s, i) => s + i.percent, 0);
  if (total <= 100 || total === 0) return capped;

  const scale = 100 / total;
  const scaled = capped.map((item) => ({
    ...item,
    percent: Math.floor(item.percent * scale),
  }));

  let remainder = 100 - scaled.reduce((s, i) => s + i.percent, 0);
  const order = scaled
    .map((item, index) => ({ index, percent: item.percent }))
    .sort((a, b) => b.percent - a.percent);

  for (const { index } of order) {
    if (remainder <= 0) break;
    scaled[index]!.percent += 1;
    remainder -= 1;
  }

  return scaled;
}
