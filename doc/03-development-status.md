# 03. 개발 현황

> **전체 이력:** [09-development-log.md](./09-development-log.md)  
> **기능 레퍼런스:** [10-features-reference.md](./10-features-reference.md)  
> 빌드: `npm run build` ✅ (2026-07-10)

---

## ✅ 구현 완료 — 사용자 앱

### 인프라

- [x] Vite 6 + React 19 + TS + Tailwind v4 + PWA
- [x] Firebase (rules, indexes, Functions 스켈레톤)
- [x] **Netlify** 배포 (`netlify.toml`, Functions 5종)
- [x] 로컬 `dev:netlify` + `vite-dev-api-plugin`

### 인증 · 티어

- [x] 익명 Auth → 꿈 DB 저장
- [x] Google/이메일 + `linkWithPopup`
- [x] `useAccessPolicy` — guest / member / premium
- [x] FCM 푸시 (회원)
- [x] **후기 열람 한도** — 키워드당 4건 (`story-access` API)

### 페이지 (2026-07 최신)

| 경로 | 상태 | 비고 |
|------|------|------|
| `/` 홈 | ✅ | 히어로·연구미션·관측밀도·키워드12·후기1건 |
| `/write` | ✅ | AI 해몽 |
| `/dream/:id` | ✅ | 운세 그래프·유사 꿈 |
| `/follow-up/:id` | ✅ | 후기 8자+, nothing 제거 |
| `/explore` | ✅ | 칩20·미리보기6·DB키워드 |
| `/my` | ✅ | 아카이브·달력·운세·연구미션 |
| `/my-dreams` | ✅ | 전체 아카이브 |
| `/#research` | ✅ | 연구 미션 딥링크 |

### UX · 브랜드 (2026-07)

- [x] 홈 단순화 — FOMO 숫자·과한 블러 완화
- [x] `LabResearchMission` — 히어로 아래 아코디언
- [x] `AiWritingPulse` — 「데이터 검색·결과 정리」 톤
- [x] **DreamFortuneTrendPanel** — 프리미엄 7축 8주 운세
- [x] **ReinterpretRecentPanel 제거**
- [x] 아카이브 슬림 카드 · 월별 잔디 달력
- [x] DB 키워드 랜덤 칩 (`useFeaturedKeywords`)

### 데이터 · AI

- [x] `researchAnchor` AI 1차
- [x] `communityStoryQuality` — 원문 겹침 필터
- [x] `similarDreamVariation` — 같은 결·다른 장면
- [x] 시드 DB 탐색 반영 (`MIN_REAL_COMMUNITY_COUNT=5`)
- [x] `normalizeOutcomeCategory` — nothing → other

### 결제

- [x] **토스페이먼츠 제거**
- [ ] App Store / Play IAP (예정)

---

## ✅ 구현 완료 — Admin

- [x] `/superadmin` PWA 임베드 (대시보드·회원·꿈 DB)
- [x] **DreamSpreadsheet** — 엑셀 32열 CRUD
- [x] 시드 `dreamlab-seed-data` 업로드·삭제
- [x] **admin-import-dreams** / **admin-delete-dreams** API
- [x] 클라이언트 폴백 + 배치 8건 (rules get 제한)
- [x] 마스터 계정 + `isAdminSeedCreate` rules

### Admin 레거시 (파일만 존재, 라우터 미연결)

- DataExposure, Monitoring, AiUsage, LabMetrics, Push, System 페이지

---

## 🟡 배포 전 / 부분

- [ ] Netlify `FIREBASE_*` Admin 키 프로덕션 확인
- [ ] Firestore rules 프로덕션 최신 배포
- [ ] Cloud Functions 30일 푸시 운영
- [ ] `isPremium` 스토어 IAP 자동화
- [ ] `kpi_daily` 야간 배치
- [ ] `followUpPush` → Functions 연동
- [ ] interpret rate limit

---

## ❌ 미구현

- [ ] 앱스토어 / Play 출시 (TWA·Capacitor)
- [ ] Premium 결제 UI (웹)
- [ ] 신고·moderation
- [ ] pgvector 검색
- [ ] AI 출력 → DB 자동 재적재 (의도적 미구현)

---

## 핵심 파일 맵

| 파일 | 역할 |
|------|------|
| `src/lib/branding.ts` | 슬로건, RESEARCH_MISSION_* |
| `src/components/LabResearchMission.tsx` | 연구 미션 아코디언 |
| `src/hooks/useFeaturedKeywords.ts` | DB 키워드 랜덤 |
| `src/lib/dreamFortuneTrends.ts` | 운세 7축 |
| `admin/src/lib/dreamSpreadsheetSchema.ts` | 32열 스키마 |
| `src/lib/dreamSeedImport.ts` | 시드 페이로드 |
| `netlify/functions/admin-*.ts` | Admin API |
| `firestore.rules` | master + seed create |

마지막 업데이트: **2026-07-10**
