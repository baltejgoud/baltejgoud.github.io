"use client";

import { useRef } from "react";
import { Code2, GraduationCap } from "lucide-react";
import { InkText } from "../motion/InkText";
import { Draggable } from "../motion/Draggable";
import "./story.css";

const sources = [
  { name: "B V Raju Institute of Technology", logo: "/assets/logos/bvrit-mark.webp" },
  { name: "Haritha Industries", logo: "/assets/logos/haritha-mark.webp" },
  { name: "Tectoro Consulting", logo: "/assets/logos/tectoro-mark.webp" },
  { name: "Sanket", logo: "/assets/logos/sanket-mark.webp" },
];

export function Story() {
  const board = useRef<HTMLDivElement>(null);
  return (
    <section id="story" className="p-section s-story p-paper-edge" data-dock="top">
      <span id="about" className="p-anchor-alias" aria-hidden />
      <div className="p-wrap s-layout">
        <div>
          <p className="p-eyebrow">The short version</p>
          <InkText
            className="s-copy"
            segments={[
              "I started with ",
              { text: "computer science,", mark: "marker" },
              " learning how systems work. Then I got curious about ",
              { text: "what the data", mark: "loop", note: "the signal", seed: 21 },
              " was trying to say. That took me from tutoring and analysis to AI, and now to ",
              { text: "building the things", mark: "trend", seed: 5 },
              " that make it useful.",
            ]}
          />
        </div>
        <div className="s-board" ref={board}>
          <Draggable className="s-sticky s-sticky-yellow" label="BVRIT, class of 2023" board={board} rotate={-6}>
            <span className="p-tape" />
            <GraduationCap size={27} />
            <strong>BVRIT, class of ’23.</strong>
            <p>
              Computer Science & Engineering.
              <br />A foundation. Not the finish line.
            </p>
            <small>2019 → 2023</small>
          </Draggable>
          <Draggable className="s-sticky s-sticky-blue" label="Analyst brain, builder’s instinct" board={board} rotate={5}>
            <span className="p-tape" />
            <Code2 size={27} />
            <strong>
              Analyst brain.
              <br />
              Builder’s instinct.
            </strong>
            <p>Haritha · Tectoro · Sanket</p>
            <small>ALWAYS CURIOUS</small>
          </Draggable>
          <p className="s-board-hint p-handnote" aria-hidden>
            go on, rearrange them
          </p>
        </div>
      </div>
      <figure className="p-wrap s-sources" data-reveal>
        <figcaption>
          <span>Fig. 1</span> Sources for this story
        </figcaption>
        <ul>
          {sources.map((source, i) => (
            <li key={source.name} style={{ transitionDelay: `${i * 70}ms` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.logo} alt="" width={30} height={30} loading="lazy" />
              {source.name}
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}
