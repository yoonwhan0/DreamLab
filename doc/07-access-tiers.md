# 07. 접근 티어 정책

## 요약

| 티어 | DB 적재 | 유사 꿈·탐색 | 30일 푸시 | 후기 작성 | 후기 열람 | 운세 그래프 |
|------|---------|-------------|-----------|-----------|-----------|-------------|
| **비회원** | ✅ 익명 | 미리보기+블러 | ❌ | ❌ | 1건 | 1축 블러 |
| **회원** | ✅ | ✅ | ✅ | ✅ | **키워드당 4건** | 3축 |
| **프리미엄** | ✅ | ✅ | ✅ | ✅ | **전체** | **7축 8주** |

구현: `src/hooks/useAccessPolicy.ts`

---

## 비회원

- `signInAnonymously()` 자동
- 꿈 저장 → Firestore
- 탐색: 후기 1건 + 블러, ConversionGate
- 가입 시 `linkWithPopup` — uid 유지

## 회원

- 유사 꿈 · 커뮤니티 스토리
- `/follow-up/:id` 후기 (8자 이상, nothing 카테고리 없음)
- **후기 열람 한도:** `MEMBER_FREE_STORY_VIEWS = 4` / 키워드
  - API: `story-access`, `register-story-views`
  - Firestore: `users/{uid}/story_unlocks/{keywordKey}`

## 프리미엄

- `users.isPremium = true` (수동 또는 **스토어 IAP 예정**)
- `DreamFortuneTrendPanel` 7축 전체
- 후기·통계 전체 (`canViewOutcomeStats`)
- **토스페이먼츠 웹 결제 제거됨** (2026-07)

---

## 운세 그래프 티어 (`DreamFortuneTrendPanel`)

| 티어 | 노출 |
|------|------|
| guest | 종합운 1축, 나머지 블러 |
| member | 3축, 마지막 살짝 블러 |
| premium | 7축 전체 · 8주 스파크라인 |

파일: `src/lib/dreamFortuneTrends.ts`

---

## 결제 방향 (2026-07)

- ❌ 토스페이먼츠 (제거)
- ✅ App Store / Google Play IAP
- `story_payment_orders` — rules write:false (예약)

---

## Firebase · Netlify 체크리스트

1. Auth — 익명·Google 활성화
2. 승인 도메인 — Netlify URL
3. `VITE_FIREBASE_VAPID_KEY`
4. `firebase deploy --only firestore`
5. Admin — `role=admin` 또는 마스터 이메일

마지막 업데이트: **2026-07-10**
