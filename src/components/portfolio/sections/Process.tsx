"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import {
  SIGNAL_EDGES,
  SIGNAL_GAPS,
  SIGNAL_STAGE,
  signalBandPath,
  signalDots,
  signalLoop,
  signalTrendPath,
} from "@/lib/valley/signalStates";
import "./process.css";

const steps = [
  ["Ask the useful question", "Start with the decision someone needs to make, and work back to the data."],
  ["Get the data into shape", "Clean, explore and understand what’s missing before choosing a model."],
  ["Build a clear baseline", "Make a simple answer work first. Add complexity when it earns its place."],
  ["Make it usable", "Turn analysis into a dashboard, a workflow or a product people can act on."],
  ["Check the whole system", "Inspect outcomes, uncertainty and the edges where things can go wrong."],
  ["Keep learning", "Listen, measure, improve. There’s always a better question to ask."],
] as const;

const captions = [
  "Raw data, before the question",
  `${SIGNAL_GAPS} gaps filled · ${SIGNAL_EDGES} outliers set aside`,
  "A simple linear baseline",
  "Shaped into a view people use",
  `Uncertainty band · ${SIGNAL_EDGES} edge cases flagged`,
  "Measure, learn, ask again",
];

const { width: W, height: H } = SIGNAL_STAGE;
const dots = signalDots().map((dot) => ({
  kind: dot.kind,
  style: Object.fromEntries([
    ...dot.at.flatMap((p, step) => [
      [`--x${step}`, p.x],
      [`--y${step}`, p.y],
    ]),
    ["--d", dot.delay],
  ]) as CSSProperties,
}));
const trend = signalTrendPath();
const band = signalBandPath();
const loop = signalLoop();

// The step crossing the reading line drives the stage. On phones the stage pins to the top, so
// the line sits halfway down the space left beneath it.
function readingLine(stage: HTMLElement | null) {
  const pinned = stage?.getBoundingClientRect();
  return window.matchMedia("(max-width: 760px)").matches && pinned
    ? (pinned.bottom + window.innerHeight) / 2
    : window.innerHeight / 2;
}

export function Process() {
  const list = useRef<HTMLOListElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const items = list.current?.children;
      if (!items) return;
      const line = readingLine(stage.current);
      let next = 0;
      for (let i = 0; i < items.length; i++)
        if (items[i].getBoundingClientRect().top <= line) next = i;
      setActive(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const go = (index: number) => {
    const item = list.current?.children[index];
    if (!item) return;
    const top = item.getBoundingClientRect().top;
    scrollTo(window.scrollY + top - readingLine(stage.current) + 40, { immediate: reduced });
  };

  return (
    <section id="process" className="p-section r-process p-paper-edge" data-dock="journey">
      <div className="p-wrap">
        <div className="p-intro" data-reveal>
          <p className="p-eyebrow">How I work</p>
          <h2>
            First, the right question.
            <br />
            Then, the useful answer.
          </h2>
          <p className="p-description">
            One handful of data, taken from a first question to a useful answer. Scroll, and watch
            the noise turn into a signal.
          </p>
        </div>

        <div className="r-scrolly">
          <ol ref={list} className="r-steps">
            {steps.map(([title, text], i) => (
              <li key={title} className={`r-step ${i === active ? "is-active" : ""}`}>
                <span className="r-step-n">
                  0{i + 1} <i>/ 0{steps.length}</i>
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>

          <div ref={stage} className="r-stage-wrap">
            <figure className="r-stage" data-step={active} aria-hidden>
              <figcaption className="r-stage-top">
                <span>Illustrative data</span>
                <span key={active} className="r-caption">
                  {captions[active]}
                </span>
              </figcaption>
              <svg viewBox={`0 0 ${W} ${H}`}>
                <g className="r-layer r-card" data-on="3">
                  <rect x={40} y={28} width={520} height={384} rx={18} />
                  <rect className="r-skeleton" x={70} y={56} width={150} height={11} rx={5.5} />
                  <rect className="r-skeleton" x={70} y={77} width={92} height={8} rx={4} />
                  <rect className="r-skeleton" x={434} y={56} width={52} height={20} rx={10} />
                  <rect className="r-skeleton" x={494} y={56} width={36} height={20} rx={10} />
                  <line x1={70} x2={530} y1={384} y2={384} />
                </g>
                <path className="r-layer r-band" data-on="4" d={band} />
                <g className="r-layer r-axes" data-on="2 4">
                  <path d="M50 30V380H490" />
                </g>
                <g className="r-layer r-table" data-on="1">
                  {Array.from({ length: 11 }, (_, c) => (
                    <rect key={c} className="r-skeleton" x={67 + c * 38} y={46} width={22} height={7} rx={3.5} />
                  ))}
                  {Array.from({ length: 9 }, (_, r) => (
                    <line key={r} x1={58} x2={478} y1={94 + r * 28} y2={94 + r * 28} />
                  ))}
                </g>
                <g className="r-layer r-aside" data-on="1 2">
                  <line x1={505} x2={505} y1={40} y2={350} />
                  <text x={548} y={53}>
                    SET ASIDE
                  </text>
                </g>
                <g className="r-layer r-ask" data-on="0 5">
                  <circle cx={300} cy={220} r={46} />
                  <text x={300} y={237}>
                    ?
                  </text>
                </g>
                <g className="r-layer r-loop" data-on="5">
                  <path d={loop.arc} />
                  <path className="r-loop-head" d={loop.arrow} />
                </g>
                <g className="r-dots">
                  {dots.map((dot, i) => (
                    <circle key={i} r={5.5} className={`r-dot is-${dot.kind}`} style={dot.style} />
                  ))}
                </g>
                <path className="r-layer r-trend" data-on="2 4" d={trend} pathLength={1} />
              </svg>
            </figure>
            <nav className="r-rail" aria-label="How I work steps">
              {steps.map(([title], i) => (
                <button
                  key={title}
                  className={i === active ? "is-active" : i < active ? "is-done" : ""}
                  onClick={() => go(i)}
                  aria-label={`Step ${i + 1}: ${title}`}
                  aria-current={i === active ? "step" : undefined}
                >
                  <span>0{i + 1}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
