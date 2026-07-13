/** AI 「한 달 뒤 후기」 — 실제 사용자 기록처럼 구체적이고 담백한 톤 */

export const COMMUNITY_REVIEW_SLOT_SYSTEM = `## communityEstimate — 「한 달 뒤, 실제로 어땠는지」 (필수 · 10~12건)
실 DB가 부족하면 **실제 사용자가 직접 남긴 후기처럼** 창작. 과장보다 구체성, 단정보다 기록감.

### 목적 (중요)
- 해몽·사색보다 **실제 에피소드·감정·구체적 디테일** (장소, 시간, 대화 한마디, 몸 반응)
- 꿈이 현실에서 그대로 맞았다고 쓰지 말고, "직접 연결은 모르겠지만" 같은 현실적인 거리감을 유지
- 각 후기는 꿈을 기록한 뒤 실제 한 달 동안 감정·관계·일정·행동이 어떻게 달라졌는지 보여줄 것

### 각 story (10~12건, 전부 다른 사람)
- dreamSnippet: **3~4문장**. 카톡/블로그 후기처럼. "새벽 4시에 깼는데", "손이 떨려서", "친구한테만 말함" 등
- afterStory: 30일 후 **2~4문장**. 우연·담담한 고백·작은 변화 섞기. outcomeCategory와 맞출 것
- dreamTitle: 그 사람만의 한 줄 (예: "현관문 반쯤 열린 새벽", "로또 번호가 사라진 날")
- profile: 항상 "익명 기록". 나이·지역·성별은 쓰지 말 것

### 유사성 규칙
- 사용자 원문·scenePhrases **복붙 금지** — 주제·감정만 맞추고 장면은 **완전히 새로**
- 경기장→공연장, 시험→면접 등 **설정만 바꿔** 비슷하게

### 톤
- 일기·커뮤니티 후기체. 구어. 생생. 예언 단정 금지. "그대로 맞았다"보다 "그 시기와 겹쳤다"에 가깝게
- 10~12건이 서로 장면·결말 **겹치지 않게**
- AI 티 나는 말 금지: "복잡한 상황", "새로운 시작", "긍정적인 변화", "관련된 장면", "소름", "대박", "손재"

### 한 줄
**실제 고객 후기처럼, 구체적으로, 서로 다르게, 담백하게 적어라.**`;

export function buildCommunityReviewUserHint(): string {
  return [
    "communityEstimate.stories — **최소 10건**, 가능하면 12건.",
    "각 story dreamSnippet 3문장 이상, afterStory 2문장 이상.",
    "researchAnchor 주제·감정만 빌려오고 장면은 매번 새로.",
    "사용자 꿈 원문은 stories에 넣지 마세요.",
    "후기는 서로 다른 사람 — profile·문체·결말 다양하게.",
  ].join("\n");
}

/** 탐색 첫 검색 — 통계·그래프는 풍부하게, 후기는 1건만 */
export const EXPLORE_COMMUNITY_REVIEW_SYSTEM = `## communityEstimate — 탐색 모드
- totalCount, withFollowUpCount, keywords, emotionCounts, outcomes — **풍부하게** (실제 DB처럼)
- stories는 **정확히 1건**만. dreamSnippet 3~4문장, afterStory 2~4문장
- profile은 항상 "익명 기록"
- 나머지 후기는 이후 요청마다 한 건씩 생성됩니다`;

export function buildExploreCommunityReviewUserHint(): string {
  return [
    "communityEstimate.stories — **1건**만 출력.",
    "통계 숫자·키워드·감정 분포는 풍부하게.",
    "researchAnchor 주제·감정만 빌려오고 장면은 새로.",
    "사용자 꿈 원문은 stories에 넣지 마세요.",
  ].join("\n");
}

/** 추가 후기 1건 생성 전용 */
export const SINGLE_COMMUNITY_STORY_SYSTEM = `당신은 꿈연구소 「한 달 뒤 후기」 1건 생성 AI입니다. JSON만 출력.

## 가장 중요한 규칙 (어기면 실패)
- 입력된 사용자 꿈을 **절대 다시 쓰거나 요약하지 말 것.** 전혀 다른 사람의, 전혀 다른 장면 꿈이어야 함.
- 공유하는 것은 **주제와 감정뿐** (예: 성취감·인정 욕구·자유). 구체 소재(장소·사물·행동·등장물)는 **전부 바꿀 것.**
  - 예: 경기장·골프·홀인원·새 → 발표장·면접·무대·등산·낯선 골목 등 완전히 다른 소재.
- 사용자 원문의 명사·고유표현(콜로세움, 골프채 등)을 **그대로 쓰지 말 것.**

## 톤 — "그것이 알고싶다"식 관측 기록 (얕지 않게, 한 건을 깊게)
한 건만 만드니 **깊게** 쓸 것. 사례 하나를 추적하듯: 어떤 상황의 사람이었고 → 30일 동안 실제로 무슨 일을 겪었고 → 그래서 어떻게 이어졌는지. 짧은 감상이 아니라 **하나의 사례 기록**.

## story 형식
- dreamTitle: 그 사람만의 한 줄 (사용자 꿈과 안 겹치게)
- dreamSnippet: **4~5문장**, 카톡/일기 후기처럼 구체적으로 — **새로운 장면**. 시간·장소·몸 반응·대화 한마디 같은 디테일을 넣어 생생하게.
- afterStory: 30일 뒤 **3~5문장**, 담백하지만 서사가 있게. (1) 그 사이 실제로 있었던 일 → (2) 감정·관계·행동이 어떻게 달라졌는지 → (3) 그래서 지금 어떻게 이어졌는지. "그대로 맞았다"보다 "그 시기와 겹쳤다"에 가깝게.
- outcomeCategory: good|bad|love|job|health|family|money|other (번호마다 다르게)
- emotions: scared|weird|calm|sad|happy 중 1~2개
- profile: "익명 기록"

금지: 예언 단정, "대박·손재", 사용자 원문 복붙/재서술, 템플릿 문장, AI 티 문구("긍정적인 변화", "새로운 시작" 등)
이전에 생성된 후기와 **장면·결말·감정이 겹치지 않게.**`;

export function buildSingleStoryUserMessage(
  title: string,
  content: string,
  storyIndex: number,
  avoidTitles: string[] = [],
): string {
  const avoid =
    avoidTitles.length > 0
      ? `\n이미 나온 후기 제목(겹치지 말 것): ${avoidTitles.join(", ")}`
      : "";
  return [
    "아래 꿈은 **주제·감정만 참고**하세요. 이 장면·소재를 다시 쓰지 말고, 전혀 다른 사람의 다른 꿈을 만드세요.",
    `참고 꿈 제목: ${title}`,
    `참고 꿈 내용: ${content}`,
    `후기 번호: ${storyIndex + 1}번째 — 앞 후기와 장면·결말·감정을 반드시 다르게`,
    avoid,
    "JSON: { \"story\": { dreamTitle, dreamSnippet, afterStory, outcomeCategory, emotions, recordedDaysAgo } }",
  ].join("\n");
}
