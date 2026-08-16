import { useEffect } from "react";
import type { CSSProperties } from "react";

const SPARKLE_COUNT = 16;
const DURATION_MS = 900;

interface SparkleBurstProps {
  onDone: () => void;
}

export function SparkleBurst({ onDone }: SparkleBurstProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <span
      aria-hidden="true"
      data-testid="sparkles"
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
    >
      {Array.from({ length: SPARKLE_COUNT }, (_, index) => (
        <span
          key={index}
          className="sparkle"
          style={{ "--sparkle-i": String(index) } as CSSProperties}
        />
      ))}
    </span>
  );
}
