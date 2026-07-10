import { useEffect, useRef, useState } from "react";

interface LiveStatProps {
  value: number;
  className?: string;
  pulseOnChange?: boolean;
}

/** 숫자가 바뀔 때 부드럽게 카운트업 */
export function LiveStat({
  value,
  className = "",
  pulseOnChange = true,
}: LiveStatProps) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const prevTargetRef = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const start = displayRef.current;
    const target = value;
    if (start === target) return;

    const startTime = performance.now();
    const duration = Math.min(900, 280 + Math.abs(target - start) * 12);
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(start + (target - start) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        displayRef.current = target;
        setDisplay(target);
        if (pulseOnChange && target > prevTargetRef.current) {
          setPulse(true);
          prevTargetRef.current = target;
          window.setTimeout(() => setPulse(false), 420);
        }
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, pulseOnChange]);

  return (
    <span
      className={`tabular-nums transition-colors duration-300 ${
        pulse ? "text-primary" : ""
      } ${className}`.trim()}
    >
      {display.toLocaleString()}
    </span>
  );
}
