"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { SkillPreview } from "./SkillPreview";
import { SkillTile } from "./SkillTile";
import type { Skill, SkillCategory } from "@/content/types";
import { cn } from "@/lib/cn";
import { gridMove } from "@/lib/grid";
import { categoryMeta, categoryOrder, filterAnnouncement } from "@/lib/skills";

export function PeriodicTable({ skills }: { skills: Skill[] }) {
  const [category, setCategory] = useState<SkillCategory | null>(null);
  const [previewId, setPreviewId] = useState(skills[0].id);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const preview = skills.find((s) => s.id === previewId) ?? skills[0];

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const next = gridMove(focusIndex, e.key, cols, skills.length);
    if (next === null) return;
    e.preventDefault();
    setFocusIndex(next);
    grid.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <div className="mt-10">
      <div
        role="group"
        aria-label="Filter by category"
        className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {[null, ...categoryOrder].map((c) => {
          const active = category === c;
          return (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(c === null || active ? null : c)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                active ? "border-ink bg-ink text-cream" : "border-line bg-paper/60 text-ink hover:border-ink/40",
              )}
            >
              {c && <span aria-hidden className="size-2 rounded-full" style={{ background: categoryMeta[c].color }} />}
              {c ? categoryMeta[c].label : "All"}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {filterAnnouncement(skills, category)}
      </p>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          ref={gridRef}
          role="group"
          aria-label="Skills"
          onKeyDown={onGridKey}
          className="order-2 grid grid-cols-4 gap-2 sm:gap-2.5 md:order-1 md:grid-cols-8"
        >
          {skills.map((s, i) => (
            <SkillTile
              key={s.id}
              skill={s}
              number={i + 1}
              state={category === null ? "idle" : s.category === category ? "match" : "dim"}
              selected={s.id === previewId}
              tabIndex={i === focusIndex ? 0 : -1}
              onPreview={() => setPreviewId(s.id)}
              onFocus={() => {
                setPreviewId(s.id);
                setFocusIndex(i);
              }}
            />
          ))}
        </div>
        <div className="sticky top-[calc(var(--nav-h)+8px)] z-10 order-1 md:order-2 lg:top-28">
          <SkillPreview skill={preview} />
        </div>
      </div>
    </div>
  );
}
