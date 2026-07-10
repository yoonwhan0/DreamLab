import {
  CURIOSITY_HOOKS,
  SERVICE_PROMISE,
  SERVICE_TAGLINE,
} from "@/lib/productIdeas";

export function CuriosityBanner() {
  return (
    <section className="card p-5 space-y-4">
      <div>
        <p className="section-label">왜 궁금해지는지</p>
        <p className="mt-1 text-base font-semibold text-text">{SERVICE_TAGLINE}</p>
        <p className="mt-1 text-sm text-text-secondary leading-relaxed">
          {SERVICE_PROMISE}
        </p>
      </div>
      <ul className="space-y-3">
        {CURIOSITY_HOOKS.map((hook) => (
          <li key={hook.id} className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="text-sm font-medium text-text">{hook.title}</p>
            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
              {hook.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
