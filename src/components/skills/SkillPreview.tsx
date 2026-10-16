"use client";

import { AnimatePresence, motion } from "motion/react";
import { SkillIcon } from "./SkillIcon";
import type { Skill } from "@/content/types";
import { categoryMeta } from "@/lib/skills";

export function SkillPreview({ skill }: { skill: Skill }) {
  const meta = categoryMeta[skill.category];
  return (
    <div className="min-h-[136px] rounded-[20px] border border-line bg-paper p-5 shadow-card lg:min-h-[420px] lg:p-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-4 lg:flex-col lg:gap-6"
        >
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cream lg:size-24">
            <SkillIcon skill={skill} className="size-7 lg:size-12" />
          </div>
          <div className="min-w-0">
            <p className="label flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight lg:text-3xl">{skill.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone lg:mt-4">
              <span className="font-medium text-ink">How I use it: </span>
              {skill.usage}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="label mt-6 hidden lg:block">Hover or tap any element</p>
    </div>
  );
}
