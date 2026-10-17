"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Code2,
  Crosshair,
  Minus,
  Navigation2,
  Plus,
  X,
} from "lucide-react";
import { journey } from "@/content/journey";
import { journeyStories } from "@/content/journey-stories";
import route from "@/content/journey-route.json";
import {
  clampJourney,
  easeJourney,
  journeyLegProgress,
  journeyLegs,
  journeyScrollState,
  journeyStopProgress,
  pointOnJourney,
} from "@/lib/careerJourney";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { profile } from "@/content/profile";
import "./career-journey.css";

export interface CareerJourneyHandle {
  goTo: (index: number) => void;
}
type Photo = { src: string; caption: string };

function Brand({
  logo,
  mark = false,
  name,
}: {
  logo: string | null;
  mark?: boolean;
  name: string;
}) {
  if (!logo) return <Code2 size={25} strokeWidth={1.7} aria-hidden />;
  return (
    <Image
      src={`/assets/logos/${logo}${mark ? "-mark" : ""}.webp`}
      alt={`${name} logo`}
      fill
      sizes={mark ? "36px" : "64px"}
    />
  );
}

export const CareerJourney = forwardRef<CareerJourneyHandle>(
  function CareerJourney(_, ref) {
    const track = useRef<HTMLDivElement>(null);
    const scene = useRef<HTMLDivElement>(null);
    const world = useRef<HTMLDivElement>(null);
    const legs = useRef<(SVGPathElement | null)[]>([]);
    const cursor = useRef<HTMLDivElement>(null);
    // Last values written to the DOM, so a frame only touches what actually moved.
    const written = useRef<Record<string, string>>({});
    const lightbox = useRef<HTMLDialogElement>(null);
    const animation = useRef(0);
    const frame = useRef(0);
    const mobile = useMediaQuery("(max-width: 760px)");
    const reduced = usePrefersReducedMotion();
    const stepMode = mobile || reduced;
    const [selected, setSelected] = useState(0);
    const [overview, setOverview] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [panning, setPanning] = useState(false);
    const {
      scrollTo,
      stop: stopScroll,
      start: startScroll,
    } = useSmoothScroll();
    const state = useRef({
      stepMode: false,
      mobile: false,
      overview: true,
      index: 0,
      distance: 0,
      approach: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
    });
    const rendered = useRef({ index: 0, overview: true });
    const gesture = useRef<{
      x: number;
      y: number;
      panX: number;
      panY: number;
    } | null>(null);

    const paint = useCallback(() => {
      if (!scene.current || !world.current || !track.current) return;
      const config = state.current;
      const width = scene.current.clientWidth;
      const height = scene.current.clientHeight;
      if (!width || !height) return;
      if (!config.stepMode) {
        const distance = track.current.getBoundingClientRect().top * -1;
        const range = Math.max(1, track.current.offsetHeight - height);
        const next = journeyScrollState(distance / range);
        config.index = next.index;
        config.overview = next.overview;
        config.distance = next.distance;
        config.approach = next.firstApproach;
      }
      if (rendered.current.index !== config.index) {
        rendered.current.index = config.index;
        setSelected(config.index);
        setExpanded(false);
      }
      if (rendered.current.overview !== config.overview) {
        rendered.current.overview = config.overview;
        setOverview(config.overview);
      }
      const point = pointOnJourney(config.distance);
      const fit = Math.min(
        (width * (config.mobile ? 0.98 : 0.42)) / 4720,
        (height * (config.mobile ? 0.48 : 0.52)) / 3900,
      );
      const near =
        (config.mobile ? 0.5 : Math.max(0.38, Math.min(0.54, width / 3040))) *
        config.zoom;
      const approach = config.overview ? 0 : config.approach;
      const scale = fit + (near - fit) * approach;
      const farX = width / 2 - 2360 * fit;
      const farY = height * 0.6 - 1950 * fit;
      const closeX = width * (config.mobile ? 0.5 : 0.59) - point.x * scale;
      const closeY = height * (config.mobile ? 0.32 : 0.58) - point.y * scale;
      const x = farX + (closeX - farX) * approach + config.panX;
      const y = farY + (closeY - farY) * approach + config.panY;
      const last = written.current;
      const write = (
        key: string,
        target: HTMLElement | SVGElement | null | undefined,
        property: string,
        value: string,
      ) => {
        if (!target || last[key] === value) return;
        last[key] = value;
        target.style.setProperty(property, value);
      };
      write(
        "world",
        world.current,
        "transform",
        `translate3d(${x}px,${y}px,0) scale(${scale})`,
      );
      // Pins counter-scale through these, so they only change while the camera zooms.
      write("inverse", world.current, "--jm-inverse", (1 / scale).toFixed(4));
      write(
        "pin",
        world.current,
        "--jm-pin-size",
        config.overview ? (config.mobile ? "0.48" : "1") : "1.3",
      );
      journeyLegs.forEach((leg, i) =>
        write(
          `leg${i}`,
          legs.current[i],
          "stroke-dashoffset",
          (1 - journeyLegProgress(config.distance, leg)).toFixed(4),
        ),
      );
      // Transform only (no left/top), so moving the cursor never triggers layout.
      write(
        "cursor",
        cursor.current,
        "transform",
        `translate(${point.x}px,${point.y}px) translate(-50%,-50%) scale(${1 / scale}) rotate(${point.angle}deg)`,
      );
      write(
        "cursorOpacity",
        cursor.current,
        "opacity",
        String(config.overview ? 0 : Math.min(1, approach * 3)),
      );
    }, []);

    useEffect(() => {
      state.current.stepMode = stepMode;
      state.current.mobile = mobile;
      const schedule = () => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(paint);
      };
      const observer = new ResizeObserver(schedule);
      if (scene.current) observer.observe(scene.current);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      schedule();
      return () => {
        observer.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(frame.current);
        cancelAnimationFrame(animation.current);
      };
    }, [stepMode, mobile, paint]);

    const goTo = useCallback(
      (index: number) => {
        const target = Math.max(0, Math.min(journey.length - 1, index));
        state.current.panX = 0;
        state.current.panY = 0;
        setExpanded(false);
        if (!state.current.stepMode && track.current) {
          const top =
            window.scrollY + track.current.getBoundingClientRect().top;
          scrollTo(
            top +
              journeyStopProgress(target) *
                (track.current.offsetHeight - window.innerHeight),
          );
          return;
        }
        cancelAnimationFrame(animation.current);
        const from = state.current.distance;
        const fromApproach = state.current.overview ? 0 : 1;
        state.current.index = target;
        state.current.overview = false;
        rendered.current = { index: target, overview: false };
        setSelected(target);
        setOverview(false);
        const started = performance.now();
        const tick = (now: number) => {
          const t = reduced ? 1 : clampJourney((now - started) / 700);
          const eased = easeJourney(t);
          state.current.distance = from + (route.stops[target] - from) * eased;
          state.current.approach = fromApproach + (1 - fromApproach) * eased;
          paint();
          if (t < 1) animation.current = requestAnimationFrame(tick);
        };
        animation.current = requestAnimationFrame(tick);
        scrollTo("#journey");
      },
      [paint, reduced, scrollTo],
    );

    useImperativeHandle(ref, () => ({ goTo }), [goTo]);

    const resetView = () => {
      state.current.zoom = 1;
      state.current.panX = 0;
      state.current.panY = 0;
      paint();
    };
    const showOverview = () => {
      cancelAnimationFrame(animation.current);
      state.current.overview = true;
      state.current.approach = 0;
      state.current.distance = 0;
      state.current.zoom = 1;
      state.current.panX = 0;
      state.current.panY = 0;
      setExpanded(false);
      if (!state.current.stepMode) scrollTo("#journey");
      paint();
    };
    const zoom = (direction: number) => {
      if (state.current.overview) {
        goTo(selected);
        return;
      }
      state.current.zoom = Math.max(
        0.65,
        Math.min(1.65, state.current.zoom + direction * 0.15),
      );
      paint();
    };
    const next = () =>
      state.current.index < journey.length - 1
        ? goTo(state.current.index + 1)
        : scrollTo("#work");
    const previous = () =>
      state.current.index === 0
        ? showOverview()
        : goTo(state.current.index - 1);

    useEffect(() => {
      if (photo && lightbox.current) {
        if (!lightbox.current.open) lightbox.current.showModal();
        stopScroll();
      }
      if (!photo) {
        lightbox.current?.close();
        startScroll();
      }
      return () => startScroll();
    }, [photo, stopScroll, startScroll]);

    const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (
        (event.target as HTMLElement).closest("button, a") ||
        event.button !== 0
      )
        return;
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        panX: state.current.panX,
        panY: state.current.panY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      if (!mobile) setPanning(true);
    };
    const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
      if (!gesture.current || mobile) return;
      state.current.panX =
        gesture.current.panX + event.clientX - gesture.current.x;
      state.current.panY =
        gesture.current.panY + event.clientY - gesture.current.y;
      paint();
    };
    const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
      const start = gesture.current;
      if (start && mobile) {
        const x = event.clientX - start.x;
        const y = event.clientY - start.y;
        if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.2)
          goTo(overview ? 0 : selected + (x < 0 ? 1 : -1));
      }
      gesture.current = null;
      setPanning(false);
    };

    const story = journeyStories[selected];
    const milestone = journey[selected];
    const gallery: readonly Photo[] = "gallery" in story ? story.gallery : [];
    return (
      <section
        id="journey"
        className="jm-section p-paper-edge"
        data-dock-section
        data-step-mode={stepMode}
        aria-label="The journey"
      >
        <span id="experience" className="p-anchor-alias" aria-hidden />
        <div
          ref={track}
          className="jm-track"
          style={{ "--jm-stops": journey.length } as CSSProperties}
        >
          <div
            ref={scene}
            className={`jm-scene ${overview ? "jm-overview" : "jm-travelling"} ${panning ? "jm-panning" : ""}`}
            tabIndex={0}
            aria-label="Career journey map. Use left and right arrow keys to change stops."
            onKeyDown={(event) => {
              if ((event.target as HTMLElement).closest("dialog")) return;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                if (overview) goTo(0);
                else next();
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                previous();
              }
            }}
          >
            <div
              className="jm-map-viewport"
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={() => {
                gesture.current = null;
                setPanning(false);
              }}
            >
              <div ref={world} className="jm-world">
                <Image
                  src="/assets/journey-city-map.svg"
                  alt=""
                  width={4720}
                  height={3900}
                  className="jm-city"
                  draggable={false}
                />
                <svg
                  viewBox="0 0 4720 3900"
                  className="jm-route jm-route-base"
                  aria-hidden
                >
                  <path
                    d={route.path}
                    fill="none"
                    stroke="#c8d9ee"
                    strokeWidth="22"
                    strokeLinecap="round"
                    opacity="0.28"
                  />
                  <path
                    d={route.path}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="28"
                    strokeLinecap="round"
                  />
                </svg>
                <svg viewBox="0 0 4720 3900" className="jm-route" aria-hidden>
                  {journeyLegs.map((leg, i) => (
                    <path
                      key={leg.to}
                      ref={(node) => {
                        legs.current[i] = node;
                      }}
                      d={leg.path}
                      fill="none"
                      stroke="#4285f4"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset="1"
                    />
                  ))}
                </svg>
                {journeyStories.map((item, index) => (
                  <button
                    key={item.name}
                    className={`jm-map-pin ${index === selected && !overview ? "jm-selected-pin" : ""}`}
                    style={
                      {
                        left: route.positions[index][0],
                        top: route.positions[index][1],
                        "--jm-color": item.color,
                      } as CSSProperties
                    }
                    onClick={() => goTo(index)}
                    aria-label={`Go to ${journey[index].dates || "Next"}: ${item.name}`}
                    aria-pressed={!overview && selected === index}
                  >
                    <svg
                      viewBox="0 0 54 66"
                      className="jm-pin-shape"
                      aria-hidden
                    >
                      <use href="/assets/journey-pin.svg#pin" />
                    </svg>
                    <span className="jm-pin-logo">
                      {item.logo ? (
                        <Brand logo={item.logo} mark name={item.name} />
                      ) : index === journey.length - 1 ? (
                        <Image
                          src="/images/id-photo.webp"
                          alt=""
                          fill
                          sizes="36px"
                        />
                      ) : (
                        <Code2 size={23} />
                      )}
                    </span>
                    <span className="jm-pin-name">{item.name}</span>
                  </button>
                ))}
                <div ref={cursor} className="jm-cursor" aria-hidden>
                  <span />
                  <Navigation2 size={28} fill="white" strokeWidth={1.7} />
                </div>
              </div>
            </div>
            <div className="jm-map-fog" aria-hidden />
            <header className="jm-heading" aria-hidden={!overview}>
              <p>The journey</p>
              <h2>
                From a classroom
                <br />
                to a company.
              </h2>
              <p className="jm-subtitle">
                Seven stops since 2019, one line through all of them.
                <br className="jm-mobile-break" />{" "}
                {stepMode
                  ? "Tap a stop, or swipe the map."
                  : "Keep scrolling to follow it."}
              </p>
            </header>
            {!overview && (
              <article
                className={`jm-card ${expanded ? "jm-card-expanded" : ""}`}
                style={{ "--jm-color": story.color } as CSSProperties}
                aria-live="polite"
                data-scroll-area
              >
                <motion.div
                  key={selected}
                  initial={reduced ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24 }}
                >
                  <div className="jm-card-top">
                    <span className="jm-brand-tile">
                      <Brand logo={story.logo} mark name={story.name} />
                    </span>
                    <div>
                      <strong>{story.name}</strong>
                      <p>
                        {milestone.dates || "Next"} · {story.place}
                      </p>
                    </div>
                    <span className="jm-card-index">
                      {String(selected + 1).padStart(2, "0")} /{" "}
                      {String(journey.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="jm-card-body">
                    <h3>{story.title}</h3>
                    <p className="jm-story-text">{story.story}</p>
                    <button
                      className="jm-read-more"
                      aria-expanded={expanded}
                      onClick={() => setExpanded((value) => !value)}
                    >
                      {expanded ? "Read less" : "Read more"}
                      <ChevronDown size={16} />
                    </button>
                    <div className="jm-extra">
                      <div className="jm-takeaway">
                        <strong>{story.takeaway}</strong>
                        <p>{story.detail}</p>
                      </div>
                      {expanded && (
                        <ul className="jm-story-bullets">
                          {milestone.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                      {gallery.length > 0 && (
                        <div className="jm-gallery">
                          <p>Gallery</p>
                          <div>
                            {gallery.map((item, index) => (
                              <button
                                key={item.src}
                                onClick={() => setPhoto(item)}
                                aria-label={`Open photo: ${item.caption}`}
                                style={
                                  {
                                    "--jm-rotation": `${index % 2 ? 2 : -3}deg`,
                                  } as CSSProperties
                                }
                              >
                                <Image
                                  src={item.src}
                                  alt=""
                                  width={1672}
                                  height={941}
                                  sizes="160px"
                                />
                                <span>{item.caption}</span>
                              </button>
                            ))}
                          </div>
                          <small>
                            Development interfaces · illustrative sandbox data.
                          </small>
                        </div>
                      )}
                      {story.website && (
                        <a
                          className="jm-company-link"
                          href={story.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit {story.name.split(" · ")[0]}{" "}
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                      {selected === 5 && (
                        <a className="jm-company-link" href="/work/sanket/">
                          Inside Sanket <ArrowUpRight size={14} />
                        </a>
                      )}
                      {selected === journey.length - 1 && (
                        <a
                          className="jm-company-link"
                          href={`mailto:${profile.email}`}
                        >
                          Let’s talk <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </article>
            )}
            {!overview && (
              <Image
                src="/assets/journey-compass.svg"
                alt="Map compass"
                width={90}
                height={90}
                className="jm-compass"
              />
            )}
            <div className="jm-map-controls" aria-label="Map controls">
              <button onClick={resetView} aria-label="Recenter journey map">
                <Crosshair size={19} />
              </button>
              <div>
                <button onClick={() => zoom(1)} aria-label="Zoom in">
                  <Plus size={19} />
                </button>
                <button onClick={() => zoom(-1)} aria-label="Zoom out">
                  <Minus size={19} />
                </button>
              </div>
            </div>
            <div className="jm-timeline" aria-label="Journey stops">
              {journeyStories.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => goTo(index)}
                  aria-label={`${journey[index].dates || "Next"}, ${item.name}`}
                  aria-pressed={!overview && selected === index}
                  style={{ "--jm-color": item.color } as CSSProperties}
                >
                  <span />
                </button>
              ))}
              <strong>
                {overview
                  ? "2019 → now"
                  : `${milestone.dates || "Next"} · ${story.place}`}
              </strong>
            </div>
            {overview && (
              <button className="jm-start" onClick={() => goTo(0)}>
                Start the journey <ArrowRight size={19} />
              </button>
            )}
            {!overview && (
              <div className="jm-step-controls">
                <button onClick={previous} aria-label="Previous stop">
                  <ArrowLeft size={19} />
                </button>
                <span>
                  {selected + 1} / {journey.length}
                </span>
                <button onClick={next}>
                  {selected === journey.length - 1
                    ? "See my work"
                    : "Next stop"}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        <dialog
          ref={lightbox}
          className="jm-lightbox"
          data-lenis-prevent
          onCancel={() => setPhoto(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhoto(null);
          }}
          aria-label={photo?.caption || "Journey photo"}
        >
          {photo && (
            <div>
              <button onClick={() => setPhoto(null)} aria-label="Close photo">
                <X size={23} />
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
