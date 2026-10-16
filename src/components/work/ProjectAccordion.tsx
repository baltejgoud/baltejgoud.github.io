"use client";

import { useState, type KeyboardEvent } from "react";
import { ProjectPanel } from "./ProjectPanel";
import type { Project } from "@/content/types";
import { cn } from "@/lib/cn";

const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Horizontal accordion of spines on wide screens; a vertical accordion below 1280px. One open at a time. */
export function ProjectAccordion({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);

  const open = (i: number, button: HTMLButtonElement) => {
    setActive(i);
    setInteracted(true);
    if (!window.matchMedia("(min-width: 1280px)").matches) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => button.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = projects.length - 1;
    else if (e.key in MOVES) next = (i + MOVES[e.key] + projects.length) % projects.length;
    else return;
    e.preventDefault();
    document.getElementById(`project-${projects[next].id}-button`)?.focus();
  };

  return (
    <div className="mt-14 flex flex-col gap-3 xl:h-[640px] xl:flex-row">
      {projects.map((project, i) => {
        const isOpen = i === active;
        return (
          <article
            key={project.id}
            className={cn(
              "overflow-hidden rounded-[24px] border border-line transition-[flex-grow,flex-basis,background-color,border-color] duration-[600ms] ease-out-expo",
              isOpen ? "bg-paper shadow-card xl:flex-[1_1_0%]" : "bg-cream hover:border-ink/30 xl:flex-[0_0_76px]",
            )}
          >
            <h3>
              <button
                id={`project-${project.id}-button`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`project-${project.id}-panel`}
                data-cursor={isOpen ? undefined : "Open"}
                onClick={(e) => open(i, e.currentTarget)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="block w-full text-left"
              >
                <span className="sr-only">{project.title}</span>
                {!isOpen && (
                  <span aria-hidden className="hidden h-[640px] w-[76px] flex-col items-center justify-between py-6 xl:flex">
                    <span className="font-mono text-xs text-stone">{project.index}</span>
                    <span className="rotate-180 whitespace-nowrap text-lg font-bold tracking-tight [writing-mode:vertical-rl]">
                      {project.title}
                    </span>
                    <span className="text-lg text-stone">+</span>
                  </span>
                )}
                <span aria-hidden className={cn("flex items-center gap-4 px-5 py-4 sm:px-8", !isOpen && "xl:hidden")}>
                  <span className="font-mono text-xs text-stone">{project.index}</span>
                  <span className="flex-1 truncate text-xl font-extrabold tracking-tight xl:hidden">{project.title}</span>
                  <span className="label hidden xl:inline">{project.category}</span>
                  <span className={cn("text-xl text-stone transition-transform duration-300 xl:hidden", isOpen && "rotate-45")}>+</span>
                </span>
              </button>
            </h3>
            <div id={`project-${project.id}-panel`} role="region" aria-labelledby={`project-${project.id}-button`} hidden={!isOpen}>
              {isOpen && <ProjectPanel project={project} animate={interacted} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}
