# 10. 기능 레퍼런스 (전체)

> **2026-07-10 최종 동기화** — 사용자 앱 · Admin · API · 데이터 흐름을 한 문서에 정리합니다.

---

## 1. 제품 한 줄

**DreamLab(꿈연구소)** — 꿈을 기록하고 AI 해몽을 받은 뒤, **30일 후 실제 후기**가 쌓이면 같은 꿈 패턴의 통계·결말을 관측하는 PWA.

**차별점:** 해몽이 끝나는 지점에서 멈추지 않고, **한 달 뒤 결말 데이터**를 모아 비교한다.

---

## 2. 브랜드 · 카피 (`src/lib/branding.ts`)

| 항목 | 내용 |
|------|------|
| 한글명 | 꿈연구소 |
| 영문명 | DreamLab (카멜케이스, CSS uppercase 금지) |
| 홈 히어로 제목 | 같은 꿈을 꾼 사람들. |
| 홈 히어로 액센트 | 30일 뒤, 그들에게는 무슨 일이 있었을까요? |
| 매니페스토 | 꿈은 보통 해몽에서 끝났습니다… 한 달 뒤 실제 기록을 모읍니다 |
| 연구 미션 비트 | AI 해몽은 일반적 → 데이터 쌓임 → 그다음은? (`RESEARCH_MISSION_BEATS`) |
| CTA | 꿈 기록하기, 무료로 가입하기, 프리미엄 구독 안내 |

### 「우리는 어떤 것을 연구하나」

- **위치:** 홈 히어로 바로 아래 — 클릭형 텍스트 + `motion-accordion-open`
- **컴포넌트:** `LabResearchMission.tsx` (`variant="hero"`)
- **내용:** 훅 + 매니페스토 + 내러티브 3줄 + 연구 주제 4카드 (`RESEARCH_MISSION_TOPICS`)
- **제외:** 관측 밀도 그리드 (홈 `HomeObservatorySignal`과 중복 방지)
- **딥링크:** `/#research` — 해시 시 자동 펼침
- **마이:** 동일 컴포넌트 `variant="card"` — 관측 밀도 포함

---

## 3. 사용자 앱 — 페이지별

| 경로 | 페이지 | 핵심 기능 |
|------|--------|-----------|
| `/` | HomePage | 히어로, 연구 미션 아코디언, 관측 밀도 신호, 키워드 칩 12개(DB 랜덤), 후기 1건 미리보기 |
| `/write` | WriteDreamPage | 감정·본문 → AI 해몽 → **회원만** Firestore 저장 |
| `/dream/:id` | DreamDetailPage | 해석 카드, 유사 꿈, 운세 그래프, 후기 |
| `/follow-up/:id` | FollowUpPage | 30일 후기 (회원, 8자 이상 필수) |
| `/explore` | ExplorePage | 키워드 검색, 칩 **12개**(DB), 미리보기 6건, AI+실데이터 병합 |
| `/my` | MyPage | 아카이브, 월별 잔디 달력, 운세 패널, 연구 미션, 프리미엄 |
| `/my-dreams` | MyDreamsPage | 전체 아카이브 |
| `/about` | — | `/#research` 리다이렉트 |
| `/premium` | — | `/my#pricing` 리다이렉트 |
| `/superadmin/*` | AdminApp | 운영 Admin (임베드) |

### 홈 단순화 (2026-07)

- 제거·축소: 홈 대형 KPI 숫자, FOMO 블러 과다, `ResearchLabPanel` 풀 노출
- 유지: `HomeObservatorySignal` (관측 밀도만), `HomeFeaturedStoryPanel` (키워드 1건)
- 키워드: `useHomeFeaturedKeywords` — Firestore 공개 꿈 빈도 중 **수동 후기 카피가 있는 키워드만** 12개 랜덤
- 홈·탐색 뱃지 후기: `coherentCommunityStory.ts`의 `MANUAL_STORIES`에 제목·꿈내용·30일후기를 **키워드별로 직접 작성**한다. 키워드만 끼워 넣는 조합 템플릿, 큰따옴표 강조, 공통 골격 문장 사용 금지.

### 탐색 (2026-07)

- 검색 칩 **12개** (`KEYWORD_RAIL_COUNT` / `EXPLORE_KEYWORD_CHIP_COUNT`)
- 검색 전 미리보기 **6건** (`EXPLORE_DISCOVER_PREVIEW_COUNT`)
- `fetchPopularDreamKeywords()` — DB 500건 집계 후 `isManualStoryKeyword()`로 필터링
- 폴백: `PREVIEW_KEYWORD_POOL` 중 수동 후기 카피가 있는 키워드

---

## 4. 접근 티어 · 잠금

상세: [07-access-tiers.md](./07-access-tiers.md)

| 티어 | 꿈 저장 | 탐색 후기 | 운세 그래프 | 통계 전체 |
|------|---------|-----------|-------------|-----------|
| 비회원 | ❌ (로컬 미리보기) | 1건+블러 | 절반+블러 | blur |
| 회원 | ✅ Firestore | 키워드당 **2건 무료** | 3축 | 일부 |
| 프리미엄 | ✅ | 전체 | **7축 8주** | ✅ |

### 후기 열람 한도 (회원)

- `MEMBER_FREE_STORY_VIEWS = 2` (`storyAccessPricing.ts`)
- API: `story-access`, `register-story-views` (Netlify Functions)
- Firestore: `users/{uid}/story_unlocks/{keywordKey}` — 서버만 쓰기

### 프리미엄 핵심 혜택 (2026-07)

- **30일 운세 추이** — `DreamFortuneTrendPanel` + `dreamFortuneTrends.ts`
- 7축: 종합·재물·연애·직장·건강·가족·대외
- 8주 스파크라인, 상승/하락/보합
- 노출: 탐색·꿈 상세·마이·프리미엄 미리보기
- **제거:** AI 재해석 패널 (`ReinterpretRecentPanel`)

### 결제

- **토스페이먼츠 제거** (2026-07) — 웹 결제 Functions 삭제
- 방향: **App Store / Google Play IAP** + `grantPaidStoryUnlock` (미연동)
- 프리미엄: `users.isPremium` 수동 또는 추후 스토어 영수증

### 인증 (2026-07-10)

- **Google 로그인 전용** — 이메일/비밀번호 UI 제거
- 비회원: Firebase Auth 세션 없음, `sessionStorage` pending dream
- 데스크톱: `signInWithPopup` → 실패 시 redirect 폴백
- 모바일·PWA·인앱: `signInWithRedirect` (`authPlatform.ts`)
- 가입 후 pending → `PendingDreamLinker` → Firestore `saveDream`
- **RTDB 미사용** — Firestore만

---

## 5. AI · 커뮤니티 데이터

### AI 해몽 API

| 환경 | 경로 |
|------|------|
| Netlify 프로덕션 | `POST /api/interpret-dream` |
| 로컬 Vite | `scripts/vite-dev-api-plugin.ts` 동일 라우트 |

**출력:** `DreamInterpretation` + `communityEstimate` (세션/캐시만, **DB 미저장**)

### 커뮤니티 데이터 병합 (`communityDataService.ts`)

```
1. mergeEstimate — AI estimate + syntheticCommunity 합성
2. findSimilarDreams — Firestore isPublic + keywords (시드 포함)
3. blendMode (config/dataExposure):
   - real_first: ≥5건 → 실데이터, 아니면 합성+AI
   - synthetic_only / organic_only
```

- `MIN_REAL_COMMUNITY_COUNT = 5`
- **시드 데이터:** `userId: dreamlab-seed-data`, `isPublic: true`
- **AI 후기는 DB에 재저장되지 않음** — 무한 학습 루프 없음

### 유사 꿈 · 후기 품질

- `similarDreamVariation.ts` — 같은 결·다른 장면 변주
- `communityStoryQuality.ts` — 사용자 원문과 겹치는 AI 스토리 필터
- `communityReviewPrompt.ts` — 「유사성 찾아 believable하게 창작」

### 후기 카테고리

- `OUTCOME_CATEGORIES`: good, bad, love, job, health, family, money, other
- **제거:** `nothing` / 「별일 없었음」 — `normalizeOutcomeCategory()` → `other`
- FollowUp: 원탭 제거, 후기 8자 이상 필수

---

## 6. Admin (`/superadmin` · `admin/`)

### 현재 메뉴 (3개)

| 메뉴 | 경로 | 기능 |
|------|------|------|
| 대시보드 | `/superadmin` | KPI 샘플 |
| 회원 | `/superadmin/members` | users 목록 |
| 꿈 DB | `/superadmin/dreams` | **엑셀형 스프레드시트** |

> 레거시 페이지 파일(`DataExposurePage` 등)은 코드에 남아 있으나 **라우터 미연결** (2026-07 Admin 슬림화)

### 꿈 DB 스프레드시트

- **컴포넌트:** `DreamSpreadsheet.tsx`
- **스키마:** `dreamSpreadsheetSchema.ts` — **32열** (문서ID ~ 프로필)
- **시드 UID:** `dreamlab-seed-data`
- **업로드:** 항상 새 문서 추가 (덮어쓰기 없음)
- **고정값:** `isPublic: true` — likes/importedBy 등 미저장
- **양식:** DB 양식 / DB 다운로드 / DB 업로드 / 선택 삭제

### Admin Server API (Firestore rules 우회)

| API | 파일 | 역할 |
|-----|------|------|
| `POST /api/admin-import-dreams` | `admin-import-dreams.ts` | 시드 일괄 저장 |
| `POST /api/admin-delete-dreams` | `admin-delete-dreams.ts` | 시드 일괄 삭제 |

- 인증: `verifyBearerAdmin` — 마스터 이메일 또는 `users.role=admin`
- env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- 클라이언트 폴백: `adminDreamDb.ts` — API 503/404 시 Firestore 직접 (배치 8건)

### 마스터 계정

- `src/lib/masterAccounts.ts` — `yoonwhan0@gmail.com`
- `firestore.rules` — `isMasterAdmin()` 토큰 이메일 매칭

---

## 7. Netlify Functions 전체

| Function | 경로 | 설명 |
|----------|------|------|
| interpret-dream | `/api/interpret-dream` | AI 해몽 + communityEstimate |
| story-access | `/api/story-access` | 키워드별 열람 상태 |
| register-story-views | `/api/register-story-views` | 후기 열람 등록 |
| admin-import-dreams | `/api/admin-import-dreams` | Admin 시드 업로드 |
| admin-delete-dreams | `/api/admin-delete-dreams` | Admin 시드 삭제 |

공통: `netlify/functions/lib/firebaseAdmin.ts`, `firebasePrivateKey.ts`

---

## 8. Firestore 요약

상세: [05-data-model.md](./05-data-model.md)

| 컬렉션 | 용도 |
|--------|------|
| `users` | 프로필, isPremium, role, fcmTokens, story_unlocks 서브컬렉션 |
| `dreams` | 꿈·해몽·후기·keywords[]·isPublic |
| `config/*` | labMetrics, dataExposure, followUpPush, system |
| `ai_usage` | 일별 AI 호출 집계 |
| `story_payment_orders` | rules write:false (IAP 예정) |

### dreams 주요 필드 (시드 포함)

- `keywords[]`, `category` — 탐색·유사 꿈 쿼리용 (top-level)
- `interpretation.researchAnchor` — AI 1차 클러스터 키
- `seedProfile` — Admin 프로필 열 (UI 미사용, export용)
- `followUp` — 30일 후기 (실데이터 후기 카드 소스)

---

## 9. 로컬 개발 · 배포

| 명령 | 포트 | 설명 |
|------|------|------|
| `npm run dev` | 5173 (Vite) | 사용자 앱 |
| `npm run dev:netlify` | 8888 | Functions 포함 |
| `npm run dev:admin` | 5174 | Admin standalone |
| `npm run build` | — | `dist/` PWA |

**프로덕션:** Netlify (`netlify.toml`) — GitHub `main` 자동 배포  
상세: [06-deployment.md](./06-deployment.md)

---

## 10. 미구현 · 다음 단계

- [ ] App Store / Play IAP → `isPremium` 자동화
- [ ] `kpi_daily` 야간 집계
- [ ] `followUpPush` → Cloud Functions 연동
- [ ] Admin 설정 페이지 라우터 재연결 (선택)
- [ ] interpret rate limit 강제
- [ ] embedding Firestore 저장 (현재 미저장)

---

## 11. 핵심 파일 색인 (2026-07)

```
# 인증
src/hooks/useAuth.tsx
src/lib/authPlatform.ts
src/lib/authUser.ts
src/lib/pendingDreamStorage.ts
src/services/pendingDreamService.ts
src/components/PendingDreamLinker.tsx
src/components/AuthSheetBody.tsx

# 브랜드 · 홈
src/lib/branding.ts
src/components/LabResearchMission.tsx
src/components/HomeObservatorySignal.tsx
src/hooks/useFeaturedKeywords.ts
src/hooks/useHomeFeaturedKeywords.ts

# 커뮤니티 · AI
src/services/communityDataService.ts
src/services/syntheticCommunityService.ts
src/services/dreamService.ts          # fetchPopularDreamKeywords
src/lib/communityStoryQuality.ts
netlify/functions/interpret-dream.ts

# 프리미엄 · 열람
src/lib/dreamFortuneTrends.ts
src/components/DreamFortuneTrendPanel.tsx
src/services/storyUnlockService.ts
src/lib/storyAccessPricing.ts

# Admin 시드
admin/src/components/DreamSpreadsheet.tsx
admin/src/lib/dreamSpreadsheetSchema.ts
admin/src/services/adminDreamDb.ts
src/lib/dreamSeedImport.ts
netlify/functions/admin-import-dreams.ts
netlify/functions/admin-delete-dreams.ts

# 보안
firestore.rules
src/lib/masterAccounts.ts
```

마지막 업데이트: **2026-07-10**
