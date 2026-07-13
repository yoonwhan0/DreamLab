# 05. 데이터 모델 (Firestore)

> Storage / RTDB 미사용. 상세 기능 맥락: [10-features-reference.md](./10-features-reference.md)

---

## 컬렉션: `users/{uid}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `displayName`, `email` | string? | |
| `isPremium` | boolean | 프리미엄 (수동 / IAP 예정) |
| `isAnonymous` | boolean | **레거시** — 신규 가입 시 `false` 고정 (익명 Auth 제거) |
| `role` | string? | `"admin"` — Admin 접근 |
| `fcmTokens` | string[] | FCM |
| `gender`, `ageRange`, `country` | string? | |
| `createdAt` | Timestamp | |
| `hasFollowUpDiscount` | boolean? | Functions |
| `lastFollowUpAt` | Timestamp? | |

### 서브컬렉션: `users/{uid}/story_unlocks/{keywordKey}`

| 필드 | 설명 |
|------|------|
| `viewedStoryIds` | 열람한 후기 ID |
| `paidUnlockCount` | 유료 추가 열람 (IAP 예정) |
| `aiBlocked` | 무료 2건 소진 후 AI 재생성 스킵 |

**규칙:** read 본인, write 서버만 (`story-access` API)

---

## 컬렉션: `dreams/{dreamId}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `userId` | string | 작성자 또는 `dreamlab-seed-data` |
| `title`, `content` | string | |
| `emotions` | string[] | |
| `interpretation` | object | DreamInterpretation |
| `keywords` | string[] | **탐색 쿼리용** (top-level) |
| `category` | string | |
| `embedding` | number[]? | **256d 축소 임베딩** (`text-embedding-3-small`) — 유사 꿈 코사인 재정렬용. OpenAI 키 있을 때만 생성·저장 (~2KB) |
| `createdAt`, `followUpDueAt` | Timestamp | |
| `followUp` | object? | 30일 후기 |
| `followUpReminderSent` | boolean? | |
| `isPublic` | boolean | 탐색·유사꿈 (시드: true 고정) |
| `seedProfile` | string? | Admin 프로필 열 (UI 미사용) |
| `likes` | number? | 레거시, 시드 미저장 |

### Admin 시드 업로드 시 미저장 필드

`likes`, `importedBy`, `importedAt`, `seedSource` — 엑셀 32열에 없음

### `followUp.outcomeCategory`

```ts
"good" | "bad" | "love" | "job" | "health" | "family" | "money" | "other"
```

- **제거:** `nothing` / 「별일 없었음」 — 읽기 시 `normalizeOutcomeCategory()` → `other`

### `interpretation.researchAnchor`

```ts
{ primary, secondary?, scenePhrases?, clusterLabel? }
```

### `interpretation` — Dream Parser · 관찰 · 신호 (2026-07-13 추가)

```ts
// Dream Parser — 꿈 본문에서 추측 없이 추출
elements?: {
  people, places, actions, emotions, objects, events, symbols: string[]
}
// 연구노트 관찰 (반복 요소 · 연결 축)
observation?: { repeatedElements: string[]; axes: string[]; note: string }
// 재미 요소 정성 필드 (정량값은 클라이언트에서 결정론적 계산)
signals?: {
  oneLiner: string;          // 꿈 한줄평
  directorNote: string;      // 연구소장 한마디
  movies: { title; reason? }[];
  symbolChain: string[];     // 상징 연결도 (어머니→음식→집→안정)
}
```

- 정량 재미 요소(희귀도·감정온도·꿈 MBTI)는 **저장하지 않음** — `dreamSignals.ts`가 매 렌더 시 시드 기반으로 재계산.

---

## Admin 엑셀 32열 (`SPREADSHEET_COLUMNS`)

문서ID → 작성일 → 출처 → … → **프로필** (AF열)

- 업로드: `rowToFirestorePayload` / `rowToAdminImportPayload` (`dreamSeedImport.ts`)
- `userId` = `dreamlab-seed-data`
- `afterStory` 있으면 `followUp` 즉시 완료 처리

---

## 컬렉션: `config/{docId}`

| docId | 용도 |
|-------|------|
| `labMetrics` | 홈 KPI |
| `dataExposure` | real_first / synthetic_only / minRealCommunityCount |
| `followUpPush` | 푸시 설정 (Functions 미연동) |
| `system` | maintenance, rate limit |

---

## 컬렉션: `ai_usage/{YYYY-MM-DD}`

서버만 write — `recordAiUsage.ts`

---

## 컬렉션: `story_payment_orders/{orderId}`

rules: read/write false — IAP 연동 예정

---

## 보안 규칙 (`firestore.rules`)

```text
isMasterAdmin()  — yoonwhan0@gmail.com (토큰 이메일)
isRoleAdmin()    — users/{uid}.role == 'admin'
isAdminSeedCreate() — admin + userId == dreamlab-seed-data

dreams create: 본인 uid | isAdminSeedCreate | isAdmin
dreams delete: 본인 | isAdmin
```

배포: `npm run deploy:rules`

---

## 인덱스

1. `userId` + `createdAt` DESC
2. `isPublic` + `keywords` array-contains + `createdAt`
3. `isPublic` + `category` + `createdAt`
4. `followUpDueAt` + `followUp`

---

## 데이터 흐름 요약

| 소스 | dreams 적재 | UI 소비 |
|------|-------------|---------|
| 유저 꿈 기록 | ✅ interpretation | 상세·아카이브 |
| 유저 30일 후기 | ✅ followUp | 유사꿈 실후기 |
| Admin 시드 엑셀 | ✅ seed | 탐색 ≥5건 시 실데이터 |
| AI communityEstimate | ❌ | 세션/화면만 |

마지막 업데이트: **2026-07-13**
