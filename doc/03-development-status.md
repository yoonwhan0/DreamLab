# 03. 개발 현황

> **전체 개발 이력 (처음부터 상세)**: [09-development-log.md](./09-development-log.md)  
> 빌드: `npm run build` ✅ (2026-07-10)

---

## ✅ 구현 완료 — 사용자 앱

### 인프라

- [x] Vite 6 + React 19 + TS + Tailwind v4
- [x] PWA (manifest, SW, 아이콘 `npm run icons`)
- [x] Firebase (`firebase.json`, rules, indexes, Functions)
- [x] Vercel API (`api/interpret-dream.ts`) + Netlify Functions 공용 로직
- [x] **로컬 dev** — Vite port **3000** + `vite-local-api-plugin` (Vercel 로그인 불필요)
- [x] `.env.example` + `sync-branch-env` + `inject-firebase-sw`
- [x] 스플래시 (DreamLab / 꿈연구소, LOADING) — NaN% 버그 수정

### 인증 · 티어 ([07-access-tiers.md](./07-access-tiers.md))

- [x] 익명 Auth 자동 로그인 → 비회원 꿈 DB 저장
- [x] Google/이메일 가입 시 익명 계정 연결 (`linkWithPopup`)
- [x] `useAccessPolicy` — guest / member / premium
- [x] `PushNotificationPrompt` — 회원 FCM 토큰 등록
- [x] Functions — 익명 사용자 푸시 스킵
- [x] 데모 모드 + 티어 스위처

### 페이지

| 경로 | 상태 |
|------|------|
| `/` 홈 | ✅ KPI, 키워드, 후기 미리보기, ResearchLab |
| `/write` | ✅ AI 해몽 + 저장 |
| `/dream/:id` | ✅ 상세, researchAnchor 표시, 유사 꿈 |
| `/follow-up/:id` | ✅ 30일 후기 (회원) |
| `/explore` | ✅ 패턴 탐색 |
| `/my`, `/my-dreams` | ✅ 마이·아카이브 |
| `/premium` | ✅ → `/my` 리다이렉트 |

### UI / 브랜드

- [x] 로고 (달·전자 UI) — favicon/PWA 전체
- [x] 시뮬레이션 배경 (그리드, 레이더, 스캔라인)
- [x] 황금·주황 컬러 시스템
- [x] **DreamLab** 영문 표기 (uppercase 제거, `.brand-wordmark`)
- [x] 히어로 3줄, CTA 직관화 (`branding.ts`)
- [x] 네비: 홈 → **기록** → 탐색 → 마이

### 데이터 · AI

- [x] `interpret-dream` (OpenAI / Gemini fallback)
- [x] **`researchAnchor`** — AI 1차 키워드·클러스터
- [x] `labObservations` — 장면 인용 UI (`InterpretationCard`)
- [x] `keywordNarratives` — 내태몽·보살·연꽃 등 팩
- [x] 홈 KPI — `lab-metrics.json` + Firestore `config/labMetrics`
- [x] `opsConfigService` — 데이터 노출 정책 런타임 반영
- [x] Firestore CRUD, 30일 푸시 스케줄, follow-up 트리거
- [x] **`ai_usage`** 일별 AI 호출 로깅 (서버 env 있을 때)

---

## ✅ 구현 완료 — Admin ERP

- [x] 별도 Vite 앱 `admin/` (port 5174)
- [x] 사이드바 + react-router 라우팅
- [x] Google/이메일 로그인 + `role === "admin"` 게이트
- [x] Firestore rules — admin read/write, `config/*` 공개 read
- [x] **대시보드** — 실DB 샘플(500건) + 합성 KPI 비교
- [x] **모니터링** — 시스템 상태
- [x] **회원** — users 목록
- [x] **꿈 DB** — dreams 목록·필터
- [x] **Follow-up** — due/완료/대기
- [x] **데이터 노출** — `config/dataExposure` 저장
- [x] **AI 사용량** — `ai_usage` 조회
- [x] **설정** — 홈 KPI / 푸시 / 시스템 (`config/*`)

---

## 🟡 배포 전 / 부분 구현

- [ ] Firebase 프로젝트 실연결 + 프로덕션 env
- [ ] `firebase deploy --only firestore,functions`
- [ ] Vercel 프로덕션 배포
- [ ] 결제 연동 (프리미엄 `isPremium` 수동)
- [ ] 홈 KPI → **전체** 실 DB 집계 (Admin은 500건 샘플)
- [ ] `kpi_daily` / `kpi_snapshots` 야간 배치
- [ ] `config/followUpPush` → Cloud Functions 연동
- [ ] `interpret-dream` rate limit / 사용자 인증
- [ ] Analytics, 이메일 리마인더
- [ ] Git push (권한 이슈 시 별도 계정)

---

## ❌ 미구현

- [ ] 주간 AI 연구 리포트 (Admin)
- [ ] Premium 결제·구독 관리 화면
- [ ] 신고·moderation
- [ ] 앱스토어 / Google Play (TWA·Capacitor)
- [ ] pgvector, 카카오/Apple 로그인

---

## 핵심 파일 맵

| 파일 | 역할 |
|------|------|
| `src/lib/branding.ts` | 슬로건, CTA, APP_NAME_EN |
| `src/lib/dreamAnchor.ts` | researchAnchor 정리·폴백 |
| `src/lib/opsConfig.ts` | config/* 타입·기본값 |
| `src/services/opsConfigService.ts` | Firestore config CRUD |
| `src/hooks/useAuth.tsx` | Auth + 익명 + 연결 |
| `src/hooks/useAccessPolicy.ts` | 티어 정책 |
| `netlify/functions/interpret-dream.ts` | AI API |
| `scripts/vite-local-api-plugin.ts` | 로컬 /api |
| `admin/src/App.tsx` | Admin 라우터 |
| `firestore.rules` | admin + config 규칙 |

마지막 업데이트: **2026-07-10**
