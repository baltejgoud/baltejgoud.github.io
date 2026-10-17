"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

const format = (value: number, decimals: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** A number that counts up once when it scrolls into view. Renders the real value without JS. */
export function CountUp({ to, decimals = 0, duration = 1.6 }: { to: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!reduced && ref.current && !inView) ref.current.textContent = format(0, decimals);
    // Only the first layout pass should blank the number; later passes are handled by the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduced) {
      el.textContent = format(to, decimals);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        el.textContent = format(value, decimals);
      },
    });
    return () => controls.stop();
  }, [decimals, duration, inView, reduced, to]);

  return (
    <>
      <span ref={ref} aria-hidden>
        {format(to, decimals)}
      </span>
      <span className="sr-only">{format(to, decimals)}</span>
    </>
  );
}
