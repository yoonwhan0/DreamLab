# 06. 배포 가이드

> Firebase + **Vercel** 기준. Netlify(`netlify.toml`)도 유지 — 동일 `dist` + Functions 구조.  
> 빠른 체크리스트: [DEPLOY.md](../DEPLOY.md)

---

## DB 종류

| 서비스 | 사용 |
|--------|------|
| **Cloud Firestore** | ✅ `users`, `dreams`, `config`, `ai_usage` |
| **Realtime Database** | ❌ |
| **Cloud Storage** | ❌ (코드에서 `getStorage()` 미사용) |

---

## 1. 사용자 앱 — Vercel

### 빌드

```bash
npm run build    # dist/ + PWA + firebase-messaging-sw inject
vercel           # 또는 GitHub 연동
```

- **Publish:** `dist/`
- **API:** `api/interpret-dream.ts` → `netlify/functions/interpret-dream`
- **설정:** `vercel.json`

### Vercel 환경변수

#### 클라이언트 (`VITE_` — 빌드에 포함)

| 변수 | 설명 |
|------|------|
| `VITE_FIREBASE_API_KEY` | Firebase 웹 API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `프로젝트ID.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | 콘솔 기본값 (Storage 미사용이어도 복사) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |
| `VITE_FIREBASE_VAPID_KEY` | 웹 푸시 VAPID |
| `VITE_DEMO_MODE` | 프로덕션: **`false`** |

#### 서버 (브라우저 노출 금지)

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | AI 해몽 + embedding (권장) |
| `GEMINI_API_KEY` | OpenAI 없을 때 fallback |
| `FIREBASE_PROJECT_ID` | `ai_usage` 로깅용 Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | |
| `FIREBASE_PRIVATE_KEY` | `\n` 이스케이프 |

---

## 2. Firebase

### Console 설정

1. **Authentication** — 익명, Google, 이메일 활성화
2. **승인 도메인** — `localhost`, `*.vercel.app`, 커스텀 도메인
3. **Cloud Messaging** — VAPID → `VITE_FIREBASE_VAPID_KEY`
4. **Firestore** — Native 모드 DB 생성

### Rules · Indexes 배포

```bash
firebase login
firebase use --add
firebase deploy --only firestore
```

`firestore.rules` — admin, `config/*`, `ai_usage` 포함 ([05-data-model.md](./05-data-model.md))

### Cloud Functions (30일 푸시)

```bash
firebase deploy --only functions
```

- `sendFollowUpReminders` — 매일 KST 00:00
- `onFollowUpSubmitted` — 후기 제출 후처리
- **Blaze 요금제** 필요 (스케줄)

> `config/followUpPush` 연동은 **UI만** — Functions는 아직 하드코드 스케줄

---

## 3. Admin 배포

### Phase A (현재 — 로컬)

```bash
npm run dev:admin    # http://localhost:5174
# 또는 admin.bat
```

### Phase B (권장 — 운영)

- **별도 Vercel 프로젝트** 또는 Netlify 사이트: `admin.dreamlab.kr`
- Build: `npm run build:admin`
- 동일 Firebase env (`VITE_FIREBASE_*`)
- 사용자 PWA에 Admin 링크 **노출하지 않음**

### Admin 권한 부여

Firestore → `users/{uid}` → `role: "admin"`

---

## 4. 로컬 개발

```bash
npm install
cp .env.example .env          # 또는 Branch/.env
npm run dev                   # http://localhost:3000
```

| 명령 | 포트 | 설명 |
|------|------|------|
| `npm run dev` | **3000** | Vite + 로컬 `/api/interpret-dream` (**권장**) |
| `npm run dev:vercel` | 3000 | Vercel dev (로그인 필요, 선택) |
| `npm run dev:netlify` | 8888 | Netlify dev (레거시) |
| `npm run dev:admin` | **5174** | Admin ERP |

**predev:** `sync-branch-env.mjs` + `inject-firebase-sw.mjs`

로컬 API: `scripts/vite-local-api-plugin.ts` — Vercel/Netlify 없이 AI 테스트 가능

---

## 5. Netlify (선택)

기존 `netlify.toml` 유지:

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- env: Vercel과 동일

---

## 6. 배포 직전 체크리스트

- [ ] Firestore rules 배포
- [ ] Vercel `VITE_*` + `OPENAI_API_KEY` (+ AI usage용 Firebase Admin 키)
- [ ] `VITE_DEMO_MODE=false`
- [ ] Firebase Auth 승인 도메인에 Vercel URL
- [ ] `npm run build` 성공
- [ ] Admin `role: "admin"` 설정
- [ ] (선택) Functions 배포 — 푸시
- [ ] iOS PWA 홈화면 + 16.4+ (웹 푸시)

---

## 7. 비용 대략

| 항목 | 비고 |
|------|------|
| Vercel | Hobby~Pro (Serverless 호출) |
| Firebase | Spark → Blaze (Functions 스케줄, FCM) |
| OpenAI | interpret 호출당 — Admin `ai_usage`로 추적 |

마지막 업데이트: **2026-07-10**
