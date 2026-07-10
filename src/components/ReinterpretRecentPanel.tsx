import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessPolicy } from "@/hooks/useAccessPolicy";
import { usePremiumSheet } from "@/hooks/usePremiumSheet";
import { interpretDream } from "@/services/interpretService";
import { updateDreamInterpretation } from "@/services/dreamService";
import type { Dream } from "@/types";
import { LoadingSpinner } from "@/components/ui/Icon";

interface ReinterpretRecentPanelProps {
  dreams: Dream[];
  onUpdated?: () => void;
}

export function ReinterpretRecentPanel({ dreams, onUpdated }: ReinterpretRecentPanelProps) {
  const access = useAccessPolicy();
  const { openPremiumSheet } = usePremiumSheet();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recent = dreams.slice(0, 3);
  if (recent.length === 0) return null;

  const handleReinterpret = async (dream: Dream) => {
    if (!access.isPremium) {
      openPremiumSheet("최근 꿈을 AI로 다시 해석하려면 프리미엄이 필요합니다.");
      return;
    }

    setBusyId(dream.id);
    setError(null);
    try {
      const { interpretation } = await interpretDream(dream.title, dream.content);
      await updateDreamInterpretation(dream.id, interpretation);
      onUpdated?.();
      navigate(`/dream/${dream.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "다시 해석에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card-highlight p-5 space-y-4">
      <div>
        <p className="section-label">프리미엄 · AI 재해석</p>
        <h3 className="mt-1 text-base font-semibold text-text">최근 꿈 다시 해석해 보기</h3>
        <p className="mt-1 text-sm text-text-secondary leading-relaxed">
          같은 꿈도 시간이 지나면 다른 각도로 읽힙니다. 최근 기록 3건까지 AI 해몽을
          새로 받을 수 있어요.
        </p>
      </div>

      <ul className="space-y-2">
        {recent.map((dream) => (
          <li
            key={dream.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text line-clamp-1">
                {dream.title || "꿈 기록"}
              </p>
              <p className="text-[0.6875rem] text-text-muted">
                {dream.createdAt.toLocaleDateString("ko-KR")}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => void handleReinterpret(dream)}
              className="btn-secondary !w-auto !min-h-[2.25rem] shrink-0 px-3 text-xs !normal-case !tracking-normal disabled:opacity-50"
            >
              {busyId === dream.id ? "해석 중…" : access.isPremium ? "다시 해석" : "프리미엄"}
            </button>
          </li>
        ))}
      </ul>

      {busyId && (
        <div className="flex justify-center py-1">
          <LoadingSpinner label="AI가 다시 읽는 중" />
        </div>
      )}
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      {!access.isPremium && (
        <button
          type="button"
          onClick={() => openPremiumSheet("최근 꿈 AI 재해석은 프리미엄 전용입니다.")}
          className="btn-primary !min-h-[2.75rem] text-sm !normal-case !tracking-normal"
        >
          프리미엄으로 재해석 열기
        </button>
      )}
    </section>
  );
}
