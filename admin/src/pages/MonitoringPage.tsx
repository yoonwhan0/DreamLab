import { useEffect, useState } from "react";
import { PageHeader, StatCard, StatusBanner } from "@admin/components/AdminUi";
import { fetchAiUsage, fetchKpiSnapshot } from "@admin/services/adminMetrics";
import type { AiUsageDailyDoc, KpiSnapshot } from "@/lib/opsConfig";

export function MonitoringPage() {
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsageDailyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [snapshot, usage] = await Promise.all([
          fetchKpiSnapshot(),
          fetchAiUsage(7),
        ]);
        setKpi(snapshot);
        setAiUsage(usage);
      } catch {
        setError("모니터링 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const aiWeekTotal = aiUsage.reduce((s, d) => s + d.totalCalls, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="모니터링"
        desc="서비스 건강도·퍼널·AI 호출을 실시간(샘플)으로 추적합니다."
        actions={
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        }
      />

      {error && <StatusBanner type="warn">{error}</StatusBanner>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="DAU 추정" value={loading ? "…" : (kpi?.dreamsToday ?? 0)} hint="오늘 꿈 기록 유저 프록시" />
        <StatCard label="답변 대기" value={loading ? "…" : (kpi?.followUpPending ?? 0)} accent />
        <StatCard label="오늘 due" value={loading ? "…" : (kpi?.followUpDueToday ?? 0)} />
        <StatCard label="7일 AI 호출" value={loading ? "…" : aiWeekTotal} accent />
        <StatCard label="익명 비율" value={loading ? "…" : pct(kpi?.anonymousUsers, kpi?.totalUsers)} suffix="%" />
        <StatCard label="프리미엄" value={loading ? "…" : (kpi?.premiumUsers ?? 0)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">최근 7일 AI 호출</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-[0.625rem] uppercase">
                <th className="text-left px-4 py-2">날짜</th>
                <th className="text-right px-4 py-2">합계</th>
                <th className="text-right px-4 py-2">OpenAI</th>
                <th className="text-right px-4 py-2">Gemini</th>
                <th className="text-right px-4 py-2">Fallback</th>
              </tr>
            </thead>
            <tbody>
              {aiUsage.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                    {loading ? "불러오는 중…" : "아직 ai_usage 로그 없음"}
                  </td>
                </tr>
              ) : (
                aiUsage.map((row) => (
                  <tr key={row.date} className="border-b border-border/50">
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2 text-right font-medium">{row.totalCalls}</td>
                    <td className="px-4 py-2 text-right">{row.openaiCalls ?? 0}</td>
                    <td className="px-4 py-2 text-right">{row.geminiCalls ?? 0}</td>
                    <td className="px-4 py-2 text-right text-text-muted">{row.fallbackCalls ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {kpi && (
        <p className="text-[0.6875rem] text-text-muted">
          집계 시각: {kpi.computedAt.toLocaleString("ko-KR")} · 샘플 상한 500건
        </p>
      )}
    </div>
  );
}

function pct(part: number | undefined, total: number | undefined): number {
  if (!total || !part) return 0;
  return Math.round((part / total) * 100);
}
