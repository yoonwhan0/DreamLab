# 07. 접근 티어 정책

## 요약

| 티어 | DB 적재 | 유사 꿈 | 30일 푸시 | 후기 작성 | 마이페이지 |
|------|---------|---------|-----------|-----------|------------|
| **비회원** (익명 Auth) | 꿈 내용 ✅ | ❌ | ❌ | ❌ | 저장된 꿈 목록만 |
| **회원** | ✅ | ✅ | ✅ | ✅ | 내 꿈 전체 |
| **프리미엄** | ✅ | ✅ | ✅ | ✅ | 통계·후기 전체 열람 |

## 기술 구현

### 비회원
- 앱 로드 시 Firebase **익명 로그인** (`signInAnonymously`) 자동 실행
- `saveDream` → Firestore `dreams` 컬렉션에 `userId` = 익명 uid
- Google/이메일 가입 시 **계정 연결** (`linkWithPopup` / `linkWithCredential`) — uid 유지, 꿈 데이터 이전 불필요

### 회원
- 익명이 아닌 Firebase Auth (Google / 이메일)
- 유사 꿈 패널, 커뮤니티 스토리 (일부 블러)
- 꿈 저장 직후 **푸시 알림 등록** UI (`PushNotificationPrompt`)
- 30일 후 Cloud Functions `sendFollowUpReminders` → FCM 푸시
- `/follow-up/:id` 에서 후기 적재

### 프리미엄
- Firestore `users/{uid}.isPremium = true` (결제 연동 전 수동 설정)
- 한 달 뒤 통계·후기 전체 열람 (`canViewOutcomeStats`)

## 데모 모드

`VITE_DEMO_MODE=true` 이면 Firebase 없이 UI만 동작합니다.
- 비회원 꿈은 `sessionStorage.pendingDream` → `/dream/preview` 미리보기
- Admin 티어 스위치로 guest/member/premium 시뮬레이션

## Firebase Console 체크리스트

1. **Authentication** → 익명 로그인 활성화
2. **Authentication** → Google 로그인 활성화
3. **Authentication** → 승인 도메인에 **Vercel/Netlify URL** 추가
4. **Cloud Messaging** → Web Push VAPID 키 생성 → `VITE_FIREBASE_VAPID_KEY`
5. **Firestore** → `firebase deploy --only firestore`
6. **Functions** (Blaze) → `firebase deploy --only functions`
7. **Admin** → `users/{uid}.role = "admin"` 수동 설정

## Vercel / Netlify 환경변수

빌드 시 `VITE_*` 가 번들에 포함됩니다. Site settings → Environment variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
VITE_DEMO_MODE=false
OPENAI_API_KEY
GEMINI_API_KEY
```

빌드 시 `scripts/inject-firebase-sw.mjs` 가 `public/firebase-messaging-sw.js` 를 생성합니다.

## 프리미엄 수동 부여 (테스트)

Firebase Console → Firestore → `users/{uid}` → `isPremium: true`

또는 Admin Firestore에서 (추후 UI 추가 예정) `isPremium: true` 설정.

마지막 업데이트: **2026-07-10**
