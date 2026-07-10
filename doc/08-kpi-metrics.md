# 08. KPI 지표 — 처음부터 계산할 것

> Admin Dashboard 첫 화면에 배치할 지표.  
> **가장 중요**: `30일 후 응답률`, `D30 재방문률`

## 핵심 KPI (대시보드 최상단)

| KPI | 정의 | 계산 |
|-----|------|------|
| **30일 후 응답률** | followUpDueAt 지난 꿈 중 답변 비율 | `answered / due` |
| **D30 재방문률** | 가입 후 30일 내 재접속 | `users with session D30 / cohort` |
| D1 / D7 재방문 | | 동일 코호트 |
| 답변률 (전체) | 전체 꿈 대비 followUp | `withFollowUp / totalDreams` |

## 성장·활성

| KPI | 정의 |
|-----|------|
| 총 꿈 등록 수 | `dreams` count |
| DAU / WAU / MAU | `lastSeenAt` 또는 analytics |
| 오늘 꿈 기록 | `createdAt` today |
| 오늘 가입 | `users.createdAt` today |

## 전환 (퍼널)

| 단계 | 이벤트 |
|------|--------|
| 웹 방문 | `page_view` |
| 회원가입 | `auth_sign_up` |
| 꿈 작성 | `dream_created` |
| 30일 완료 | `follow_up_submitted` |
| Premium | `subscription_started` |

| KPI | 정의 |
|-----|------|
| 회원가입 전환율 | 가입 / 방문 |
| 꿈 작성 전환율 | 첫 꿈 / 가입 |
| 구독 전환율 | Premium / MAU |
| 구독 유지율 (Churn) | 해지 / 활성 구독 |

## Push

| KPI | 정의 |
|-----|------|
| 푸시 발송 성공률 | success / sent |
| 푸시 클릭률 | opened / delivered |

→ Functions 발송 시 `push_logs` 기록 필수

## AI·비용

| KPI | 정의 |
|-----|------|
| AI 호출 수 | interpret 요청 count |
| 토큰 사용량 | prompt + completion |
| 비용 | 모델별 단가 × 토큰 |
| 사용자당 평균 | cost / active users |

## 콘텐츠·커뮤니티

| KPI | 정의 |
|-----|------|
| 인기 꿈 키워드 TOP 20 | keywords aggregation |
| 사용자당 평균 꿈 기록 수 | dreams / users |
| 공개 후기 작성률 | public followUp / total followUp |
| 평균 체류 시간 | analytics (선택) |

---

## 집계 방식 (권장)

### Nightly batch (Cloud Functions) — **미구현**

```
매일 KST 01:00 (예정)
  → Firestore 집계 쿼리
  → kpi_daily/{YYYY-MM-DD} 문서 upsert
  → Admin Dashboard는 kpi_daily + 오늘 실시간 partial
```

**현재:** Admin `fetchKpiSnapshot()` — users/dreams **limit 500** 샘플 실시간 집계

마지막 업데이트: **2026-07-10**

### `kpi_daily` 문서 예시

```json
{
  "date": "2026-07-09",
  "totalDreams": 12491,
  "totalUsers": 3201,
  "todayDreams": 421,
  "todaySignups": 38,
  "followUpDue": 98,
  "followUpAnswered": 84,
  "followUpRate30d": 0.44,
  "dau": 512,
  "mau": 4100,
  "premiumCount": 89,
  "pushSent": 842,
  "pushSuccess": 812,
  "pushClicked": 203,
  "aiTokens": 125000,
  "aiCostUsd": 12.4,
  "topKeywords": [{ "keyword": "뱀", "count": 1241, "delta": 0.32 }]
}
```

---

## 현재 앱과의 갭

| 지표 | 사용자 앱 | 실제 |
|------|-----------|------|
| 홈 연구 수치 | `researchLab.ts` 시드 | ❌ 실 DB 아님 |
| 통계 미리보기 | 합성 + 일부 Firestore | ⚠️ 혼합 |
| 30일 응답률 | `SurvivalRate` 컴포넌트 | ✅ 로직 있음, Admin 집계 없음 |

Admin 구축 시 **interpret-dream**에 토큰 로깅, **sendFollowUpReminders**에 push_logs 추가가 선행 과제입니다.
