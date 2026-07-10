import { useEffect, useMemo, useState } from "react";

const DEFAULT_LINES = [
  "비슷한 꿈을 꾼 사람들 후기를 모으는 중",
  "한 달 뒤 결말 패턴을 정리하는 중",
  "생생한 후기 문장을 작성하는 중",
  "재물·연애·직장운 흐름을 계산하는 중",
  "관측 기록과 겹치는 장면을 찾는 중",
];

interface AiWritingPulseProps {
  keyword?: string;
  /** 짧은 인라인 vs 카드 */
  variant?: "card" | "inline";
}

/** 탐색·AI 해몽 — 타이핑 + 최소 대기 연출 */
export function AiWritingPulse({ keyword, variant = "card" }: AiWritingPulseProps) {
  const lines = useMemo(() => {
    if (!keyword?.trim()) return DEFAULT_LINES;
    const q = keyword.trim();
    return [
      `"${q}" — 비슷한 꿈 검색 중`,
      `"${q}" 꿈 30일 뒤 후기 작성 중`,
      ...DEFAULT_LINES.slice(2),
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
      <p className="text-sm font-semibold text-text motion-shimmer">AI 관측 · 작성 중</p>
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
        {body}
      </div>
    );
  }

  return (
    <div
      className="ai-writing-pulse card card-bezel border border-primary/20 bg-primary-soft/10 p-4 space-y-3"
      role="status"
      aria-live="polite"
    >
      {body}
    </div>
  );
}
