import {
  BRAND_MANIFESTO,
  BRAND_TAGLINE,
  BRAND_HOOK_LEAD,
  BRAND_HOOK_MID,
  BRAND_HOOK_LINE,
  HOME_HERO_TITLE,
} from "@/lib/branding";

/** 소비자 여정 */
export const CONSUMER_JOURNEY = [
  { step: 1, label: "꿈 기록", hook: "꿈 적기" },
  { step: 2, label: "30일 대기", hook: "알림 예약" },
  { step: 3, label: "결과 공유", hook: "후기 남기기" },
  { step: 4, label: "패턴 열람", hook: "통계 보기" },
] as const;

export const SERVICE_TAGLINE = BRAND_TAGLINE;

export const HOME_HERO_DESC_LEAD = BRAND_HOOK_LEAD;
export const HOME_HERO_DESC_MID = BRAND_HOOK_MID;
export const HOME_HERO_DESC_ACCENT = BRAND_HOOK_LINE;

export const PAGE_COPY = {
  home: {
    label: "DreamLab",
    title: HOME_HERO_TITLE,
    descLead: HOME_HERO_DESC_LEAD,
    descMid: HOME_HERO_DESC_MID,
    descAccent: HOME_HERO_DESC_ACCENT,
  },
  explore: {
    title: "패턴 탐색",
    desc: "비슷한 꿈을 꾼 사람들이 한 달 뒤에 남긴 기록을 봅니다.",
  },
  write: {
    title: "관측 기록",
    desc: "기억나는 대로 적으면 됩니다. 제목은 자동으로 잡힙니다.",
  },
  writeEmotions: {
    title: "기록 시 감정",
    desc: "관측 메모는 준비됐습니다. 꿈 속 기분만 골라 주세요.",
  },
  followUp: {
    title: "한 달 뒤 결과",
    desc: "지금 적어도 됩니다. 아직 안 적었다면 30일에 알림이 옵니다.",
  },
  premium: {
    title: "열람 권한 · 프리미엄",
    desc: "8주 운세 그래프·재물·연애·직장운 전 축. 같은 꿈 30일 뒤 통계·후기 전체.",
  },
  my: {
    title: "내 꿈 아카이브",
    desc: "내가 꾼 꿈과, 한 달 뒤 직접 남긴 후기를 모아 봅니다.",
  },
  myDreams: {
    title: "전체 아카이브",
    desc: "기록한 꿈을 시간순으로 모두 봅니다.",
  },
} as const;

export const SERVICE_PROMISE = BRAND_MANIFESTO;

export const CURIOSITY_HOOKS = [
  {
    id: "forbidden",
    title: "해몽 다음 기록",
    body: "꿈은 보통 해몽에서 끝납니다. 꿈연구소는 그 뒤 한 달 동안 실제로 무엇이 달라졌는지, 사용자가 남긴 문장으로 다시 봅니다.",
  },
  {
    id: "fomo",
    title: "같은 꿈의 한 달",
    body: "같은 키워드로 기록된 꿈도 30일 뒤 이야기는 조금씩 갈립니다. 좋은 소식, 관계 변화, 조용한 정리까지 실제 후기를 나란히 봅니다.",
  },
  {
    id: "unlock",
    title: "일부 미리보기",
    body: "처음에는 대표 후기만 보여드립니다. 더 많은 기록을 열면 내 꿈과 비슷한 장면이 어떤 결말로 이어졌는지 더 촘촘히 비교할 수 있습니다.",
  },
  {
    id: "share",
    title: "내 기록도 데이터",
    body: "내 한 달 뒤 후기는 다음 사람에게 참고 기록이 됩니다. 과장하지 않고 적은 한 문장이 같은 꿈 패턴의 통계를 더 정확하게 만듭니다.",
  },
] as const;

export const PRODUCT_IDEAS = CURIOSITY_HOOKS;

export const FOLLOWUP_EXAMPLES = [
  "꿈이랑 직접 연결되진 않았지만 계속 생각났어요",
  "그 뒤로 관계를 정리할 일이 있었어요",
  "무섭게 꿨는데 한 달 뒤엔 마음이 좀 놓였어요",
  "큰 사건은 없었고, 컨디션만 유난히 흔들렸어요",
];

export const FOLLOWUP_NOTE_HINT =
  "한 달 전 관측 기록 — 현실에서는? 답이 쌓일수록 다음 관측의 통계가 열립니다.";

export const INTERPRETATION_IDEA_GUIDE = `
- usualTake: 일반 해몽에서 흔히 보는 해석을 소개하되 과장·공포 단정 금지
- alternativeLens: "보통은 ~지만" 꺾기 + 이 꿈의 장면·감정·현실 맥락
- symbol/psychology/reflection: 관측·30일 데이터, 담백한 호기심, 단정 금지
- 저비용 모델 + 프롬프트·후처리로 프리미엄 톤 (netlify/functions/lib/interpretPremium.ts)
- 문장 필드 최대 2줄 \\n
`.trim();
