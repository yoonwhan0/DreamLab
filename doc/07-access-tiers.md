# 07. 접근 티어 정책

## 요약

| 티어 | DB 적재 | 유사 꿈·탐색 | 30일 푸시 | 후기 작성 | 후기 열람 | 운세 그래프 |
|------|---------|-------------|-----------|-----------|-----------|-------------|
| **비회원** | ❌ (로컬 미리보기만) | 미리보기+블러 | ❌ | ❌ | 1건 | 절반+블러 |
| **회원** | ✅ Firestore | ✅ | ✅ | ✅ | **키워드당 2건** | 3축 |
| **프리미엄** | ✅ | ✅ | ✅ | ✅ | **전체** | **7축 8주** |

구현: `src/hooks/useAccessPolicy.ts`

---

## 비회원 (guest)

- **Firebase Auth 세션 없음** — 익명 로그인 제거 (2026-07-10)
- 꿈 해몽은 가능 → **Firestore 저장 안 함**
- `sessionStorage` (`dreamlab:pendingDream`)에 임시 보관 → `/dream/preview`
- Google 가입·로그인 후 `PendingDreamLinker` / `flushPendingDream`으로 아카이브 연동
- 탐색: 후기 미리보기 + 블러, `ConversionGate`
- 운세: `DreamFortuneTrendPanel` 절반 노출 + 블러

## 회원 (member)

- **Google 로그인 전용** (`signInWithPopup` / `signInWithRedirect`)
- `isLinkedAuthUser()` — Firebase `user.email` 존재 시 회원 판별
- 유사 꿈 · 커뮤니티 스토리 · 아카이브 저장
- `/follow-up/:id` 후기 (8자 이상, nothing 카테고리 없음)
- **후기 열람 한도:** `MEMBER_FREE_STORY_VIEWS = 2` / 키워드
  - API: `story-access`, `register-story-views`
  - Firestore: `users/{uid}/story_unlocks/{keywordKey}`

## 프리미엄 (premium)

- `users.isPremium = true` (수동 또는 **스토어 IAP 예정**)
- `DreamFortuneTrendPanel` 7축 전체
- 후기·통계 전체 (`canViewOutcomeStats`)
- **토스페이먼츠 웹 결제 제거됨** (2026-07)

---

## 운세 그래프 티어 (`DreamFortuneTrendPanel`)

| 티어 | 노출 |
|------|------|
| guest | 종합운 등 일부만, 나머지 블러 |
| member | 3축, 마지막 살짝 블러 |
| premium | 7축 전체 · 8주 스파크라인 |

파일: `src/lib/dreamFortuneTrends.ts`

---

## 인증 흐름 (2026-07-10)

```
[비회원] 앱 진입 — Auth 세션 없음
    ↓ 꿈 기록
[해몽] AI 해석 (API)
    ↓
[미리보기] sessionStorage pendingDream → /dream/preview
    ↓ Google 로그인 (버튼 클릭 시만 — 자동 가입 시트 없음)
[회원] signInWithPopup (데스크톱) / signInWithRedirect (모바일·PWA·인앱)
    ↓
[연동] PendingDreamLinker → Firestore saveDream
```

**핵심 파일**

| 파일 | 역할 |
|------|------|
| `src/hooks/useAuth.tsx` | Google 직접 로그인, redirect 처리, `authError` |
| `src/lib/authPlatform.ts` | popup/redirect 분기, COOP 대응 |
| `src/lib/authUser.ts` | `isLinkedAuthUser()` |
| `src/lib/pendingDreamStorage.ts` | 비회원 임시 꿈 |
| `src/services/pendingDreamService.ts` | 가입 후 아카이브 flush |
| `src/components/PendingDreamLinker.tsx` | 전역 pending 연동 |
| `src/components/MemberRoute.tsx` | 회원 전용 — **자동 가입 시트 없음** |
| `src/components/AuthSheetBody.tsx` | Google 로그인 바텀시트 |
| `src/components/Layout.tsx` | redirect 실패 시 `authError` 배너 |

**제거된 것 (도돌이표 원인)**

- `signInAnonymously()` 자동 로그인
- `linkWithPopup` / `linkWithRedirect` (익명→Google 연동)
- `MemberRoute` 마운트 시 가입 시트 자동 오픈
- Firebase Console **익명 로그인** (비활성화 권장)

---

## 결제 방향 (2026-07)

- ❌ 토스페이먼츠 (제거)
- ✅ App Store / Google Play IAP
- `story_payment_orders` — rules write:false (예약)

---

## Firebase · Netlify 체크리스트

1. Auth — **Google만** 활성화 (익명 ❌)
2. **승인 도메인** — Netlify URL (`*.netlify.app`) + 커스텀 도메인 + `localhost`
3. `VITE_FIREBASE_VAPID_KEY`
4. `firebase deploy --only firestore` (rules · indexes)
5. Netlify `Cross-Origin-Opener-Policy: same-origin-allow-popups` (`netlify.toml`)
6. Admin — `role=admin` 또는 마스터 이메일

**RTDB 불필요** — Firestore만 사용

마지막 업데이트: **2026-07-10**
