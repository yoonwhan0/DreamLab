export const APP_NAME = "꿈연구소";
export const APP_NAME_EN = "DreamLab";
export const APP_DISPLAY_NAME = `${APP_NAME}(${APP_NAME_EN})`;
export const APP_SHORT_NAME = "DreamLab";

/** 헤더 — 짧은 정체성 */
export const APP_SUBTITLE = "DreamLab · 꿈 결과 데이터";

/** 메인 슬로건 — OG·소개용 */
export const BRAND_TAGLINE =
  "같은 꿈을 꾼 사람들. 30일 뒤, 그들에게는 무슨 일이 있었을까요?";

/** 홈 첫 화면 — 호기심·질문형 훅 */
export const HOME_HERO_TITLE = "같은 꿈을 꾼 사람들.";

/** 서브 훅 — 홈 히어로 질문 (액센트) */
export const BRAND_HOOK_LEAD = "";
export const BRAND_HOOK_MID = "";
export const BRAND_HOOK_LINE = "30일 뒤, 그들에게는 무슨 일이 있었을까요?";

/** @deprecated use BRAND_HOOK_LINE */
export const BRAND_ORACLE_LINE = BRAND_HOOK_LINE;

export const BRAND_DEPTH_LINE =
  "해몽은 여기까지입니다. 그 너머는 열람 권한이 있는 자만 봅니다.";

/** 핵심 정체성 */
export const BRAND_MANIFESTO =
  "꿈의 결말은 금기였습니다. 혼자 해석하면 끝났고, 아무도 한 달 뒤를 말해주지 않았습니다. 우리는 그 영역을 열었습니다.";

export const BRAND_CLOSING = "오늘도, 누군가의 한 달 뒤가 잠금 해제됩니다.";

export const RESEARCH_MISSION_TITLE = "우리는 어떤 것을 연구하는가";

/** 아코디언 펼침 — 히어로 직후 훅 (태그라인과 겹치지 않게) */
export const RESEARCH_MISSION_HOOK =
  "해몽은 이제 어디서나 받을 수 있습니다. 문제는 그다음이었습니다.";

/** 내러티브 비트 */
export const RESEARCH_MISSION_BEATS = [
  "AI가 꿈 해몽을 해주는 건, 더 이상 특별하지 않습니다.",
  "그런데 그 기록은 쌓입니다. 웃고 넘기기엔, 너무 진지해지고 있습니다.",
  "그래서 우리는 물었습니다. 한 달 뒤, 그들에게는 무슨 일이 있었을까.",
] as const;

/** 연구 주제 — 카드형 안내 */
export const RESEARCH_MISSION_TOPICS = [
  {
    title: "같은 꿈 → 30일 뒤",
    body: "해몽이 끝나는 지점에서, 실제로 한 달 뒤 어떤 일이 있었는지를 모읍니다.",
  },
  {
    title: "누적된 꿈 패턴",
    body: "기록이 쌓일수록 키워드·감정·결말이 아카이브 그래프로 드러납니다.",
  },
  {
    title: "해몽 vs 현실",
    body: "인터넷 해몽과 실제 후기가 얼마나 다른지 — 겹쳐 비교합니다.",
  },
  {
    title: "익명 후기 네트워크",
    body: "비슷한 꿈을 꾼 사람들의 30일 답변이, 다음 관측의 통계가 됩니다.",
  },
] as const;

/** 프리미엄·잠금 CTA 톤 */
export const BRAND_FORBIDDEN_TEASE =
  "일부만 공개됩니다. 나머지는 프리미엄 구독에서 볼 수 있어요.";

/** OG·메타용 */
export const BRAND_META_DESCRIPTION =
  "DreamLab — 같은 꿈을 꾼 사람들. 30일 뒤, 그들에게는 무슨 일이 있었을까요? 해몽 너머, 한 달 뒤 결말을 일부만 엽니다.";

/** 버튼·퍼널 — 짧고 직관적으로 (브랜드 수식어 X) */
export const CTA_SIGNUP = "무료로 가입하기";
export const CTA_SIGNUP_SEE_MORE = "가입하고 더 보기";
export const CTA_PREMIUM = "프리미엄 구독 · ₩4,900/월";
export const CTA_PREMIUM_SEE_ALL = "프리미엄으로 전체 보기";
export const CTA_WRITE_DREAM = "꿈 기록하기";
export const CTA_EXPLORE = "다른 꿈 패턴 탐색";
export const HINT_GUEST = "지금은 미리보기만 — 가입하면 저장·알림·유사 꿈이 열립니다";
export const HINT_MEMBER = "지금은 일부만 — 프리미엄이면 운세 그래프·후기·통계 전체";
export const HINT_PREMIUM = "1분 · 기록 무료 · 한 달 뒤 결말 기록";
