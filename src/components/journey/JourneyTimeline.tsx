"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MilestoneCard } from "./MilestoneCard";
import type { Milestone } from "@/content/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { journeyPath } from "@/lib/journey";

/** Milestones along a dashed S-curve; a dot travels the curve with scroll progress. */
export function JourneyTimeline({ milestones }: { milestones: Milestone[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start center", "end center"] });
  const d = size.h > 0 ? journeyPath(size.w, size.h, milestones.length, desktop) : "";

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = useCallback((value: number) => {
    const path = pathRef.current;
    const progress = progressRef.current;
    const dot = dotRef.current;
    if (!path || !progress || !dot || !path.getAttribute("d")) return;
    const reduced = document.documentElement.classList.contains("reduced");
    const v = reduced ? 1 : Math.max(0, Math.min(1, value));
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * v);
    dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
    progress.style.strokeDasharray = `${length}`;
    progress.style.strokeDashoffset = `${length * (1 - v)}`;
  }, []);

  useMotionValueEvent(scrollYProgress, "change", place);
  useEffect(() => {
    place(scrollYProgress.get());
  }, [d, place, scrollYProgress]);

  return (
    <ol ref={listRef} className="relative mt-16">
      <svg
        aria-hidden
        width={size.w}
        height={size.h}
        className={cn("pointer-events-none absolute inset-0 overflow-visible", !d && "invisible")}
      >
        <path ref={pathRef} d={d} fill="none" stroke="var(--color-stone)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="6 8" />
        <path ref={progressRef} d={d} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round" />
        <g ref={dotRef}>
          <circle r={13} fill="var(--color-ink)" fillOpacity={0.1} />
          <circle r={6} fill="var(--color-ink)" />
        </g>
      </svg>
      {milestones.map((milestone, i) => {
        const left = i % 2 === 0;
        return (
          <li key={`${milestone.org}-${milestone.role}`} className="relative grid py-8 lg:grid-cols-2 lg:gap-x-32 lg:py-12">
            {milestone.watermark && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[clamp(4.5rem,13vw,11rem)] font-extrabold leading-none tracking-[-0.05em] text-watermark",
                  !left && "lg:left-0 lg:right-auto",
                )}
              >
                {milestone.watermark}
              </span>
            )}
            <div className={cn("relative z-10 pl-12 lg:pl-0", left ? "lg:col-start-1" : "lg:col-start-2")} data-reveal>
              <MilestoneCard milestone={milestone} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
