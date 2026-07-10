import { formatObservatoryId } from "@/lib/observatoryCredibility";
import {
  getKeywordNarrativePack,
  resolveNarrativePack,
  type KeywordNarrativePack,
} from "@/lib/keywordNarratives";
import { createSeededRandom, hashSeed, seededInt } from "@/lib/seededRandom";
import { VIVID_AFTER_BY_OUTCOME, VIVID_DREAM_SCENES } from "@/lib/vividPreviewCopy";
import type { CommunityStory, DreamEmotionId, OutcomeCategory } from "@/types";
import { OUTCOME_CATEGORIES } from "@/types";

export const ANONYMOUS_STORY_PROFILE = "익명 기록";

const EMOTION_POOL: DreamEmotionId[] = ["scared", "weird", "calm", "sad", "happy"];

interface ManualStoryCopy {
  title: string;
  dreamSnippet: string;
  afterStory: string;
  outcomeCategory: OutcomeCategory;
  emotions: DreamEmotionId[];
}

const MANUAL_STORIES: Record<string, ManualStoryCopy> = {
  시험: {
    title: "종이 울렸는데 문제지를 못 넘긴 꿈",
    dreamSnippet:
      "시험장 맨 앞자리에 앉아 있었는데 손에 든 펜이 계속 미끄러졌어요. 감독관은 제 이름만 확인하고 지나갔고, 문제지는 첫 장부터 젖어 있었습니다. 끝나는 종이 울릴 때까지 답을 하나도 못 쓴 채로 앉아 있었습니다.",
    afterStory:
      "한 달 안에 실제 평가 일정이 하나 겹쳤습니다. 꿈처럼 망치진 않았지만 준비가 부족하다는 느낌은 계속 따라왔어요. 그 뒤로 할 일을 작게 쪼개서 적는 습관이 생겼습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "weird"],
  },
  로또: {
    title: "번호를 적으려는 순간 종이가 젖은 꿈",
    dreamSnippet:
      "편의점 계산대 앞에서 번호 여섯 개를 외우고 있었어요. 막 종이에 쓰려는데 잉크가 물처럼 번져서 숫자가 다 뭉개졌습니다. 뒤에 줄 선 사람들 숨소리가 너무 가까워서 급하게 밖으로 나왔습니다.",
    afterStory:
      "큰돈이 들어온 일은 없었습니다. 대신 미뤄둔 환급 신청을 확인해서 작은 금액을 돌려받았어요. 기대가 컸던 만큼 현실 숫자를 직접 보는 게 더 필요하다는 생각이 들었습니다.",
    outcomeCategory: "money",
    emotions: ["weird", "happy"],
  },
  돈: {
    title: "지갑 안 영수증만 불어난 꿈",
    dreamSnippet:
      "지갑을 열었는데 현금은 없고 오래된 영수증만 빽빽하게 들어 있었습니다. 계산대 직원은 조용히 기다리는데 뒤에서 누가 제 어깨를 툭툭 쳤어요. 카드를 찾다가 지갑 바닥이 종이처럼 찢어졌습니다.",
    afterStory:
      "그달에 예상하지 못한 지출이 몇 번 있었습니다. 꿈 때문이라고 하긴 어렵지만 돈 생각이 자주 났어요. 한 달 뒤에는 자동결제 목록을 정리하고 필요 없는 항목을 끊었습니다.",
    outcomeCategory: "money",
    emotions: ["scared", "sad"],
  },
  금: {
    title: "손바닥에 금가루가 묻어 있던 꿈",
    dreamSnippet:
      "세면대에서 손을 씻는데 물이 내려가도 금가루 같은 것이 손금 사이에 남아 있었습니다. 닦을수록 더 반짝여서 당황했어요. 거울을 보니 제 얼굴보다 손바닥만 밝게 보였습니다.",
    afterStory:
      "한 달 뒤 작지만 좋은 소식이 있었습니다. 오래 기다리던 정산이 들어왔고 금액은 크지 않았지만 숨통이 트였어요. 꿈의 장면은 행운보다 안도감에 가깝게 기억됐습니다.",
    outcomeCategory: "good",
    emotions: ["weird", "happy"],
  },
  "전 남친": {
    title: "닫힌 카페 문 밖에 서 있던 꿈",
    dreamSnippet:
      "문 닫은 카페 안쪽에 전 남친이 앉아 있었고 저는 유리문 밖에 서 있었습니다. 말은 안 들리는데 그 사람이 제 쪽을 보고 웃는 것 같았어요. 손잡이를 잡았지만 문은 밀리지 않았습니다.",
    afterStory:
      "며칠 뒤 전 연인 소식을 우연히 들었습니다. 연락하고 싶은 마음이 잠깐 올라왔지만 바로 움직이진 않았어요. 한 달쯤 지나서는 그리움과 습관을 조금 구분하게 됐습니다.",
    outcomeCategory: "love",
    emotions: ["sad", "weird"],
  },
  "죽은 사람": {
    title: "식탁 건너편에 조용히 앉아 있던 꿈",
    dreamSnippet:
      "돌아가신 분이 부엌 식탁 건너편에 앉아 있었습니다. 밥그릇에서는 김이 나는데 아무 말도 하지 않았어요. 제가 숟가락을 들자 그분이 고개를 한 번 끄덕이고 자리에서 일어났습니다.",
    afterStory:
      "가족 단톡방에 오랜만에 안부가 오갔습니다. 꿈과 직접 이어진 일은 아니지만 그날 이후 가족 생각이 잦아졌어요. 한 달 뒤에는 미루던 전화를 먼저 했습니다.",
    outcomeCategory: "family",
    emotions: ["sad", "calm"],
  },
  불: {
    title: "연기 냄새만 가득했던 복도 꿈",
    dreamSnippet:
      "아파트 복도에 연기가 깔려 있었는데 불꽃은 보이지 않았습니다. 문마다 초인종 불빛만 깜빡였고 아무도 나오지 않았어요. 저는 젖은 수건을 들고 계단을 찾다가 같은 층으로 계속 돌아왔습니다.",
    afterStory:
      "그 시기에 급하게 처리할 일이 생겨 며칠 동안 긴장했습니다. 실제 사고는 없었지만 마음이 계속 조급했어요. 한 달 뒤에는 알림과 일정을 줄여서 숨 쉴 틈을 만들었습니다.",
    outcomeCategory: "bad",
    emotions: ["scared", "weird"],
  },
  이별: {
    title: "짐을 나눠 담는데 가방이 비어 있던 꿈",
    dreamSnippet:
      "방 한가운데에서 둘이 짐을 나눠 담고 있었습니다. 제 가방에는 아무것도 들어가지 않고 상대 가방만 계속 무거워졌어요. 마지막에 문이 닫히는데 저는 인사를 못 했습니다.",
    afterStory:
      "한 달 사이 관계를 다시 생각할 일이 있었습니다. 실제 이별은 아니었지만 서운했던 말을 꺼내게 됐어요. 기록을 다시 보니 붙잡고 있던 감정이 꽤 오래됐다는 걸 알았습니다.",
    outcomeCategory: "love",
    emotions: ["sad", "calm"],
  },
  임신: {
    title: "작은 신발을 잃어버린 꿈",
    dreamSnippet:
      "병원 복도 의자 위에 아주 작은 신발 한 짝이 놓여 있었습니다. 제 것처럼 챙겨야 할 것 같은데 어디에 둬야 할지 몰랐어요. 안내 방송에서는 제 이름이 아닌 낯선 이름만 반복됐습니다.",
    afterStory:
      "한 달 동안 새로 맡게 된 일이 생겼습니다. 아이나 임신과 직접 관련된 일은 아니었지만 책임감이 커진 시기였어요. 부담스럽지만 피하고 싶지만은 않은 마음이 남았습니다.",
    outcomeCategory: "family",
    emotions: ["weird", "calm"],
  },
  "치아 빠짐": {
    title: "손수건에 치아를 싸서 들고 있던 꿈",
    dreamSnippet:
      "말을 하려는데 어금니가 하나씩 빠져 손수건 위에 떨어졌습니다. 아프지는 않았지만 손수건이 묵직해질수록 말을 못 하겠더라고요. 거울 앞에 섰을 때 입 모양이 낯설게 보였습니다.",
    afterStory:
      "그달에는 말을 조심해야 하는 일이 있었습니다. 괜찮다고 넘긴 표현이 뒤늦게 신경 쓰였어요. 한 달 뒤에는 중요한 대화 전에 메모를 먼저 쓰게 됐습니다.",
    outcomeCategory: "other",
    emotions: ["scared", "weird"],
  },
  "쫓기는 꿈": {
    title: "계단 소리가 계속 따라오던 꿈",
    dreamSnippet:
      "어두운 계단을 내려가는데 위층에서 발소리가 일정하게 따라왔습니다. 뛰면 더 가까워질 것 같아서 일부러 천천히 걸었어요. 1층 표시가 여러 번 나왔는데 출구는 끝내 보이지 않았습니다.",
    afterStory:
      "한 달 동안 미뤄둔 일이 계속 마음을 눌렀습니다. 누가 실제로 재촉한 건 아니었지만 혼자 쫓기는 느낌이 강했어요. 결국 가장 작은 일부터 처리하니 잠이 조금 나아졌습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "sad"],
  },
  추락: {
    title: "난간 아래가 갑자기 사라진 꿈",
    dreamSnippet:
      "옥상 난간을 붙잡고 있었는데 아래 풍경이 종이처럼 접히며 사라졌습니다. 떨어지는 느낌은 있었지만 바닥은 끝까지 보이지 않았어요. 소리를 지르려는데 목소리가 목 안에서만 울렸습니다.",
    afterStory:
      "그 시기에 결정 하나가 갑자기 불안해졌습니다. 실제로 무너진 일은 없었지만 선택을 다시 확인하게 됐어요. 한 달 뒤에는 혼자 결론내리지 않고 주변 의견을 물었습니다.",
    outcomeCategory: "other",
    emotions: ["scared", "weird"],
  },
  바람: {
    title: "우산이 뒤집혀 하늘로 날아간 꿈",
    dreamSnippet:
      "비는 오지 않는데 바람 때문에 우산을 펴고 걷고 있었습니다. 갑자기 우산살이 뒤집히더니 손잡이만 제 손에 남았어요. 길 건너편 사람들은 멀쩡히 걸어가는데 저만 앞으로 나아가지 못했습니다.",
    afterStory:
      "한 달 동안 계획이 몇 번 바뀌었습니다. 제 의지와 상관없이 밀리는 느낌이 있었어요. 그래도 바뀐 일정에 맞춰 다시 정리하니 생각보다 큰 문제는 없었습니다.",
    outcomeCategory: "other",
    emotions: ["weird", "calm"],
  },
  교통사고: {
    title: "멈춘 차 안에서 신호만 바뀌던 꿈",
    dreamSnippet:
      "교차로 한가운데 차가 멈췄고 신호등 색만 계속 바뀌었습니다. 주변 차들은 저를 피해 조용히 지나갔어요. 안전벨트가 풀리지 않아 손끝에 땀이 났습니다.",
    afterStory:
      "실제 사고는 없었습니다. 대신 이동 일정이 꼬여서 약속을 한 번 미뤘어요. 꿈을 떠올린 뒤로는 급할수록 출발 시간을 넉넉히 잡게 됐습니다.",
    outcomeCategory: "health",
    emotions: ["scared", "weird"],
  },
  귀신: {
    title: "불 꺼진 방에서 숨소리만 들린 꿈",
    dreamSnippet:
      "방 불을 켜려고 스위치를 눌렀는데 아무 반응이 없었습니다. 침대 옆에서 제 숨소리와 다른 리듬의 숨이 들렸어요. 돌아보면 사라질 것 같아서 벽만 보고 서 있었습니다.",
    afterStory:
      "그달에는 혼자 있는 시간이 유난히 길었습니다. 무서운 일이 생긴 건 아니지만 밤에 생각이 많아졌어요. 한 달 뒤에는 잠들기 전 휴대폰을 덜 보기로 했습니다.",
    outcomeCategory: "health",
    emotions: ["scared", "sad"],
  },
  배신: {
    title: "내 편인 줄 알았던 사람이 다른 줄에 선 꿈",
    dreamSnippet:
      "회의실 같은 곳에서 사람들이 두 줄로 나뉘어 서 있었습니다. 당연히 제 옆에 있을 줄 알았던 사람이 말없이 반대편으로 갔어요. 저는 아무 말도 못 하고 빈 의자만 바라봤습니다.",
    afterStory:
      "한 달 안에 서운한 일이 하나 있었습니다. 상대가 큰 잘못을 했다기보다 제가 기대를 많이 하고 있었던 것 같아요. 그 뒤로 부탁과 기대를 조금 더 분리해서 보게 됐습니다.",
    outcomeCategory: "bad",
    emotions: ["sad", "weird"],
  },
  실직: {
    title: "출입카드가 투명해진 꿈",
    dreamSnippet:
      "회사 입구에서 출입카드를 찍었는데 기계가 아무 소리도 내지 않았습니다. 카드를 보니 플라스틱이 투명해져 이름도 사번도 사라져 있었어요. 뒤에 서 있던 사람들은 저를 지나쳐 들어갔습니다.",
    afterStory:
      "업무 평가나 계약 관련 이야기가 나왔던 시기였습니다. 당장 큰 변화는 없었지만 불안이 꽤 컸어요. 한 달 뒤에는 이력서와 포트폴리오를 조용히 정리해 두었습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "sad"],
  },
  지진: {
    title: "컵 속 물만 먼저 흔들린 꿈",
    dreamSnippet:
      "식탁 위 컵 속 물이 먼저 흔들리기 시작했습니다. 바닥은 멀쩡한데 벽에 걸린 시계가 삐뚤어졌어요. 가족을 부르려는데 입안이 마른 것처럼 목소리가 나오지 않았습니다.",
    afterStory:
      "집안일로 급하게 정리할 게 생겼습니다. 큰 사건은 아니었지만 안정감이 흔들리는 느낌이 있었어요. 한 달 뒤에는 미뤄둔 서류와 연락처를 정리했습니다.",
    outcomeCategory: "family",
    emotions: ["scared", "weird"],
  },
  불륜: {
    title: "낯선 향수가 엘리베이터에 남아 있던 꿈",
    dreamSnippet:
      "엘리베이터 문이 열렸는데 익숙한 사람과 낯선 향수가 함께 남아 있었습니다. 아무 장면도 보지 않았는데 이미 알고 있는 느낌이 들었어요. 버튼을 누르지 못한 채 층수만 올라가는 걸 봤습니다.",
    afterStory:
      "관계에서 의심이 올라온 시기였습니다. 실제로 확인된 일은 없었지만 혼자 상상한 부분이 컸어요. 한 달 뒤에는 돌려 말하지 않고 불편했던 지점을 직접 이야기했습니다.",
    outcomeCategory: "love",
    emotions: ["sad", "scared"],
  },
  암: {
    title: "검사 결과 봉투를 열지 못한 꿈",
    dreamSnippet:
      "병원 복도 끝에서 흰 봉투를 들고 있었습니다. 이름은 제 것이 맞는데 봉투 입구가 이상하게 붙어 있었어요. 의자에 앉은 사람들은 모두 조용했고 시계 초침 소리만 크게 들렸습니다.",
    afterStory:
      "건강검진 결과를 기다리던 시기와 겹쳤습니다. 다행히 큰 문제는 없었지만 기다리는 동안 예민했어요. 한 달 뒤에는 몸의 작은 신호도 미루지 않고 확인하려고 했습니다.",
    outcomeCategory: "health",
    emotions: ["scared", "calm"],
  },
  뱀: {
    title: "거실 한가운데 뱀이 둥글게 말려 있던 꿈",
    dreamSnippet:
      "예전에 살던 집 거실 바닥에 초록빛 뱀이 둥글게 말려 있었습니다. 저를 쫓아오지는 않았지만 지나가려는 길을 막고 있었어요. 한참 마주 보고 있다가 제가 먼저 방으로 들어갔습니다.",
    afterStory:
      "가족이나 집안일을 다시 들여다볼 일이 있었습니다. 큰 사건은 아니었지만 피하던 이야기를 꺼내게 됐어요. 한 달 뒤에는 무섭다기보다 정리할 게 보였다는 느낌이 남았습니다.",
    outcomeCategory: "family",
    emotions: ["scared", "weird"],
  },
  비행: {
    title: "낮은 건물 사이를 겨우 날던 꿈",
    dreamSnippet:
      "하늘 높이 나는 게 아니라 건물 사이를 낮게 스치며 날고 있었습니다. 조금만 힘을 빼면 전선에 닿을 것 같아 계속 팔에 힘을 줬어요. 멀리 가고 싶은데 같은 골목 위만 맴돌았습니다.",
    afterStory:
      "하고 싶은 일은 있었지만 현실 조건을 계속 계산하던 시기였습니다. 한 달 뒤에는 바로 뛰기보다 준비 목록을 만들었어요. 답답함은 남았지만 방향은 조금 더 분명해졌습니다.",
    outcomeCategory: "job",
    emotions: ["weird", "happy"],
  },
  엘리베이터: {
    title: "층수 버튼이 전부 지워진 꿈",
    dreamSnippet:
      "엘리베이터 안에 탔는데 버튼 숫자가 전부 지워져 있었습니다. 문은 닫혔고 위로 가는지 아래로 가는지도 알 수 없었어요. 안내음만 반복되는데 아무 층에서도 문이 열리지 않았습니다.",
    afterStory:
      "진행 중인 일이 멈춘 것처럼 느껴졌습니다. 기다리는 답이 늦어져서 더 답답했어요. 한 달 뒤에는 제가 할 수 있는 부분과 기다려야 하는 부분을 나눠 적었습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "weird"],
  },
  아기: {
    title: "이름표 없는 아기를 안고 있던 꿈",
    dreamSnippet:
      "낯선 아기를 안고 병원 복도를 걷고 있었습니다. 아기는 울지 않았는데 이름표가 비어 있어서 누구에게 데려가야 할지 몰랐어요. 품은 따뜻한데 팔이 점점 무거워졌습니다.",
    afterStory:
      "새로운 책임이 생긴 달이었습니다. 누가 시킨 건 아니지만 제가 챙겨야 할 일이 늘었어요. 한 달 뒤에는 부담과 애정을 같이 느끼고 있다는 걸 인정하게 됐습니다.",
    outcomeCategory: "family",
    emotions: ["weird", "calm"],
  },
  호랑이: {
    title: "운동장 끝에 호랑이가 앉아 있던 꿈",
    dreamSnippet:
      "비어 있는 운동장 끝에 호랑이가 앉아 있었습니다. 달려오지는 않았지만 제가 움직일 때마다 고개만 따라왔어요. 숨을 참은 채 철문까지 걸어가는데 발소리가 유난히 크게 들렸습니다.",
    afterStory:
      "권위 있는 사람과 마주할 일이 있었습니다. 실제로 위협적인 상황은 아니었지만 긴장이 컸어요. 한 달 뒤에는 피하지 않고 준비해서 들어간 것만으로도 다행이라고 느꼈습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "calm"],
  },
  결혼: {
    title: "식장에 들어갔는데 음악이 안 나온 꿈",
    dreamSnippet:
      "웨딩홀 문이 열렸는데 아무 음악도 나오지 않았습니다. 하객들은 모두 앉아 있는데 얼굴이 흐릿했어요. 제 손에 든 부케가 너무 무거워서 앞으로 걷기가 힘들었습니다.",
    afterStory:
      "관계나 약속에 대해 진지하게 생각한 달이었습니다. 실제 결혼 이야기가 아니어도 책임이라는 단어가 자주 떠올랐어요. 한 달 뒤에는 원하는 것과 부담스러운 것을 따로 적어봤습니다.",
    outcomeCategory: "love",
    emotions: ["weird", "sad"],
  },
  회사: {
    title: "회의실 문패가 계속 바뀐 꿈",
    dreamSnippet:
      "회의실을 찾아가는데 문패 이름이 볼 때마다 달라졌습니다. 안에서는 제 발표 순서라고 부르는 소리가 들렸어요. 자료를 열어보니 첫 장만 있고 나머지는 전부 빈 페이지였습니다.",
    afterStory:
      "업무에서 설명해야 할 일이 많았습니다. 완벽하게 준비됐다는 느낌은 없었지만 피할 수도 없었어요. 한 달 뒤에는 부족해도 먼저 공유하는 편이 낫다는 걸 배웠습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "weird"],
  },
  학교: {
    title: "졸업한 학교 사물함을 다시 연 꿈",
    dreamSnippet:
      "오래전에 졸업한 학교 복도에 서 있었습니다. 제 이름이 붙은 사물함이 아직 남아 있었고 안에는 낡은 체육복이 들어 있었어요. 종이 울리자 복도에 저 혼자만 남았습니다.",
    afterStory:
      "예전 사람들과 연락이 닿은 달이었습니다. 반갑기도 했지만 예전의 나로 돌아가는 느낌도 있었어요. 한 달 뒤에는 지나간 시절을 그리워하되 거기에 머물 필요는 없다고 느꼈습니다.",
    outcomeCategory: "other",
    emotions: ["sad", "calm"],
  },
  고양이: {
    title: "창틀 위 고양이가 말을 기다리던 꿈",
    dreamSnippet:
      "회색 고양이가 창틀 위에 앉아 저를 보고 있었습니다. 다가가면 도망갈 줄 알았는데 오히려 꼬리만 천천히 흔들었어요. 제가 말을 꺼내기 전까지 방 안이 아주 조용했습니다.",
    afterStory:
      "혼자 있는 시간을 조금 다르게 쓰게 됐습니다. 누군가와 억지로 맞추기보다 제 리듬을 챙기고 싶었어요. 한 달 뒤에는 조용한 시간이 불안보다 회복에 가깝게 느껴졌습니다.",
    outcomeCategory: "other",
    emotions: ["calm", "weird"],
  },
  바다: {
    title: "파도가 발목까지만 밀려오던 꿈",
    dreamSnippet:
      "넓은 바다 앞에 서 있었는데 파도가 발목까지만 왔다가 물러났습니다. 멀리서는 사람들이 수영하고 있었지만 저는 신발을 벗지 못했어요. 바닷물보다 젖은 양말 느낌이 더 선명했습니다.",
    afterStory:
      "새로운 일을 시작할까 말까 망설였습니다. 뛰어들 준비가 안 된 것 같아 계속 주변만 살폈어요. 한 달 뒤에는 작게라도 먼저 해보자는 쪽으로 마음이 기울었습니다.",
    outcomeCategory: "good",
    emotions: ["calm", "weird"],
  },
  이사: {
    title: "상자마다 다른 주소가 적힌 꿈",
    dreamSnippet:
      "이삿짐 상자를 열 때마다 다른 주소가 적힌 종이가 나왔습니다. 제 방 물건인데 어디로 보내야 할지 알 수 없었어요. 마지막 상자에는 아무것도 없고 먼지만 가득했습니다.",
    afterStory:
      "생활 공간이나 루틴을 바꾸고 싶은 마음이 커졌습니다. 실제 이사를 하진 않았지만 정리를 많이 했어요. 한 달 뒤에는 버릴 것과 남길 것이 조금 분명해졌습니다.",
    outcomeCategory: "other",
    emotions: ["weird", "calm"],
  },
  군대: {
    title: "다시 받은 군복 이름표가 비어 있던 꿈",
    dreamSnippet:
      "전역한 지 오래됐는데 다시 생활관 침상 위에 앉아 있었습니다. 군복은 제 사이즈가 아니고 이름표도 비어 있었어요. 점호 소리가 들리는데 아무도 제 위치를 알려주지 않았습니다.",
    afterStory:
      "규칙이나 책임 때문에 답답한 일이 있었습니다. 하고 싶지 않아도 따라야 하는 절차가 많았어요. 한 달 뒤에는 거절할 수 있는 것과 감당해야 하는 것을 나눠 보게 됐습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "sad"],
  },
  화장실: {
    title: "잠기지 않는 화장실 문 꿈",
    dreamSnippet:
      "화장실에 들어갔는데 문 잠금장치가 계속 헛돌았습니다. 밖에서는 사람들이 줄 서 있었고 발소리가 가까워졌어요. 급한데도 아무것도 해결하지 못한 채 손잡이만 붙잡고 있었습니다.",
    afterStory:
      "사적인 문제를 계속 미루고 있던 시기였습니다. 남에게 말하기 애매해서 혼자 끙끙댄 일이 있었어요. 한 달 뒤에는 작은 것부터 처리하니 마음이 훨씬 가벼워졌습니다.",
    outcomeCategory: "health",
    emotions: ["weird", "scared"],
  },
  집: {
    title: "우리 집 안에 모르는 방이 있던 꿈",
    dreamSnippet:
      "분명 우리 집인데 복도 끝에 처음 보는 문이 하나 있었습니다. 문을 열자 가구 없는 방에 햇빛만 길게 들어와 있었어요. 들어가도 되는지 몰라 문턱에서 오래 서 있었습니다.",
    afterStory:
      "집이나 가족 문제를 다시 생각하게 된 달이었습니다. 큰 변화는 없었지만 마음속에 비워둔 공간이 있다는 느낌이 들었어요. 한 달 뒤에는 미뤄둔 정리와 대화를 조금 시작했습니다.",
    outcomeCategory: "family",
    emotions: ["calm", "weird"],
  },
  밥먹는꿈: {
    title: "식탁에 숟가락만 여러 개 놓인 꿈",
    dreamSnippet:
      "긴 식탁에 앉았는데 음식은 없고 숟가락만 사람 수보다 많이 놓여 있었습니다. 맞은편 의자는 비어 있는데 누가 곧 올 것 같은 느낌이었어요. 배고픈데도 먼저 먹으면 안 될 것 같았습니다.",
    afterStory:
      "사람들과 만나는 약속이 몇 번 생겼습니다. 어색했지만 같이 밥을 먹으면서 풀린 이야기도 있었어요. 한 달 뒤에는 혼자 버티기보다 누군가와 나눌 때 덜 무겁다는 걸 느꼈습니다.",
    outcomeCategory: "family",
    emotions: ["calm", "sad"],
  },
  금니: {
    title: "웃을 때 금니만 크게 보인 꿈",
    dreamSnippet:
      "거울 앞에서 웃었는데 다른 치아는 흐릿하고 금니 하나만 크게 반짝였습니다. 손으로 가리려 해도 빛이 손가락 사이로 새어 나왔어요. 부끄러운데도 이상하게 눈을 뗄 수 없었습니다.",
    afterStory:
      "작은 수입이나 인정받는 일이 있었습니다. 크게 자랑할 정도는 아니었지만 기분이 오래 갔어요. 한 달 뒤에는 내가 숨기던 성과도 조금은 말해도 된다고 느꼈습니다.",
    outcomeCategory: "money",
    emotions: ["happy", "weird"],
  },
  물에빠지는꿈: {
    title: "얕은 물에서 발이 안 닿던 꿈",
    dreamSnippet:
      "분명 얕아 보이는 강물이었는데 들어가자마자 발이 바닥에 닿지 않았습니다. 주변 사람들은 물가에서 웃고 있었고 제 목소리는 물속에서만 울렸어요. 손을 뻗어도 잡히는 건 젖은 풀뿐이었습니다.",
    afterStory:
      "감당할 수 있다고 생각한 일이 생각보다 깊었습니다. 도움을 청하기 애매해서 혼자 붙잡고 있었어요. 한 달 뒤에는 빨리 말하는 편이 덜 가라앉는 길이라는 걸 알았습니다.",
    outcomeCategory: "bad",
    emotions: ["scared", "sad"],
  },
  치아: {
    title: "치과 의자 위 조명이 너무 밝던 꿈",
    dreamSnippet:
      "치과 의자에 누웠는데 조명이 얼굴 가까이까지 내려왔습니다. 의사는 보이지 않고 금속 도구 소리만 들렸어요. 입을 벌리고 있는데 어떤 말을 해야 할지 몰라 눈만 깜빡였습니다.",
    afterStory:
      "말을 아끼다가 오히려 더 불편해진 일이 있었습니다. 제 상태를 설명하지 않으면 아무도 모른다는 걸 느꼈어요. 한 달 뒤에는 필요한 말은 조금 불편해도 꺼내기로 했습니다.",
    outcomeCategory: "health",
    emotions: ["scared", "weird"],
  },
  죽음: {
    title: "검은 리본을 주머니에 넣은 꿈",
    dreamSnippet:
      "장례식장 같은 곳에 있었는데 정작 영정사진은 보이지 않았습니다. 안내대에서 검은 리본을 받아 주머니에 넣었어요. 울음소리는 멀리서 들리는데 제 주변만 너무 조용했습니다.",
    afterStory:
      "무언가를 끝내야 한다는 생각이 강했던 달이었습니다. 사람의 죽음과 관련된 일은 아니었지만 오래 붙잡은 습관을 놓고 싶었어요. 한 달 뒤에는 하나를 정리하고 나니 마음이 덜 복잡했습니다.",
    outcomeCategory: "other",
    emotions: ["sad", "calm"],
  },
  전여친: {
    title: "예전 번호로 부재중 전화가 온 꿈",
    dreamSnippet:
      "휴대폰에 오래전 저장한 이름으로 부재중 전화가 떠 있었습니다. 다시 걸려고 하니 번호가 한 자리씩 사라졌어요. 통화 버튼을 누르는 순간 화면이 꺼졌습니다.",
    afterStory:
      "예전 관계를 떠올릴 일이 있었습니다. 연락으로 이어지진 않았지만 그때의 미안함이 조금 올라왔어요. 한 달 뒤에는 다시 시작보다 제대로 끝내는 쪽을 생각하게 됐습니다.",
    outcomeCategory: "love",
    emotions: ["sad", "weird"],
  },
  상사: {
    title: "상사가 제 책상 서랍을 열어본 꿈",
    dreamSnippet:
      "사무실에 아무도 없는데 상사가 제 책상 앞에 서 있었습니다. 서랍을 하나씩 열어보는데 안에는 업무 자료가 아니라 오래된 메모들이 있었어요. 저는 멀리서 보고만 있고 말릴 수 없었습니다.",
    afterStory:
      "업무에서 평가받는 느낌이 강했습니다. 실제로 누가 몰아붙인 건 아니지만 제 기준이 너무 빡빡했어요. 한 달 뒤에는 숨기기보다 진행 상황을 먼저 공유하는 쪽이 편해졌습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "weird"],
  },
  수능: {
    title: "수험표 사진이 다른 사람 얼굴인 꿈",
    dreamSnippet:
      "수능 시험장 입구에서 수험표를 꺼냈는데 사진이 제 얼굴이 아니었습니다. 감독관은 확인하겠다며 저만 복도에 세워뒀어요. 교실 안에서는 듣기평가 안내가 이미 시작되고 있었습니다.",
    afterStory:
      "중요한 일정 앞에서 자격이 부족한 것 같은 기분이 있었습니다. 실제 결과는 생각보다 괜찮았지만 시작 전 불안이 컸어요. 한 달 뒤에는 준비한 만큼은 인정하려고 했습니다.",
    outcomeCategory: "job",
    emotions: ["scared", "sad"],
  },
  태몽: {
    title: "흰 천에 싸인 열매를 받은 꿈",
    dreamSnippet:
      "누군가 흰 천에 싼 둥근 열매를 제 손에 올려줬습니다. 무겁지는 않은데 떨어뜨리면 안 될 것 같아 양손으로 받쳤어요. 열어보려는 순간 주변이 환해져서 눈을 떴습니다.",
    afterStory:
      "가족 안에서 새 소식이나 기대가 오간 달이었습니다. 꼭 아이와 관련된 일은 아니었지만 무언가를 조심히 기다리는 분위기가 있었어요. 한 달 뒤에는 좋은 쪽으로 마음을 열게 됐습니다.",
    outcomeCategory: "family",
    emotions: ["calm", "happy"],
  },
  뿌리: {
    title: "숲속 오래된 나무 밑바닥",
    dreamSnippet:
      "숲속 오래된 나무 밑바닥에 앉아 있었습니다. 땅 위로 드러난 뿌리를 손으로 따라가다 보니 집 쪽으로 이어지는 것 같았어요. 바람 소리만 크게 들렸고 주변은 유난히 고요했습니다.",
    afterStory:
      "그 이후로 가족 모임에서도 자연 이야기를 많이 하게 됐어요. 작은 일상에서도 뿌리 깊은 가치를 찾게 되는 계기가 됐습니다. 꿈에서 본 장면은 크게 맞지 않았지만 마음은 한결 가벼워졌습니다.",
    outcomeCategory: "family",
    emotions: ["calm", "weird"],
  },
  정원: {
    title: "문 없는 정원 안에서 길을 찾던 꿈",
    dreamSnippet:
      "낮은 담장 안에 정원이 있었고 흙길이 여러 갈래로 나뉘어 있었습니다. 꽃은 피어 있는데 향은 거의 나지 않았어요. 밖으로 나가려는데 출입문이 보이지 않아 같은 나무 옆을 두 번 지나쳤습니다.",
    afterStory:
      "한 달 동안 쉬고 싶은 마음과 해야 할 일이 계속 부딪혔습니다. 큰 사건은 없었지만 생활을 다시 가꾸고 싶다는 생각이 들었어요. 결국 주말 하루를 비워두고 방 정리부터 시작했습니다.",
    outcomeCategory: "other",
    emotions: ["calm", "weird"],
  },
  밤: {
    title: "새벽인데 시계가 오후를 가리킨 꿈",
    dreamSnippet:
      "창밖은 완전히 어두웠는데 방 안 시계는 오후 세 시를 가리키고 있었습니다. 커튼 틈으로 들어오는 빛이 없어서 휴대폰을 켰는데 날짜만 보이고 시간은 비어 있었어요. 다시 눕자 천장이 조금씩 낮아지는 느낌이 들었습니다.",
    afterStory:
      "한 달 동안 수면 리듬이 많이 흔들렸습니다. 큰 사건은 없었지만 밤마다 생각이 길어져서 아침이 무거웠어요. 결국 자기 전 알림을 줄이고 잠드는 시간을 먼저 고정해 보기로 했습니다.",
    outcomeCategory: "health",
    emotions: ["weird", "sad"],
  },
  광장: {
    title: "사람 없는 광장에 안내 방송만 울리던 꿈",
    dreamSnippet:
      "넓은 광장 한가운데 서 있었는데 벤치와 깃발은 그대로인데 사람이 한 명도 없었습니다. 안내 방송에서는 모르는 행사 이름만 반복됐고, 어느 방향으로 가도 같은 분수대로 돌아왔어요. 바닥에 떨어진 종이컵만 바람에 굴러다녔습니다.",
    afterStory:
      "한 달 사이 사람 많은 자리에서 이상하게 혼자 떨어진 느낌을 받은 적이 있었습니다. 실제로 문제가 생긴 건 아니지만 대화에 끼어드는 게 어렵더라고요. 이후에는 약속을 줄이고 편한 사람부터 만나면서 리듬을 되찾았습니다.",
    outcomeCategory: "other",
    emotions: ["sad", "weird"],
  },
};

export const MANUAL_STORY_KEYWORDS = Object.freeze(Object.keys(MANUAL_STORIES));

export function isManualStoryKeyword(keyword: string): boolean {
  return Object.prototype.hasOwnProperty.call(MANUAL_STORIES, keyword.trim());
}

const GENERIC_DREAM_TITLE_TEMPLATES = [
  () => "복도 끝 불빛이 꺼지지 않던 꿈",
  () => "낡은 가방을 들고 길을 헤맨 꿈",
  () => "문이 열려 있는데 들어가지 못한 꿈",
  () => "흐린 창문 너머를 오래 본 꿈",
] as const;

const GENERIC_DREAM_SNIPPETS = [
  () =>
    "낯선 건물 복도를 걷는데 끝방 불빛만 계속 켜져 있었습니다. 손잡이를 잡으면 안쪽에서 누가 먼저 잡을 것 같아 망설였어요. 깨고 나서도 손바닥에 차가운 금속 느낌이 남았습니다.",
  () =>
    "무거운 가방을 들고 버스 정류장을 찾고 있었습니다. 지나가는 버스마다 번호판이 흐려서 탈 수가 없었어요. 결국 길가에 앉아 가방 안을 다시 확인하다가 잠에서 깼습니다.",
  () =>
    "문이 반쯤 열린 방 앞에 서 있었는데 안쪽에서는 낮은 라디오 소리만 들렸습니다. 들어가면 아는 사람이 있을 것 같았지만 발이 움직이지 않았어요. 아침까지 그 망설임이 이상하게 남았습니다.",
  () =>
    "흐린 창문 너머로 사람들이 지나가는 게 보였습니다. 얼굴은 보이지 않았고 신발 소리만 또렷했어요. 창문을 닦으려는 순간 바깥 풍경이 물감처럼 번졌습니다.",
] as const;

const DREAM_DETAIL_LINES = [
  () => `깬 뒤에는 단어보다 그때의 몸 상태가 더 오래 남았습니다.`,
  () => `나중에 다시 읽어보려고 색, 소리, 거리감까지 적어 두었습니다.`,
  () => `좋은 꿈인지 나쁜 꿈인지 바로 판단하기보다는 당시 감정을 먼저 남겼습니다.`,
  () => `평소라면 지나쳤을 감각인데 꿈에서는 이상하게 오래 남았습니다.`,
] as const;

const AFTER_DETAIL_LINES: Record<OutcomeCategory, string[]> = {
  good: [
    "한 달 뒤 다시 보니 그때의 긴장이 조금 풀려 있었습니다.",
    "기록을 남겨둔 덕분에 좋은 쪽으로 바뀐 부분도 더 잘 보였습니다.",
  ],
  bad: [
    "그 시기를 지나고 나서야 제가 얼마나 예민했는지 알았습니다.",
    "꿈이 맞았다기보다, 이미 마음이 많이 지쳐 있었다는 쪽에 가까웠습니다.",
  ],
  love: [
    "감정이 바로 정리되진 않았지만, 예전처럼 서두르지는 않았습니다.",
    "한 달 뒤에는 관계를 조금 더 천천히 보게 됐습니다.",
  ],
  job: [
    "그 뒤로 일정과 할 일을 종이에 다시 적어 보면서 조금 정리됐습니다.",
    "결과보다 준비 과정에서 제가 어디에 눌려 있었는지가 보였습니다.",
  ],
  health: [
    "한 달 뒤에는 수면과 컨디션을 먼저 확인하는 습관이 생겼습니다.",
    "큰 문제로 이어지진 않았지만 몸이 보내는 신호를 덜 무시하게 됐습니다.",
  ],
  family: [
    "가족 이야기를 바로 꺼내진 못했지만, 연락을 미루지는 않게 됐습니다.",
    "그 뒤로 오래 묵은 감정을 조금씩 나눠 보려고 했습니다.",
  ],
  money: [
    "숫자를 직접 확인하고 나서야 막연한 불안이 조금 줄었습니다.",
    "한 달 뒤에는 지출을 미루지 않고 바로 적어두기 시작했습니다.",
  ],
  other: [
    "큰 사건보다 감정의 방향을 확인한 기록에 가까웠습니다.",
    "다시 읽어보니 꿈보다 그때의 생활 리듬이 더 선명하게 보였습니다.",
  ],
};

function storyLines(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?。])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clampStoryLines(lines: string[]): string {
  return lines.slice(0, 5).join("\n");
}

export function storyRelatesToAnchor(text: string, anchor: string): boolean {
  const k = anchor.trim();
  if (!k || k === "꿈") return true;
  if (text.includes(k)) return true;
  const tokens = k.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.some((t) => text.includes(t));
}

export function isGenericVividPoolSnippet(snippet: string): boolean {
  const head = snippet.trim().slice(0, 28);
  if (!head) return false;
  return VIVID_DREAM_SCENES.some(
    (scene) => scene.startsWith(head) || head.startsWith(scene.slice(0, 28)),
  );
}

export function genericDreamTitle(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const variant = Math.abs(hashSeed(`generic-title-${k}-${index}`));
  return GENERIC_DREAM_TITLE_TEMPLATES[variant % GENERIC_DREAM_TITLE_TEMPLATES.length]!();
}

export function genericKeywordSnippet(anchor: string, index: number): string {
  const k = anchor.trim() || "꿈";
  const variant = Math.abs(hashSeed(`generic-snippet-${k}-${index}`));
  const base = GENERIC_DREAM_SNIPPETS[variant % GENERIC_DREAM_SNIPPETS.length]!();
  return ensureDreamStoryLines(base, k, index);
}

function manualStoryForKeyword(keyword: string): ManualStoryCopy | undefined {
  const key = keyword.trim();
  return MANUAL_STORIES[key];
}

export function ensureDreamStoryLines(text: string, _anchor: string, index: number): string {
  const lines = storyLines(text);
  let offset = 0;
  while (lines.length < 3 && offset < DREAM_DETAIL_LINES.length) {
    const lineFn = DREAM_DETAIL_LINES[(index + offset) % DREAM_DETAIL_LINES.length]!;
    lines.push(lineFn());
    offset += 1;
  }
  return clampStoryLines(lines);
}

export function ensureAfterStoryLines(
  text: string,
  outcome: OutcomeCategory,
  index: number,
  _anchor = "",
): string {
  const lines = storyLines(text);
  const extras = AFTER_DETAIL_LINES[outcome] ?? AFTER_DETAIL_LINES.other;
  let offset = 0;
  while (lines.length < 3 && offset < extras.length) {
    lines.push(extras[(index + offset) % extras.length]!);
    offset += 1;
  }
  return clampStoryLines(lines);
}

function pickOutcome(rand: () => number, pack: KeywordNarrativePack): OutcomeCategory {
  const keys = Object.keys(OUTCOME_CATEGORIES) as OutcomeCategory[];
  const hasCustom = Object.keys(pack.afterByOutcome).length > 0;
  const weights = hasCustom
    ? keys.map((k) => (pack.afterByOutcome[k]?.length ? 22 : 8))
    : [12, 22, 12, 10, 9, 8, 7, 20];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return keys[i]!;
  }
  return "other";
}

function pickAfterStory(
  outcome: OutcomeCategory,
  pack: KeywordNarrativePack,
  rand: () => number,
): string {
  const custom = pack.afterByOutcome[outcome];
  const pool = custom?.length ? custom : VIVID_AFTER_BY_OUTCOME[outcome];
  return pool[seededInt(rand, 0, pool.length - 1)] ?? pool[0];
}

/** 키워드 하나에 제목·꿈·30일 후기가 같은 맥락으로 맞춰진 후기 1건 */
export function buildCoherentStoryForKeyword(keyword: string, index = 0): CommunityStory {
  const anchor = keyword.trim() || "꿈";
  const manual = manualStoryForKeyword(anchor);
  if (manual) {
    return {
      id: formatObservatoryId(anchor, index),
      dreamTitle: manual.title,
      dreamSnippet: manual.dreamSnippet,
      emotions: manual.emotions,
      outcomeCategory: manual.outcomeCategory,
      afterStory: manual.afterStory,
      recordedDaysAgo: 12 + (Math.abs(hashSeed(`manual-days-${anchor}`)) % 24),
      profile: ANONYMOUS_STORY_PROFILE,
    };
  }

  const curated = getKeywordNarrativePack(anchor);
  const pack = curated ?? resolveNarrativePack(anchor);
  const seed = hashSeed(`coherent-story-${anchor}-${index}`);
  const rand = createSeededRandom(seed);
  const outcome = pickOutcome(rand, pack);
  const slot = index % pack.dreamSnippets.length;

  const dreamTitle = pack.titles[slot % pack.titles.length]!;
  const dreamSnippet = ensureDreamStoryLines(pack.dreamSnippets[slot]!, anchor, index);
  const afterStory = pickAfterStory(outcome, pack, rand);

  const emotions: DreamEmotionId[] = [
    EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)],
    ...(rand() > 0.4 ? [EMOTION_POOL[seededInt(rand, 0, EMOTION_POOL.length - 1)]] : []),
  ];

  return {
    id: formatObservatoryId(anchor, index),
    dreamTitle,
    dreamSnippet,
    emotions,
    outcomeCategory: outcome,
    afterStory: ensureAfterStoryLines(afterStory, outcome, index, anchor),
    recordedDaysAgo: seededInt(rand, 7, 35),
    profile: ANONYMOUS_STORY_PROFILE,
  };
}

/** 제목·꿈·후기가 서로 다른 소스에서 섞이지 않도록 정렬 */
export function alignStoryToKeyword(
  story: CommunityStory,
  anchor: string,
  index: number,
): CommunityStory {
  const k = anchor.trim() || "꿈";
  const coherent = buildCoherentStoryForKeyword(k, index);
  const snippetOk =
    !isGenericVividPoolSnippet(story.dreamSnippet) &&
    storyRelatesToAnchor(story.dreamSnippet, k);
  const titleOk =
    story.dreamTitle.trim().length > 0 &&
    (storyRelatesToAnchor(story.dreamTitle, k) || storyRelatesToAnchor(story.dreamTitle, story.dreamSnippet));
  const afterOk = storyRelatesToAnchor(story.afterStory, k) || story.afterStory.length >= 40;

  if (snippetOk && titleOk && afterOk) {
    return {
      ...story,
      dreamSnippet: ensureDreamStoryLines(story.dreamSnippet, k, index),
      afterStory: ensureAfterStoryLines(story.afterStory, story.outcomeCategory, index, k),
      profile: ANONYMOUS_STORY_PROFILE,
    };
  }

  return {
    ...coherent,
    afterStory: afterOk
      ? ensureAfterStoryLines(story.afterStory, story.outcomeCategory, index, k)
      : coherent.afterStory,
    outcomeCategory: afterOk ? story.outcomeCategory : coherent.outcomeCategory,
    emotions: story.emotions.length > 0 ? story.emotions : coherent.emotions,
    profile: ANONYMOUS_STORY_PROFILE,
  };
}
