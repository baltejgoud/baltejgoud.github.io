"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useMotionValueEvent } from "motion/react";
import { bandPath, pointAt, processSeries, reachedStep, smoothPath } from "@/lib/valley/processChart";
import { useScrollVar } from "../motion/useScrollVar";
import "./process.css";

const steps = [
  ["Ask the useful question", "Start with the decision someone needs to make, and work back to the data."],
  ["Get the data into shape", "Clean, explore and understand what’s missing before choosing a model."],
  ["Build a clear baseline", "Make a simple answer work first. Add complexity when it earns its place."],
  ["Make it usable", "Turn analysis into a dashboard, a workflow or a product people can act on."],
  ["Check the whole system", "Inspect outcomes, uncertainty and the edges where things can go wrong."],
  ["Keep learning", "Listen, measure, improve. There’s always a better question to ask."],
] as const;

const W = 1100;
const H = 400;
const series = processSeries(steps.length);
const actual = smoothPath(series, "y", W, H);
const forecast = smoothPath(series, "trend", W, H);
const band = bandPath(series, W, H);
const points = series.map((p) => pointAt(p, W, H));

export function Process() {
  const chart = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(-1);
  const progress = useScrollVar(chart, "--trace", ["start 0.75", "end 0.55"]);
  useMotionValueEvent(progress, "change", (value) => setReached(reachedStep(value, steps.length)));

  return (
    <section id="process" className="p-section r-process p-paper-edge" data-dock="journey">
      <div className="p-wrap">
        <div className="p-section-heading-row">
          <div className="p-intro" data-reveal>
            <p className="p-eyebrow">How I work</p>
            <h2>
              First, the right question.
              <br />
              Then, the useful answer.
            </h2>
            <p className="p-description">
              Drawn the way I’d chart it: a plan, its uncertainty, and what actually happened along the way.
            </p>
          </div>
          <ul className="r-legend" aria-hidden data-reveal>
            <li>
              <i className="r-key-forecast" /> plan
            </li>
            <li>
              <i className="r-key-band" /> uncertainty
            </li>
            <li>
              <i className="r-key-actual" /> what happened
            </li>
          </ul>
        </div>

        <div className="r-chart" ref={chart} style={{ "--count": steps.length } as CSSProperties}>
          <div className="r-plot">
            <svg viewBox={`0 0 ${W} ${H}`} className="r-svg" aria-hidden>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} className="r-grid" />
              ))}
              <path d={band} className="r-band" />
              <path d={forecast} className="r-forecast" />
              <path d={actual} className="r-actual" pathLength={1} />
              {points.map((p, i) => (
                <g key={i} className={`r-point ${i <= reached ? "is-reached" : ""}`} transform={`translate(${p.x} ${p.y})`}>
                  <circle r={15} className="r-point-halo" />
                  <circle r={7} className="r-point-dot" />
                </g>
              ))}
            </svg>
            <ol className="r-steps">
              {steps.map(([title, text], i) => (
                <li
                  key={title}
                  className={`r-step ${i <= reached ? "is-reached" : ""} ${i % 2 === 0 ? "is-above" : "is-below"}`}
                  style={{ "--px": (points[i].x / W) * 100, "--py": (points[i].y / H) * 100, "--i": i } as CSSProperties}
                >
                  <span className="r-step-n">0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="r-axis" aria-hidden>
            <span>first question</span>
            <span>useful answer</span>
          </div>
        </div>
      </div>
    </section>
  );
}
