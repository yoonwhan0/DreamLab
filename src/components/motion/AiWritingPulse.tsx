import { useEffect, useMemo, useState } from "react";
import {
  DATA_SEARCH_HEADLINE,
  DATA_SEARCH_LINES,
  LOADING_FIND_SIMILAR,
} from "@/lib/dataCopy";

interface AiWritingPulseProps {
  keyword?: string;
  /** 짧은 인라인 vs 카드 */
  variant?: "card" | "inline";
}

/** 해몽·탐색 — 비슷한 꿈 데이터 정제 연출 */
export function AiWritingPulse({ keyword, variant = "card" }: AiWritingPulseProps) {
  const lines = useMemo(() => {
    if (!keyword?.trim()) return [...DATA_SEARCH_LINES];
    const q = keyword.trim();
    return [
      `"${q}"와 비슷한 꿈을 찾는 중`,
      `"${q}" 한 달 뒤 기록을 정리하는 중`,
      ...DATA_SEARCH_LINES.slice(2),
    ];
  }, [keyword]);

  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState("");

  const fullLine = lines[lineIndex % lines.length]!;

  useEffect(() => {
    setLineIndex(0);
    setTyped("");
  }, [keyword, lines]);

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
      setTyped("");
    }, 2400);
    return () => clearInterval(rotate);
  }, [lines.length]);

  useEffect(() => {
    let i = 0;
    setTyped("");
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(fullLine.slice(0, i));
      if (i >= fullLine.length) clearInterval(tick);
    }, 36);
    return () => clearInterval(tick);
  }, [fullLine]);

  const body = (
    <>
      <div className="loading-pulse-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="text-sm font-semibold text-text motion-shimmer">{DATA_SEARCH_HEADLINE}</p>
      <p className="ai-writing-type text-xs text-text-secondary min-h-[1.25rem]" aria-live="polite">
        {typed}
        <span className="ai-writing-cursor" aria-hidden>
          |
        </span>
      </p>
      <div className="ai-writing-skeleton space-y-2 pt-1" aria-hidden="true">
        <div className="ai-writing-bar w-[92%]" />
        <div className="ai-writing-bar w-[78%]" />
        <div className="ai-writing-bar w-[85%]" />
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="ai-writing-pulse ai-writing-pulse--inline py-3 text-center space-y-2" role="status">
        <p className="sr-only">{LOADING_FIND_SIMILAR}</p>
        {body}
      </div>
    );
  }

  return (
    <div
      className="ai-writing-pulse card card-bezel border border-primary/20 bg-primary-soft/10 p-4 space-y-3"
      role="status"
      aria-live="polite"
      aria-label={LOADING_FIND_SIMILAR}
    >
      {body}
    </div>
  );
}
