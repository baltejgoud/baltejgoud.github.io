"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { magneticOffset } from "@/lib/magnet";

type Variant = "solid" | "outline";

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  magnetic?: boolean;
  className?: string;
  "aria-label"?: string;
}

interface LinkPill extends CommonProps {
  href: string;
  external?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

interface ButtonPill extends CommonProps {
  href?: undefined;
  onClick: () => void;
  "aria-pressed"?: boolean;
  disabled?: boolean;
}

const base =
  "relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";
const variants: Record<Variant, string> = {
  solid: "bg-ink text-cream hover:bg-[#2b2b2b]",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream",
};

/** Pill link or button. `magnetic` drifts it toward a fine pointer by up to 8px. */
export function Pill(props: LinkPill | ButtonPill) {
  const { children, variant = "solid", magnetic = false, className } = props;
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const active = magnetic && fine && !reduced;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18 });
  const y = useSpring(my, { stiffness: 260, damping: 18 });

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!active) return;
    const offset = magneticOffset(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    mx.set(offset.x);
    my.set(offset.y);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };
  const cls = cn(base, variants[variant], className);

  if (props.href !== undefined) {
    return (
      <motion.a
        href={props.href}
        className={cls}
        style={{ x, y }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={props.onClick}
        aria-label={props["aria-label"]}
        {...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      className={cls}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={props.onClick}
      aria-label={props["aria-label"]}
      aria-pressed={props["aria-pressed"]}
      disabled={props.disabled}
    >
      {children}
    </motion.button>
  );
}
