import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  DEFAULT_LAB_METRICS,
  fetchLabMetricsConfig,
  mergeLabMetricsConfig,
  saveLabMetricsToStorage,
  type LabMetricsConfig,
  type LiveCounterConfig,
} from "@/lib/labMetricsConfig";
import { computeResearchLabStats } from "@/lib/researchLab";

type CounterKey =
  | "todayNewDreams"
  | "todayFollowUpDue"
  | "todayNewPatterns"
  | "totalDreamsLive";

const COUNTER_LABELS: Record<CounterKey, string> = {
  todayNewDreams: "오늘 새로 관측된 꿈",
  todayFollowUpDue: "오늘 30일이 지난 기록",
  todayNewPatterns: "새로운 패턴 발견",
  totalDreamsLive: "누적 꿈 기록 (라이브 가산)",
};

export function LabMetricsEditor({
  onConfigChange,
  showHeader = true,
}: {
  onConfigChange?: (config: LabMetricsConfig) => void;
  showHeader?: boolean;
} = {}) {
  const [config, setConfig] = useState<LabMetricsConfig>(DEFAULT_LAB_METRICS);
  const [preview, setPreview] = useState(() => computeResearchLabStats());
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchLabMetricsConfig().then((loaded) => {
      setConfig(loaded);
      onConfigChange?.(loaded);
    });
    // onConfigChange는 안정적이지 않을 수 있어 mount 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => setPreview(computeResearchLabStats(config));
    tick();
    if (!config.liveEnabled) return;
    const id = window.setInterval(tick, 2_500);
    return () => window.clearInterval(id);
  }, [config]);

  const patch = (partial: Partial<LabMetricsConfig>) => {
    setConfig((prev) => {
      const next = mergeLabMetricsConfig({ ...prev, ...partial });
      onConfigChange?.(next);
      return next;
    });
    setStatus(null);
  };

  const patchCounter = (key: CounterKey, partial: Partial<LiveCounterConfig>) => {
    setConfig((prev) => {
      const next = mergeLabMetricsConfig({
        ...prev,
        [key]: { ...prev[key], ...partial },
      });
      onConfigChange?.(next);
      return next;
    });
    setStatus(null);
  };

  const handleSaveLocal = () => {
    saveLabMetricsToStorage(config);
    setStatus("브라우저 저장 완료 (이 Admin 탭에서만 즉시 반영)");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lab-metrics.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("lab-metrics.json 다운로드됨 → public/lab-metrics.json 에 덮어쓰면 사용자 앱에 반영");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<LabMetricsConfig>;
        setConfig(mergeLabMetricsConfig(parsed));
        onConfigChange?.(mergeLabMetricsConfig(parsed));
        setStatus("JSON 가져오기 완료 — 저장 또는 배포용 export 필요");
      } catch {
        setStatus("JSON 파싱 실패");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const next = { ...DEFAULT_LAB_METRICS };
    setConfig(next);
    onConfigChange?.(next);
    setStatus("기본값으로 초기화됨");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {showHeader && (
      <section className="card card-bezel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text">라이브 KPI 통제</h2>
            <p className="text-xs text-text-muted mt-1 copy-lines">
              홈 화면 숫자가 실시간으로 증가하는 속도·범위를 조정합니다.
              Firestore <code className="text-primary">config/labMetrics</code> 저장을 권장합니다.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.liveEnabled}
              onChange={(e) => patch({ liveEnabled: e.target.checked })}
              className="accent-accent"
            />
            LIVE 카운팅
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary text-xs" onClick={handleSaveLocal}>
            로컬 저장
          </button>
          <button type="button" className="btn btn-secondary text-xs" onClick={handleExport}>
            JSON보내기
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={() => fileRef.current?.click()}
          >
            JSON 가져오기
          </button>
          <button type="button" className="btn btn-ghost text-xs" onClick={handleReset}>
            기본값
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>
        {status && <p className="text-xs text-accent">{status}</p>}
      </section>
      )}

      {!showHeader && (
        <section className="card card-bezel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.liveEnabled}
                onChange={(e) => patch({ liveEnabled: e.target.checked })}
                className="accent-accent"
              />
              LIVE 카운팅
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary text-xs" onClick={handleSaveLocal}>
                로컬 저장
              </button>
              <button type="button" className="btn btn-secondary text-xs" onClick={handleExport}>
                JSON보내기
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => fileRef.current?.click()}
              >
                JSON 가져오기
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={handleReset}>
                기본값
              </button>
            </div>
          </div>
          {status && <p className="text-xs text-accent">{status}</p>}
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            누적·기준값
          </h3>
          <FieldGrid>
            <NumberField
              label="연구소 개설일"
              type="date"
              value={config.labLaunchDate}
              onChange={(v) => patch({ labLaunchDate: v })}
            />
            <NumberField
              label="기준 꿈 기록"
              value={config.baseDreams}
              onChange={(v) => patch({ baseDreams: Number(v) })}
            />
            <NumberField
              label="기준 30일 결과"
              value={config.baseResults}
              onChange={(v) => patch({ baseResults: Number(v) })}
            />
            <NumberField
              label="기준 누적 연구일"
              value={config.baseResearchDays}
              onChange={(v) => patch({ baseResearchDays: Number(v) })}
            />
            <NumberField
              label="일평균 꿈 증가"
              value={config.dreamsPerDay}
              onChange={(v) => patch({ dreamsPerDay: Number(v) })}
            />
            <NumberField
              label="일평균 결과 증가"
              value={config.resultsPerDay}
              onChange={(v) => patch({ resultsPerDay: Number(v) })}
            />
            <NumberField
              label="일별 꿈 지터"
              value={config.dailyDreamJitter}
              onChange={(v) => patch({ dailyDreamJitter: Number(v) })}
            />
            <NumberField
              label="일별 결과 지터"
              value={config.dailyResultJitter}
              onChange={(v) => patch({ dailyResultJitter: Number(v) })}
            />
            <NumberField
              label="히트맵 주 수"
              value={config.contributionWeeks}
              min={8}
              max={52}
              onChange={(v) => patch({ contributionWeeks: Number(v) })}
            />
          </FieldGrid>
        </section>

        <section className="card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            라이브 미리보기
          </h3>
          <PreviewRow label="꿈 기록" value={preview.totalDreams} />
          <PreviewRow label="30일 결과" value={preview.totalFollowUpResults} accent />
          <PreviewRow label="누적 연구" value={preview.researchDays} suffix="일" />
          <hr className="border-border my-2" />
          <PreviewRow label="오늘 새로 관측된 꿈" value={preview.todayNewDreams} />
          <PreviewRow label="오늘 30일이 지난 기록" value={preview.todayFollowUpDue} />
          <PreviewRow label="새로운 패턴 발견" value={preview.todayNewPatterns} />
        </section>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">
          오늘 카운터 (base · max · tickMs)
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(Object.keys(COUNTER_LABELS) as CounterKey[]).map((key) => (
            <CounterCard
              key={key}
              title={COUNTER_LABELS[key]}
              counter={config[key]}
              onChange={(partial) => patchCounter(key, partial)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
}

function NumberField({
  label,
  value,
  onChange,
  type = "number",
  min,
  max,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  type?: "number" | "date";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[0.625rem] text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          type === "date"
            ? onChange(e.target.value)
            : onChange(String(Number(e.target.value) || 0))
        }
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
      />
    </label>
  );
}

function CounterCard({
  title,
  counter,
  onChange,
}: {
  title: string;
  counter: LiveCounterConfig;
  onChange: (partial: Partial<LiveCounterConfig>) => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <p className="text-sm font-medium text-text">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="시작(base)"
          value={counter.base}
          onChange={(v) => onChange({ base: Number(v) })}
        />
        <NumberField
          label="최대(max)"
          value={counter.max}
          onChange={(v) => onChange({ max: Number(v) })}
        />
        <NumberField
          label="틱(ms)"
          value={counter.tickMs}
          min={1000}
          onChange={(v) => onChange({ tickMs: Number(v) })}
        />
      </div>
      <p className="text-[0.625rem] text-text-muted">
        약 {(counter.tickMs / 1000).toFixed(0)}초마다 +1 · 오늘 상한 {counter.max}
      </p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  suffix = "건",
  accent = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-2 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-bold tabular-nums ${accent ? "text-accent" : "text-text"}`}>
        {value.toLocaleString()}
        <span className="text-text-muted font-normal text-xs ml-0.5">{suffix}</span>
      </span>
    </div>
  );
}
