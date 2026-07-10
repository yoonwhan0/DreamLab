/** AI 「한 달 뒤 후기」 슬롯 — 유사하지만 다른 관측자 기록 창작 지시 */

export const COMMUNITY_REVIEW_SLOT_SYSTEM = `## communityEstimate — 「한 달 뒤, 실제로 어땠는지」 (필수)
다른 사람들이 남긴 **비슷한 꿈 + 30일 후기** 5~6건. 실 DB가 부족하면 believable하게 창작.

### 핵심 (가장 중요)
- **같은 꿈을 쓰지 마세요.** 사용자 입력과 장소·인물·사건은 달라야 합니다.
- **유사성만 맞추세요** — 감정, 주제, 불안·몰입의 결이 겹치게.
- 목표: 읽는 사람이 "어? 나랑 거의 같은 꿈인데?"라고 **오해할 만큼** 비슷하게.
- 예: 사용자 꿈이 경기장이면 → 다른 관측자는 공연장·콘서트홀·대형 행사장 등으로 **틀어서** 씀.
- 예: 시험이면 → 면접·발표·서류 심사 등 **같은 긴장, 다른 장면**.

### 각 story
- 서로 다른 익명 관측자 1명분 (5~6건 모두 다른 사람)
- dreamSnippet: 2문장 이상, 구체적 장면 — **사용자 원문·scenePhrases 복붙 금지**
- afterStory: 30일 뒤 경험 (outcomeCategory와 맞게, 2~3줄)
- dreamTitle: 그 사람만의 장면 요약

### 톤
- 관측 기록·일기체. 담백. 예언·운명 단정 금지.
- 5~6건이 서로 장면·결말 **겹치지 않게**.

### 한 줄 요약
**유사성을 찾아서, 거짓말을 잘해라** — 주제는 맞고, 디테일은 다르게.`;

export function buildCommunityReviewUserHint(): string {
  return [
    "communityEstimate.stories — 위 슬롯을 채우세요.",
    "researchAnchor.primary·secondary의 **주제·감정**만 빌려오고, 장면은 각 관측자마다 새로 지으세요.",
    "사용자 꿈 원문은 해몽·scenePhrases에만 쓰고 stories에는 넣지 마세요.",
    "경기장↔공연장처럼 **설정만 바꿔도** 비슷하게 느껴지게 쓰세요.",
  ].join("\n");
}
