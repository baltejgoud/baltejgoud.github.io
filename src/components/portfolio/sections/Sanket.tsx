"use client";

import type { CSSProperties, PointerEvent } from "react";
import Image from "next/image";
import { ArrowUpRight, Boxes, Code2, Database, Flag, Sparkles, TrendingUp } from "lucide-react";
import { InkText } from "../motion/InkText";
import { CountUp } from "../motion/CountUp";
import "./sanket.css";

const roles = [
  { title: "Co-founder & CEO", text: "Product direction and the business behind it", icon: Flag },
  { title: "Data & ML", text: "Demand forecasting, model routing and uncertainty", icon: Database },
  { title: "Product engineer", text: "APIs, tenant isolation and the dashboard", icon: Code2 },
  { title: "Product thinker", text: "Replenish. Hold. Investigate. Make it actionable.", icon: Sparkles },
];

const tilt = (event: PointerEvent<HTMLAnchorElement>) => {
  if (event.pointerType !== "mouse") return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--rx", `${((event.clientY - box.top) / box.height - 0.5) * -8}deg`);
  event.currentTarget.style.setProperty("--ry", `${((event.clientX - box.left) / box.width - 0.5) * 10}deg`);
};
const untilt = (event: PointerEvent<HTMLAnchorElement>) => {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
};

export function Sanket() {
  return (
    <section id="sanket" className="p-section k-sanket p-paper-edge" data-dock="work">
      <div className="p-wrap">
        <div className="k-head" data-reveal>
          <Image
            className="k-wordmark"
            src="/assets/logos/sanket-wordmark.webp"
            alt="Sanket — Supply Chain & Forecasting"
            width={900}
            height={307}
            sizes="300px"
          />
          <p className="p-eyebrow">My own company</p>
          <h2>
            I’m building <span className="k-name">Sanket.</span>
          </h2>
          <p className="k-define">
            <span lang="hi">संकेत</span> · <em>noun</em> · a signal; a sign of what’s coming.
          </p>
        </div>

        <div className="k-story">
          <InkText
            className="k-pitch"
            segments={[
              "What if a planning team could see ",
              { text: "what’s coming", mark: "wave", seed: 14 },
              " before the shelves ran empty? I’m building Sanket to turn ",
              { chip: <Database aria-hidden />, label: "operational data" },
              " into ",
              { chip: <TrendingUp aria-hidden />, label: "clearer forecasts" },
              " and ",
              { chip: <Boxes aria-hidden />, label: "better inventory decisions." },
            ]}
          />
          <a href="/work/sanket/" className="k-preview" onPointerMove={tilt} onPointerLeave={untilt} aria-label="Inside Sanket: read the case study">
            <Image src="/assets/work/sanket-dashboard.webp" width={1672} height={941} alt="Sanket’s decision dashboard with sandbox data" loading="lazy" sizes="(max-width: 760px) 92vw, 520px" />
            <span className="k-preview-tag">
              Inside Sanket <small>sandbox data</small> <ArrowUpRight size={17} />
            </span>
          </a>
        </div>

        <p className="p-eyebrow k-roles-label">The pipeline, and the roles I play in it</p>
        <ol className="k-pipeline" data-reveal>
          {roles.map(({ title, text, icon: Icon }, i) => (
            <li key={title} style={{ "--i": i } as CSSProperties}>
              <span className="k-node">
                <Icon size={22} strokeWidth={1.7} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div className="k-facts">
          <div data-reveal>
            <strong>
              <CountUp to={4} />
            </strong>
            <span>Industry verticals: fashion, electronics, pharma and agro</span>
          </div>
          <div data-reveal>
            <strong>
              <CountUp to={3} /> <small>+1</small>
            </strong>
            <span>Model routes (XGBoost, Prophet, ensembles) plus a zero-shot Chronos fallback for new SKUs</span>
          </div>
          <div data-reveal>
            <strong>±</strong>
            <span>Every forecast ships with its uncertainty band, not just a single line</span>
          </div>
        </div>

        <a href="/work/sanket/" className="p-button p-dark-button k-cta">
          Explore the Sanket story <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
