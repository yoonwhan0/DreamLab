/** 사용자-facing — 데이터 정제·검색 톤 (AI·작성 언급 금지) */

export const SIMILAR_MONTH_LABEL = "비슷한 내용의 한 달 뒤는?";
export const SIMILAR_MONTH_TITLE = (keyword: string) =>
  `"${keyword}" — 비슷한 내용의 한 달 뒤는?`;
export const SIMILAR_MONTH_KEYWORD_TITLE = (keyword: string) =>
  `"${keyword}" 꿈 — 비슷한 내용의 한 달 뒤는?`;
export const SIMILAR_STORIES_DEFAULT_TITLE = "비슷한 내용의 한 달 뒤, 실제로 어땠는지";

export const DATA_SEARCH_HEADLINE = "비슷한 꿈 · 한 달 뒤 기록 정리 중";
export const DATA_SEARCH_LINES = [
  "비슷한 꿈을 찾는 중",
  "같은 유형 기록을 분류하는 중",
  "한 달 뒤 후기를 정리하는 중",
  "공개된 관측 기록을 모으는 중",
  "결말 비율을 계산하는 중",
] as const;

export const LOADING_FIND_SIMILAR = "비슷한 꿈을 찾는 중…";
export const LOADING_FIND_REVIEW = "비슷한 후기를 정리하는 중…";
export const LOADING_MORE_REVIEW = "다음 후기를 불러오는 중…";
