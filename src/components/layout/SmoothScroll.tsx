"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type Target = string | HTMLElement | number;

interface ScrollApi {
  scrollTo: (target: Target) => void;
  stop: () => void;
  start: () => void;
}

const ScrollContext = createContext<ScrollApi | null>(null);

/** One Lenis instance for the page; skipped entirely under reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      // Lenis honours each section's CSS scroll-margin-top, which already clears the sticky nav.
      anchors: true,
      // Let textareas, galleries and story panels scroll natively, then hand the
      // wheel back to the page at their edges. This also covers unmarked panels.
      allowNestedScroll: true,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const scrollTo = useCallback((target: Target) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { force: true });
      return;
    }
    if (typeof target === "number") window.scrollTo({ top: target });
    else (typeof target === "string" ? document.querySelector<HTMLElement>(target) : target)?.scrollIntoView();
  }, []);
  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);
  const api = useMemo(() => ({ scrollTo, stop, start }), [scrollTo, stop, start]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollApi {
  const api = useContext(ScrollContext);
  if (!api) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return api;
}
