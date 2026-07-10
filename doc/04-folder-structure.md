# 04. 폴더 구조

```
새 폴더/
├── assets/
│   └── icons/brand/
│       └── dreamlab-app-icon.png       # 로고 마스터 (달·전자 UI)
│
├── api/
│   └── interpret-dream.ts              # Vercel Serverless → Netlify handler 재사용
│
├── admin/                              # Admin ERP (port 5174)
│   ├── index.html
│   └── src/
│       ├── App.tsx                     # 라우터 + AdminGate
│       ├── main.tsx                    # ../src/index.css 공유
│       ├── layout/
│       │   ├── AdminLayout.tsx
│       │   └── AdminSidebar.tsx        # DreamLab · ERP
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx       # 실DB + 합성 KPI
│       │   ├── MonitoringPage.tsx
│       │   ├── MembersPage.tsx
│       │   ├── DreamsPage.tsx
│       │   ├── FollowUpPage.tsx
│       │   ├── DataExposurePage.tsx
│       │   ├── AiUsagePage.tsx
│       │   ├── LabMetricsPage.tsx
│       │   ├── PushSettingsPage.tsx
│       │   └── SystemSettingsPage.tsx
│       ├── hooks/
│       │   ├── useAdminAuth.ts         # role === "admin"
│       │   └── useOpsConfig.ts
│       ├── services/
│       │   └── adminMetrics.ts         # KPI 샘플, ai_usage
│       ├── components/
│       │   └── AdminUi.tsx
│       └── LabMetricsEditor.tsx
│
├── doc/                                # 📁 프로젝트 문서 (단일 소스)
│
├── functions/src/
│   └── index.ts                        # sendFollowUpReminders, onFollowUpSubmitted
│
├── netlify/functions/
│   ├── interpret-dream.ts              # AI 해몽 API (핵심)
│   └── lib/
│       ├── interpretPremium.ts         # 프롬프트 + researchAnchor
│       ├── dreamAnchor.ts              # → src/lib/dreamAnchor re-export
│       └── recordAiUsage.ts            # ai_usage/{date}
│
├── public/
│   ├── favicon-*.png, pwa-*.png
│   ├── firebase-messaging-sw.js        # prebuild inject
│   └── lab-metrics.json                # 홈 KPI 폴백 (config 없을 때)
│
├── scripts/
│   ├── sync-branch-env.mjs             # Branch/.env → .env.local
│   ├── inject-firebase-sw.mjs          # FCM SW config 주입
│   ├── generate-icons.mjs              # 로고 → public 아이콘
│   └── vite-local-api-plugin.ts        # 로컬 /api/interpret-dream
│
├── src/
│   ├── App.tsx                         # 스플래시 → 라우트
│   ├── main.tsx
│   ├── index.css                       # Tailwind v4 + brand-wordmark
│   ├── types/index.ts                  # Dream, ResearchAnchor, CommunityEstimate
│   ├── components/
│   │   ├── SplashScreen.tsx
│   │   ├── Layout.tsx                  # 헤더 DreamLab + 4탭
│   │   ├── InterpretationCard.tsx      # labObservations UI
│   │   ├── AppBackground.tsx
│   │   ├── PushNotificationPrompt.tsx
│   │   ├── ConversionGate.tsx
│   │   ├── CommunityStoriesPanel.tsx
│   │   ├── ResearchLabPanel.tsx
│   │   └── ui/
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── WriteDreamPage.tsx
│   │   ├── DreamDetailPage.tsx         # clusterLabel / researchAnchor
│   │   ├── FollowUpPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── MyPage.tsx
│   │   └── MyDreamsPage.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useAccessPolicy.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useLiveLabMetrics.ts
│   │   └── usePremiumSheet.tsx
│   ├── services/
│   │   ├── dreamService.ts
│   │   ├── interpretService.ts
│   │   ├── communityDataService.ts
│   │   ├── syntheticCommunityService.ts
│   │   └── opsConfigService.ts         # config/*
│   └── lib/
│       ├── branding.ts
│       ├── dreamAnchor.ts              # AI 앵커 정리·폴백
│       ├── opsConfig.ts
│       ├── labMetricsConfig.ts
│       ├── keywordNarratives.ts
│       ├── previewKeywords.ts
│       └── firebase.ts
│
├── firestore.rules                     # admin, config, ai_usage
├── firestore.indexes.json
├── firebase.json
├── netlify.toml                        # Netlify 배포 (선택)
├── vercel.json                         # Vercel 배포
├── vite.config.ts                      # port 3000, PWA, local API
├── vite.admin.config.ts                # Admin port 5174
├── index.html
├── DEPLOY.md                           # Firebase + Vercel 체크리스트
├── package.json
├── 실행.bat                            # npm run dev → 3000
└── admin.bat                           # npm run dev:admin → 5174
```

## 삭제·변경된 항목

- `ConversionFunnelStrip.tsx` — 제거 (홈 3단계 퍼널 스트립)
- 로컬 dev 포트 **8888 → 3000** (Vite 단독, Netlify dev 선택)
- Admin: `LabMetricsEditor` 단독 → **ERP 전체 페이지**로 확장
- 키워드: 고정 lexicon 우선 → **`researchAnchor` AI 1차**

마지막 업데이트: **2026-07-10**
