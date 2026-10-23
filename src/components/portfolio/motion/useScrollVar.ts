"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

export type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

/**
 * Writes an element's scroll progress (0..1) into a CSS custom property every frame, so CSS can
 * derive many animations from one value without React re-renders. Under reduced motion the
 * property is pinned at 1, which every consumer treats as "finished".
 */
export function useScrollVar(ref: RefObject<HTMLElement | null>, name: string, offset: ScrollOffset) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (!reduced) ref.current?.style.setProperty(name, value.toFixed(4));
  });

  useEffect(() => {
    ref.current?.style.setProperty(name, reduced ? "1" : scrollYProgress.get().toFixed(4));
  }, [name, reduced, ref, scrollYProgress]);

  return scrollYProgress;
}
