import { useEffect, useState } from "react";
import { PageHeader, StatCard, StatusBanner } from "@admin/components/AdminUi";
import { fetchAiUsage } from "@admin/services/adminMetrics";
import type { AiUsageDailyDoc } from "@/lib/opsConfig";

export function AiUsagePage() {
  const [usage, setUsage] = useState<AiUsageDailyDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAiUsage(30).then((data) => {
      setUsage(data);
      setLoading(false);
    });
  }, []);

  const totals = usage.reduce(
    (acc, d) => ({
      calls: acc.calls + d.totalCalls,
      openai: acc.openai + (d.openaiCalls ?? 0),
      gemini: acc.gemini + (d.geminiCalls ?? 0),
      fallback: acc.fallback + (d.fallbackCalls ?? 0),
    }),
    { calls: 0, openai: 0, gemini: 0, fallback: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 사용량"
        desc="interpret-dream API 호출 — Firestore ai_usage/{date} 일별 집계"
      />

      <StatusBanner type="info">
        서버 env: <code>FIREBASE_PROJECT_ID</code>, <code>FIREBASE_CLIENT_EMAIL</code>,{" "}
        <code>FIREBASE_PRIVATE_KEY</code> 설정 시 자동 기록됩니다.
      </StatusBanner>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="30일 총 호출" value={loading ? "…" : totals.calls} accent />
        <StatCard label="OpenAI" value={loading ? "…" : totals.openai} />
        <StatCard label="Gemini" value={loading ? "…" : totals.gemini} />
        <StatCard label="Fallback" value={loading ? "…" : totals.fallback} hint="API 키 없음·실패" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[0.625rem] uppercase text-text-muted">
              <th className="text-left px-4 py-2">날짜</th>
              <th className="text-right px-4 py-2">합계</th>
              <th className="text-right px-4 py-2">OpenAI</th>
              <th className="text-right px-4 py-2">Gemini</th>
              <th className="text-right px-4 py-2">Fallback</th>
              <th className="text-right px-4 py-2">오류</th>
            </tr>
          </thead>
          <tbody>
            {usage.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  {loading ? "불러오는 중…" : "로그 없음 — 해몽 API 호출 후 생성됩니다"}
                </td>
              </tr>
            ) : (
              usage.map((row) => (
                <tr key={row.date} className="border-b border-border/50">
                  <td className="px-4 py-2">{row.date}</td>
                  <td className="px-4 py-2 text-right font-semibold">{row.totalCalls}</td>
                  <td className="px-4 py-2 text-right">{row.openaiCalls ?? 0}</td>
                  <td className="px-4 py-2 text-right">{row.geminiCalls ?? 0}</td>
                  <td className="px-4 py-2 text-right">{row.fallbackCalls ?? 0}</td>
                  <td className="px-4 py-2 text-right text-red-400">{row.errorCalls ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
