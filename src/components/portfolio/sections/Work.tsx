"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, FlaskConical, GitFork as Github, ImageIcon, ListChecks, Play } from "lucide-react";
import { projects } from "@/content/projects";
import { workMedia } from "@/content/workMedia";
import { ProjectWidget } from "@/components/work/ProjectWidget";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import "./work.css";

type Tab = "try" | "see" | "built";

const tabs: { id: Tab; label: string; icon: typeof Play }[] = [
  { id: "try", label: "Try it", icon: Play },
  { id: "see", label: "See it", icon: ImageIcon },
  { id: "built", label: "What went in", icon: ListChecks },
];

export function Work() {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<Tab>("try");
  const [shot, setShot] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const stageNear = useInView(stage, { once: true, margin: "400px 0px" });
  const reduced = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const swipe = useRef<number | null>(null);
  const project = projects[selected];
  const media = workMedia[project.id];
  const count = projects.length;

  const select = (index: number) => {
    setSelected((index + count) % count);
    setShot(0);
  };
  const openStage = (next: Tab = "try") => {
    setTab(next);
    if (stage.current) scrollTo(window.scrollY + stage.current.getBoundingClientRect().top - 90);
  };
  const onDeckKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") select(selected + 1);
    else if (event.key === "ArrowLeft") select(selected - 1);
    else return;
    event.preventDefault();
  };
  const onTilt = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--rx", `${((event.clientY - box.top) / box.height - 0.5) * -10}deg`);
    event.currentTarget.style.setProperty("--ry", `${((event.clientX - box.left) / box.width - 0.5) * 12}deg`);
  };
  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  };
  const fade = reduced
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <section id="work" className="p-section w-work p-paper-edge" data-dock="work">
      <div className="p-wrap">
        <div className="p-intro p-center" data-reveal>
          <p className="p-eyebrow">Selected work</p>
          <h2>
            Six things I built.
            <br />
            <span className="w-run">Go ahead, run them.</span>
          </h2>
          <p className="p-description">
            Forecasting, AI coworkers, health data, fairer tickets. Every card opens a small working model of the idea, right here on the page.
          </p>
        </div>

        <div
          className="w-deck"
          role="group"
          aria-roledescription="carousel"
          aria-label="Projects. Use the left and right arrow keys to browse."
          tabIndex={0}
          onKeyDown={onDeckKey}
          onPointerDown={(e) => (swipe.current = e.clientX)}
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (Math.abs(dx) > 50) select(selected + (dx < 0 ? 1 : -1));
          }}
          data-reveal
        >
          {projects.map((item, index) => {
            const offset = ((index - selected + count + 3) % count) - 3;
            const isSelected = offset === 0;
            const cover = workMedia[item.id].cover;
            return (
              <button
                key={item.id}
                type="button"
                className={`w-card ${isSelected ? "is-selected" : ""}`}
                style={
                  {
                    "--offset": offset,
                    "--abs": Math.abs(offset),
                    "--accent": workMedia[item.id].accent,
                    zIndex: 10 - Math.abs(offset),
                  } as CSSProperties
                }
                onClick={() => (isSelected ? openStage("try") : select(index))}
                onPointerMove={isSelected ? onTilt : undefined}
                onPointerLeave={resetTilt}
                aria-label={isSelected ? `${item.title}: try it` : `Show ${item.title}`}
                tabIndex={isSelected ? 0 : -1}
              >
                <span className="w-card-top">
                  <span>
                    {item.index} / {item.category}
                  </span>
                  <ArrowUpRight size={18} />
                </span>
                <span className="w-card-image">
                  <Image src={cover.src} width={cover.width} height={cover.height} alt="" loading="lazy" sizes="360px" />
                  {cover.kind === "concept" && <span className="w-concept">Concept</span>}
                </span>
                <span className="w-card-body">
                  <strong>{item.title}</strong>
                  <span className="w-card-role">{item.role}</span>
                  <span className="w-card-summary">{item.summary}</span>
                  <span className="w-card-cta">
                    <span>
                      <FlaskConical size={14} /> Try the live model
                    </span>
                    <ArrowUpRight size={15} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-rail" role="group" aria-label="Choose a project">
          {projects.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === index}
              className={selected === index ? "is-active" : ""}
              style={{ "--accent": workMedia[item.id].accent } as CSSProperties}
              onClick={() => select(index)}
            >
              <span>{item.index}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>

        <div className="w-stage" ref={stage} style={{ "--accent": media.accent } as CSSProperties}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={project.id} className="w-info" {...fade}>
              <p className="w-info-eyebrow">
                {project.index} / {project.category}
              </p>
              <h3>{project.title}</h3>
              <p className="w-info-role">{project.role}</p>
              <p className="w-info-summary">{project.summary}</p>
              <div className="w-tags">
                {project.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="w-links">
                {project.links.caseStudy && (
                  <a href={project.links.caseStudy} className="p-button p-dark-button">
                    Read the case study <ArrowUpRight size={16} />
                  </a>
                )}
                {project.links.github && (
                  <a href={project.links.github} target="_blank" rel="noreferrer" className="p-button">
                    <Github size={16} /> Source <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="w-bench">
            <div className="w-tabs" role="tablist" aria-label={`${project.title} views`}>
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`w-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="w-panel"
                  tabIndex={tab === id ? 0 : -1}
                  className={tab === id ? "is-active" : ""}
                  onClick={() => setTab(id)}
                  onKeyDown={(event) => {
                    const index = tabs.findIndex((item) => item.id === id);
                    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                      : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
                      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
                    if (next === null) return;
                    event.preventDefault();
                    setTab(tabs[next].id);
                    document.getElementById(`w-tab-${tabs[next].id}`)?.focus();
                  }}
                >
                  {tab === id && <motion.span layoutId="w-tab-pill" className="w-tab-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div id="w-panel" role="tabpanel" aria-labelledby={`w-tab-${tab}`} className="w-panel">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={`${project.id}-${tab}`} className={`w-panel-inner w-panel-${tab}`} {...fade}>
                  {tab === "try" && (stageNear ? <ProjectWidget kind={project.widget} /> : <div className="w-widget-wait" />)}
                  {tab === "see" && (
                    <div className="w-gallery">
                      <figure className="w-browser">
                        <span className="w-browser-bar">
                          <i />
                          <i />
                          <i />
                          <small>{project.title.toLowerCase().replaceAll(" ", "")}.app</small>
                        </span>
                        <span className="w-browser-view">
                          <Image
                            key={media.shots[shot].src}
                            src={media.shots[shot].src}
                            width={media.shots[shot].width}
                            height={media.shots[shot].height}
                            alt={`${project.title}: ${media.shots[shot].caption}`}
                            sizes="(max-width: 760px) 92vw, 620px"
                          />
                        </span>
                        <figcaption>
                          {media.shots[shot].kind === "concept" && <span className="w-concept">Concept</span>}
                          {media.shots[shot].caption}
                        </figcaption>
                      </figure>
                      {media.shots.length > 1 && (
                        <div className="w-thumbs">
                          {media.shots.map((item, i) => (
                            <button
                              key={item.src}
                              type="button"
                              className={shot === i ? "is-active" : ""}
                              aria-pressed={shot === i}
                              aria-label={item.caption}
                              onClick={() => setShot(i)}
                            >
                              <Image src={item.src} width={item.width} height={item.height} alt="" sizes="96px" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {tab === "built" && (
                    <ul className="w-features">
                      {project.features.map((feature, i) => (
                        <li key={feature} style={{ "--i": i } as CSSProperties}>
                          <Check size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
