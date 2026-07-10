# 꿈연구소 (DreamLab) — 프로젝트 문서

> **`doc/` 폴더가 단일 소스 오브 트루스**입니다.  
> 코드·배포·운영 변경 시 이 문서를 함께 갱신합니다.

---

## 문서 목록

| 문서 | 내용 |
|------|------|
| [01-overview.md](./01-overview.md) | 서비스 정체성, 브랜드, 로고, 티어 요약 |
| [02-architecture.md](./02-architecture.md) | 기술 스택, 런타임, API, Admin 구조 |
| [03-development-status.md](./03-development-status.md) | **구현 완료 / 부분 / 미완** 체크리스트 |
| [04-folder-structure.md](./04-folder-structure.md) | 폴더·파일 맵 (앱 + Admin + API) |
| [05-data-model.md](./05-data-model.md) | Firestore 스키마, 시드 DB, story_unlocks |
| [06-deployment.md](./06-deployment.md) | Firebase + **Netlify** 배포, 로컬 개발 |
| [07-access-tiers.md](./07-access-tiers.md) | **비회원·회원·프리미엄** 정책·구현 |
| [07-admin-roadmap.md](./07-admin-roadmap.md) | Admin — 설계 vs **구현 현황** |
| [08-kpi-metrics.md](./08-kpi-metrics.md) | 운영 KPI 정의·집계 방식 |
| [09-development-log.md](./09-development-log.md) | **처음부터 지금까지 개발 전체 상세 기록** |
| [10-features-reference.md](./10-features-reference.md) | **기능 레퍼런스 전체** (페이지·API·데이터 흐름) ⭐ |

루트 배포 메모: [`../DEPLOY.md`](../DEPLOY.md)

---

## 한 줄 요약 (2026-07-10)

| 항목 | 내용 |
|------|------|
| **앱** | React 19 PWA — Vite 빌드 → **Netlify** `dist/` |
| **백엔드** | Firebase Auth / Firestore / FCM / Cloud Functions |
| **API** | Netlify Functions 5종 (AI·후기열람·Admin 시드) |
| **Admin** | `/superadmin` 임베드 — 대시보드 · 회원 · **꿈 DB 엑셀** |
| **AI** | OpenAI gpt-4o-mini — `researchAnchor` 1차 키워드 |
| **시드 DB** | Admin 엑셀 32열 → `dreamlab-seed-data` (~100건+) |
| **프리미엄** | 30일 **운세 7축 그래프** (토스 제거 → 스토어 IAP 예정) |
| **브랜드** | 한글 **꿈연구소** · 영문 **DreamLab** |

---

## 빠른 시작

```bash
npm install
cp .env.example .env
npm run dev                   # Vite :5173
npm run dev:netlify           # Functions 포함 :8888
npm run dev:admin             # Admin :5174
```

Windows: `실행.bat` · `admin.bat`

---

## 다음 권장 순서

1. Firestore rules 배포 — `npm run deploy:rules`
2. Netlify env — `VITE_*` + `OPENAI_API_KEY` + `FIREBASE_*` (Admin API)
3. Admin 시드 DB 업로드 — `/superadmin/dreams`
4. Cloud Functions 배포 — 30일 푸시
5. App Store / Play IAP 연동
6. `kpi_daily` 야간 집계

마지막 업데이트: **2026-07-10**
