/** 탐색·홈 인기 키워드 — 짧은 시각 라벨 (이모지) */
const KEYWORD_ICON_MAP: Record<string, string> = {
  시험: "📝",
  로또: "🎰",
  돈: "💰",
  금: "✨",
  "전 남친": "💔",
  "죽은 사람": "🕊",
  불: "🔥",
  이별: "🌧",
  임신: "👶",
  "치아 빠짐": "🦷",
  "쫓기는 꿈": "🏃",
  추락: "⬇️",
  바람: "💨",
  교통사고: "🚗",
  귀신: "👻",
  배신: "🗡",
  실직: "📉",
  지진: "🌋",
  불륜: "🎭",
  암: "🩺",
  뱀: "🐍",
  비행: "✈️",
  엘리베이터: "🛗",
  아기: "🍼",
  호랑이: "🐯",
  결혼: "💍",
  회사: "🏢",
  학교: "🏫",
  고양이: "🐱",
  바다: "🌊",
  이사: "📦",
  군대: "🎖",
  화장실: "🚪",
  집: "🏠",
};

export function getKeywordIcon(keyword: string): string {
  const k = keyword.trim();
  if (KEYWORD_ICON_MAP[k]) return KEYWORD_ICON_MAP[k]!;
  for (const [key, icon] of Object.entries(KEYWORD_ICON_MAP)) {
    if (k.includes(key) || key.includes(k)) return icon;
  }
  return "✨";
}

