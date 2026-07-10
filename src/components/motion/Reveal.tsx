import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** 마운트 시 샤샤샥 등장 (stagger용 delay ms) */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const style = { "--motion-delay": `${delay}ms` } as CSSProperties;

  return (
    <div className={`motion-reveal ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
