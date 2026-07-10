# 02. 아키텍처

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19 + TypeScript + Vite 6 |
| 스타일 | Tailwind CSS v4 (`src/index.css` + `@theme`) |
| 라우팅 | react-router-dom v7 |
| 아이콘 | lucide-react |
| PWA | vite-plugin-pwa + FCM service worker |
| Auth / DB | Firebase Auth, Firestore |
| Push | FCM + Firebase Cloud Functions |
| AI (서버) | `netlify/functions/interpret-dream.ts` (Netlify/Vercel 공용) |
| AI 모델 | OpenAI gpt-4o-mini + text-embedding-3-small (Gemini fallback) |
| 배포 (프론트) | **Vercel** (`dist/`) — Netlify도 `netlify.toml` 유지 |
| 배포 (API) | Vercel `api/interpret-dream.ts` → Netlify 핸들러 재사용 |
| 배포 (백엔드) | Firebase (`functions/`, Firestore rules) |
| Admin | 별도 Vite 앱 `admin/` (port 5174) |

## 런타임 다이어그램

```
[브라우저 PWA — localhost:3000 / Vercel]
    │
    ├─► Firebase Auth / Firestore (직접)
    │       └─ config/* 읽기 (공개 read) — 홈 KPI·데이터 노출 정책
    ├─► FCM (푸시 토큰 → users.fcmTokens)
    └─► POST /api/interpret-dream
              │
              ├─ OpenAI Chat + Embedding
              ├─ researchAnchor JSON (AI 1차 키워드)
              ├─ communityEstimate (AI 추정, isEstimated: true)
              └─ ai_usage/{YYYY-MM-DD} 집계 (Admin SDK, env 있을 때)

[Firebase Cloud Functions]
    sendFollowUpReminders (매일 KST 00:00)
        └─ followUpDueAt 지난 dreams → FCM multicast (익명 스킵)
    onFollowUpSubmitted
        └─ users.hasFollowUpDiscount 등 업데이트

[Admin ERP — localhost:5174]
    Firebase Auth (Google/이메일) + users.role == "admin"
    Firestore read/write — users, dreams, config/*, ai_usage
```

## 로컬 개발 (Vercel 로그인 불필요)

```
npm run dev
  → Vite port 3000
  → scripts/vite-local-api-plugin.ts
       POST /api/interpret-dream → netlify/functions/interpret-dream.handler
  → .env / .env.local 서버 키 (OPENAI_API_KEY 등) process.env 주입
```

선택: `npm run dev:vercel` — Vercel dev와 동일 환경 (최초 `vercel login` 필요)

## 주요 API / 서비스

| 경로 | 역할 |
|------|------|
| `src/services/dreamService.ts` | 꿈 CRUD, 통계, 유사 꿈 |
| `src/services/interpretService.ts` | AI 해석 호출 + mock fallback |
| `src/services/communityDataService.ts` | 실데이터 vs 합성 병합 (`config/dataExposure`) |
| `src/services/syntheticCommunityService.ts` | 데모·초기 합성 커뮤니티 |
| `src/services/opsConfigService.ts` | Firestore `config/*` CRUD |
| `src/lib/dreamAnchor.ts` | AI 앵커 정리·폴백 (`researchAnchor` 1차) |
| `netlify/functions/interpret-dream.ts` | AI 프롬프트 + JSON 파싱 + ai_usage |
| `netlify/functions/lib/interpretPremium.ts` | 프리미엄 프롬프트·researchAnchor 스키마 |
| `netlify/functions/lib/recordAiUsage.ts` | `ai_usage` 일별 집계 |
| `api/interpret-dream.ts` | Vercel Serverless 래퍼 |
| `functions/src/index.ts` | 30일 푸시, follow-up 후처리 |

## AI 해석 파이프라인 (`researchAnchor`)

**설계 원칙 (2026-07):** 키워드·DB 클러스터는 **AI 1차**, 코드는 정리·폴백만.

```
꿈 본문 + 감정
    ↓
interpretPremium 프롬프트 → JSON
    ├─ usualTake, alternativeLens, symbol, psychology, reflection
    ├─ keywords[] (보조)
    ├─ labObservations (장면 인용, 행동, 연관 검색)
    └─ researchAnchor { primary, secondary[], scenePhrases[], clusterLabel }
    ↓
normalizeResearchAnchor() — 조사 정리, 메타(생년월일) 제외
    ↓
resolveResearchAnchor() — AI primary > keywords > 휴리스틱
    ↓
DreamDetailPage / 통계 / 유사 꿈 — clusterLabel 또는 primary 표시
```

## 데모 모드

| 환경변수 | 효과 |
|----------|------|
| `VITE_DEMO_MODE=true` | Firebase 없이 UI, 비회원 → `sessionStorage` 미리보기 |
| `VITE_DEMO_MODE=false` | 프로덕션 — 익명 Auth + Firestore 저장 |
| `VITE_DEV_SHORT_FOLLOWUP=true` | 30일 → 1분 (테스트) |

데모 티어 스위처: `DemoTierSwitcher` (개발용)

## 앱 진입 흐름

```
[SplashScreen] ~1.8s LOADING (DreamLab / 꿈연구소)
    ↓
[AuthProvider] 익명 자동 로그인 (Firebase 설정 시)
    ↓
[Layout + Routes] — 4탭: 홈 · 기록 · 탐색 · 마이
```

## Admin ERP

| 메뉴 | 경로 | 상태 |
|------|------|------|
| 대시보드 | `/` | ✅ 실DB 샘플 KPI + 합성 KPI 비교 |
| 모니터링 | `/monitoring` | ✅ |
| 회원 | `/members` | ✅ |
| 꿈 DB | `/dreams` | ✅ |
| Follow-up | `/follow-up` | ✅ |
| 데이터 노출 | `/data-exposure` | ✅ Firestore 저장 |
| AI 사용량 | `/ai-usage` | ✅ `ai_usage` |
| 홈 KPI | `/settings/lab-metrics` | ✅ |
| 푸시 | `/settings/push` | ✅ UI (Functions 연동 예정) |
| 시스템 | `/settings/system` | ✅ |

인증: `admin/src/hooks/useAdminAuth.ts` — `users/{uid}.role === "admin"`

상세: [07-admin-roadmap.md](./07-admin-roadmap.md)

마지막 업데이트: **2026-07-10**
