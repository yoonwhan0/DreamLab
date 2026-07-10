import { useDemo } from "@/demo/DemoProvider";
import type { AccessTier } from "@/hooks/useAccessPolicy";

const TIERS: { id: AccessTier; label: string }[] = [
  { id: "guest", label: "비회원" },
  { id: "member", label: "회원" },
  { id: "premium", label: "프리미엄" },
];

export function DemoTierSwitcher() {
  const { enabled, demoTier, setDemoTier } = useDemo();

  if (!enabled) return null;

  return (
    <div className="fixed top-[3.75rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
      <div className="card flex items-center gap-1 p-1 shadow-md">
        <span className="shrink-0 px-2 text-xs font-semibold text-warning">데모</span>
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setDemoTier(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              demoTier === t.id
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDemoTier(null)}
          className="shrink-0 px-2 text-xs text-text-muted"
        >
          실제
        </button>
      </div>
    </div>
  );
}
