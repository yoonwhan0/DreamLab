import { useState } from "react";
import { BRAND_CLOSING, BRAND_MANIFESTO, BRAND_TAGLINE } from "@/lib/branding";
import { CURIOSITY_HOOKS } from "@/lib/productIdeas";
import { PolicyBanner } from "@/components/AccessGate";

export function ServiceIntroAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-center text-sm font-medium text-text-muted py-2 hover:text-primary transition-colors"
        aria-expanded={open}
      >
        {open ? "접기 ▲" : "꿈연구소가 뭐하는 곳인지 ▼"}
      </button>

      {open && (
        <div className="space-y-4 pt-2 motion-accordion-open">
          <div className="card card-bezel card-glow p-4 space-y-3">
            <p className="text-sm font-semibold text-text text-center">{BRAND_TAGLINE}</p>
            <p className="text-xs text-text-secondary text-center copy-lines leading-relaxed">
              {BRAND_MANIFESTO}
            </p>
            <ul className="space-y-2">
              {CURIOSITY_HOOKS.map((hook) => (
                <li key={hook.id} className="rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-xs font-medium text-text">{hook.title}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-text-secondary leading-relaxed">
                    {hook.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <PolicyBanner />
          <p className="text-[0.6875rem] text-text-muted text-center">{BRAND_CLOSING}</p>
        </div>
      )}
    </div>
  );
}
