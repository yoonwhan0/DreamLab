# 07. Admin ERP — 설계 vs 구현

> **2026-07-10 기준: MVP ERP 구현 완료** (일부 백엔드 연동·집계는 미완)

---

## 설계 원칙

1. 첫 화면 = **서비스 건강도** (30일 응답률, 실DB vs 노출 KPI)
2. 숫자·정책 변경 = Firestore **`config/*`** — **앱 재배포 불필요**
3. 톤: 사용자 앱과 동일 — **관측·연구소**
4. 사용자 앱에 Admin 링크 없음 — 북마크 / `admin.dreamlab.kr`

---

## 구현된 메뉴 (admin/)

| # | 메뉴 | 경로 | 상태 | 설명 |
|---|------|------|------|------|
| 1 | **대시보드** | `/` | ✅ | Firestore 샘플 KPI + 합성 KPI 비교 |
| 2 | **모니터링** | `/monitoring` | ✅ | 시스템·config 요약 |
| 3 | **회원** | `/members` | ✅ | users 목록 (500건) |
| 4 | **꿈 DB** | `/dreams` | ✅ | dreams 목록·검색 |
| 5 | **Follow-up** | `/follow-up` | ✅ | due/완료/대기 |
| 6 | **데이터 노출** | `/data-exposure` | ✅ | `config/dataExposure` 저장 |
| 7 | **AI 사용량** | `/ai-usage` | ✅ | `ai_usage/{date}` |
| 8 | **홈 KPI** | `/settings/lab-metrics` | ✅ | `config/labMetrics` |
| 9 | **푸시** | `/settings/push` | 🟡 | UI + Firestore 저장, **Functions 미연동** |
| 10 | **시스템** | `/settings/system` | ✅ | maintenance, rate limit 메모 |

### 미구현 (설계만)

| 메뉴 | 상태 |
|------|------|
| Premium / 결제 | ❌ |
| 신고 | ❌ |
| Analytics 퍼널 | ❌ |
| 인기 키워드 TOP (전용) | ❌ (꿈 DB에서 부분) |
| ⭐ 주간 AI 연구 리포트 | ❌ |

---

## 인증

```
Admin 로그인 (Google/이메일)
    ↓
useAdminAuth — Firestore users/{uid}.role === "admin"
    ↓
AdminGate — 미로그인 → /login, 비admin → 경고 화면
```

**설정 방법**

1. Firebase Console에서 운영자 계정으로 앱(Admin) 로그인 1회
2. Firestore `users/{uid}` 문서에 `role: "admin"` 추가
3. `firebase deploy --only firestore:rules`

---

## Firestore `config/*` (재배포 없이 변경)

| docId | Admin 페이지 | 앱 반영 |
|-------|-------------|---------|
| `labMetrics` | 홈 KPI 설정 | `useLiveLabMetrics`, ResearchLabPanel |
| `dataExposure` | 데이터 노출 | `communityDataService` |
| `followUpPush` | 푸시 설정 | 저장만 (Functions 연동 예정) |
| `system` | 시스템 | maintenance 등 (부분) |

타입: `src/lib/opsConfig.ts`  
서비스: `src/services/opsConfigService.ts`

---

## 대시보드 KPI

### 실데이터 (Firestore 샘플 — 최대 500건)

| 카드 | 출처 |
|------|------|
| 총 회원 | `users` count |
| 총 꿈 / 오늘 | `dreams` |
| 30일 응답률 | followUp 완료 / (완료+대기) |
| 오늘 AI 호출 | `ai_usage/{today}` |

### 사용자 노출 (합성 KPI)

| 카드 | 출처 |
|------|------|
| 노출 꿈 기록 | `config/labMetrics` → `computeResearchLabStats` |
| 노출 30일 결과 | 동일 |

> 전체 집계는 `kpi_daily` 야간 배치 예정 — [08-kpi-metrics.md](./08-kpi-metrics.md)

---

## AI 사용량

`interpret-dream` 호출 시:

- env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `netlify/functions/lib/recordAiUsage.ts` → `ai_usage/{YYYY-MM-DD}` increment

Admin **AI 사용량** 페이지에서 일별 조회

---

## 구현 순서 (완료 vs 남은 일)

| 단계 | 상태 |
|------|------|
| Admin auth (`role`) + rules | ✅ |
| ERP 레이아웃 + 라우터 | ✅ |
| Dashboard MVP | ✅ (샘플 집계) |
| Follow-up + 꿈 DB + 회원 | ✅ |
| `config/*` + 데이터 노출 | ✅ |
| AI 비용 로깅 | ✅ |
| `kpi_daily` nightly batch | ❌ |
| `followUpPush` → Functions | ❌ |
| push_logs | ❌ |
| 주간 연구 리포트 | ❌ |
| Admin 별도 Vercel 배포 | ❌ |

---

## Admin 로컬 실행

```bash
npm run dev:admin    # http://localhost:5174
# Windows: admin.bat
```

Firebase 미설정 시 경고 화면 표시

마지막 업데이트: **2026-07-10**
