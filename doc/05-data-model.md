# 05. 데이터 모델 (Firestore)

> **Storage / RTDB 미사용** — 텍스트·JSON·배열만 Firestore에 저장 ([DEPLOY.md](../DEPLOY.md))

---

## 컬렉션: `users/{uid}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `displayName` | string? | |
| `email` | string? | |
| `isPremium` | boolean | 프리미엄 여부 |
| `isAnonymous` | boolean | 게스트 |
| `role` | string? | **`"admin"`** — Admin ERP 접근 |
| `fcmTokens` | string[] | FCM 푸시 |
| `gender`, `ageRange`, `country` | string? | 선택 |
| `createdAt` | Timestamp | |
| `hasFollowUpDiscount` | boolean? | Functions에서 설정 |
| `lastFollowUpAt` | Timestamp? | |

---

## 컬렉션: `dreams/{dreamId}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `userId` | string | 작성자 |
| `title` | string | 본문 첫 줄 자동 |
| `content` | string | 원문 |
| `emotions` | string[] | 꿈 속 감정 ID |
| `interpretation` | object | 아래 `DreamInterpretation` |
| `embedding` | number[]? | OpenAI embedding |
| `createdAt` | Timestamp | |
| `followUpDueAt` | Timestamp | 30일 후 (dev: 1분) |
| `followUp` | object? | 30일 후기 |
| `followUpReminderSent` | boolean? | 푸시 1회 플래그 |
| `isPublic` | boolean | 통계/탐색 노출 |
| `likes` | number | |

### `interpretation` 객체 (`DreamInterpretation`)

```ts
{
  usualTake: string;
  alternativeLens?: string;
  symbol: string;
  psychology: string;
  reflection: string;
  keywords: string[];
  category: string;
  mood?: { anxiety: number; hope: number; longing: number };
  labObservations?: {
    sceneNote: string;
    commonBehaviors: string[];
    relatedSearches: string[];
  };
  researchAnchor?: {
    primary: string;           // AI 1차 DB·통계 키
    secondary?: string[];
    scenePhrases?: string[];
    clusterLabel?: string;     // UI 표시용 클러스터명
  };
}
```

### `followUp` 객체

```ts
{
  outcomeCategory: "nothing" | "good" | "bad" | "love" | "job" | "health" | "family" | "money" | "other";
  note: string;
  emotions: FollowUpEmotionId[];
  answeredAt: Timestamp;
}
```

---

## 컬렉션: `config/{docId}` ⭐ (Admin 설정 — 재배포 불필요)

| docId | 타입 | 용도 |
|-------|------|------|
| `labMetrics` | `LabMetricsConfig` | 홈 KPI tick/base/max |
| `dataExposure` | `DataExposureConfig` | 실데이터 vs 합성, 배지, blendMode |
| `followUpPush` | `FollowUpPushConfig` | 푸시 on/off, 마일스톤, 메시지 |
| `system` | `SystemOpsConfig` | maintenance, rate limit, adminNotes |

**규칙:** `read: true` (앱 런타임), `write: isAdmin()`

타입 정의: `src/lib/opsConfig.ts`  
CRUD: `src/services/opsConfigService.ts`

### `dataExposure` 주요 필드

| 필드 | 설명 |
|------|------|
| `minRealCommunityCount` | 이 건수 이상이면 실 커뮤니티 데이터 |
| `blendMode` | `real_first` / `synthetic_only` / `organic_only` |
| `showEstimatedBadge` | AI 추정 배지 표시 |
| `homePreviewsSynthetic` | 홈 '많이 찾는 꿈' 합성 허용 |
| `allowAiCommunityEstimate` | AI communityEstimate 병합 |
| `targetOrganicPercent` | 운영 목표 오가닉 % |

---

## 컬렉션: `ai_usage/{YYYY-MM-DD}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `date` | string | `2026-07-10` |
| `totalCalls` | number | |
| `openaiCalls` | number? | |
| `geminiCalls` | number? | |
| `fallbackCalls` | number? | |
| `errorCalls` | number? | |
| `updatedAt` | Timestamp | |

**기록:** `interpret-dream` 성공/실패 시 `recordAiUsage.ts` (Firebase Admin env 필요)  
**규칙:** `read: isAdmin()`, `write: false` (서버만)

---

## 컬렉션: `kpi_snapshots/{id}` (설계·부분)

Admin 대시보드용 일별 스냅샷. 현재 Admin은 **500건 샘플 실시간 집계** (`adminMetrics.ts`).  
야간 배치 → [08-kpi-metrics.md](./08-kpi-metrics.md)

---

## 보안 규칙 (`firestore.rules`)

```text
isAdmin() = users/{uid}.role == 'admin'

config/*     — read: all, write: admin
ai_usage/*   — read: admin, write: server only
kpi_snapshots/* — read: admin, write: server only
users/*      — read/write: 본인 또는 admin
dreams/*     — read: public 또는 본인 또는 admin
               write: 본인 또는 admin
```

배포: `firebase deploy --only firestore`

---

## 인덱스 (`firestore.indexes.json`)

1. `userId` + `createdAt` DESC — 내 꿈 목록
2. `isPublic` + `keywords` array-contains + `createdAt` — 키워드 탐색
3. `isPublic` + `category` + `createdAt`
4. `followUpDueAt` + `followUp` — 푸시 스케줄 쿼리

---

## Admin 최초 설정

1. Firebase Auth로 Admin 계정 로그인
2. Firestore → `users/{해당 uid}` → `role: "admin"` 추가
3. `firebase deploy --only firestore:rules`
4. `admin.bat` → Google 로그인

---

## 미구현 컬렉션 (설계)

| 컬렉션 | 용도 |
|--------|------|
| `push_logs` | 발송/성공/실패/클릭 |
| `reports` | 신고 |
| `subscriptions` | Premium 결제 |
| `analytics_events` | 퍼널 |
| `kpi_daily` | 일별 집계 |

마지막 업데이트: **2026-07-10**
