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
    <section className="card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text">
          AI 재해석
          {!access.isPremium && (
            <span className="ml-1.5 text-xs font-normal text-accent" aria-label="프리미엄">
              ⭐
            </span>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-text-muted">최근 기록 3건</p>
      </div>

      <ul className="space-y-1.5">
        {recent.map((dream) => (
          <li
            key={dream.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            <p className="min-w-0 flex-1 text-sm text-text line-clamp-1">
              {dream.title || "꿈 기록"}
            </p>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => void handleReinterpret(dream)}
              className="shrink-0 text-xs font-medium text-primary disabled:opacity-50"
            >
              {busyId === dream.id ? "…" : "다시 해석"}
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
    </section>
  );
}
