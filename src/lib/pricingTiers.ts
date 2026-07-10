export const PRICING_TIERS = [
  {
    tier: "guest" as const,
    name: "비회원",
    price: "무료",
    features: ["키워드 탐색 미리보기", "꿈 기록 · 해몽 일부"],
    locked: ["30일 후 운세 그래프", "후기·통계 전체"],
  },
  {
    tier: "member" as const,
    name: "회원",
    price: "무료",
    features: [
      "꿈 저장 · 30일 알림",
      "유사 꿈 · 키워드 탐색",
      "후기 작성",
      "아카이브 운세 3축 요약",
    ],
    locked: ["8주 운세 그래프 전체", "재물·연애·직장·건강 전 축"],
  },
  {
    tier: "premium" as const,
    name: "프리미엄",
    price: "₩4,900/월",
    features: [
      "회원 기능 전체",
      "8주 운세 그래프 · 7개 축",
      "누적 아카이브 운세 전체",
      "30일 후 통계·후기 전체",
      "무제한 탐색",
    ],
    locked: [] as string[],
  },
] as const;
