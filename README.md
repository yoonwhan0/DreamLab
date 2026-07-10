# 꿈연구소 (DreamLab)

> **문서**: 상세 구조·진행 상황·Admin 설계는 [`doc/README.md`](./doc/README.md) 참고.

## 서비스 철학

> AI가 꿈을 해석하는 서비스가 아니라, **시간을 관측·기록하는 연구소**입니다.

| AI는 입구 | 진짜 상품 |
|-----------|-----------|
| 꿈해몽 (무료) | 꿈 데이터 |
| | 감정 데이터 |
| | 시간 데이터 |
| | **결과 데이터** |

**"세상에서 가장 큰 '꿈 이후' 데이터베이스를 만든다."**

## MVP 기능 (현재 구현)

- [x] Google / 이메일 / 게스트 로그인
- [x] 꿈 작성 (제목, 내용, 이모지 감정)
- [x] AI 꿈해몽 (상징 / 심리 / 생각해볼 점 + 법적 면책)
- [x] OpenAI Embedding → 유사 꿈 매칭 (Dream Matching)
- [x] 30일 후 Push (Cloud Functions) + 이메일 병행 예정
- [x] 후기 작성 (별일없음 / 연애 / 직장 / 건강 등)
- [x] 통계 + **꿈의 생존율** (후기 작성률)
- [x] 프리미엄 게이트 (같은 꿈 통계)
- [x] PWA (홈화면 추가)

## Phase 2 (로드맵)

- [ ] 카카오 / Apple 로그인
- [ ] Dream DNA (개인 리포트)
- [ ] AI 예측 정확도 공개
- [ ] 월간 리포트
- [ ] 익명 커뮤니티 (공감, 댓글)
- [ ] Stripe / 토스페이먼츠 결제
- [ ] pgvector 마이그레이션 (데이터 1만+ 시)

## 기술 스택

| 영역 | 현재 | 확장 시 |
|------|------|---------|
| Frontend | React + Vite PWA | — |
| Backend | Firebase (Auth, Firestore) | Supabase + pgvector |
| AI | OpenAI GPT-4o-mini | — |
| Embedding | text-embedding-3-small | pgvector |
| Push | FCM + Cloud Functions | + 이메일 (Resend) |
| 배포 | Vercel (`dist` + `/api`) | — |

## 시작하기

```bash
npm install
cp .env.example .env   # Firebase 키 입력
npm run dev
```

### 환경변수

**클라이언트 (`.env`)**
```
VITE_FIREBASE_* 
VITE_DEV_SHORT_FOLLOWUP=true  # 30일 → 1분 (테스트용)
```

**Vercel (Serverless)**
```
OPENAI_API_KEY   # AI + Embedding (권장)
GEMINI_API_KEY   # OpenAI 없을 때 fallback
```

### Firebase 배포

```bash
firebase login && firebase use --add
firebase deploy --only firestore,functions
```

## 법적/윤리 가이드

모든 AI 해석과 통계에 다음 면책 포함:

> 유사한 꿈을 기록한 사용자들의 후기에서 이런 경향이 보고되었습니다.  
> 이는 **통계적 경향일 뿐**이며, 개인의 미래를 예측하거나 보장하지 않습니다.

## 결제

웹 MVP: Stripe / 토스페이먼츠 / 카카오페이  
앱 출시 후: Google Play Billing / Apple IAP
