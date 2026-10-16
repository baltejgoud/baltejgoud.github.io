"use client";

import { motion } from "motion/react";
import { ProjectWidget } from "./ProjectWidget";
import { Pill } from "@/components/ui/Pill";
import type { Project } from "@/content/types";

/** Expanded project: details on the left, live widget on the right (stacked below 1280px). */
export function ProjectPanel({ project, animate }: { project: Project; animate: boolean }) {
  const { github, caseStudy } = project.links;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      data-scroll-area
      className="grid gap-8 px-5 pb-6 sm:px-8 sm:pb-8 xl:h-[584px] xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:overflow-y-auto"
    >
      <div className="flex flex-col">
        <p className="hidden text-[clamp(2rem,3.4vw,3.25rem)] font-extrabold leading-none tracking-[-0.04em] xl:block">{project.title}</p>
        <p className="label xl:hidden">{project.category}</p>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/80">{project.summary}</p>
        <p className="mt-2 text-sm text-stone">{project.role}</p>
        <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {project.features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm leading-snug">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />
              {feature}
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.map((tech) => (
            <li key={tech} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-stone">
              {tech}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
          {github ? (
            <Pill href={github} external magnetic>
              View on GitHub <span aria-hidden>↗</span>
            </Pill>
          ) : (
            caseStudy && (
              <Pill href={caseStudy} magnetic>
                Read case study <span aria-hidden>↗</span>
              </Pill>
            )
          )}
          {github && caseStudy && (
            <a
              href={caseStudy}
              className="text-sm font-semibold underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Case study ↗
            </a>
          )}
        </div>
      </div>
      <div className="min-h-[380px]">
        <ProjectWidget kind={project.widget} />
      </div>
    </motion.div>
  );
}
