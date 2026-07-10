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
    desc: "지금은 일부만 보입니다. 프리미엄이면 한 달 뒤 통계·후기를 전부 볼 수 있어요.",
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
    title: "금단의 영역",
    body: "해몽은 입구에서 끝났습니다. 꿈이 현실에서 어떻게 풀렸는지 — 그 결말은 아무도 끝까지 말해주지 않았습니다. 우리만 열었습니다.",
  },
  {
    id: "fomo",
    title: "당신만 모릅니다",
    body: "같은 꿈을 꾼 수만 명이 이미 한 달 뒤를 남겼습니다. 별일 없었음 몇 %, 나쁜 일 몇 % — 당신만 아직 그 숫자를 모릅니다.",
  },
  {
    id: "unlock",
    title: "잠금이 풀리는 순간",
    body: "한 건만 보여드립니다. 나머지는 열람 권한이 있는 자만 봅니다. 보고 나면, 혼자 해석하던 밤이 달라집니다.",
  },
  {
    id: "share",
    title: "공유가 열쇠입니다",
    body: "내 한 달 뒤가 남의 꿈에 답이 됩니다. 기록할수록 금단의 문이 넓어지고, 당신만의 결말도 데이터가 됩니다.",
  },
] as const;

export const PRODUCT_IDEAS = CURIOSITY_HOOKS;

export const FOLLOWUP_EXAMPLES = [
  "별일 없었는데, 왜 그 꿈만 자꾸 생각났을까",
  "꿈과 전혀 다른 일이 터졌어요",
  "무섭게 꿨는데 한 달 뒤엔 좋은 소식이",
  "솔직히 아무 일도 없었어요",
];

export const FOLLOWUP_NOTE_HINT =
  "한 달 전 관측 기록 — 현실에서는? 답이 쌓일수록 다음 관측의 통계가 열립니다.";

export const INTERPRETATION_IDEA_GUIDE = `
- usualTake: 인터넷 해몽(겁·단정) — 대비용
- alternativeLens: "보통은 ~지만" 꺾기 + 다층 관점 (심리·데이터·맥락)
- symbol/psychology/reflection: 관측·30일 데이터, 호기심 갭, 단정 금지
- 저비용 모델 + 프롬프트·후처리로 프리미엄 톤 (netlify/functions/lib/interpretPremium.ts)
- 문장 필드 최대 2줄 \\n
`.trim();
