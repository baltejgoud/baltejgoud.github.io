"use client";

import { useEffect } from "react";
import { pointerToOffset } from "@/lib/parallax";

/** Writes --px / --py on the hero so .parallax layers drift with a fine pointer. */
export function HeroPointer() {
  useEffect(() => {
    const hero = document.getElementById("top");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hero || !fine || reduced) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { x, y } = pointerToOffset(e.clientX, e.clientY, hero.getBoundingClientRect());
        hero.style.setProperty("--px", x.toFixed(3));
        hero.style.setProperty("--py", y.toFixed(3));
      });
    };
    const onLeave = () => {
      hero.style.setProperty("--px", "0");
      hero.style.setProperty("--py", "0");
    };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
