import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";

/** 합성 후기용 — 같은 주제, 다른 장면 (경기장→공연장 등) */
const SCENE_VARIANTS: { theme: RegExp; settings: string[]; moods: string[] }[] = [
  {
    theme: /경기|축구|야구|스타디움|경기장|관중/,
    settings: ["공연장", "콘서트홀", "대형 행사장", "실내 아레나"],
    moods: ["환호가 밀려오기 직전", "많은 시선이 한곳에 모이는", "소리가 울려 퍼지는"],
  },
  {
    theme: /시험|수능|답안|교실|채점/,
    settings: ["면접 대기실", "발표 연습실", "서류 심사실", "온라인 시험 화면"],
    moods: ["시간이 다 가는", "손에 땀이 맺히는", "조용해서 더 무서운"],
  },
  {
    theme: /집|방|침대|현관|거실/,
    settings: ["낯선 복도", "옛 아파트 계단", "비어 있는 사무실", "모텔 복도"],
    moods: ["익숙한데 이상한", "문이 잠기지 않는", "누군가 있는 것 같은"],
  },
  {
    theme: /쫓|도망|추격|뒤쫓/,
    settings: ["지하철 플랫폼", "주차장", "밤거리 골목", "엘리베이터"],
    moods: ["발이 안 떨어지는", "숨이 가빠지는", "뒤를 돌아볼 수 없는"],
  },
  {
    theme: /뱀|물고기|동물|개|고양이/,
    settings: ["수족관 통로", "야외 시장", "놀이공원", "온실"],
    moods: ["가까이 다가오는", "움직임이 이상하게 느린", "눈이 마주친"],
  },
  {
    theme: /비행|하늘|날아|추락|비행기/,
    settings: ["고층 건물 옥상", "케이블카", "관람차", "다리 위"],
    moods: ["발밑이 비어 있는", "바람이 거세게 부는", "높이가 갑자기 느껴지는"],
  },
];

const GENERIC_VARIANTS = {
  settings: ["낯선 복도", "큰 홀", "밤의 거리", "조용한 카페", "버스 안"],
  moods: ["많은 시선이 느껴지는", "현실과 섞인 듯한", "결정적인 순간이 다가오는", "말하지 못한 채 남은"],
};

function pickVariantGroup(anchor: string) {
  const k = anchor.trim();
  for (const group of SCENE_VARIANTS) {
    if (group.theme.test(k)) return group;
  }
  return null;
}

/** 합성 관측자 꿈 한 줄 — 키워드를 끼워 넣지 않는 독립 장면 */
export function buildVariantDreamSnippet(anchor: string, index: number): string {
  const seed = hashSeed(`variant-snippet-${anchor}-${index}`);
  const rand = createSeededRandom(seed);
  const group = pickVariantGroup(anchor) ?? GENERIC_VARIANTS;
  const settings = "settings" in group ? group.settings : GENERIC_VARIANTS.settings;
  const moods = "moods" in group ? group.moods : GENERIC_VARIANTS.moods;
  const setting = settings[seededInt(rand, 0, settings.length - 1)]!;
  const mood = moods[seededInt(rand, 0, moods.length - 1)]!;
  const templates = [
    `${setting}에 혼자 서 있었는데 ${mood} 느낌이 먼저 왔습니다. 누가 부른 것도 아닌데 계속 주변을 확인하게 됐어요. 깨자마자 손에 힘이 들어가 있었습니다.`,
    `${mood} 순간이 지나가고 ${setting}만 조용히 남았습니다. 친구에게 말하려다 설명이 잘 안 돼서 메모부터 했어요. 하루 종일 그 장면의 온도만 기억났습니다.`,
    `새벽에 깼을 때 ${setting}의 소리만 또렷했습니다. 꿈속에서는 별일 아닌 것처럼 지나갔는데 몸은 계속 긴장해 있었어요. 한 달 뒤 다시 읽으니 그때의 압박이 보였습니다.`,
  ];
  return templates[seededInt(rand, 0, templates.length - 1)]!;
}

export function buildVariantDreamTitle(anchor: string, index: number): string {
  const seed = hashSeed(`variant-title-${anchor}-${index}`);
  const rand = createSeededRandom(seed);
  const group = pickVariantGroup(anchor);
  const setting = group
    ? group.settings[seededInt(rand, 0, group.settings.length - 1)]!
    : GENERIC_VARIANTS.settings[seededInt(rand, 0, GENERIC_VARIANTS.settings.length - 1)]!;
  return `${setting}에 혼자 남아 있던 꿈`;
}
