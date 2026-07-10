import { LiveStat } from "@/components/LiveStat";
import { useLiveLabMetrics } from "@/hooks/useLiveLabMetrics";

/** 홈 — DreamLab 아이덴티티: 오늘 30일 후를 맞이한 꿈 */
export function HomeTodayHero() {
  const { stats } = useLiveLabMetrics();

  return (
    <section className="card-highlight p-5 sm:p-6 text-center space-y-4">
      <p className="section-label">오늘</p>
      <p className="text-xl sm:text-2xl font-bold text-text leading-snug tracking-tight">
        <LiveStat value={stats.todayFollowUpDue} className="text-primary" />
        <span className="text-primary">개</span>의 꿈이
        <br />
        <span className="text-primary">30일 후</span>를 맞이했습니다
      </p>
      <dl className="flex items-center justify-center gap-10 pt-1">
        <div className="text-center">
          <dd className="text-lg font-bold text-text tabular-nums">
            <LiveStat value={stats.todayNewDreams} />
            <span className="text-sm font-normal text-text-muted ml-0.5">건</span>
          </dd>
          <dt className="text-[0.6875rem] text-text-muted mt-0.5">꿈 기록</dt>
        </div>
        <div className="h-8 w-px bg-border" aria-hidden />
        <div className="text-center">
          <dd className="text-lg font-bold text-primary tabular-nums">
            <LiveStat value={stats.todayFollowUpDue} />
            <span className="text-sm font-normal text-text-muted ml-0.5">건</span>
          </dd>
          <dt className="text-[0.6875rem] text-text-muted mt-0.5">30일 후기</dt>
        </div>
      </dl>
    </section>
  );
}
