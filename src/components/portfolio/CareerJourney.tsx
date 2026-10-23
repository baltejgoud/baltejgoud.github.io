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
  ArrowRight,
  ArrowUpRight,
  Mouse,
  ChevronsRight,
  RotateCcw,
  X,
} from "lucide-react";
import { journey } from "@/content/journey";
import { journeyStories, journeyMapSummaries } from "@/content/journey-stories";
import route from "@/content/journey-route.json";
import { placeCareerPopup } from "@/lib/careerMapLayout";
import { CAREER_SCENE, circuitLabels, pointOnCareerScene, scenePercent, sceneRoad, sceneStops } from "@/lib/careerScene";
import {
  CAREER_MAP_SCROLL_SCREENS,
  careerMapState,
  careerMapStopProgress,
} from "@/lib/careerMapProgress";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { profile } from "@/content/profile";
import { CareerCircuit } from "./CareerCircuit";
import "./career-journey.css";

export interface CareerJourneyHandle {
  goTo: (index: number) => void;
}
type Photo = { src: string; caption: string };

export const CareerJourney = forwardRef<CareerJourneyHandle>(
  function CareerJourney(_, ref) {
    const track = useRef<HTMLDivElement>(null);
    const sticky = useRef<HTMLDivElement>(null);
    const car = useRef<HTMLDivElement>(null);
    const board = useRef<HTMLDivElement>(null);
    const popup = useRef<HTMLElement>(null);
    const connector = useRef<SVGPathElement>(null);
    const progressPath = useRef<SVGPathElement>(null);
    const percentage = useRef<HTMLSpanElement>(null);
    const storyBody = useRef<HTMLDivElement>(null);
    const lightbox = useRef<HTMLDialogElement>(null);
    const reduced = usePrefersReducedMotion();
    const [view, setView] = useState({
      index: 0,
      overview: true,
      arrived: false,
    });
    const rendered = useRef(view);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [photo, setPhoto] = useState<Photo | null>(null);
    const {
      scrollTo,
      stop: stopScroll,
      start: startScroll,
    } = useSmoothScroll();
    const { index: selected, overview, arrived } = view;

    const paint = useCallback((at: number) => {
      const point = pointOnCareerScene(at);
      const percent = scenePercent(point);
      if (car.current) {
        car.current.dataset.distance = String(at);
        car.current.style.left = `${percent.x}%`;
        car.current.style.top = `${percent.y}%`;
        const heading = car.current.firstElementChild as HTMLElement | null;
        if (heading) heading.style.transform = `rotate(${point.angle}deg)`;
      }
      progressPath.current?.style.setProperty(
        "stroke-dashoffset",
        String(1 - at),
      );
      if (percentage.current)
        percentage.current.textContent = `${Math.round(at * 100)}%`;
    }, []);

    const scrollBounds = useCallback(() => {
      if (!track.current || !sticky.current) return null;
      const inset =
        Number.parseFloat(getComputedStyle(sticky.current).top) || 0;
      return {
        start:
          window.scrollY + track.current.getBoundingClientRect().top - inset,
        range: Math.max(
          1,
          track.current.offsetHeight - sticky.current.offsetHeight,
        ),
      };
    }, []);

    useEffect(() => {
      let frame = 0;
      const update = () => {
        frame = 0;
        const bounds = scrollBounds();
        if (!bounds) return;
        const next = careerMapState(
          (window.scrollY - bounds.start) / bounds.range,
        );
        // Reduced motion keeps the story readable and changes position only at chapter boundaries.
        paint(
          reduced && !next.overview ? route.stops[next.index] : next.distance,
        );
        const previous = rendered.current;
        const current = {
          index: next.index,
          overview: next.overview,
          arrived: reduced ? !next.overview : next.arrived,
        };
        if (
          previous.index !== current.index ||
          previous.overview !== current.overview
        ) {
          setExpanded(false);
          setDismissed(false);
          if (storyBody.current) storyBody.current.scrollTop = 0;
        }
        if (
          previous.index !== current.index ||
          previous.overview !== current.overview ||
          previous.arrived !== current.arrived
        ) {
          rendered.current = current;
          setView(current);
        }
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      const resize = new ResizeObserver(schedule);
      if (track.current) resize.observe(track.current);
      if (sticky.current) resize.observe(sticky.current);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      schedule();
      return () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      };
    }, [paint, reduced, scrollBounds]);

    const select = useCallback(
      (index: number) => {
        const bounds = scrollBounds();
        if (!bounds) return;
        setExpanded(false);
        setDismissed(false);
        scrollTo(bounds.start + careerMapStopProgress(index) * bounds.range, {
          immediate: reduced,
        });
      },
      [reduced, scrollBounds, scrollTo],
    );
    useImperativeHandle(ref, () => ({ goTo: select }), [select]);

    useEffect(() => {
      if (!dismissed) return;
      // Removing focus from a dismissed popover can trigger browser scroll anchoring.
      // Keep this checkpoint parked; subsequent wheel input still drives normally.
      const bounds = scrollBounds();
      if (bounds)
        scrollTo(
          bounds.start + careerMapStopProgress(selected) * bounds.range,
          {
            immediate: true,
          },
        );
    }, [dismissed, selected, scrollBounds, scrollTo]);

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

    const restart = () => {
      const bounds = scrollBounds();
      if (bounds) scrollTo(bounds.start, { immediate: reduced });
    };
    const next = () =>
      selected === journey.length - 1 && !overview
        ? scrollTo("#hello")
        : select(overview ? 0 : selected + 1);
    const positionPopup = useCallback(() => {
      if (!board.current || !popup.current || !sticky.current) return;
      const frame = sticky.current.getBoundingClientRect();
      const map = board.current.getBoundingClientRect();
      const percent = scenePercent(sceneStops[selected]);
      const anchor = {
        x: map.left - frame.left + (percent.x / 100) * map.width,
        y: map.top - frame.top + (percent.y / 100) * map.height,
      };
      if (frame.width > 650 && frame.height <= 500) {
        popup.current.style.setProperty("--card-x", "18px");
        popup.current.style.setProperty("--card-y", "150px");
        return;
      }
      if (frame.width <= 650) {
        const top = Math.max(320, frame.height - 295);
        popup.current.style.setProperty("--mobile-card-top", `${top}px`);
        popup.current.style.removeProperty("--card-x");
        popup.current.style.removeProperty("--card-y");
        return;
      }
      const size = popup.current.getBoundingClientRect();
      const road = sceneRoad
        .filter((_, i) => i % 8 === 0)
        .map((point) => {
          const p = scenePercent(point);
          return {
            x: map.left - frame.left + (p.x / 100) * map.width,
            y: map.top - frame.top + (p.y / 100) * map.height,
          };
        });
      const protectedAreas = [...sticky.current.querySelectorAll(".cm-overview, .cm-masthead")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left - frame.left, right: rect.right - frame.left, top: rect.top - frame.top, bottom: rect.bottom - frame.top };
      });
      const at = selected === 0 && frame.width > 1100 && size.height < 250
        ? { x: Math.min(frame.width - size.width - 28, frame.width * 529 / 1672), y: Math.min(frame.height - size.height - 110, frame.height * 517 / 941) }
        : placeCareerPopup(anchor, size, frame, road, protectedAreas);
      popup.current.style.setProperty("--card-x", `${at.x}px`);
      popup.current.style.setProperty("--card-y", `${at.y}px`);
      const end = {
        x: Math.max(at.x, Math.min(at.x + size.width, anchor.x)),
        y: Math.max(at.y, Math.min(at.y + size.height, anchor.y)),
      };
      connector.current?.setAttribute(
        "d",
        `M${anchor.x} ${anchor.y}L${end.x} ${end.y}`,
      );
    }, [selected]);

    // A single, uniformly scaled artboard keeps the environment, road, car and pins registered.
    // It is deliberately independent of scroll: the camera never chases or zooms into the car.
    useEffect(() => {
      const frame = sticky.current;
      const map = board.current;
      if (!frame || !map) return;
      const fit = () => {
        const rect = frame.getBoundingClientRect();
        const mobile = rect.width <= 650;
        const compact = mobile && rect.height < 740;
        const landscape = !mobile && rect.height <= 500;
        const scale = landscape
          ? Math.min((rect.width - 360) / 1280, (rect.height - 160) / 800)
          : mobile
          ? ((rect.width - 28) / 1280) * (compact ? 0.6 : 1)
          : Math.min(rect.width / CAREER_SCENE.width, rect.height / CAREER_SCENE.height);
        const width = CAREER_SCENE.width * scale;
        const height = CAREER_SCENE.height * scale;
        map.style.setProperty("--cm-board-w", `${width}px`);
        map.style.setProperty("--cm-board-h", `${height}px`);
        map.style.setProperty("--cm-board-x", `${landscape ? 340 + (rect.width - 360 - 1165 * scale) / 2 - 390 * scale : mobile ? compact ? (rect.width - 1165 * scale) / 2 - 390 * scale : -340 * scale + 14 : (rect.width - width) / 2}px`);
        map.style.setProperty("--cm-board-y", `${landscape ? 70 - 125 * scale : mobile ? compact ? 245 : 295 : (rect.height - height) / 2}px`);
        map.style.setProperty("--cm-scale", String(scale));
      };
      const observer = new ResizeObserver(fit);
      observer.observe(frame);
      fit();
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const observer = new ResizeObserver(positionPopup);
      if (sticky.current) observer.observe(sticky.current);
      if (board.current) observer.observe(board.current);
      if (popup.current) observer.observe(popup.current);
      const frame = requestAnimationFrame(positionPopup);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    }, [positionPopup, expanded]);

    const story = journeyStories[selected],
      milestone = journey[selected];
    const gallery: readonly Photo[] = "gallery" in story ? story.gallery : [];
    const showing = (overview || arrived) && !dismissed;
    const chapterNames = [
      "The foundation",
      "Pass it on",
      "Go independent",
      "Find the signal",
      "Build intelligence",
      "Building now",
      "The next chapter",
    ];

    return (
      <section
        id="journey"
        className="cm-section"
        data-dock="journey"
        data-reduced={reduced}
        aria-labelledby="career-map-title"
      >
        <span id="experience" className="p-anchor-alias" aria-hidden />
        <h2 id="career-map-title" className="sr-only">
          The career circuit
        </h2>
        <div
          ref={track}
          className="cm-scroll-track"
          style={
            {
              "--career-scroll-screens": CAREER_MAP_SCROLL_SCREENS,
            } as CSSProperties
          }
        >
          <div ref={sticky} className="cm-sticky">
            <div
              className={`cm-experience ${overview ? "is-overview" : ""} ${showing ? "has-story" : ""}`}
              role="group"
              tabIndex={0}
              aria-label="Career circuit. Scroll down to drive forward, up to retrace. Left and right arrow keys select checkpoints."
              onKeyDown={(event) => {
                if (
                  (event.target as Element).closest(
                    "button, a, dialog, [data-scroll-area]",
                  )
                )
                  return;
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  select(
                    overview ? 0 : Math.min(journey.length - 1, selected + 1),
                  );
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  select(Math.max(0, selected - 1));
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  restart();
                }
                if (event.key === "End") {
                  event.preventDefault();
                  select(journey.length - 1);
                }
              }}
            >
              <CareerCircuit
                ref={car}
                boardRef={board}
                progressRef={progressPath}
                selected={selected}
                overview={overview}
                onSelect={select}
              />
              <header className="cm-masthead">
                <a href="#top">Baltej Goud</a>
                <i aria-hidden="true" />
                <span>THE CAREER CIRCUIT</span>
              </header>
              <div className="cm-lap-hud">
                <span ref={percentage}>0%</span>
                <span className="cm-lap-label">LAP 01 / 01</span>
                <button
                  onClick={restart}
                  aria-label="Restart the journey"
                  title="Back to the grid"
                >
                  <RotateCcw size={21} />
                </button>
                <button
                  onClick={() => scrollTo("#process")}
                  aria-label="Skip career circuit"
                  title="Continue to how I work"
                >
                  <ChevronsRight size={23} />
                </button>
              </div>
              <div className="cm-overview">
                  <span>2019 — NOW / SEVEN CHAPTERS</span>
                  <h3>
                    Every turn
                    <br />
                    has a story.
                  </h3>
                  <p>
                    From computer science to building a company.
                    <br />
                    Scroll to follow the road that brought me here.
                  </p>
                </div>
              <svg
                className={`cm-connector ${showing ? "is-visible" : ""}`}
                aria-hidden="true"
              >
                <path ref={connector} />
              </svg>
              <article
                ref={popup}
                className={`ts-popup ${showing ? "is-visible" : ""} ${expanded ? "is-expanded" : ""}`}
                aria-hidden={!showing}
                inert={!showing}
                aria-label={`${story.name} career checkpoint`}
              >
                <Image
                  className="ts-popup-thumbnail"
                  src={selected < 2 ? "/assets/journey/university-reference.webp" : selected === 5 ? "/assets/work/sanket-dashboard.webp" : story.logo ? `/assets/logos/${story.logo}.webp` : "/assets/portrait.webp"}
                  alt={selected < 2 ? "University architecture, reference illustration" : story.name}
                  width={100} height={128} sizes="100px"
                />
                <div className="ts-popup-top">
                  <span>
                    {String(selected + 1).padStart(2, "0")} / 07
                  </span>
                  <button
                    onClick={() => setDismissed(true)}
                    aria-label="Hide chapter"
                  >
                    <X size={21} />
                  </button>
                </div>
                <div
                  ref={storyBody}
                  className="ts-popup-body"
                  data-scroll-area
                  tabIndex={showing ? 0 : -1}
                  aria-label={`${story.name} experience details`}
                >
                  <p className="ts-date">
                    {selected === 5
                      ? "BUILDING NOW"
                      : milestone.dates || "THE NEXT CHAPTER"}
                  </p>
                  <h3>{circuitLabels[selected]}</h3>
                  <p className="ts-role">{milestone.role}</p>
                  <h4>{selected === 5 ? <>From building products to<br />building a company.</> : story.title}</h4>
                  <p className="ts-story">{journeyMapSummaries[selected]}</p>
                  <div className="ts-popup-actions">
                    {selected === 5 && (
                      <a className="ts-primary-link" href="/work/sanket/">
                        Inside Sanket <ArrowRight size={17} />
                      </a>
                    )}
                    {selected === 6 && (
                      <a
                        className="ts-primary-link"
                        href={`mailto:${profile.email}`}
                      >
                        Let’s talk <ArrowUpRight size={17} />
                      </a>
                    )}
                    <button
                      className="ts-detail-toggle"
                      aria-expanded={expanded}
                      aria-controls="ts-details"
                      aria-label={
                        expanded
                          ? "Hide chapter details"
                          : "Show chapter details"
                      }
                      onClick={() => setExpanded(!expanded)}
                    >
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div
                    id="ts-details"
                    className="ts-details"
                    hidden={!expanded}
                  >
                    <p>{story.story}</p>
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
                    <button className="ts-next" onClick={next}>
                      {selected === 6 ? "Go to contact" : "Next checkpoint"}{" "}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
              {dismissed && !overview && arrived && (
                <button className="cm-reopen" onClick={() => select(selected)}>
                  Show {story.name} story <ArrowUpRight size={15} />
                </button>
              )}
              <div className="cm-driving-note">
                <Mouse size={29} strokeWidth={1.3} />
                <span>
                  SCROLL TO EXPLORE<br />THE JOURNEY
                </span>
              </div>
              <p className="cm-status sr-only" role="status">
                {overview
                  ? "Scroll down to take the first turn."
                  : arrived
                    ? `Checkpoint ${selected + 1}: ${story.name}. ${chapterNames[selected]}.`
                    : `On the way to ${story.name}`}
              </p>
              <span className="cm-distance">SPA<br />FRANCORCHAMPS<i /></span>
            </div>
          </div>
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
