# 09. 개발 로그 — 처음부터 지금까지 (전체 상세)

> **2026-07-10 기준**  
> 체크리스트: [03-development-status.md](./03-development-status.md)  
> 아키텍처: [02-architecture.md](./02-architecture.md)

---

## 목차

1. [프로젝트 정의](#1-프로젝트-정의)
2. [Phase 1 — PWA 골격](#2-phase-1--pwa-골격)
3. [Phase 2 — Firebase · 티어 · 30일 루프](#3-phase-2--firebase--티어--30일-루프)
4. [Phase 3 — 브랜드 · UI · 홈 경험](#4-phase-3--브랜드--ui--홈-경험)
5. [Phase 4 — AI 해몽 · 커뮤니티 데이터](#5-phase-4--ai-해몽--커뮤니티-데이터)
6. [Phase 5 — Admin ERP](#6-phase-5--admin-erp)
7. [Phase 6 — researchAnchor](#7-phase-6--researchanchor-ai-1차-키워드)
8. [Phase 7 — 로컬 개발 · Vercel](#8-phase-7--로컬-개발--vercel)
9. [Phase 8 — DreamLab 브랜드 표기](#9-phase-8--dreamlab-브랜드-표기)
10. [Phase 9–12 — 2026-07 최신](#phase-9--ux-단순화--홈탐색-2026-07)
11. [라우트 · 페이지 상세](#10-라우트--페이지-상세)
12. [환경변수 · 스크립트](#11-환경변수--스크립트)
13. [알려진 이슈 · 미완](#12-알려진-이슈--미완)
14. [핵심 파일 색인](#13-핵심-파일-색인)

---

## 1. 프로젝트 정의

### 1.1 한 줄

**꿈연구소 (DreamLab)** — 꿈을 기록하고 AI 관측 메모를 받은 뒤, **30일 후 실제 후기**가 쌓이면 같은 꿈 패턴의 통계·결말을 보여주는 React PWA.

### 1.2 핵심 차별점

| 일반 해몽 앱 | DreamLab |
|-------------|----------|
| GPT 1회 답변 | 30일 후 **실제 사용자 후기 DB** |
| 예언·불길 | 통계 경향 + **면책** (`LEGAL_DISCLAIMER`) |
| 고정 키워드 사전 | **AI `researchAnchor`** 가 DB·통계 클러스터 1차 결정 |
| 회원가입 필수 | **익명 Auth** 로도 꿈 DB 저장 → 가입 시 uid 유지 연결 |

### 1.3 수익 모델 (구현 전)

- 프리미엄 **₩4,900/월** — `users.isPremium` (결제 연동 전 수동)
- 프리미엄: 한 달 뒤 통계·후기 **전체** 열람

### 1.4 기술 선택 이유

| 선택 | 이유 |
|------|------|
| React + Vite | 빠른 PWA, 모바일 웹 우선 |
| Firebase | Auth(익명)·Firestore·FCM·스케줄 Functions 한 패키지 |
| Serverless AI | API 키 브라우저 노출 방지 |
| Tailwind v4 | `@theme` + `index.css` 디자인 토큰 |
| Admin 분리 | 운영 URL·빌드 분리, 사용자 앱에 링크 없음 |

---

## 2. Phase 1 — PWA 골격

### 2.1 초기 세팅

- **Vite 6** + **React 19** + TypeScript
- **Tailwind CSS v4** — `src/index.css` `@theme` 변수
- **react-router-dom v7** — SPA 라우팅
- **vite-plugin-pwa** — manifest, workbox, 오프라인 precache
- **lucide-react** — 아이콘

### 2.2 PWA manifest

- `name`: 꿈연구소(DreamLab)
- `short_name`: DreamLab
- `theme_color` / `background_color`: `#000000`
- 아이콘: `scripts/generate-icons.mjs` → `public/pwa-*.png`

### 2.3 레이아웃 · 네비

- `Layout.tsx` — sticky 헤더 + 하단 4탭
- 탭 순서: **홈 → 기록 → 탐색 → 마이** (꿈 적기 우선)
- `AppBackground.tsx` — 시뮬레이션 그리드·레이더·스캔라인

### 2.4 스플래시

- `SplashScreen.tsx` — 앱 진입 ~1.8초
- 검은 배경 + 픽셀 그리드 + 레이더 링 + 로고
- **DreamLab** / **꿈연구소** + LOADING 바 + %
- **버그 수정 (2026-07-09):** `NaN%` 무한 로딩 — progress clamp + safety timeout

---

## 3. Phase 2 — Firebase · 티어 · 30일 루프

### 3.1 Firebase 연동

- `src/lib/firebase.ts` — Auth, Firestore, Messaging
- env: `VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY`
- `scripts/inject-firebase-sw.mjs` — 빌드/predev 시 `public/firebase-messaging-sw.js` 생성

### 3.2 3단계 티어

상세: [07-access-tiers.md](./07-access-tiers.md)

| 티어 | 구현 |
|------|------|
| **비회원** | `signInAnonymously()` 자동 → `dreams` 저장 |
| **회원** | Google/이메일 + `linkWithPopup` (uid 유지) |
| **프리미엄** | `users.isPremium` |

**핵심 파일**

- `src/hooks/useAuth.tsx`
- `src/hooks/useAccessPolicy.ts`
- `src/components/MemberRoute.tsx`, `AccessGate.tsx`, `ConversionGate.tsx`

### 3.3 꿈 CRUD

- `src/services/dreamService.ts`
- 저장 시: `interpretation`, `embedding`, `followUpDueAt` (30일 또는 dev 1분)
- `firestore.indexes.json` — userId, keywords, followUpDueAt 복합 인덱스

### 3.4 30일 푸시 · 후기

**Cloud Functions** (`functions/src/index.ts`)

| Function | 역할 |
|----------|------|
| `sendFollowUpReminders` | 매일 KST 00:00, due 지난 꿈 FCM 1회 |
| `onFollowUpSubmitted` | 후기 제출 후 `hasFollowUpDiscount` 등 |

- 익명 사용자 푸시 **스킵**
- `followUpReminderSent` — 중복 발송 방지

**클라이언트**

- `PushNotificationPrompt.tsx` — 회원 FCM 토큰 → `users.fcmTokens`
- `FollowUpPage.tsx` — `/follow-up/:id`

### 3.5 데모 모드

- `VITE_DEMO_MODE=true` — Firebase 없이 UI
- 비회원 꿈 → `sessionStorage` → `/dream/preview`
- `DemoTierSwitcher` — guest/member/premium 시뮬레이션

---

## 4. Phase 3 — 브랜드 · UI · 홈 경험

### 4.1 브랜드 카피 (`src/lib/branding.ts`)

| 항목 | 문구 |
|------|------|
| 메인 | **우리는 꿈의 결과가 궁금했습니다.** |
| 서브 1~3 | 금단의 영역 — / 모르는 결말 — / **한 달 뒤, 지금 열립니다.** |
| CTA | 무료로 가입하기, 꿈 적고 시작하기, 프리미엄 ₩4,900/월 |
| 힌트 | `HINT_GUEST`, `HINT_MEMBER`, `HINT_PREMIUM` |

**제거한 것**

- 「금단 입장 · 무료 가입」 등 모호한 CTA
- `ConversionFunnelStrip` (홈 3단계 퍼널 스트립)

### 4.2 로고 · 비주얼

- 마스터: `assets/icons/brand/dreamlab-app-icon.png` (달 + 전자 UI)
- `npm run icons` — favicon, apple-touch, pwa 192/512/maskable
- 컬러: 황금 `#d4a04a`, 주황 `#e8872b`, 검은 배경

### 4.3 홈 KPI · 연구소 UI

- `public/lab-metrics.json` — tick/base/max 시드
- `useLiveLabMetrics.ts` — 실시간 카운팅 애니메이션
- `ResearchLabPanel`, `ResearchPulseToday`, `LiveStat`
- `src/lib/researchLab.ts` — `computeResearchLabStats`
- `src/lib/observatoryCredibility.ts` — humanizeCount, 갱신 시각

### 4.4 커뮤니티·신뢰 UI

- `CommunityStoriesPanel` — `꿈 -` / `30일 후 -` 라벨, 가운데 정렬
- `CommunityStatPreview`, `EstimatedDataBadge`
- `PageHero` — 히어로 3줄 분리

### 4.5 전환 UX

- `ConversionGate` — 가입/프리미엄 게이트 (퍼널 스트립 대체)
- `StickyHomeCta` — 하단 **꿈 적고 시작하기** → `/write`
- `useSignupSheet`, `usePremiumSheet` — 바텀시트

---

## 5. Phase 4 — AI 해몽 · 커뮤니티 데이터

### 5.1 API 엔드포인트

| 환경 | 경로 |
|------|------|
| 프로덕션 (Vercel) | `POST /api/interpret-dream` |
| Netlify | `/.netlify/functions/interpret-dream` |
| 로컬 | `POST http://localhost:3000/api/interpret-dream` |

**핸들러:** `netlify/functions/interpret-dream.ts`  
**Vercel 래퍼:** `api/interpret-dream.ts`

### 5.2 AI 모델 · fallback

1. **OpenAI** `gpt-4o-mini` — JSON 구조화 응답
2. **OpenAI** `text-embedding-3-small` — 유사 꿈 벡터
3. **Gemini** — OpenAI 실패 시 fallback
4. 클라이언트 mock — API 키 없을 때 (`interpretService.ts`)

### 5.3 응답 JSON 구조 (`DreamInterpretation`)

```json
{
  "usualTake": "흔한 해몽 한 줄",
  "alternativeLens": "다른 관점",
  "symbol": "...",
  "psychology": "...",
  "reflection": "...",
  "keywords": ["..."],
  "category": "...",
  "mood": { "anxiety": 0.5, "hope": 0.3, "longing": 0.2 },
  "labObservations": {
    "sceneNote": "꿈 장면 인용 관측",
    "commonBehaviors": ["..."],
    "relatedSearches": ["..."]
  },
  "researchAnchor": {
    "primary": "대표 키",
    "secondary": ["..."],
    "scenePhrases": ["..."],
    "clusterLabel": "UI 클러스터명"
  }
}
```

### 5.4 프롬프트 품질 개선 (`interpretPremium.ts`)

- 빈말·일반론 금지 — **꿈 본문 장면 인용** 필수
- `labObservations.sceneNote` — 1~2문장 직접 관측
- `alternativeLens` — usualTake와 다른 각도
- `communityEstimate` — `isEstimated: true` 로 AI 추정 통계

### 5.5 키워드 서사 (`keywordNarratives.ts`)

- 시험, 로또, 실직, **내태몽**, 보살, 연꽃 등 키워드별 전용 서사 팩
- 홈·탐색 미리보기와 연동

### 5.6 커뮤니티 데이터 병합

- `communityDataService.ts` — Firestore 실데이터 + 합성
- `syntheticCommunityService.ts` — 초기·데모 합성
- `previewKeywords.ts` — 방문마다 랜덤 자극 키워드
- `MIN_REAL_COMMUNITY_COUNT = 5` — 이 이상이면 실데이터 우선

### 5.7 UI — 해석 카드

- `InterpretationCard.tsx`
  - usualTake / alternativeLens / symbol / psychology / reflection
  - **labObservations** 섹션 (장면·행동·연관 검색)
  - 프리미엄 blur / ConversionGate

---

## 6. Phase 5 — Admin ERP

### 6.1 배경

운영자가 **재배포 없이** 홈 KPI·데이터 노출·푸시 문구를 바꾸고, 회원·꿈·Follow-up·AI 비용을 한 화면에서 보기 위해 ERP형 Admin 구축.

### 6.2 구조

- **별도 Vite 앱** `admin/` — `vite.admin.config.ts`, port **5174**
- `admin/src/main.tsx` — `../../src/index.css` 공유 (동일 디자인 토큰)
- alias: `@` → `src/`, `@admin` → `admin/src/`

### 6.3 인증 · 권한

```text
Firestore users/{uid}.role === "admin"
firestore.rules — isAdmin() 헬퍼
```

- `useAdminAuth.ts` — Firebase Auth + role 확인
- `AdminGate` — 비로그인 → `/login`, 비admin → 안내

### 6.4 Firestore `config/*`

| docId | Admin UI | 앱 사용처 |
|-------|----------|-----------|
| `labMetrics` | 홈 KPI | `useLiveLabMetrics`, ResearchLab |
| `dataExposure` | 데이터 노출 | `communityDataService` |
| `followUpPush` | 푸시 설정 | 저장만 (Functions 연동 예정) |
| `system` | 시스템 | maintenance, rate limit 메모 |

- 타입: `src/lib/opsConfig.ts`
- CRUD: `src/services/opsConfigService.ts`
- Admin hook: `useOpsConfig.ts`

**규칙:** `config/*` — **read: true** (앱), **write: admin**

### 6.5 Admin 페이지별 기능

| 페이지 | 파일 | 기능 |
|--------|------|------|
| 대시보드 | `DashboardPage.tsx` | 실DB KPI(500 샘플) + 합성 KPI, AI 오늘 호출 |
| 모니터링 | `MonitoringPage.tsx` | config·시스템 상태 |
| 회원 | `MembersPage.tsx` | users 테이블 |
| 꿈 DB | `DreamsPage.tsx` | dreams 목록 |
| Follow-up | `FollowUpPage.tsx` | due/완료/미응답 |
| 데이터 노출 | `DataExposurePage.tsx` | blendMode, 배지, 오가닉 목표 % |
| AI 사용량 | `AiUsagePage.tsx` | `ai_usage` 일별 |
| 홈 KPI | `LabMetricsPage.tsx` | tick/base/max 편집 |
| 푸시 | `PushSettingsPage.tsx` | 마일스톤·메시지 JSON |
| 시스템 | `SystemSettingsPage.tsx` | maintenance, rate limit |

### 6.6 AI 사용량 로깅

- `netlify/functions/lib/recordAiUsage.ts`
- env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `ai_usage/{YYYY-MM-DD}` — totalCalls, openaiCalls, geminiCalls, errorCalls
- rules: read admin only, write server only

### 6.7 Admin metrics

- `admin/src/services/adminMetrics.ts`
- `fetchKpiSnapshot()` — users/dreams 각 **limit 500** 샘플
- 30일 응답률 = completed / (completed + pending)

---

## 7. Phase 6 — researchAnchor (AI 1차 키워드)

### 7.1 문제

초기에는 **고정 lexicon·차단 목록**으로 키워드를 뽑았으나:

- `#내태몽이였다고` 같은 해시태그형 오류
- `"할아버지가"` — 조사 포함 통계 키
- AI가 문맥상 더 나은 앵커를 알지만 코드가 덮어씀

### 7.2 설계 전환 (2026-07)

**원칙:** 키워드·DB 클러스터 = **AI 1차**, 코드 = **정리·폴백만**

```
interpretPremium → researchAnchor JSON
    ↓
normalizeResearchAnchor() — primary 정규화
    ↓
resolveResearchAnchor() — AI primary > keywords > heuristic
    ↓
DreamDetailPage — clusterLabel ?? primary 표시
유사 꿈 / 탐색 — primary 기준 클러스터
```

### 7.3 `src/lib/dreamAnchor.ts`

| 함수 | 역할 |
|------|------|
| `sanitizeDreamContent` | 생년월일·운영 메타 줄 제외 |
| `normalizeKoreanToken` | 조사·어미 가벼운 제거 |
| `isValidKeywordToken` | stop word, 숫자만 제외 |
| `extractHeuristicKeywords` | **AI 없을 때만** 폴백 |
| `resolveResearchAnchor` | AI primary 우선 |
| `resolveAnchorKeyword` | UI 표시용 단일 키 |

**약화/제거**

- `DREAM_SYMBOL_LEXICON` 우선 스캔 → 빈 배열 폴백
- `WEAK_ANCHOR` 강제 차단 → AI 키워드 신뢰

**동기화:** `netlify/functions/lib/dreamAnchor.ts` → `src/lib/dreamAnchor.ts` re-export

### 7.4 타입 (`src/types/index.ts`)

```ts
interface ResearchAnchor {
  primary: string;
  secondary?: string[];
  scenePhrases?: string[];
  clusterLabel?: string;
}
```

`DreamInterpretation.researchAnchor?: ResearchAnchor`

### 7.5 UI 반영

- `DreamDetailPage.tsx` — `clusterLabel` 우선, 없으면 `resolveAnchorKeyword`
- `InterpretationCard.tsx` — labObservations와 함께 관측 톤 유지

---

## 8. Phase 7 — 로컬 개발 · Vercel

### 8.1 문제

- `vercel dev` — 로그인 프롬프트에서 멈춤, 배포 전에도 앱 확인 어려움
- `netlify dev` — port 8888, CLI 의존

### 8.2 해결

**`npm run dev` = Vite 단독 (port 3000)**

- `vite.config.ts` — `server.port: 3000`, `host: 127.0.0.1`
- `scripts/vite-local-api-plugin.ts`
  - dev middleware가 `POST /api/interpret-dream` 가로챔
  - `netlify/functions/interpret-dream.handler` 직접 호출
- `package.json`:
  - `"dev": "vite"`
  - `"dev:vercel": "vercel dev --listen 3000"` (선택)
  - `"dev:netlify": "netlify dev"` (레거시)

### 8.3 서버 env 로드

`vite.config.ts` — `loadEnv` 후 다음을 `process.env`에 주입:

- `OPENAI_API_KEY`, `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (ai_usage)

### 8.4 Vercel 프로덕션

- `api/interpret-dream.ts` — Netlify HandlerEvent 어댑터
- `vercel.json` — SPA + API 라우팅
- `DEPLOY.md` — Firebase + Vercel 체크리스트

### 8.5 env 동기화

- `scripts/sync-branch-env.mjs` — `Branch/.env` → `.env.local`
- Firebase env 없으면: UI만 동작, Auth/DB 불가 (경고 표시)

---

## 9. Phase 8 — DreamLab 브랜드 표기

### 9.1 문제

`branding.ts`의 `APP_NAME_EN = "DreamLab"` 이었으나:

- `Layout.tsx` 헤더 — `uppercase` + `tracking-[0.12em]` → **DREAMLAB**
- `.splash-brand-en` — `letter-spacing: 0.32em` → 대문자 로고처럼 보임
- Admin `section-label` — `text-transform: uppercase` → **DREAMLAB · ERP**

### 9.2 수정 (2026-07-10)

- CSS `.brand-wordmark` — `text-transform: none`, `letter-spacing: 0.02em`
- `Layout.tsx`, `SplashScreen.tsx`, Admin sidebar/login 적용
- `index.html` — `apple-mobile-web-app-title`: DreamLab
- PWA `short_name`: DreamLab (유지)

---

## 10. 라우트 · 페이지 상세

### 10.1 사용자 앱

| 경로 | 컴포넌트 | 주요 기능 |
|------|----------|-----------|
| `/` | HomePage | 히어로, LabResearchMission, HomeObservatorySignal, 키워드12, 후기1건 |
| `/write` | WriteDreamPage | 감정, 본문, AI, 저장 |
| `/dream/:id` | DreamDetailPage | 해석, 운세, 유사꿈 |
| `/follow-up/:id` | FollowUpPage | 후기 8자+ |
| `/explore` | ExplorePage | 칩20, AI+실DB, 운세 |
| `/my` | MyPage | 아카이브, 달력, 운세, 연구미션 |
| `/my-dreams` | MyDreamsPage | 전체 아카이브 |
| `/about` | Navigate | → `/#research` |
| `/premium` | Navigate | → `/my#pricing` |
| `/superadmin/*` | AdminApp | 대시보드·회원·꿈DB |

### 10.2 Admin

| 경로 | 컴포넌트 |
|------|----------|
| `/login` | LoginPage |
| `/` | DashboardPage |
| `/monitoring` | MonitoringPage |
| `/members` | MembersPage |
| `/dreams` | DreamsPage |
| `/follow-up` | FollowUpPage |
| `/data-exposure` | DataExposurePage |
| `/ai-usage` | AiUsagePage |
| `/settings/lab-metrics` | LabMetricsPage |
| `/settings/push` | PushSettingsPage |
| `/settings/system` | SystemSettingsPage |

---

## 11. 환경변수 · 스크립트

### 11.1 환경변수

```env
# 클라이언트
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_DEMO_MODE=false

# 서버 (AI + ai_usage)
OPENAI_API_KEY=
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# 로컬 테스트
VITE_DEV_SHORT_FOLLOWUP=false   # true → 30일 = 1분
```

### 11.2 npm scripts

| script | 설명 |
|--------|------|
| `predev` | sync-branch-env + inject-firebase-sw |
| `dev` | Vite :3000 + 로컬 API |
| `dev:admin` | Admin :5174 |
| `dev:vercel` | Vercel dev (선택) |
| `build` | icons + tsc + vite build |
| `build:admin` | Admin 프로덕션 빌드 |
| `icons` | generate-icons.mjs |

### 11.3 Windows 배치

- `실행.bat` — `npm run dev`
- `admin.bat` — `npm run dev:admin`

---

## 12. 알려진 이슈 · 미완

| 항목 | 상태 | 비고 |
|------|------|------|
| Netlify 프로덕션 | ✅ | GitHub main 자동 배포 |
| Firestore rules | 🟡 | 배포 후 Admin 시드 확인 |
| Cloud Functions 푸시 | 🟡 | Blaze |
| 스토어 IAP | ❌ | 토스 제거됨 |
| `kpi_daily` | ❌ | |
| `followUpPush` → Functions | ❌ | |
| Admin 설정 페이지 라우터 | 🟡 | 파일만 존재 |

---

## 13. 핵심 파일 색인

### 사용자 앱

```
src/App.tsx
src/components/SplashScreen.tsx
src/components/Layout.tsx
src/components/InterpretationCard.tsx
src/pages/HomePage.tsx
src/pages/WriteDreamPage.tsx
src/pages/DreamDetailPage.tsx
src/hooks/useAuth.tsx
src/hooks/useAccessPolicy.ts
src/lib/branding.ts
src/lib/dreamAnchor.ts
src/lib/opsConfig.ts
src/services/dreamService.ts
src/services/interpretService.ts
src/services/opsConfigService.ts
src/services/communityDataService.ts
```

### AI · API

```
netlify/functions/interpret-dream.ts
netlify/functions/lib/interpretPremium.ts
netlify/functions/lib/recordAiUsage.ts
api/interpret-dream.ts
scripts/vite-local-api-plugin.ts
```

### Firebase · 배포

```
functions/src/index.ts
firestore.rules
firestore.indexes.json
firebase.json
vercel.json
DEPLOY.md
vite.config.ts
```

### Admin

```
admin/src/App.tsx
admin/src/layout/AdminSidebar.tsx
admin/src/hooks/useAdminAuth.ts
admin/src/services/adminMetrics.ts
admin/src/pages/DashboardPage.tsx
admin/src/pages/DataExposurePage.tsx
vite.admin.config.ts
```

### 에셋

```
assets/icons/brand/dreamlab-app-icon.png
scripts/generate-icons.mjs
scripts/inject-firebase-sw.mjs
scripts/sync-branch-env.mjs
```

---

## Phase 9 — UX 단순화 · 홈·탐색 (2026-07)

### 9.1 홈

- 히어로: 「같은 꿈을 꾼 사람들」+ 30일 질문
- FOMO 숫자·과한 블러 제거
- `HomeObservatorySignal` — 관측 밀도만
- 키워드 칩 **12개** — `fetchPopularDreamKeywords` + 랜덤
- `LabResearchMission` — 히어로 아래 아코디언 (`/#research`)

### 9.2 탐색

- 검색 칩 **20개**, 미리보기 **6건**
- `useFeaturedKeywords` 공용 훅
- `AiWritingPulse` — 로딩 카피 정리

### 9.3 마이 · 아카이브

- `DreamArchiveCard` 슬림
- `DreamArchiveCalendar` — 월별 잔디 MVP
- `MyDreamFortuneSection` — 최근 꿈 운세

---

## Phase 10 — 프리미엄 운세 · 결제 정리 (2026-07)

### 10.1 프리미엄 재정의

- **30일 운세 추이** — 7축 8주 (`DreamFortuneTrendPanel`)
- AI 재해석 패널 **제거**
- 탐색·상세·마이·프리미엄 페이지 노출

### 10.2 결제

- **토스페이먼츠 SDK·Functions 제거**
- 방향: App Store / Play IAP
- `story_payment_orders` 컬렉션 rules 예약

### 10.3 후기 정책

- 「별일 없었음」카테고리 제거 → `other`
- FollowUp 원탭 제거, 후기 8자 이상

---

## Phase 11 — Admin 꿈 DB · 시드 (2026-07)

### 11.1 엑셀 스프레드시트

- `DreamSpreadsheet.tsx` — 32열 (문서ID~프로필)
- `dreamlab-seed-data` 시드 userId
- 추가 저장만 (덮어쓰기 없음)
- `isPublic: true` 고정

### 11.2 Server API

- `admin-import-dreams.ts` — Admin SDK bulk set
- `admin-delete-dreams.ts` — Admin SDK bulk delete
- `firebaseAdmin.ts` — verifyBearerAdmin, PEM 정규화
- Netlify redirects + `vite-dev-api-plugin`

### 11.3 Firestore rules

- `isMasterAdmin` — 마스터 이메일
- `isAdminSeedCreate` — 시드 create
- admin delete 권한

### 11.4 Admin 슬림화

- 메뉴 3개: 대시보드 · 회원 · 꿈 DB
- `/superadmin` PWA 임베드
- 레거시 설정 페이지 라우터 분리

---

## Phase 12 — 커뮤니티 품질 · 브랜드 페르소나 (2026-07)

### 12.1 AI·커뮤니티

- `communityStoryQuality` — 사용자 원문 겹침 필터
- `similarDreamVariation` — 같은 결·다른 장면
- `communityReviewPrompt` — believable 변주 지시
- **AI 출력 DB 미저장** — 무한 루프 없음

### 12.2 시드 → 탐색

- `MIN_REAL_COMMUNITY_COUNT = 5`
- `communityDataService` real_first
- `fetchPopularDreamKeywords` — 홈·탐색 칩

### 12.3 브랜드 카피

- `RESEARCH_MISSION_BEATS` / `RESEARCH_MISSION_TOPICS`
- 연구 미션 아코디언 — 관측 밀도 중복 제거 (홈)

---

## 부록 — 개발 타임라인 요약

| 시기 | 마일스톤 |
|------|----------|
| 초기 | PWA + React + 4탭 |
| Phase 2 | Firebase + 30일 Functions |
| Phase 3 | 브랜드·로고·홈 KPI |
| Phase 4 | interpret-dream + 커뮤니티 |
| Phase 5 | Admin ERP + config/* |
| Phase 6 | researchAnchor AI 1차 |
| Phase 7 | 로컬 API · Vercel 경로 |
| Phase 8 | DreamLab 표기 |
| **Phase 9** | **홈·탐색 UX · DB 키워드 칩** |
| **Phase 10** | **운세 7축 · 토스 제거** |
| **Phase 11** | **Admin 엑셀 시드 · import/delete API** |
| **Phase 12** | **커뮤니티 품질 · 연구 미션 페르소나** |

---

마지막 업데이트: **2026-07-10**
