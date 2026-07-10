import { FormattedText } from "@/components/ui/FormattedText";

interface PageHeroProps {
  label?: string;
  title: string;
  desc?: string;
  descLead?: string;
  descMid?: string;
  descAccent?: string;
  className?: string;
  centered?: boolean;
}

/** 페이지 상단 — 궁금증 한두 줄, 세로로 길지 않게 */
export function PageHero({
  label,
  title,
  desc,
  descLead,
  descMid,
  descAccent,
  className = "",
  centered = true,
}: PageHeroProps) {
  const hasStructuredDesc = descLead || descMid || descAccent;
  const hasDesc = desc || hasStructuredDesc;

  return (
    <header className={`page-hero ${centered ? "text-center" : ""} ${className}`.trim()}>
      {label && <p className="section-label motion-shimmer">{label}</p>}
      <FormattedText as="h2" className={`page-title ${label ? "mt-1" : ""}`}>
        {title}
      </FormattedText>
      {hasDesc && (
        <div
          className={`page-desc-block mt-2 ${centered ? "mx-auto max-w-[21rem]" : "max-w-prose"}`}
        >
          {desc && (
            <FormattedText className="page-desc copy-lines">{desc}</FormattedText>
          )}
          {hasStructuredDesc && (
            <div className="space-y-1">
              {descLead && (
                <FormattedText className="page-desc copy-lines">{descLead}</FormattedText>
              )}
              {descMid && (
                <FormattedText className="page-desc copy-lines">{descMid}</FormattedText>
              )}
              {descAccent && (
                <FormattedText className="page-desc page-desc-accent copy-lines">
                  {descAccent}
                </FormattedText>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
