import type { CSSProperties } from "react";
import { CONSUMER_JOURNEY } from "@/lib/productIdeas";

export function ConsumerJourneyStrip() {
  return (
    <div className="journey-strip">
      {CONSUMER_JOURNEY.map((item, i) => (
        <div
          key={item.step}
          className="journey-step motion-reveal"
          style={{ "--motion-delay": `${i * 70}ms` } as CSSProperties}
        >
          <span className={`journey-dot ${item.step === 1 ? "journey-dot-pulse" : ""}`}>
            {item.step}
          </span>
          <p className="journey-label">{item.label}</p>
          <p className="journey-hook">{item.hook}</p>
        </div>
      ))}
    </div>
  );
}
