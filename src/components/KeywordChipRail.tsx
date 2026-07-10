import { useMemo } from "react";
import { previewKeywordLabel } from "@/lib/previewKeywords";

interface KeywordChipRailProps {
  keywords: string[];
  label: string;
  activeKeyword?: string;
  onSelect: (keyword: string) => void;
  /** home: 선택 하이라이트 / explore: 검색 실행 */
  variant?: "home" | "explore";
  className?: string;
}

function isKeywordActive(term: string, activeKeyword: string | undefined): boolean {
  if (activeKeyword == null) return false;
  return (
    term === activeKeyword ||
    previewKeywordLabel(term) === activeKeyword ||
    term === activeKeyword.replace(/ 꿈$/, "")
  );
}

export function KeywordChipRail({
  keywords,
  label,
  activeKeyword,
  onSelect,
  variant = "explore",
  className = "",
}: KeywordChipRailProps) {
  const unique = useMemo(
    () => [...new Set(keywords.map((k) => k.trim()).filter(Boolean))],
    [keywords],
  );

  if (unique.length === 0) return null;

  return (
    <section className={`keyword-chip-rail ${className}`.trim()}>
      <p className="keyword-chip-rail-label">{label}</p>
      <div className="keyword-chip-track" role="list" aria-label={label}>
        {unique.map((term) => {
          const isActive = variant === "home" && isKeywordActive(term, activeKeyword);

          return (
            <button
              key={term}
              type="button"
              role="listitem"
              onClick={() => onSelect(term)}
              className={`keyword-badge ${isActive ? "keyword-badge--active" : ""}`}
              aria-pressed={variant === "home" ? isActive : undefined}
            >
              {term}
            </button>
          );
        })}
      </div>
    </section>
  );
}
