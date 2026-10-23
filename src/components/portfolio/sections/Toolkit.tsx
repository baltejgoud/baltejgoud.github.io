"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { skills } from "@/content/skills";
import type { SkillCategory } from "@/content/types";
import { categoryMeta, categoryOrder, filterAnnouncement } from "@/lib/skills";
import { gridMove } from "@/lib/grid";
import { SkillIcon } from "@/components/skills/SkillIcon";
import "./toolkit.css";

export function Toolkit() {
  const [category, setCategory] = useState<SkillCategory | null>(null);
  const [selectedId, setSelectedId] = useState(skills[0].id);
  const [focus, setFocus] = useState(0);
  const grid = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const selectedIndex = skills.findIndex((s) => s.id === selectedId);
  const selected = skills[selectedIndex];

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = grid.current;
    if (!el) return;
    const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length;
    const next = gridMove(focus, event.key, cols, skills.length);
    if (next === null) return;
    event.preventDefault();
    setFocus(next);
    setSelectedId(skills[next].id);
    el.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <section id="stack" className="p-section t-toolkit p-paper-edge" data-dock="life">
      <span id="skills" className="p-anchor-alias" aria-hidden />
      <div className="p-wrap">
        <div className="p-intro p-center" data-reveal>
          <p className="p-eyebrow">Toolkit</p>
          <h2>
            The elements I build with.
          </h2>
          <p className="p-description">
            {skills.length} tools, arranged like a periodic table. Pick an element to see where it shows up in my work.
          </p>
        </div>

        <div className="t-filters" role="group" aria-label="Filter by category" data-reveal>
          {[null, ...categoryOrder].map((c) => {
            const active = category === c;
            return (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={active}
                className={active ? "is-active" : ""}
                style={c ? ({ "--cat": categoryMeta[c].color } as CSSProperties) : undefined}
                onClick={() => setCategory(c === null || active ? null : c)}
              >
                {c && <i aria-hidden />}
                {c ? categoryMeta[c].label : "All"}
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {filterAnnouncement(skills, category)}
        </p>

        <div className="t-layout">
          <div
            ref={grid}
            className="t-grid"
            role="group"
            aria-label="Toolkit elements. Use the arrow keys to move between them."
            onKeyDown={onGridKey}
            data-reveal
          >
            {skills.map((skill, i) => {
              const dim = category !== null && skill.category !== category;
              return (
                <button
                  key={skill.id}
                  type="button"
                  className={`t-tile ${selectedId === skill.id ? "is-selected" : ""} ${dim ? "is-dim" : ""}`}
                  style={{ "--cat": categoryMeta[skill.category].color, "--i": i } as CSSProperties}
                  tabIndex={i === focus ? 0 : -1}
                  aria-pressed={selectedId === skill.id}
                  aria-label={`${skill.name}, ${categoryMeta[skill.category].label}`}
                  onClick={() => {
                    setSelectedId(skill.id);
                    setFocus(i);
                  }}
                  onMouseEnter={() => setSelectedId(skill.id)}
                  onFocus={() => setFocus(i)}
                >
                  <span className="t-num">{i + 1}</span>
                  <span className="t-symbol">{skill.symbol}</span>
                  <span className="t-name">{skill.name}</span>
                </button>
              );
            })}
          </div>

          <aside className="t-detail" aria-live="polite" data-reveal>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selected.id}
                initial={reduced ? false : { opacity: 0, y: 10, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ "--cat": categoryMeta[selected.category].color } as CSSProperties}
              >
                <div className="t-detail-tile">
                  <span className="t-num">{selectedIndex + 1}</span>
                  <span className="t-detail-icon">
                    <SkillIcon skill={selected} className="t-brand" />
                  </span>
                  <span className="t-symbol">{selected.symbol}</span>
                </div>
                <p className="t-detail-cat">
                  <i /> {categoryMeta[selected.category].label}
                </p>
                <h3>{selected.name}</h3>
                <p className="t-detail-usage">{selected.usage}</p>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </section>
  );
}
