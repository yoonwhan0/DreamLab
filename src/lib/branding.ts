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

/** 「우리는 어떤 것을 연구하나」 — 짧은 내러티브 비트 */
export const RESEARCH_MISSION_BEATS = [
  "AI가 꿈 해몽을 해주는 건, 이제 일반적입니다.",
  "그 기록은 쌓입니다. 웃고 넘기기엔, 너무 많이 모이고 있습니다.",
  "우리는 생각했습니다. 해몽이 끝난 뒤, 그다음은 무엇일까?",
] as const;

/** 연구 축 — 아코디언 안 짧은 라벨 */
export const RESEARCH_MISSION_PILLARS = [
  { label: "30일 뒤", text: "같은 꿈을 꾼 이들에게 실제로 무슨 일이 있었는지" },
  { label: "쌓인 패턴", text: "키워드·감정·결말이 아카이브로 드러나는지" },
  { label: "해몽 vs 현실", text: "인터넷 해석과 실제 후기가 얼마나 다른지" },
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
