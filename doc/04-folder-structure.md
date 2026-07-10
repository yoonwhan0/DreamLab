# 04. 폴더 구조

> 2026-07-10 동기화. 상세 기능: [10-features-reference.md](./10-features-reference.md)

```
DreamLab/
├── admin/                          # Admin (standalone :5174 + /superadmin 임베드)
│   └── src/
│       ├── AdminApp.tsx            # 3메뉴 라우터
│       ├── components/
│       │   └── DreamSpreadsheet.tsx
│       ├── lib/
│       │   ├── dreamSpreadsheetSchema.ts   # 32열
│       │   └── adminRoutes.ts
│       ├── services/
│       │   └── adminDreamDb.ts     # import/delete API
│       └── pages/
│           ├── DashboardPage.tsx
│           ├── MembersPage.tsx
│           └── DreamsPage.tsx
│
├── netlify/functions/
│   ├── interpret-dream.ts
│   ├── story-access.ts
│   ├── register-story-views.ts
│   ├── admin-import-dreams.ts
│   ├── admin-delete-dreams.ts
│   └── lib/
│       ├── firebaseAdmin.ts
│       ├── firebasePrivateKey.ts
│       ├── interpretPremium.ts
│       ├── communityReviewPrompt.ts
│       ├── communityStoryQuality.ts
│       └── recordAiUsage.ts
│
├── scripts/
│   ├── vite-dev-api-plugin.ts      # 로컬 /api/* → Functions
│   ├── inject-firebase-sw.mjs
│   ├── generate-icons.mjs
│   └── sync-branch-env.mjs
│
├── src/
│   ├── App.tsx                     # /superadmin/* + 사용자 라우트
│   ├── components/
│   │   ├── LabResearchMission.tsx  # 연구 미션 아코디언
│   │   ├── HomeObservatorySignal.tsx
│   │   ├── HomeFeaturedStoryPanel.tsx
│   │   ├── DreamFortuneTrendPanel.tsx
│   │   ├── DreamArchiveCalendar.tsx
│   │   ├── CommunityStoriesPanel.tsx
│   │   ├── AuthSheetBody.tsx
│   │   ├── PendingDreamLinker.tsx
│   │   ├── MemberRoute.tsx
│   │   └── motion/AiWritingPulse.tsx
│   ├── hooks/
│   │   ├── useFeaturedKeywords.ts
│   │   ├── useHomeFeaturedKeywords.ts
│   │   ├── useAccessPolicy.ts
│   │   ├── useAuth.tsx
│   │   └── useSignupSheet.tsx
│   ├── lib/
│   │   ├── authPlatform.ts           # popup/redirect 분기
│   │   ├── authUser.ts               # isLinkedAuthUser
│   │   ├── pendingDreamStorage.ts    # 비회원 임시 꿈
│   │   ├── branding.ts             # RESEARCH_MISSION_*
│   │   ├── dreamSeedImport.ts      # 시드 페이로드
│   │   ├── dreamFortuneTrends.ts
│   │   ├── communityStoryQuality.ts
│   │   ├── similarDreamVariation.ts
│   │   ├── storyAccessPricing.ts
│   │   ├── previewKeywords.ts
│   │   ├── masterAccounts.ts
│   │   └── adminPath.ts            # /superadmin
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── MyPage.tsx
│   │   ├── DreamDetailPage.tsx
│   │   ├── FollowUpPage.tsx
│   │   └── WriteDreamPage.tsx
│   └── services/
│       ├── pendingDreamService.ts    # 가입 후 pending flush
│       ├── dreamService.ts         # fetchPopularDreamKeywords
│       ├── communityDataService.ts
│       ├── storyUnlockService.ts
│       └── interpretService.ts
│
├── doc/                            # 📁 프로젝트 문서
├── firestore.rules
├── firestore.indexes.json
├── netlify.toml
├── vite.config.ts
└── package.json
```

## 삭제·변경 (2026-07)

| 항목 | 내용 |
|------|------|
| 토스 결제 | SDK·Functions 제거 |
| `ReinterpretRecentPanel` | 제거 → 운세 그래프 |
| `HOME_FEATURED_KEYWORDS` 4개 고정 | → DB 랜덤 칩 |
| Admin ERP 10메뉴 | → 3메뉴 슬림화 |
| `/about` 페이지 | → `/#research` |
| outcome `nothing` | 제거 → `other` |
| 익명 Auth | 제거 → Google 직접 로그인 + pending dream |

## Admin 레거시 (라우터 미연결)

`admin/src/pages/` — Monitoring, DataExposure, AiUsage, LabMetrics, PushSettings, SystemSettings, FollowUpPage(standalone)

마지막 업데이트: **2026-07-10**
