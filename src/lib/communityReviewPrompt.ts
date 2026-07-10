/** AI에게 "한 달 뒤 후기" UI 슬롯 맥락 — 실 DB 부족 시 관측자 기록을 창작 */

export const COMMUNITY_REVIEW_SLOT_SYSTEM = `## communityEstimate — 「한 달 뒤, 실제로 어땠는지」 UI 슬롯 (필수)
이 영역은 앱에서 **다른 관측자들이 남긴 꿈·30일 후기**가 나오는 자리입니다.
아직 실제 DB(오가닉) 데이터가 충분하지 않으므로, **당신이 관측소 기록처럼 believable한 가상 후기 5~6건을 창작**합니다.

### 역할
- 각 story = **서로 다른 익명 관측자** 1명분 (같은 사람 아님)
- dreamSnippet = 그 사람이 꾼 **비슷하지만 다른** 꿈 장면 (2문장 이상, 구체적)
- afterStory = 30일 뒤 실제 경험 (outcomeCategory와 일치, 2~3줄)
- **지금 사용자가 입력한 꿈 원문을 다른 사람 dreamSnippet에 복붙 금지**

### 톤
- 관측소 기록·일기체. 담백, 1인칭 또는 과거형.
- 예언·운명 단정 금지. "별일 없었어요 / 갈등 / 좋은 소식" 등 현실적 분포.
- 서로 장면·결말이 **겹치지 않게** 5~6건.

### 금지
- "○○이(가) 갑자기 나타났어요", "집에 ○○ 들어온 꿈", 키워드만 끼운 문장
- 사용자 꿈 문장 그대로 재사용
- 6건이 같은 afterStory 복붙`;

export function buildCommunityReviewUserHint(): string {
  return [
    "communityEstimate — 위 「한 달 뒤 후기」 슬롯을 채우세요.",
    "실제 DB가 없으므로 유사 주제의 **가상 관측자 기록** 5~6건을 각각 다르게 창작하세요.",
    "사용자 꿈 원문은 해몽·scenePhrases에만 쓰고, stories.dreamSnippet에는 넣지 마세요.",
  ].join("\n");
}
