import { useEffect, useRef, useState } from "react";
import { APP_NAME, APP_NAME_EN } from "@/lib/branding";
import { APP_ICON } from "@/lib/brandAssets";

const MIN_MS = 1800;
const MAX_MS = 3000;
const TICK_MS = 28;

interface SplashScreenProps {
  onComplete: () => void;
}

function easeProgress(elapsed: number): number {
  const t = Math.min(1, Math.max(0, elapsed / MIN_MS));
  return Math.min(100, Math.round((1 - (1 - t) ** 2.1) * 100));
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const started = Date.now();
    let frame = 0;
    let cancelled = false;

    const finish = () => {
      if (finishedRef.current || cancelled) return;
      finishedRef.current = true;
      setProgress(100);
      onCompleteRef.current();
    };

    const tick = () => {
      if (cancelled || finishedRef.current) return;

      const elapsed = Date.now() - started;
      setProgress(easeProgress(elapsed));

      if (elapsed >= MIN_MS || elapsed >= MAX_MS) {
        finish();
        return;
      }

      frame = window.setTimeout(tick, TICK_MS);
    };

    tick();
    const safety = window.setTimeout(finish, MAX_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(frame);
      window.clearTimeout(safety);
    };
  }, []);

  const displayProgress = Number.isFinite(progress) ? progress : 0;

  return (
    <div className="splash-screen" role="status" aria-live="polite" aria-label="앱 로딩 중">
      <div className="splash-backdrop" aria-hidden />
      <div className="splash-vignette" aria-hidden />

      <div className="splash-hero splash-enter">
        <div className="splash-logo-stage">
          <div className="splash-logo-ring splash-logo-ring-outer" aria-hidden />
          <div className="splash-logo-ring splash-logo-ring-inner" aria-hidden />
          <div className="splash-logo-halo" aria-hidden />
          <img
            src={APP_ICON.lg}
            alt=""
            width={192}
            height={192}
            className="splash-logo"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div className="splash-brand-lockup">
          <p className="splash-brand-en brand-wordmark">{APP_NAME_EN}</p>
          <p className="splash-brand-ko">{APP_NAME}</p>
        </div>

        <div className="splash-progress" aria-hidden>
          <div className="splash-progress-track">
            <div
              className="splash-progress-fill"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
