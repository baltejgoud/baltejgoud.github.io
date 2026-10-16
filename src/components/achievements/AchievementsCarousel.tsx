"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { AchievementCard } from "./AchievementCard";
import type { Achievement } from "@/content/types";

const navButton =
  "grid size-11 place-items-center rounded-full border border-ink/20 transition-colors duration-200 hover:bg-ink hover:text-cream disabled:pointer-events-none disabled:opacity-30";

/** Horizontally scrolling bento row: snap, mouse drag with momentum, buttons and a progress bar. */
export function AchievementsCarousel({ items }: { items: Achievement[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startLeft: number; lastX: number; lastT: number; v: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const scrollByCard = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (!el || !(card instanceof HTMLElement)) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: smooth() });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { id: e.pointerId, startX: e.clientX, startLeft: el.scrollLeft, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dt = Math.max(e.timeStamp - d.lastT, 1);
    d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    e.currentTarget.scrollLeft = d.startLeft - (e.clientX - d.startX);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const el = e.currentTarget;
    el.style.scrollSnapType = "";
    el.scrollBy({ left: -d.v * 220, behavior: smooth() });
  };

  return (
    <div className="mt-10">
      <div className="container-page flex justify-end gap-2">
        <button type="button" aria-label="Previous achievement" disabled={edges.start} onClick={() => scrollByCard(-1)} className={navButton}>
          <ArrowLeft aria-hidden className="size-4" />
        </button>
        <button type="button" aria-label="Next achievement" disabled={edges.end} onClick={() => scrollByCard(1)} className={navButton}>
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Achievements"
        tabIndex={0}
        data-cursor="Drag"
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="no-scrollbar mt-6 flex cursor-grab snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-4 active:cursor-grabbing min-[1400px]:scroll-px-[calc((100vw-1320px)/2+var(--gutter))] min-[1400px]:px-[calc((100vw-1320px)/2+var(--gutter))]"
      >
        {items.map((achievement, i) => (
          <AchievementCard key={achievement.title} achievement={achievement} index={i} />
        ))}
      </div>
      <div className="container-page mt-4">
        <div className="h-px w-full bg-line">
          <div
            className="h-px origin-left bg-ink transition-transform duration-200"
            style={{ transform: `scaleX(${Math.max(0.06, progress)})` }}
          />
        </div>
      </div>
    </div>
  );
}
