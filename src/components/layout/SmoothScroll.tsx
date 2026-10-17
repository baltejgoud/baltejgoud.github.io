"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

type Target = string | HTMLElement | number;

interface ScrollApi {
  scrollTo: (target: Target) => void;
  stop: () => void;
  start: () => void;
}

const ScrollContext = createContext<ScrollApi | null>(null);

function canScrollInside(target: EventTarget | null, deltaY: number) {
  const area = target instanceof Element ? target.closest<HTMLElement>("[data-scroll-area]") : null;
  if (!area) return false;
  return deltaY > 0 ? area.scrollTop + area.clientHeight < area.scrollHeight - 1 : deltaY < 0 && area.scrollTop > 0;
}

/** One Lenis instance for the page; skipped entirely under reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      // Lenis honours each section's CSS scroll-margin-top, which already clears the sticky nav.
      anchors: true,
      // An inner panel (data-scroll-area) takes the wheel only while it can still scroll that way;
      // otherwise the page scrolls, so a panel under the cursor never swallows the wheel.
      virtualScroll: ({ deltaY, event }) => !(event.type === "wheel" && canScrollInside(event.target, deltaY)),
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
