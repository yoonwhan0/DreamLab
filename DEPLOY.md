# DreamLab 배포 메모 (Firebase + Vercel)

로컬 개발 우선 · Git push·계정 분리는 나중에 해도 됨.

---

## DB 종류 (중요)

| 서비스 | 사용 여부 |
|--------|-----------|
| **Cloud Firestore** | ✅ 사용 (`users`, `dreams`) |
| **Realtime Database (RTDB)** | ❌ 미사용 — 규칙·설정 불필요 |
| **Cloud Storage** | ❌ 미사용 — 사진·파일 업로드 없음 |

> `VITE_FIREBASE_STORAGE_BUCKET`은 Firebase 웹 앱 설정에 포함된 **기본 필드**일 뿐이고, 코드에서 `getStorage()`를 호출하지 않습니다. Storage 콘솔·규칙·요금 걱정 없이 두어도 되고, 나중에 프로필 사진 등 넣을 때만 켜면 됩니다.

---

## 1. Firestore 보안 규칙

파일: `firestore.rules` (배포 시 이 내용이 그대로 올라감)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    match /dreams/{dreamId} {
      allow read: if resource.data.isPublic == true
        || (request.auth != null && resource.data.userId == request.auth.uid);
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

**배포**

```bash
firebase login
firebase use --add          # 프로젝트 선택
firebase deploy --only firestore
```

인덱스는 `firestore.indexes.json` — 위 명령에 rules와 함께 배포됨.

---

## 2. Vercel 환경변수

**Vercel Dashboard → Project → Settings → Environment Variables**

### 클라이언트 (빌드에 포함 — `VITE_` 필수)

| 변수 | 설명 |
|------|------|
| `VITE_FIREBASE_API_KEY` | Firebase 웹 API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `프로젝트ID.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | 콘솔 기본값 그대로 (Storage 미사용이어도 설정값 복사) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM용 |
| `VITE_FIREBASE_APP_ID` | 웹 앱 ID |
| `VITE_FIREBASE_VAPID_KEY` | Cloud Messaging → 웹 푸시 키 쌍 |
| `VITE_DEMO_MODE` | 프로덕션: **`false`** |

### 서버 전용 (AI — `VITE_` 붙이면 안 됨)

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | 꿈 해몽 + embedding (권장) |
| `GEMINI_API_KEY` | OpenAI 없을 때 fallback (선택) |

`/api/interpret-dream` Serverless에서만 읽음. 브라우저에 노출되지 않음.

### 로컬만 (Vercel에 넣지 않아도 됨)

| 변수 | 용도 |
|------|------|
| `VITE_DEV_SHORT_FOLLOWUP` | `true`면 30일 → 1분 (로컬 테스트) |

---

## 3. Firebase 콘솔에서 같이 할 일

1. **Authentication** — 익명, Google, 이메일 활성화  
2. **승인 도메인** — `localhost`, `*.vercel.app`, 커스텀 도메인  
3. **Cloud Messaging** — VAPID 키 → `VITE_FIREBASE_VAPID_KEY`  
4. **Firestore** — 위 규칙 배포 후 Native 모드 DB 생성(아직 없으면)

### 30일 푸시 (Firebase Cloud Functions — Vercel과 별도)

```bash
firebase deploy --only functions
```

`functions/` = 스케줄 푸시. Vercel `api/` = AI 해몽. 역할이 다름.

---

## 4. Vercel 배포

```bash
npm run build
vercel          # 또는 GitHub 연동 자동 배포
```

- 정적: `dist/`  
- API: `api/interpret-dream.ts`  
- 설정: `vercel.json`

로컬: `npm run dev` → `http://localhost:3000` (**Vite + 로컬 API**, Vercel 로그인 불필요)

Vercel과 동일 환경 테스트: `npm run dev:vercel` (최초 1회 `vercel login` 필요, **배포 전에도 선택 사항**)

---

## 5. 데이터 구조 요약 (Storage 불필요 근거)

| 저장 위치 | 내용 |
|-----------|------|
| Firestore `users` | 프로필, isPremium, fcmTokens (문자열) |
| Firestore `dreams` | 꿈 텍스트, 감정 ID, interpretation 객체, embedding 배열, followUp 텍스트 |
| Vercel Serverless | AI 호출만 (DB에 결과 저장은 클라이언트→Firestore) |

이미지·음성·첨부 파일 없음 → **Cloud Storage 불필요**.

---

## 6. 체크리스트 (배포 직전)

- [ ] Firestore rules 배포  
- [ ] Vercel `VITE_*` + `OPENAI_API_KEY` 설정  
- [ ] `VITE_DEMO_MODE=false`  
- [ ] Firebase Auth 승인 도메인에 Vercel URL 추가  
- [ ] `npm run build` 성공 후 Vercel 배포  
- [ ] (선택) Functions 배포 — 푸시 쓸 때  

---

*상세 문서: `doc/05-data-model.md`, `doc/06-deployment.md`*
