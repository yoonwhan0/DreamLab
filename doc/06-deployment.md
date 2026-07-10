# 06. 배포 가이드

> **프로덕션: Netlify** (`netlify.toml`) — GitHub `main` push 시 자동 배포  
> Firebase: rules · indexes · Functions  
> 체크리스트: [DEPLOY.md](../DEPLOY.md)

---

## 1. Netlify (사용자 앱 + API)

### 빌드

```bash
npm run build    # dist/ + PWA + firebase-messaging-sw
```

- **Publish:** `dist/`
- **Functions:** `netlify/functions/`
- **Node:** 20 (`netlify.toml`)

### Redirects (`/api/*`)

| from | function |
|------|----------|
| `/api/interpret-dream` | interpret-dream |
| `/api/story-access` | story-access |
| `/api/register-story-views` | register-story-views |
| `/api/admin-import-dreams` | admin-import-dreams |
| `/api/admin-delete-dreams` | admin-delete-dreams |

### Netlify 환경변수

#### 클라이언트 (`VITE_*`)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
VITE_DEMO_MODE=false
```

#### 서버 (Functions — 브라우저 노출 금지)

```
OPENAI_API_KEY
GEMINI_API_KEY                    # fallback
FIREBASE_PROJECT_ID               # Admin SDK
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY              # JSON private_key 문자열만, \n 이스케이프
```

> `FIREBASE_PRIVATE_KEY` — `firebasePrivateKey.ts`가 PEM 정규화  
> Scopes: **Functions, Runtime** (Builds 불필요)

---

## 2. Firebase

```bash
firebase login
firebase use dreamlab-b6a8e   # 프로젝트 ID
npm run deploy:rules          # firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions   # Blaze — 30일 푸시
```

### Auth 승인 도메인

- Netlify URL (`*.netlify.app`)
- 커스텀 도메인
- `localhost`

### Admin 권한

1. `yoonwhan0@gmail.com` 마스터 (rules) 또는
2. Firestore `users/{uid}.role = "admin"`

---

## 3. Admin 접근

| 방식 | URL |
|------|-----|
| **프로덕션** | `https://{사이트}/superadmin` |
| 로컬 standalone | `npm run dev:admin` → :5174 |
| 로컬 임베드 | `npm run dev:netlify` + `/superadmin` |

시드 DB 업로드 전 확인:

- [ ] Netlify `FIREBASE_*` 3종 설정
- [ ] rules 배포 (`isAdminSeedCreate`)
- [ ] 마스터 계정 로그인

---

## 4. 로컬 개발

```bash
npm install
cp .env.example .env
npm run dev:netlify    # :8888 — API 포함 (권장)
```

| 명령 | 포트 |
|------|------|
| `npm run dev` | 5173 |
| `npm run dev:netlify` | 8888 |
| `npm run dev:admin` | 5174 |

로컬 API: `scripts/vite-dev-api-plugin.ts`

---

## 5. 배포 직전 체크리스트

- [ ] `npm run build` 성공
- [ ] Firestore rules 배포
- [ ] Netlify `VITE_*` + `OPENAI_API_KEY` + `FIREBASE_*`
- [ ] `VITE_DEMO_MODE=false`
- [ ] Auth 승인 도메인
- [ ] Admin `/superadmin/dreams` 업로드·삭제 테스트
- [ ] (선택) Functions — 푸시

---

## 6. Vercel (레거시)

`api/interpret-dream.ts`, `vercel.json` 유지 가능하나 **현재 운영은 Netlify 기준**으로 문서화합니다.

마지막 업데이트: **2026-07-10**
