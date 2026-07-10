import { AppLink } from "@/components/ui/AppLink";

interface StickyHomeCtaProps {
  label: string;
  hint?: string;
}

export function StickyHomeCta({ label, hint }: StickyHomeCtaProps) {
  return (
    <div className="home-sticky-cta motion-slide-up">
      {hint && <p className="home-sticky-hint">{hint}</p>}
      <AppLink to="/write" className="btn-primary">
        {label}
      </AppLink>
    </div>
  );
}
