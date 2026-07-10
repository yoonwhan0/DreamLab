# 07. Admin — 설계 vs 구현

> **2026-07-10: 슬림 Admin (3메뉴) + 꿈 DB 엑셀 MVP**

---

## 현재 구현 (라우터 연결됨)

| # | 메뉴 | 경로 | 기능 |
|---|------|------|------|
| 1 | **대시보드** | `/superadmin` | KPI 샘플 |
| 2 | **회원** | `/superadmin/members` | users 목록 |
| 3 | **꿈 DB** | `/superadmin/dreams` | **DreamSpreadsheet** |

### 진입 방식

- **PWA 임베드:** `src/App.tsx` → `/superadmin/*` → `AdminApp`
- **Standalone:** `npm run dev:admin` (:5174)
- `admin/src/lib/adminRoutes.ts` — embedded vs standalone 경로

---

## 꿈 DB (`DreamSpreadsheet`)

### UI 기능

| 버튼 | 동작 |
|------|------|
| DB 양식 | `dreamlab-DB-양식.xlsx` 다운로드 (예시 2행) |
| DB 다운로드 | Firestore 500건 → xlsx |
| DB 업로드 | xlsx → 미리보기 → **추가 저장** (덮어쓰기 없음) |
| 선택 삭제 | 체크 → Firestore 삭제 |

### 엑셀 32열 (A~AF)

`문서ID` … `프로필` — 상세: [05-data-model.md](./05-data-model.md)

### 저장 규칙

- `userId`: `dreamlab-seed-data`
- `isPublic`: true 고정
- `keywords`: interpretation.keywords 복사
- `afterStory` 있으면 followUp 즉시 생성
- 미저장: likes, importedBy, importedAt, seedSource, 공개 열

### API 우선 · 클라이언트 폴백

```
adminDreamDb.ts
  → POST /api/admin-import-dreams  (503/404 시 폴백)
  → POST /api/admin-delete-dreams
  → Firestore writeBatch (BATCH_SIZE=8)
```

인증: Firebase ID 토큰 + `verifyBearerAdmin`

---

## 인증

```
Google/이메일 로그인
  → isMasterAdmin (yoonwhan0@gmail.com)
  → 또는 users/{uid}.role === "admin"
```

`src/lib/masterAccounts.ts` ↔ `firestore.rules` 동기화 필수

---

## 레거시 ERP 페이지 (파일만 존재)

아래 페이지는 **코드에 남아 있으나 AdminApp 라우터 미연결** (2026-07 슬림화):

- Monitoring, DataExposure, FollowUp, AiUsage
- LabMetrics, PushSettings, SystemSettings

`config/*` 타입·서비스는 사용자 앱에서 여전히 사용 (`opsConfigService`)

---

## 미구현

| 항목 | 상태 |
|------|------|
| Premium / IAP Admin | ❌ |
| 신고 | ❌ |
| 주간 AI 리포트 | ❌ |
| 설정 페이지 라우터 재연결 | 🟡 선택 |

마지막 업데이트: **2026-07-10**
