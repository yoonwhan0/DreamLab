import { Link } from "react-router-dom";

interface CuriosityTeaseProps {
  label?: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  className?: string;
}

/** 페이지 하단 — 궁금증 1줄 + CTA */
export function CuriosityTease({
  label = "한 달 뒤 결말",
  title,
  body,
  cta,
  to,
  className = "",
}: CuriosityTeaseProps) {
  return (
    <Link
      to={to}
      className={`card card-bezel block p-4 ring-1 ring-accent/20 hover:ring-accent/40 transition-colors ${className}`.trim()}
    >
      <p className="section-label !mb-1">{label}</p>
      <p className="font-semibold text-text text-sm leading-snug">{title}</p>
      <p className="mt-1 text-xs text-text-secondary copy-lines leading-relaxed">{body}</p>
      <p className="mt-2 text-xs font-medium text-primary">{cta} →</p>
    </Link>
  );
}
