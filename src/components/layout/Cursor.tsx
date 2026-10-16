"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

type Mode = { kind: "idle" } | { kind: "link" } | { kind: "label"; text: string };

const sameMode = (a: Mode, b: Mode) =>
  a.kind === b.kind && (a.kind !== "label" || (b.kind === "label" && a.text === b.text));

/** Follower ring that grows over links and shows a label over [data-cursor] elements. The native cursor stays. */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  if (!fine || reduced) return null;
  return <CursorRing />;
}

function CursorRing() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 45, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 600, damping: 45, mass: 0.35 });
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      const next: Mode = labelled?.dataset.cursor
        ? { kind: "label", text: labelled.dataset.cursor }
        : target?.closest("a, button, [role='button'], input, label")
          ? { kind: "link" }
          : { kind: "idle" };
      setMode((prev) => (sameMode(prev, next) ? prev : next));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  const size = mode.kind === "label" ? 84 : mode.kind === "link" ? 52 : 26;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ x: sx, y: sy }}>
      <div
        className={cn(
          "grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[width,height,background-color,border-color,opacity] duration-300 ease-out-expo",
          mode.kind === "label" && "bg-ink text-cream",
          mode.kind === "link" && "bg-ink/10",
          mode.kind === "idle" && "border border-ink/35",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ width: size, height: size }}
      >
        {mode.kind === "label" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{mode.text}</span>
        )}
      </div>
    </motion.div>
  );
}
