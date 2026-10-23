"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Award, Headphones, Music2, Trophy } from "lucide-react";
import { lifePhotos } from "@/content/life";
import { Draggable } from "../motion/Draggable";
import { useSite } from "../SiteContext";
import "./life.css";

const Pin = ({ tone = "red" }: { tone?: "red" | "blue" | "yellow" }) => <span className={`l-pin l-pin-${tone}`} aria-hidden />;

export function Life() {
  const board = useRef<HTMLDivElement>(null);
  const { openMusic } = useSite();
  return (
    <section id="life" className="p-section l-life p-paper-edge" data-dock="life">
      <div className="p-wrap">
        <div className="p-intro" data-reveal>
          <p className="p-eyebrow">Off the clock</p>
          <h2>More than the work tabs.</h2>
          <p className="p-description">Hyderabad is home. Football, Formula 1, a good film, a new place to explore, and Anirudh on repeat.</p>
        </div>

        <div className="l-board" ref={board} data-reveal>
          <Draggable className="l-item l-polaroid l-me" label="A photo of Baltej" board={board} rotate={-6}>
            <Pin />
            <Image src="/assets/portrait.webp" width={720} height={1432} alt="Baltej Goud" loading="lazy" draggable={false} sizes="270px" />
            <p>hey, the person behind the projects.</p>
          </Draggable>

          <Draggable className="l-item l-ticket" label="Top two at the Code for Good hackathon, 2024" board={board} rotate={3}>
            <Pin tone="blue" />
            <span className="l-ticket-main">
              <small>ADMIT ONE · HACKATHON</small>
              <strong>Top 2</strong>
              <span>Code for Good, 2024</span>
            </span>
            <span className="l-ticket-stub" aria-hidden>
              <Award size={22} />
            </span>
          </Draggable>

          <Draggable className="l-item l-note" label="About me, off the clock" board={board} rotate={4}>
            <Pin />
            <small>OFF THE CLOCK</small>
            <h3>
              Hi, I’m Baltej.
              <br />
              The other version.
            </h3>
            <p>Things I’ll always make time for</p>
            <ul>
              <li>Badminton, cricket & football</li>
              <li>Formula 1. Red Bull on race day.</li>
              <li>Max Verstappen & Cristiano Ronaldo fan</li>
              <li>A really good movie</li>
              <li>Visiting somewhere I haven’t been</li>
              <li>Anirudh. Preferably turned up.</li>
            </ul>
            <span className="p-handnote">curiosity doesn’t clock out.</span>
          </Draggable>

          <Draggable className="l-item l-captain" label="Football captain and district player" board={board} rotate={-3}>
            <Pin tone="yellow" />
            <Trophy size={36} strokeWidth={1.4} />
            <span>ON THE PITCH</span>
            <strong>Captain.</strong>
            <p>
              College football team.
              <br />
              District-level player.
            </p>
            <small>Same team spirit. Different field.</small>
          </Draggable>

          <Draggable className="l-item l-music" label="Anirudh on repeat" board={board} rotate={4}>
            <Pin tone="blue" />
            <span className="l-record" aria-hidden />
            <Headphones size={30} />
            <small>THE SOUNDTRACK</small>
            <h3>
              Anirudh.
              <br />
              On repeat.
            </h3>
            <button type="button" className="l-play" onClick={openMusic} onPointerDown={(e) => e.stopPropagation()}>
              <Music2 size={16} /> Open the player <ArrowUpRight size={14} />
            </button>
          </Draggable>

          <Draggable className="l-item l-pennant" label="First place at a Model United Nations" board={board} rotate={-8}>
            <Pin tone="yellow" />
            <strong>1st</strong>
            <span>Model United Nations</span>
          </Draggable>

          <Draggable className="l-item l-pass" label="Always up for a new place" board={board} rotate={6}>
            <Pin />
            <span>BOARDING PASS / A STATE OF MIND</span>
            <div>
              <strong>HYD</strong>
              <ArrowRight size={26} />
              <strong>NEXT</strong>
            </div>
            <p>
              Hyderabad <span>Somewhere new</span>
            </p>
            <hr />
            <small>PASSENGER</small>
            <b>Baltej Goud</b>
            <small>SEAT: WINDOW, PLEASE.</small>
          </Draggable>

          {lifePhotos.map((photo) => (
            <Draggable
              key={photo.src}
              className="l-item l-polaroid l-photo"
              label={photo.caption}
              board={board}
              rotate={photo.rotate}
              style={{ left: `${photo.left}%`, top: `${photo.top}%` }}
            >
              <Pin />
              <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" draggable={false} sizes="220px" />
              <p>{photo.caption}</p>
            </Draggable>
          ))}

          <p className="l-caption" aria-hidden>
            everything here is pinned loosely. rearrange at will.
          </p>
        </div>
      </div>
    </section>
  );
}
