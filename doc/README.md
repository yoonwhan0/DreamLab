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
| [05-data-model.md](./05-data-model.md) | Firestore 스키마 (`users`, `dreams`, `config`, `ai_usage`) |
| [06-deployment.md](./06-deployment.md) | Firebase + Vercel 배포, 로컬 개발 |
| [07-access-tiers.md](./07-access-tiers.md) | **비회원·회원·프리미엄** 정책·구현 |
| [07-admin-roadmap.md](./07-admin-roadmap.md) | Admin ERP — 설계 vs **구현 현황** |
| [08-kpi-metrics.md](./08-kpi-metrics.md) | 운영 KPI 정의·집계 방식 |
| [09-development-log.md](./09-development-log.md) | **처음부터 지금까지 개발 전체 상세 기록** ⭐ |

루트 배포 메모: [`../DEPLOY.md`](../DEPLOY.md) (Firebase + Vercel 체크리스트)

---

## 한 줄 요약 (2026-07-10)

| 항목 | 내용 |
|------|------|
| **앱** | React 19 PWA — Vite 빌드 → Vercel `dist/` + `/api/interpret-dream` |
| **백엔드** | Firebase Auth / Firestore / FCM / Cloud Functions |
| **Admin** | 별도 Vite 앱 `admin/` — ERP형 운영 대시보드 (Firestore `config/*` 실시간 반영) |
| **AI** | OpenAI gpt-4o-mini + embedding — `researchAnchor` 1차 키워드 |
| **로컬** | `npm run dev` → **http://localhost:3000** (Vercel 로그인 불필요) |
| **Admin 로컬** | `admin.bat` / `npm run dev:admin` → **http://localhost:5174** |
| **브랜드** | 한글 **꿈연구소** · 영문 **DreamLab** (전체 대문자 아님) |

---

## 빠른 시작

```bash
npm install
cp .env.example .env          # 또는 Branch/.env → sync-branch-env
npm run dev                   # http://localhost:3000
npm run dev:admin             # http://localhost:5174
```

Windows: `실행.bat` (사용자 앱) · `admin.bat` (Admin)

---

## 다음 권장 순서

1. Firebase 프로젝트 연결 + `VITE_DEMO_MODE=false` ([06](./06-deployment.md))
2. Firestore rules 배포 + Admin `users/{uid}.role = "admin"` 설정
3. Vercel 프로덕션 배포 (`VITE_*` + `OPENAI_API_KEY`)
4. `firebase deploy --only functions` (30일 푸시)
5. 결제 연동 (`isPremium` 자동화)
6. `kpi_daily` 야간 집계 Function
7. 앱스토어 / Play (TWA·Capacitor) — 별도 검토

마지막 업데이트: **2026-07-10**
