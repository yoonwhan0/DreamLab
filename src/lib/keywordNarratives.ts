import { hashSeed, createSeededRandom, seededInt } from "@/lib/seededRandom";
import type { OutcomeCategory } from "@/types";
import { VIVID_DREAM_SCENES, VIVID_DREAM_TITLES } from "@/lib/vividPreviewCopy";

export interface KeywordNarrativePack {
  category: string;
  countRange: [number, number];
  followUpRate: number;
  titles: string[];
  dreamSnippets: string[];
  afterByOutcome: Partial<Record<OutcomeCategory, string[]>>;
  relatedKeywords: string[];
}

const PACKS: Record<string, KeywordNarrativePack> = {
  내태몽: {
    category: "family",
    countRange: [420, 980],
    followUpRate: 0.468,
    relatedKeywords: ["태몽", "보살", "연꽃", "갓난아기", "전쟁"],
    titles: [
      "전쟁 하늘에서 연꽃 위 보살",
      "할아버지가 전해준 내태몽",
      "하늘에서 내려온 갓난아기",
      "연꽃을 타고 온 보살의 꿈",
    ],
    dreamSnippets: [
      "전쟁 중 하늘에서 보살이 연꽃을 타고 내려와 갓난아기를 건네주는 장면이 선명했어요.",
      "가족이 내태몽이라 전해준 꿈 — 전쟁과 보살, 연꽃이 한 화면에 겹쳤습니다.",
      "하늘에서 빛과 함께 보살이 나타나 아기를 두고 사라지는 꿈이었어요.",
      "연꽃 위에 앉은 형상이 갓난아기를 내려주고 멀어지는 장면이 반복됐어요.",
    ],
    afterByOutcome: {
      good: [
        "기대하지 않았던 좋은 소식이 있었어요. 꿈과 직접 연결되진 않지만, 마음이 한결 가벼워졌습니다.",
        "가족 쪽에서 반가운 연락이 왔어요. 내태몽 이후로 집안 분위기가 조금 부드러워졌어요.",
      ],
      bad: [
        "한 달 안에 가족·일 관련 갈등이 있었어요. 전쟁 장면이 불안과 겹쳐 더 무거웠습니다.",
      ],
      love: [
        "새 인연이나 오래된 인연의 연락이 있었어요. 갓난아기 장면이 ‘새 시작’으로 떠올랐다고 후기에 남겼어요.",
      ],
      family: [
        "가족과 오래 묵은 이야기를 나눴어요. 할아버지가 전해준 꿈을 다시 확인하는 계기가 됐습니다.",
      ],
    },
  },
  보살: {
    category: "family",
    countRange: [880, 2140],
    followUpRate: 0.441,
    relatedKeywords: ["연꽃", "내태몽", "하늘", "갓난아기", "기도"],
    titles: [
      "연꽃 위에서 내려온 보살",
      "하늘에서 보살을 본 꿈",
      "전쟁 중 나타난 보살",
      "빛과 함께한 보살의 꿈",
    ],
    dreamSnippets: [
      "하늘에서 보살이 연꽃을 타고 내려오는 장면이 너무 선명했어요.",
      "전쟁 같은 분위기 속에서 보살이 나타나 손을 내밀었습니다.",
      "연꽃 위에 앉은 보살이 잠시 머물다 사라지는 꿈이었어요.",
      "보살이 갓난아기를 두고 떠나는 장면 — 말은 없었지만 마음이 편해졌어요.",
    ],
    afterByOutcome: {
      good: [
        "좋은 소식이나 마음의 안정이 찾아왔어요. 꿈 이후로 기도·명상을 시작했다는 후기도 있었어요.",
      ],
    },
  },
  연꽃: {
    category: "family",
    countRange: [640, 1520],
    followUpRate: 0.435,
    relatedKeywords: ["보살", "하늘", "내태몽", "갓난아기", "빛"],
    titles: [
      "연꽃을 타고 하강하는 꿈",
      "연꽃 위의 형상",
      "전쟁 하늘의 연꽃",
      "연꽃과 아기",
    ],
    dreamSnippets: [
      "하늘에서 연꽃이 내려오고 그 위에 누군가 앉아 있었어요.",
      "연꽃이 점점 가까워지며 갓난아기와 함께 있는 장면이었습니다.",
      "전쟁 소리 속에서도 연꽃만은 고요하게 빛나는 꿈이었어요.",
    ],
    afterByOutcome: {
    },
  },
  뱀: {
    category: "anxiety",
    countRange: [4120, 8900],
    followUpRate: 0.487,
    relatedKeywords: ["집", "초록색", "현관", "물", "불안"],
    titles: [
      "집 현관으로 들어오는 큰 뱀",
      "쫓아오지 않는 뱀과 마주한 꿈",
      "초록색 뱀이 거실에 누워 있는 꿈",
      "뱀과 눈이 마주친 새벽 꿈",
    ],
    dreamSnippets: [
      "옛날 살던 집인데 큰 뱀이 현관문을 열고 들어왔어요. 무서웠는데 쫓아오진 않았습니다.",
      "초록색 뱀이 거실 소파 옆에 누워 있었어요. 가까이 다가갈 수는 없었습니다.",
      "뱀이 갑자기 나타났다 사라졌어요. 깬 뒤에도 등이 서늘했습니다.",
      "손바닥만 한 뱀이 책상 위를 기어 다녔어요. 잡을지 말지 못 정한 채 깨었습니다.",
    ],
    afterByOutcome: {
      good: [
        "기대하지 않았던 좋은 소식이 있었어요. 꿈과 직접 연결되진 않지만, 한동안 무거웠던 마음이 가벼워졌습니다.",
      ],
      money: [
        "예상치 못한 지출이 있었지만, 크게 흔들리진 않았어요. 꿈의 '손재'와 겹쳐 잠깐 긴장했습니다.",
      ],
    },
  },
  시험: {
    category: "anxiety",
    countRange: [6840, 11240],
    followUpRate: 0.512,
    relatedKeywords: ["수능", "책상", "시간", "교실", "답안지"],
    titles: [
      "수능 전날 밤, 답안지가 비어 있는 시험",
      "알고리즘 시험인데 문제가 계속 바뀌는 꿈",
      "시험장에서 이름을 못 쓰고 서 있는 꿈",
      "시험 끝나기 1분 전에 깨어난 꿈",
    ],
    dreamSnippets: [
      "시험 시간이 다 가는데 답을 한 줄도 못 썼어요. 손에는 땀이 고이고, 주변은 너무 조용했습니다.",
      "같은 시험을 몇 번이나 다시 보는 꿈이었어요. 매번 다른 과목이 나왔습니다.",
      "시험지가 하얗게 비어 있었는데, 채점자가 제 이름만 부르고 있었어요.",
      "시험장이 갑자기 어두워지고, 출입문만 멀어지는 느낌이었습니다.",
    ],
    afterByOutcome: {
      bad: [
        "한 달 안에 중요한 평가에서 크게 흔들렸어요. 꿈이 경고였는지는 모르겠지만, 그 시기는 정말 버거웠습니다. 지나고 나니 '그때도 결국 넘어갔다'는 게 위로가 됐어요.",
        "예상치 못한 탈락·감점이 있었습니다. 꿈의 시험장과 겹쳐 더 무거웠어요. 그래도 다음 루틴을 다시 세웠습니다.",
      ],
      good: [
        "기대보다 좋은 결과가 나왔어요. 꿈과는 반대로, 현실은 조용히 풀렸습니다. '최악만 상상하던 버릇'이 조금 줄었어요.",
        "오래 준비하던 일이 정리됐습니다. 꿈 이후로 공부 루틴을 더 차분히 잡을 수 있었어요.",
      ],
      job: [
        "면접·자격 관련 일정이 겹쳤어요. 꿈의 시험 불안이 현실의 선택 압박과 맞물렸습니다. 결과는 생각보다 나쁘지 않았어요.",
      ],
    },
  },
  로또: {
    category: "fortune",
    countRange: [5210, 9870],
    followUpRate: 0.448,
    relatedKeywords: ["번호", "당첨", "돈", "종이", "기다림"],
    titles: [
      "로또 번호가 하늘에 떠 있는 꿈",
      "당첨 확인하는데 화면이 멈춘 꿈",
      "로또를 샀는데 영수증이 사라지는 꿈",
      "당첨자 발표 순간에 깨어난 꿈",
    ],
    dreamSnippets: [
      "로또 번호가 하나씩 떠오르는데, 깨고 나니 하나도 기억이 안 났어요.",
      "당첨됐다는 문자를 받는 꿈이었는데, 확인하려다 손이 떨렸습니다.",
      "로또를 샀는데 주머니가 비어 있었어요. 다시 찾으려 해도 영수증만 사라졌습니다.",
      "당첨 방송이 나오는데 제 번호만 소리가 안 들렸어요.",
    ],
    afterByOutcome: {
      good: [
        "작은 행운이 있었어요. 로또 당첨은 아니지만, 예상 못 한 수입이 들어왔습니다.",
        "오래 막혀 있던 돈 문제가 조금 풀렸어요. 꿈의 번호와는 무관했지만, 숨이 트였습니다.",
      ],
      money: [
        "예상치 못한 지출이 있었어요. 꿈의 '대박' 기대와 반대로, 현실은 타이트했습니다. 그래도 계획을 세워 넘겼어요.",
        "돈 때문에 며칠 밤을 지샜어요. 한 달 뒤 돌아보니 '그때도 버텼다'는 게 위로가 됐습니다.",
      ],
    },
  },
  돈: {
    category: "fortune",
    countRange: [4320, 8760],
    followUpRate: 0.467,
    relatedKeywords: ["지갑", "빚", "통장", "잃어버림", "줍기"],
    titles: [
      "지갑이 비어 있는데 아무도 모르는 꿈",
      "바닥에 돈이 쌓이는데 집어 담지 못하는 꿈",
      "빌려준 돈을 돌려받지 못하는 꿈",
      "통장 잔고 숫자가 계속 줄어드는 꿈",
    ],
    dreamSnippets: [
      "지갑을 열었는데 텅 비어 있었어요. 주변 사람들은 평소처럼 웃고 있었습니다.",
      "돈이 바닥에 흩어져 있는데, 손이 닿기 전에 사라졌어요.",
      "빌려준 돈을 돌려달라 했는데, 상대가 얼굴을 돌렸습니다.",
      "ATM 화면에서 잔고가 실시간으로 줄어드는 꿈이었어요.",
    ],
    afterByOutcome: {
      money: [
        "예상치 못한 지출이 터졌어요. 꿈의 '손재'와 겹쳐 패닉이 났지만, 결국 정리됐습니다.",
        "돈 문제로 며칠 밤을 지샜어요. 한 달 뒤엔 '그때도 넘어갔다'는 위로가 됐어요.",
      ],
      good: [
        "작은 수입이 생겼어요. 꿈과 직접 연결되진 않지만, 숨통이 트였습니다.",
      ],
    },
  },
  "전 남친": {
    category: "love",
    countRange: [3890, 7240],
    followUpRate: 0.534,
    relatedKeywords: ["연락", "집", "눈물", "문", "전화"],
    titles: [
      "전 남친이 현관문을 두드리는 꿈",
      "전 남친과 같은 엘리베이터에 갇힌 꿈",
      "전 남친이 결혼한다는 소식을 듣는 꿈",
      "전 남친이 돌아오는데 말을 안 하는 꿈",
    ],
    dreamSnippets: [
      "전 남친이 문 앞에 서 있었어요. 열어주지 않았는데, 계속 두드렸습니다.",
      "같은 공간에 있는데 서로 말을 안 했어요. 숨소리만 들렸습니다.",
      "전 남친이 다른 사람과 있는 장면을 봤어요. 깨고 나니 가슴이 먹먹했습니다.",
      "전 남친이 돌아왔는데, 얼굴이 안 보였어요. 이름만 불렀습니다.",
    ],
    afterByOutcome: {
      love: [
        "연락이 왔어요. 꿈과 비슷한 감정이었지만, 서두르지 않아도 괜찮다는 걸 알게 됐어요.",
        "새 만남이 있었어요. 꿈 이후로 '혼자가 아니다'는 감각이 조금 돌아왔습니다.",
      ],
      bad: [
        "관계에서 큰 싸움이 났어요. 꿈의 배신감이 현실로 번진 것 같기도 했습니다.",
      ],
    },
  },
  "죽은 사람": {
    category: "anxiety",
    countRange: [2980, 6120],
    followUpRate: 0.558,
    relatedKeywords: ["할머니", "아버지", "무덤", "편지", "눈물"],
    titles: [
      "돌아가신 할머니가 밥을 차려주는 꿈",
      "죽은 사람이 살아 있는 것처럼 웃는 꿈",
      "장례식장에서 다시 눈을 뜨는 꿈",
      "죽은 사람에게 편지를 받는 꿈",
    ],
    dreamSnippets: [
      "돌아가신 분이 평소처럼 밥상을 차리고 있었어요. 말은 없었지만 손은 따뜻했습니다.",
      "죽은 사람이 살아 있는 것처럼 웃었어요. 깨고 나니 베개가 젖어 있었습니다.",
      "장례식장인데, 갑자기 그 사람이 일어나는 꿈이었어요. 공포보다 그리움이 컸습니다.",
      "편지를 받았는데 글씨가 흐려 읽을 수 없었어요. 내용은 알 것 같았습니다.",
    ],
    afterByOutcome: {
      family: [
        "가족 관련 일이 있었어요. 꿈 이후로 오래 미뤄둔 대화를 나눴습니다.",
      ],
      good: [
        "작은 위로가 있었어요. 꿈과 직접 연결되진 않지만, 마음이 가벼워졌습니다.",
      ],
    },
  },
  불: {
    category: "anxiety",
    countRange: [3540, 6890],
    followUpRate: 0.489,
    relatedKeywords: ["연기", "집", "도망", "119", "어둠"],
    titles: [
      "집이 불타는데 도망치지 못하는 꿈",
      "불길 속에서 아이를 찾는 꿈",
      "불이 꺼진 줄 알았는데 다시 타오르는 꿈",
      "연기만 보이고 불꽃은 안 보이는 꿈",
    ],
    dreamSnippets: [
      "집이 타고 있었는데 다리가 안 움직였어요. 연기만 먼저 차올랐습니다.",
      "불길 속에서 아이를 찾았는데, 손이 닿지 않았어요.",
      "불을 끈 줄 알았는데, 눈을 뜨면 다시 타오르는 꿈이 반복됐어요.",
      "불꽃은 안 보이고 연기만 가득했어요. 숨이 막혔습니다.",
    ],
    afterByOutcome: {
      bad: [
        "갑작스러운 압박·갈등이 있었어요. 꿈의 불길함이 현실 스트레스와 겹쳤습니다.",
      ],
    },
  },
  이별: {
    category: "love",
    countRange: [4120, 7680],
    followUpRate: 0.521,
    relatedKeywords: ["문", "짐", "눈물", "전화", "침묵"],
    titles: [
      "이별 통보를 받는 꿈",
      "이별 후에도 같은 집에 있는 꿈",
      "이별하는데 말이 안 나오는 꿈",
      "이별 문자를 받고 손이 떨리는 꿈",
    ],
    dreamSnippets: [
      "이별을 통보받았는데, 이유는 듣지 못했어요. 문만 닫혔습니다.",
      "이별한 줄 알았는데 같은 공간에 있었어요. 서로 시선을 피했습니다.",
      "이별하려 했는데 입이 안 떨어졌어요. 상대만 뒤돌아 섰습니다.",
      "이별 문자를 받았는데, 화면이 점점 흐려졌습니다.",
    ],
    afterByOutcome: {
      love: [
        "관계가 조금씩 정리됐어요. 꿈 이후로 솔직한 대화를 나눴습니다.",
      ],
      bad: [
        "실제로 이별·갈등이 있었어요. 힘들었지만, 기록해둔 덕분에 감정은 정리됐어요.",
      ],
    },
  },
  임신: {
    category: "love",
    countRange: [2760, 5340],
    followUpRate: 0.547,
    relatedKeywords: ["아기", "병원", "검사", "가족", "놀람"],
    titles: [
      "임신 테스트가 두 줄인 꿈",
      "임신 사실을 아무도 모르는 꿈",
      "임신했는데 배가 안 보이는 꿈",
      "임신 소식을 들은 가족의 표정 꿈",
    ],
    dreamSnippets: [
      "임신 테스트기에 선이 두 개 그어졌어요. 깨고 나니 손이 떨렸습니다.",
      "임신한 것 같은데 아무도 몰랐어요. 혼자만 알고 있는 느낌이었습니다.",
      "임신했다는데 배가 평소와 같았어요. 거울 속 얼굴만 낯설었습니다.",
      "가족에게 말하려다 입이 막혔어요. 표정만 보였습니다.",
    ],
    afterByOutcome: {
      family: [
        "가족 관련 일이 있었어요. 꿈 이후로 몸과 마음을 더 챙기게 됐어요.",
      ],
      good: [
        "기대하지 않았던 좋은 소식이 있었어요. 꿈과 직접 연결되진 않았지만 마음이 가벼워졌어요.",
      ],
    },
  },
  "치아 빠짐": {
    category: "anxiety",
    countRange: [3180, 5920],
    followUpRate: 0.476,
    relatedKeywords: ["거울", "피", "입", "이빨", "놀람"],
    titles: [
      "이가 하나씩 빠지는 꿈",
      "치아가 손에 쥐어지는 꿈",
      "거울 속에서 이가 없는 꿈",
      "치아가 빠졌는데 피가 안 나는 꿈",
    ],
    dreamSnippets: [
      "이가 하나씩 빠졌어요. 통증은 없었는데, 손에만 남았습니다.",
      "치아가 손바닥에 떨어졌어요. 삼키지 않으려 애썼습니다.",
      "거울을 봤는데 이가 비어 있었어요. 웃을 수 없었습니다.",
      "이가 빠졌는데 피가 없었어요. 오히려 더 불안했습니다.",
    ],
    afterByOutcome: {
      health: [
        "치과·검진 일정이 있었어요. 꿈의 불길함이 겹쳐 긴장했지만 결과는 괜찮았어요.",
      ],
    },
  },
  "쫓기는 꿈": {
    category: "anxiety",
    countRange: [7420, 12890],
    followUpRate: 0.493,
    relatedKeywords: ["도망", "어둠", "숨", "발", "문"],
    titles: [
      "누군가 쫓아오는데 얼굴이 안 보이는 꿈",
      "쫓기다가 길이 막힌 꿈",
      "쫓기는 꿈에서 숨을 쉴 수 없는 꿈",
      "쫓기다 발이 땅에 닿지 않는 꿈",
    ],
    dreamSnippets: [
      "뒤에서 쫓아오는데 얼굴이 안 보였어요. 발소리만 커졌습니다.",
      "도망치다 길이 막혔어요. 벽이 천천히 좁혀졌습니다.",
      "쫓기는데 숨이 막혔어요. 입을 벌려도 공기가 안 들어왔습니다.",
      "달리는데 발이 땅에 닿지 않았어요. 점점 멀어졌습니다.",
    ],
    afterByOutcome: {
      bad: [
        "한 달 안에 스트레스 peak가 있었어요. 꿈의 쫓김과 비슷한 압박이었습니다.",
      ],
    },
  },
  실직: {
    category: "career",
    countRange: [4120, 7890],
    followUpRate: 0.478,
    relatedKeywords: ["회사", "해고", "통보", "서류", "면접"],
    titles: [
      "해고 통보를 받는 꿈",
      "회사에서 짐을 싸라는 꿈",
      "실직 후에도 출근하는 꿈",
      "면접에서 떨어지는 꿈",
    ],
    dreamSnippets: [
      "상사가 조용히 해고 통보를 했어요. 주변은 평소처럼 웃고 있었습니다.",
      "책상이 비어 있었고, 내 자리만 텅 비어 있었어요. 아무도 말을 걸지 않았습니다.",
      "실직한 줄 알았는데 다음 날도 출근하는 꿈이었어요. 현실과 꿈이 섞였습니다.",
      "면접 결과를 듣는데, 말 없이 고개만 저었어요.",
    ],
    afterByOutcome: {
      bad: [
        "한 달 안에 조직 개편·압박이 있었어요. 꿈의 불안이 현실 스트레스와 겹쳤습니다.",
      ],
      job: [
        "이직·면접 일정이 겹쳤어요. 꿈 이후로 '최악만 상상'하지 않기로 했습니다.",
        "업무 스트레스가 peak였지만, 한 달 뒤엔 '그때도 버텼다'는 위로가 됐어요.",
      ],
    },
  },
};

function normalizeKeyword(keyword: string): string {
  return keyword.trim().replace(/\s+/g, " ");
}

export function getKeywordNarrativePack(keyword: string): KeywordNarrativePack | null {
  const k = normalizeKeyword(keyword);
  if (PACKS[k]) return PACKS[k];
  for (const [key, pack] of Object.entries(PACKS)) {
    if (k.includes(key) || key.includes(k)) return pack;
  }
  return null;
}

export function inferCategoryFromKeyword(keyword: string): string {
  const pack = getKeywordNarrativePack(keyword);
  if (pack) return pack.category;
  const k = normalizeKeyword(keyword);
  if (/뱀|쫓|추락|시험|불|죽|귀신|지진|교통|암|군대/.test(k)) return "anxiety";
  if (/연애|남친|여친|바람|불륜|이별|결혼|임신/.test(k)) return "love";
  if (/로또|돈|금|실직|파산/.test(k)) return "fortune";
  if (/회사|학교|시험/.test(k)) return "career";
  return "general";
}

export function defaultPackForKeyword(keyword: string): KeywordNarrativePack {
  const k = normalizeKeyword(keyword) || "꿈";
  const seed = hashSeed(`default-pack-${k}`);
  const rand = createSeededRandom(seed);
  const base = seededInt(rand, 1840, 4680);
  return {
    category: inferCategoryFromKeyword(k),
    countRange: [base, base + seededInt(rand, 800, 2400)],
    followUpRate: 0.41 + rand() * 0.14,
    relatedKeywords: ["집", "밤", "불안", "연락", "돈"],
    titles: [...VIVID_DREAM_TITLES],
    dreamSnippets: [...VIVID_DREAM_SCENES].slice(0, 12),
    afterByOutcome: {},
  };
}

export function resolveNarrativePack(keyword: string): KeywordNarrativePack {
  return getKeywordNarrativePack(keyword) ?? defaultPackForKeyword(keyword);
}
