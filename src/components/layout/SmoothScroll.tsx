"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

const NAV_OFFSET = -88;
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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      anchors: { offset: NAV_OFFSET },
      // Let inner panels that can actually scroll (data-scroll-area) handle their own wheel events.
      prevent: (node) => node.hasAttribute("data-scroll-area") && node.scrollHeight > node.clientHeight + 1,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: Target) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: NAV_OFFSET, force: true });
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
