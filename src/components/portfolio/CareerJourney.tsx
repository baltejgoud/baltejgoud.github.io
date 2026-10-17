"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Flag,
  Map,
  RotateCcw,
  X,
} from "lucide-react";
import { journey } from "@/content/journey";
import { journeyStories } from "@/content/journey-stories";
import route from "@/content/journey-route.json";
import {
  journeyScrollState,
  journeyStopProgress,
  pointOnJourney,
} from "@/lib/careerJourney";
import type { DriveFrame } from "@/lib/trackside";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { useSite } from "./SiteContext";
import { profile } from "@/content/profile";
import type { TracksideRenderer } from "./trackside/TracksideScene";
import "./career-journey.css";

export interface CareerJourneyHandle {
  goTo: (index: number) => void;
}
type Photo = { src: string; caption: string };
const chapters = [
  "The foundation",
  "Pass it on",
  "Go independent",
  "Find the signal",
  "Build intelligence",
  "Take the lead",
  "The next chapter",
];

export const CareerJourney = forwardRef<CareerJourneyHandle>(
  function CareerJourney(_, ref) {
    const track = useRef<HTMLDivElement>(null);
    const scene = useRef<HTMLDivElement>(null);
    const host = useRef<HTMLDivElement>(null);
    const popup = useRef<HTMLElement>(null);
    const wire = useRef<SVGPathElement>(null);
    const miniCar = useRef<SVGCircleElement>(null);
    const miniProgress = useRef<SVGPathElement>(null);
    const percentage = useRef<HTMLSpanElement>(null);
    const lightbox = useRef<HTMLDialogElement>(null);
    const renderer = useRef<TracksideRenderer | null>(null);
    const frame = useRef(0);
    const compact = useMediaQuery("(max-width: 760px)");
    const reduced = usePrefersReducedMotion();
    const { dark } = useSite();
    const [selected, setSelected] = useState(0);
    const [overview, setOverview] = useState(true);
    const [arrived, setArrived] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [mapOpen, setMapOpen] = useState(false);
    const [webgl, setWebgl] = useState(false);
    const state = useRef<DriveFrame & { reduced: boolean }>({
      distance: 0,
      approach: 0,
      overview: true,
      index: 0,
      arrival: 0,
      compact: false,
      dark: false,
      reduced: false,
    });
    const rendered = useRef({ index: 0, overview: true, arrived: false });
    const {
      scrollTo,
      stop: stopScroll,
      start: startScroll,
    } = useSmoothScroll();

    const paint = useCallback(() => {
      if (!track.current || !scene.current) return;
      const current = state.current;
      if (!current.reduced) {
        const range = Math.max(
          1,
          track.current.offsetHeight - scene.current.offsetHeight,
        );
        const next = journeyScrollState(
          -track.current.getBoundingClientRect().top / range,
        );
        current.index = next.index;
        current.overview = next.overview;
        current.distance = next.distance;
        current.approach = next.overview ? 0 : next.firstApproach;
        current.arrival = next.arrival;
      }
      const visible = !current.overview && current.arrival > 0.7;
      if (rendered.current.index !== current.index) {
        rendered.current.index = current.index;
        setSelected(current.index);
        setExpanded(false);
        setDismissed(false);
      }
      if (rendered.current.overview !== current.overview) {
        rendered.current.overview = current.overview;
        setOverview(current.overview);
      }
      if (rendered.current.arrived !== visible) {
        rendered.current.arrived = visible;
        setArrived(visible);
      }
      const p = pointOnJourney(current.distance);
      miniCar.current?.setAttribute("cx", String(p.x));
      miniCar.current?.setAttribute("cy", String(p.y));
      miniProgress.current?.style.setProperty(
        "stroke-dashoffset",
        String(1 - current.distance),
      );
      if (percentage.current)
        percentage.current.textContent = `${Math.round(current.distance * 100)
          .toString()
          .padStart(2, "0")}%`;
      const anchor = renderer.current?.draw(current);
      if (anchor && popup.current && Number.isFinite(anchor.x + anchor.y)) {
        const width = scene.current.clientWidth,
          height = scene.current.clientHeight;
        const panelWidth = popup.current.offsetWidth,
          panelHeight = popup.current.offsetHeight;
        const x = current.compact
          ? 14
          : Math.max(
              32,
              Math.min(width - panelWidth - 32, anchor.x - panelWidth - 65),
            );
        const y = current.compact
          ? height - panelHeight - 140
          : Math.max(
              130,
              Math.min(height - panelHeight - 125, anchor.y - panelHeight - 26),
            );
        popup.current.style.setProperty("--panel-x", `${x}px`);
        popup.current.style.setProperty("--panel-y", `${y}px`);
        const ax = Math.max(20, Math.min(width - 20, anchor.x)),
          ay = Math.max(120, Math.min(height - 170, anchor.y));
        // Attach to the nearest card edge so the connector never runs through
        // the text or stretches across the car to the far corner of the panel.
        let endX = Math.max(x + 20, Math.min(x + panelWidth - 20, ax));
        let endY = Math.max(y + 20, Math.min(y + panelHeight - 20, ay));
        if (ax < x) endX = x;
        else if (ax > x + panelWidth) endX = x + panelWidth;
        else if (ay < y) endY = y;
        else endY = y + panelHeight;
        wire.current?.setAttribute(
          "d",
          `M${ax} ${ay}L${endX} ${endY}`,
        );
      }
    }, []);

    useEffect(() => {
      state.current.compact = compact;
      state.current.dark = dark;
      state.current.reduced = reduced;
      let near = false,
        disposed = false,
        loading = false;
      const schedule = () => {
        if (!near) return;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(paint);
      };
      const load = async () => {
        if (loading || renderer.current || !host.current) return;
        loading = true;
        try {
          const sceneFactory = await import("./trackside/TracksideScene");
          if (disposed || !host.current) return;
          const created = await sceneFactory.createTracksideScene(
            host.current,
            () => {
              setWebgl(false);
              renderer.current?.dispose();
              renderer.current = null;
            },
            () => disposed,
          );
          if (!created) return;
          if (disposed) {
            created.dispose();
            return;
          }
          renderer.current = created;
          paint();
          setWebgl(true);
        } catch {
          if (!disposed) setWebgl(false);
        }
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          near = entry.isIntersecting;
          if (near) {
            void load();
            schedule();
          }
        },
        { rootMargin: "100% 0px" },
      );
      if (track.current) observer.observe(track.current);
      const resize = new ResizeObserver(schedule);
      if (scene.current) resize.observe(scene.current);
      if (popup.current) resize.observe(popup.current);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      paint();
      return () => {
        disposed = true;
        observer.disconnect();
        resize.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(frame.current);
      };
    }, [compact, dark, reduced, paint]);
    useEffect(
      () => () => {
        renderer.current?.dispose();
        renderer.current = null;
      },
      [],
    );
    useEffect(() => {
      const id = requestAnimationFrame(paint);
      return () => cancelAnimationFrame(id);
    }, [selected, overview, arrived, expanded, dismissed, paint]);

    const goTo = useCallback(
      (index: number) => {
        const target = Math.max(0, Math.min(journey.length - 1, index));
        setExpanded(false);
        setDismissed(false);
        if (!state.current.reduced && track.current && scene.current) {
          const top =
            window.scrollY + track.current.getBoundingClientRect().top;
          scrollTo(
            top +
              journeyStopProgress(target) *
                (track.current.offsetHeight - scene.current.offsetHeight),
          );
          return;
        }
        state.current = {
          ...state.current,
          index: target,
          overview: false,
          distance: route.stops[target],
          approach: 1,
          arrival: 1,
        };
        paint();
        const box = scene.current?.getBoundingClientRect();
        if (box && (box.bottom < 100 || box.top > window.innerHeight - 100))
          scrollTo("#journey");
      },
      [paint, scrollTo],
    );
    useImperativeHandle(ref, () => ({ goTo }), [goTo]);
    const restart = () => {
      setExpanded(false);
      setDismissed(false);
      if (state.current.reduced) {
        state.current = {
          ...state.current,
          overview: true,
          index: 0,
          distance: 0,
          approach: 0,
          arrival: 0,
        };
        paint();
      }
      scrollTo("#journey");
    };
    const next = () =>
      overview
        ? goTo(0)
        : selected < 6
          ? goTo(selected + 1)
          : scrollTo("#hello");
    const previous = () => (selected === 0 ? restart() : goTo(selected - 1));
    useEffect(() => {
      const dialog = lightbox.current;
      if (photo && dialog) {
        if (!dialog.open) dialog.showModal();
        stopScroll();
      } else {
        dialog?.close();
        startScroll();
      }
      return () => startScroll();
    }, [photo, stopScroll, startScroll]);

    const story = journeyStories[selected],
      milestone = journey[selected];
    const gallery: readonly Photo[] = "gallery" in story ? story.gallery : [];
    const showing = arrived && !overview && !dismissed;
    return (
      <section
        id="journey"
        className="ts-section"
        data-dock="journey"
        data-reduced={reduced}
        aria-label="The Spa trackside journey"
      >
        <span id="experience" className="p-anchor-alias" aria-hidden />
        <div
          ref={track}
          className="ts-scroll-track"
          style={{ "--stops": journey.length } as CSSProperties}
        >
          <div
            ref={scene}
            className={`ts-scene ${overview ? "is-overview" : "is-driving"} ${showing ? "has-story" : ""} ${webgl ? "is-webgl" : "is-fallback"}`}
            tabIndex={0}
            role="group"
            aria-label="Trackside journey. Scroll to drive. Use left and right arrows to select chapters."
            onKeyDown={(event) => {
              if (
                (event.target as Element).closest(
                  "button, a, input, textarea, dialog, [data-scroll-area]",
                )
              )
                return;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                next();
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                previous();
              }
              if (event.key === "Home") {
                event.preventDefault();
                restart();
              }
              if (event.key === "End") {
                event.preventDefault();
                goTo(6);
              }
            }}
          >
            <div ref={host} className="ts-world" aria-hidden />
            <div className="ts-fallback" aria-hidden>
              <svg viewBox="0 0 1500 1000">
                <path d={route.path} className="ts-fallback-grass" />
                <path d={route.path} className="ts-fallback-road" />
                {route.positions.map(([x, y], i) => (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <circle r="26" />
                    <text textAnchor="middle" dy="6">
                      {i + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="ts-vignette" aria-hidden />
            <header className="ts-hud">
              <div>
                <span className="ts-beacon" />
                <strong>THE CAREER GRAND PRIX</strong>
                <span className="ts-hud-location">SPA-FRANCORCHAMPS</span>
              </div>
              <div>
                <span className="ts-lap">LAP 01 / 01</span>
                <strong ref={percentage}>00%</strong>
                <button
                  onClick={() => setMapOpen(!mapOpen)}
                  aria-label="Toggle circuit map"
                  aria-pressed={mapOpen}
                >
                  <Map size={17} />
                </button>
                <button onClick={restart} aria-label="Restart the journey">
                  <RotateCcw size={17} />
                </button>
              </div>
            </header>
            {overview && (
              <div className="ts-intro">
                <p>MY JOURNEY. AT TRACK LEVEL.</p>
                <h2>
                  One lap.
                  <br />
                  Every <em>chapter.</em>
                </h2>
                <p>
                  From a classroom to a company.
                  <br />
                  Seven stops on the road that brought me here.
                </p>
                <button onClick={() => goTo(0)}>
                  Drive the journey <ArrowRight size={18} />
                </button>
                <span>
                  <ArrowDown size={14} />
                  {reduced
                    ? "Choose a chapter to explore"
                    : "Scroll to take the wheel"}
                </span>
              </div>
            )}
            <svg
              className={`ts-leader ${showing ? "is-visible" : ""}`}
              aria-hidden
            >
              <path ref={wire} />
            </svg>
            <article
              ref={popup}
              className={`ts-popup ${showing ? "is-visible" : ""}`}
              aria-hidden={!showing}
              inert={!showing}
              data-scroll-area
              style={{ "--stop-color": story.color } as CSSProperties}
            >
              <div className="ts-popup-stripe" />
              <div className="ts-popup-top">
                <span>
                  CAREER CHECKPOINT / {String(selected + 1).padStart(2, "0")}
                </span>
                <button
                  onClick={() => setDismissed(true)}
                  aria-label="Hide chapter"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="ts-company">
                <span className="ts-logo">
                  {story.logo ? (
                    <Image
                      src={`/assets/logos/${story.logo}-mark.webp`}
                      alt={`${story.name} logo`}
                      width={42}
                      height={42}
                    />
                  ) : (
                    <Flag size={25} />
                  )}
                </span>
                <div>
                  <p>{milestone.dates || "The next chapter"}</p>
                  <h3>{story.name}</h3>
                </div>
              </div>
              <h4>{story.title}</h4>
              <p className="ts-story">{story.story}</p>
              <div className="ts-takeaway">
                <strong>{story.takeaway}</strong>
                <span>{story.detail}</span>
              </div>
              <button
                className="ts-detail-toggle"
                aria-expanded={expanded}
                aria-controls="ts-details"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Less detail" : "More from this chapter"}
                <span>{expanded ? "−" : "+"}</span>
              </button>
              <div id="ts-details" className="ts-details" hidden={!expanded}>
                {milestone.bullets.length > 0 && (
                  <ul>
                    {milestone.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {gallery.length > 0 && (
                  <div className="ts-gallery">
                    {gallery.map((item) => (
                      <button
                        key={item.src}
                        onClick={() => setPhoto(item)}
                        aria-label={`Open photo: ${item.caption}`}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          width={300}
                          height={170}
                          sizes="160px"
                        />
                        <span>{item.caption}</span>
                      </button>
                    ))}
                  </div>
                )}
                {story.website && (
                  <a href={story.website} target="_blank" rel="noreferrer">
                    Visit {story.name.split(" · ")[0]}{" "}
                    <ArrowUpRight size={15} />
                  </a>
                )}
                {selected === 5 && (
                  <a href="/work/sanket/">
                    Inside Sanket <ArrowUpRight size={15} />
                  </a>
                )}
                {selected === 6 && (
                  <a href={`mailto:${profile.email}`}>
                    Let’s talk <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
              <footer>
                <span className="ts-at-stop">
                  <i />
                  AT {route.corners[selected].toUpperCase()}
                </span>
                <button onClick={next}>
                  {selected === 6 ? "Let’s talk" : "Next checkpoint"}
                  <ArrowRight size={14} />
                </button>
              </footer>
            </article>
            {!overview && !showing && (
              <div className="ts-road-caption">
                <span>{arrived ? "CHECKPOINT REACHED" : "ON THE WAY TO"}</span>
                <strong>{story.name}</strong>
                {dismissed && (
                  <button onClick={() => setDismissed(false)}>
                    Show this chapter <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            )}
            <div
              className={`ts-minimap ${mapOpen ? "is-open" : ""}`}
              aria-label="Circuit progress"
            >
              <span>SPA / 7.004 KM</span>
              <svg viewBox="0 0 1500 1000" aria-hidden>
                <path d={route.path} className="ts-mini-road" />
                <path
                  ref={miniProgress}
                  d={route.path}
                  className="ts-mini-complete"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <circle
                  ref={miniCar}
                  cx={route.points[0][0]}
                  cy={route.points[0][1]}
                  r="26"
                />
              </svg>
              <p>RED BULL LIVERY · THE CAREER LAP</p>
            </div>
            <nav className="ts-chapters" aria-label="Career chapters">
              <button
                onClick={previous}
                disabled={overview}
                aria-label="Previous chapter"
              >
                <ArrowLeft size={16} />
              </button>
              {journeyStories.map((item, i) => (
                <button
                  key={item.name}
                  onClick={() => goTo(i)}
                  className={!overview && selected === i ? "is-active" : ""}
                  aria-label={`Chapter ${i + 1}: ${item.name}`}
                  aria-current={
                    !overview && selected === i ? "step" : undefined
                  }
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <i />
                </button>
              ))}
              <button
                onClick={next}
                aria-label={selected === 6 ? "Go to contact" : "Next chapter"}
              >
                <ArrowRight size={16} />
              </button>
            </nav>
            <div className="ts-driving-note" aria-live="polite">
              {overview
                ? "Seven chapters. One circuit."
                : `${String(selected + 1).padStart(2, "0")} / 07 · ${chapters[selected]}`}
            </div>
            <noscript>
              <ol>
                {journey.map((item) => (
                  <li key={item.role}>
                    {item.dates} · {item.role} · {item.org}
                  </li>
                ))}
              </ol>
            </noscript>
          </div>
        </div>
        <dialog
          ref={lightbox}
          className="ts-lightbox"
          data-lenis-prevent
          aria-label={photo?.caption || "Journey photo"}
          onCancel={() => setPhoto(null)}
          onClose={() => setPhoto(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhoto(null);
          }}
        >
          {photo && (
            <div>
              <button onClick={() => setPhoto(null)} aria-label="Close photo">
                <X size={22} />
              </button>
              <Image
                src={photo.src}
                alt={photo.caption}
                width={1672}
                height={941}
              />
              <p>{photo.caption}</p>
            </div>
          )}
        </dialog>
      </section>
    );
  },
);
