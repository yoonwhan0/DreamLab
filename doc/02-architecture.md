# 02. 아키텍처

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19 + TypeScript + Vite 6 |
| 스타일 | Tailwind CSS v4 |
| 라우팅 | react-router-dom v7 |
| PWA | vite-plugin-pwa + FCM SW |
| Auth / DB | Firebase Auth, Firestore |
| Push | FCM + Cloud Functions |
| AI | `netlify/functions/interpret-dream.ts` |
| AI 모델 | OpenAI gpt-4o-mini + embedding (Gemini fallback) |
| **배포 (프론트)** | **Netlify** (`netlify.toml`, `dist/`) |
| **배포 (API)** | Netlify Functions 5종 |
| **배포 (백엔드)** | Firebase (rules, indexes, Functions) |
| Admin | `admin/` + 메인 PWA `/superadmin/*` |
| 엑셀 | `xlsx` — Admin 꿈 DB |

## 런타임 다이어그램

```
[브라우저 PWA — Netlify]
    │
    ├─► Firebase Auth / Firestore
    │       ├─ dreams (유저 + dreamlab-seed-data 시드)
    │       ├─ config/* (홈 KPI, dataExposure)
    │       └─ users/{uid}/story_unlocks
    │
    └─► Netlify Functions
            ├─ POST /api/interpret-dream        → AI 해몽
            ├─ POST /api/story-access           → 후기 열람 상태
            ├─ POST /api/register-story-views   → 열람 등록
            ├─ POST /api/admin-import-dreams    → Admin 시드 업로드
            └─ POST /api/admin-delete-dreams      → Admin 시드 삭제

[Firebase Cloud Functions]
    sendFollowUpReminders · onFollowUpSubmitted

[Admin /superadmin]
    DreamSpreadsheet → admin-import/delete API (우선) → Firestore 폴백
```

## Netlify Functions

| Function | 인증 | Admin SDK |
|----------|------|-------------|
| interpret-dream | Bearer (선택) | ai_usage 집계 |
| story-access | Bearer uid | ✅ |
| register-story-views | Bearer uid | ✅ |
| admin-import-dreams | Bearer admin | ✅ |
| admin-delete-dreams | Bearer admin | ✅ |

공통 lib: `firebaseAdmin.ts`, `firebasePrivateKey.ts` (PEM `\n` 정규화)

## 주요 클라이언트 서비스

| 모듈 | 역할 |
|------|------|
| `dreamService.ts` | CRUD, 유사 꿈, `fetchPopularDreamKeywords` |
| `interpretService.ts` | AI 호출 + mock fallback |
| `communityDataService.ts` | 실DB + AI + 합성 병합 |
| `syntheticCommunityService.ts` | 합성 커뮤니티·미리보기 |
| `storyUnlockService.ts` | 키워드별 후기 열람 API |
| `opsConfigService.ts` | `config/*` |
| `adminDreamDb.ts` | Admin 시드 import/delete |

## 커뮤니티 데이터 흐름

```
사용자 꿈 → interpretDream → communityEstimate (메모리만)
         → saveDream → dreams (userId=uid)

Admin 엑셀 → admin-import-dreams → dreams (userId=dreamlab-seed-data)

탐색/상세 → resolveCommunityData
    → findSimilarDreams (isPublic, keywords)
    → ≥5건: 실데이터 / 미만: 합성+AI

※ AI 스토리 → DB 재저장 없음 (학습 루프 없음)
```

## AI 파이프라인 (`researchAnchor`)

키워드·클러스터 = **AI 1차**, 코드 = 정리·폴백 (`dreamAnchor.ts`)

## 로컬 개발

| 명령 | 포트 | 설명 |
|------|------|------|
| `npm run dev` | 5173 | Vite만 |
| `npm run dev:netlify` | 8888 | Functions 포함 (**권장**) |
| `npm run dev:admin` | 5174 | Admin standalone |

로컬 API: `scripts/vite-dev-api-plugin.ts` — `/api/*` → Netlify handler

## Admin

| 진입 | 경로 |
|------|------|
| PWA 임베드 | `/superadmin`, `/superadmin/members`, `/superadmin/dreams` |
| Standalone | `admin.bat` → :5174 |

인증: `useAdminAuth` + `isMasterAdmin` / `role=admin`

마지막 업데이트: **2026-07-10**
