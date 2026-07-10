import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { computeResearchLabStats } from "@/lib/researchLab";
import { PageHeader, StatCard, StatusBanner } from "@admin/components/AdminUi";
import { fetchAiUsage, fetchKpiSnapshot } from "@admin/services/adminMetrics";
import { useOpsConfig } from "@admin/hooks/useOpsConfig";
import type { AiUsageDailyDoc, KpiSnapshot } from "@/lib/opsConfig";

export function DashboardPage() {
  const { labMetrics, dataExposure, followUpPush, loading: configLoading } = useOpsConfig();
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [aiToday, setAiToday] = useState<AiUsageDailyDoc | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setKpiLoading(true);
      setKpiError(null);
      try {
        const [snapshot, usage] = await Promise.all([
          fetchKpiSnapshot(),
          fetchAiUsage(1),
        ]);
        if (!cancelled) {
          setKpi(snapshot);
          setAiToday(usage[0] ?? null);
        }
      } catch {
        if (!cancelled) setKpiError("Firestore 조회 실패 — admin 권한을 확인하세요.");
      } finally {
        if (!cancelled) setKpiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayStats = labMetrics ? computeResearchLabStats(labMetrics) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="운영 대시보드"
        desc="실제 DB 지표와 사용자에게 노출되는 합성 KPI를 한 화면에서 비교합니다."
      />

      {kpiError && <StatusBanner type="warn">{kpiError}</StatusBanner>}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          실데이터 (Firestore)
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="총 회원"
            value={kpiLoading ? "…" : (kpi?.totalUsers ?? 0)}
            hint={`익명 ${kpi?.anonymousUsers ?? 0} · 프리미엄 ${kpi?.premiumUsers ?? 0}`}
            accent
          />
          <StatCard
            label="총 꿈 기록"
            value={kpiLoading ? "…" : (kpi?.totalDreams ?? 0)}
            hint={`오늘 +${kpi?.dreamsToday ?? 0}`}
          />
          <StatCard
            label="30일 응답률"
            value={kpiLoading ? "…" : `${kpi?.responseRatePercent ?? 0}`}
            suffix="%"
            accent
            hint={`완료 ${kpi?.followUpCompleted ?? 0} · 대기 ${kpi?.followUpPending ?? 0}`}
          />
          <StatCard
            label="오늘 AI 호출"
            value={kpiLoading ? "…" : (aiToday?.totalCalls ?? 0)}
            hint={`OpenAI ${aiToday?.openaiCalls ?? 0} · Gemini ${aiToday?.geminiCalls ?? 0}`}
          />
        </div>
        <p className="text-[0.6875rem] text-text-muted mt-2">
          최대 500건 샘플 집계 · 전체 집계는 모니터링 → nightly 스냅샷 예정
        </p>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          사용자 노출 (합성 KPI)
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="노출 꿈 기록"
            value={configLoading ? "…" : (displayStats?.totalDreams ?? 0)}
            hint="홈 ResearchLabPanel"
          />
          <StatCard
            label="노출 30일 결과"
            value={configLoading ? "…" : (displayStats?.totalFollowUpResults ?? 0)}
            accent
          />
          <StatCard
            label="오늘 관측 (합성)"
            value={configLoading ? "…" : (displayStats?.todayNewDreams ?? 0)}
            hint="LIVE 카운터"
          />
          <StatCard
            label="목표 오가닉 비율"
            value={configLoading ? "…" : `${dataExposure?.targetOrganicPercent ?? 0}`}
            suffix="%"
            hint={`실DB 전환 기준 ≥${dataExposure?.minRealCommunityCount ?? 5}건`}
          />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-semibold">빠른 링크</h3>
          <ul className="text-sm space-y-1.5 text-text-secondary">
            <li>
              <Link to="/data-exposure" className="text-primary hover:underline">
                데이터 노출 정책
              </Link>{" "}
              — 오가닉/합성/AI 블렌드
            </li>
            <li>
              <Link to="/settings/push" className="text-primary hover:underline">
                푸시 설정
              </Link>{" "}
              — 마일스톤 {followUpPush?.milestonesDays.join("·") ?? "30"}일
            </li>
            <li>
              <Link to="/ai-usage" className="text-primary hover:underline">
                AI 사용량
              </Link>{" "}
              — interpret-dream 호출 추적
            </li>
            <li>
              <Link to="/settings/lab-metrics" className="text-primary hover:underline">
                홈 KPI
              </Link>{" "}
              — 합성 숫자·LIVE 속도
            </li>
          </ul>
        </div>
        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-semibold">운영 메모</h3>
          <ul className="text-xs text-text-muted space-y-1 copy-lines">
            <li>설정 저장 → Firestore <code>config/*</code> (재배포 불필요)</li>
            <li>첫 admin: 콘솔에서 <code>users/UID.role = admin</code> 수동 지정</li>
            <li>AI 로그: 서버에 <code>FIREBASE_CLIENT_EMAIL</code> 등 설정 필요</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
