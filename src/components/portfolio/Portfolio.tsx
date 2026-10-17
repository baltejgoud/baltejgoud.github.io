"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Flag,
  Gift,
  GitFork as Github,
  GraduationCap,
  Headphones,
  Home,
  ContactRound as Linkedin,
  Mail,
  Map,
  Moon,
  Music2,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Sun,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { CareerJourney, type CareerJourneyHandle } from "./CareerJourney";
import { skills } from "@/content/skills";
import { achievements } from "@/content/achievements";
import { certifications } from "@/content/certifications";
import { SkillIcon } from "@/components/skills/SkillIcon";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import "./portfolio.css";

const artwork = "/assets/portfolio-valley.webp";
const projectImages: Record<string, string> = {
  sanket: "/assets/work/sanket-dashboard.webp",
  axon: "/assets/work/axon-campus.webp",
  vigor: "/assets/work/vigor-health.webp",
  extraticket: "/assets/work/extraticket-home.webp",
  agritrust: "/assets/work/agritrust-concept.webp",
  tandem: "/assets/work/tandem-concept.webp",
};
const projectColors = [
  "#c96a4a",
  "#5a7d9c",
  "#648f68",
  "#bc754f",
  "#7d8c52",
  "#9073a1",
];
const projectSizes: Record<string, [number, number]> = {
  sanket: [1672, 941],
  axon: [1920, 1080],
  vigor: [1276, 718],
  extraticket: [1425, 1069],
  agritrust: [1536, 1024],
  tandem: [1536, 1024],
};
const musicLink = "https://open.spotify.com/artist/4zCH9qm4R2DADamUHMCa6O";
const processSteps = [
  [
    "01",
    "Ask the useful question",
    "Start with the decision someone needs to make, and work back to the data.",
    Database,
  ],
  [
    "02",
    "Get the data into shape",
    "Clean, explore and understand what is missing before choosing a model.",
    Sparkles,
  ],
  [
    "03",
    "Build a clear baseline",
    "Make a simple answer work first. Add complexity when it earns its place.",
    Code2,
  ],
  [
    "04",
    "Make it usable",
    "Turn analysis into a dashboard, a workflow or a product people can act on.",
    UserRound,
  ],
  [
    "05",
    "Check the whole system",
    "Inspect outcomes, uncertainty and the edges where things can go wrong.",
    Check,
  ],
  [
    "06",
    "Keep learning",
    "Listen, measure, improve. There is always a better question to ask.",
    ArrowUpRight,
  ],
] as const;

type Note = { name: string; message: string; color: string };
type Panel =
  | { kind: "project"; index: number }
  | { kind: "music" }
  | { kind: "note" }
  | null;

function SectionIntro({
  label,
  title,
  children,
  center = false,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`p-intro ${center ? "p-center" : ""}`} data-reveal>
      <p className="p-eyebrow">{label}</p>
      <h2>{title}</h2>
      {children && <p className="p-description">{children}</p>}
    </div>
  );
}

function PinCard({
  children,
  className,
  label,
  constraints,
}: {
  children: ReactNode;
  className: string;
  label: string;
  constraints: React.RefObject<HTMLDivElement | null>;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  return (
    <motion.div
      className={`p-pin-card ${className}`}
      drag
      dragConstraints={constraints}
      dragElastic={0.08}
      dragMomentum={false}
      style={{ x, y }}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Drag to move, or use arrow keys.`}
      onKeyDown={(event) => {
        if (
          !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        if (event.key === "ArrowLeft") x.set(Math.max(-70, x.get() - 12));
        if (event.key === "ArrowRight") x.set(Math.min(70, x.get() + 12));
        if (event.key === "ArrowUp") y.set(Math.max(-60, y.get() - 12));
        if (event.key === "ArrowDown") y.set(Math.min(60, y.get() + 12));
      }}
    >
      <span className="p-pushpin" aria-hidden />
      {children}
    </motion.div>
  );
}

export function Portfolio() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState("top");
  const [project, setProject] = useState(0);
  const [gallery, setGallery] = useState(0);
  const [unwrapped, setUnwrapped] = useState(false);
  const [tool, setTool] = useState(skills[0].id);
  const [panel, setPanel] = useState<Panel>(null);
  const [musicLoaded, setMusicLoaded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notice, setNotice] = useState("");
  const [noteName, setNoteName] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [noteColor, setNoteColor] = useState("yellow");
  const [noteOrder, setNoteOrder] = useState("newest");
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const careerJourney = useRef<CareerJourneyHandle>(null);
  const { scrollTo, stop: stopScroll, start: startScroll } = useSmoothScroll();
  const reduced = useReducedMotion();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 100]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.12]);
  const selectedSkill = skills.find((item) => item.id === tool) ?? skills[0];
  const selectedProject =
    panel?.kind === "project" ? projects[panel.index] : null;

  useEffect(() => {
    try {
      const savedNotes: unknown = JSON.parse(
        localStorage.getItem("baltej-notes-v1") || "[]",
      );
      const savedTheme = localStorage.getItem("baltej-theme") === "dark";
      const validNotes = Array.isArray(savedNotes)
        ? savedNotes
            .filter(
              (item): item is Note =>
                item &&
                typeof item.name === "string" &&
                typeof item.message === "string" &&
                ["yellow", "blue", "pink"].includes(item.color),
            )
            .slice(0, 24)
        : [];
      queueMicrotask(() => {
        setNotes(validNotes);
        setDark(savedTheme);
      });
    } catch {
      /* Storage is optional, including in private browsing. */
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -50% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("[data-dock-section]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (panel && dialog.current) {
      if (!dialog.current.open) dialog.current.showModal();
      stopScroll();
    }
    if (!panel) {
      dialog.current?.close();
      startScroll();
    }
    return () => startScroll();
  }, [panel, stopScroll, startScroll]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const emailShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key.toLowerCase() !== "e" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        dialog.current?.open
      )
        return;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"))
      )
        return;
      event.preventDefault();
      window.location.href = `mailto:${profile.email}`;
    };
    window.addEventListener("keydown", emailShortcut);
    return () => window.removeEventListener("keydown", emailShortcut);
  }, []);

  const toggleTheme = () => {
    setDark((value) => !value);
    try {
      localStorage.setItem("baltej-theme", dark ? "light" : "dark");
    } catch {
      /* Optional preference. */
    }
  };
  const openMusic = () => {
    setMusicLoaded(true);
    setPanel({ kind: "music" });
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setNotice("Email copied. Say hello!");
    } catch {
      setNotice(`Email me at ${profile.email}`);
    }
  };
  const openStop = (index: number) => {
    careerJourney.current?.goTo(index);
  };
  const saveNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noteName.trim() || !noteMessage.trim()) return;
    const next = [
      {
        name: noteName.trim().slice(0, 48),
        message: noteMessage.trim().slice(0, 360),
        color: noteColor,
      },
      ...notes,
    ].slice(0, 24);
    setNotes(next);
    try {
      localStorage.setItem("baltej-notes-v1", JSON.stringify(next));
      setNotice("Your note is saved on this device.");
    } catch {
      setNotice(
        "Your note is here for this visit. Device storage is unavailable.",
      );
    }
    setPanel(null);
    setNoteName("");
    setNoteMessage("");
  };
  const moveGallery = (direction: number) => {
    const next = Math.max(0, Math.min(3, gallery + direction));
    setGallery(next);
    const container = galleryRef.current;
    const card = container?.children[next] as HTMLElement | undefined;
    const first = container?.children[0] as HTMLElement | undefined;
    if (container && card && first)
      container.scrollTo({
        left: card.offsetLeft - first.offsetLeft,
        behavior: reduced ? "instant" : "smooth",
      });
  };

  return (
    <div className="p-site" data-theme={dark ? "dark" : "light"}>
      <header className="p-header">
        <a
          className="p-avatar"
          href="#top"
          aria-label="Baltej Goud, back to top"
        >
          <Image
            src="/images/id-photo.webp"
            width={48}
            height={48}
            alt="Baltej Goud"
          />
        </a>
        <div className="p-header-right">
          {musicLoaded && (
            <button
              className="p-music-header"
              aria-label="Open Anirudh music controls"
              onClick={openMusic}
            >
              <Music2 size={17} />
            </button>
          )}
          <a className="p-availability" href="#hello">
            <span />
            Open to data & AI roles
          </a>
          <button
            className="p-theme"
            onClick={toggleTheme}
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? "Day" : "Night"}</span>
          </button>
        </div>
      </header>

      <nav className="p-dock" aria-label="Main navigation">
        {[
          ["top", "Home", Home],
          ["journey", "Journey", Map],
          ["work", "Work", BriefcaseBusiness],
          ["life", "About", UserRound],
          ["hello", "Contact", Mail],
        ].map(([id, label, Icon]) => {
          const DockIcon = Icon as typeof Home;
          return (
            <a
              key={id as string}
              href={`#${id}`}
              className={active === id ? "is-active" : ""}
              aria-current={active === id ? "location" : undefined}
            >
              <DockIcon size={15} />
              <span>{label as string}</span>
            </a>
          );
        })}
        <a href={profile.links.resume} className="p-dock-resume">
          Résumé <ArrowUpRight size={14} />
        </a>
      </nav>

      <main id="main">
        <section
          id="top"
          ref={heroRef}
          className="p-hero"
          aria-label="Welcome to my world"
          data-dock-section
        >
          <motion.div
            className="p-hero-art"
            style={{ y: reduced ? 0 : heroY, scale: reduced ? 1 : heroScale }}
          >
            <picture>
              <source
                media="(max-width: 760px)"
                srcSet="/assets/portfolio-valley-mobile.webp"
              />
              <Image
                src={artwork}
                width={1672}
                height={941}
                alt="A painted green valley with a university, an engineering workshop and a hilltop observatory connected by a winding path"
                className="p-landscape"
                fetchPriority="high"
                loading="eager"
              />
            </picture>
          </motion.div>
          <div className="p-hero-shade" />
          <div className="p-hero-ribbon">
            A little world of data, ideas & things I build
          </div>
          <div className="p-hero-copy">
            <p>
              <span className="p-wave" aria-hidden>
                <Sparkles size={28} strokeWidth={1.4} />
              </span>{" "}
              hey, I’m Baltej
            </p>
            <h1>
              Turning data into
              <br />
              <span className="p-highlight">something useful.</span>
            </h1>
            <p className="p-hero-sub">
              Data analyst. AI engineer.
              <br />
              Curious enough to build the whole thing.
            </p>
          </div>
          <button
            className="p-hotspot p-hotspot-college"
            onClick={() => openStop(0)}
          >
            <span className="p-hotspot-icon">
              <GraduationCap size={18} />
            </span>
            <span>
              BVRIT <small>Where it started</small>
            </span>
            <i />
          </button>
          <button
            className="p-hotspot p-hotspot-work"
            onClick={() => openStop(3)}
          >
            <span className="p-hotspot-icon">
              <Database size={17} />
            </span>
            <span>
              Haritha <small>Data, every day</small>
            </span>
            <i />
          </button>
          <button
            className="p-hotspot p-hotspot-startup"
            onClick={() => openStop(5)}
          >
            <span className="p-hotspot-icon">
              <Sparkles size={17} />
            </span>
            <span>
              Sanket <small>Building what’s next</small>
            </span>
            <i />
          </button>
          <button
            className="p-hotspot p-hotspot-me"
            onClick={() => scrollTo("#life")}
          >
            <Image src="/images/id-photo.webp" width={26} height={26} alt="" />
            <span>That’s me</span>
            <i />
          </button>
          <button className="p-music-button" onClick={openMusic}>
            <Music2 size={17} /> A little Anirudh?
          </button>
          <a href="#story" className="p-scroll-cue">
            scroll to wander <ArrowDown size={15} />
          </a>
        </section>

        <section id="story" className="p-section p-story p-paper-edge">
          <span id="about" className="p-anchor-alias" aria-hidden />
          <div className="p-wrap p-story-layout">
            <div>
              <p className="p-eyebrow" data-reveal>
                How I got here
              </p>
              <p className="p-story-copy" data-reveal>
                I started with <span>computer science,</span> learning how
                things work. Then I got curious about what the{" "}
                <span>data was trying to say.</span> That took me from tutoring
                and analysis to AI, and now to{" "}
                <span>building things that make it useful.</span>
              </p>
            </div>
            <div className="p-story-notes">
              <motion.div
                drag
                dragMomentum={false}
                className="p-sticky p-sticky-yellow"
                style={{ rotate: -6 }}
              >
                <span className="p-tape" />
                <GraduationCap size={27} />
                <strong>BVRIT, class of ’23.</strong>
                <p>
                  Computer Science & Engineering.
                  <br />A foundation. Not the finish line.
                </p>
                <small>2019 → 2023</small>
              </motion.div>
              <motion.div
                drag
                dragMomentum={false}
                className="p-sticky p-sticky-blue"
                style={{ rotate: 5 }}
              >
                <span className="p-tape" />
                <Code2 size={27} />
                <strong>
                  Analyst brain.
                  <br />
                  Builder’s instinct.
                </strong>
                <p>Haritha · Tectoro · Sanket</p>
                <small>ALWAYS CURIOUS</small>
              </motion.div>
            </div>
          </div>
        </section>

        <CareerJourney ref={careerJourney} />

        <section
          id="work"
          className="p-section p-work p-paper-edge"
          data-dock-section
        >
          <div className="p-wrap">
            <SectionIntro
              label="Selected work"
              title={
                <>
                  Things I built.
                  <br />
                  Problems I couldn’t leave alone.
                </>
              }
              center
            >
              Forecasting, AI coworkers, health data, fairer tickets. A few
              ideas that became working software.
            </SectionIntro>
            <div
              className="p-project-deck"
              aria-label="Project card collection"
              data-reveal
            >
              {projects.map((item, index) => {
                const offset =
                  ((index - project + projects.length + 3) % projects.length) -
                  3;
                return (
                  <button
                    key={item.id}
                    className={`p-project-card ${project === index ? "is-selected" : ""}`}
                    style={
                      {
                        "--card-offset": offset,
                        "--card-color": projectColors[index],
                        zIndex: project === index ? 10 : 6 - Math.abs(offset),
                      } as CSSProperties
                    }
                    onClick={() =>
                      project === index
                        ? setPanel({ kind: "project", index })
                        : setProject(index)
                    }
                    aria-label={`${item.title}${project === index ? ", open project" : ", select project"}`}
                  >
                    <div className="p-project-top">
                      <span>
                        {item.index} / {item.category}
                      </span>
                      <ArrowUpRight size={18} />
                    </div>
                    <div className="p-project-image">
                      <Image
                        src={projectImages[item.id]}
                        width={projectSizes[item.id][0]}
                        height={projectSizes[item.id][1]}
                        alt={`${item.title} product interface`}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-project-bottom">
                      <h3>{item.title}</h3>
                      <span>{item.role}</span>
                      <p>{item.summary}</p>
                      <span className="p-project-open">
                        Take a closer look <Plus size={16} />
                      </span>
                    </div>
                  </button>
                );
              })}
              <div className="p-deck-label">The things-I-built collection</div>
            </div>
            <div
              className="p-project-tabs"
              role="group"
              aria-label="Choose a project"
            >
              {projects.map((item, index) => (
                <button
                  key={item.id}
                  className={project === index ? "is-active" : ""}
                  onClick={() => setProject(index)}
                  aria-pressed={project === index}
                >
                  <span style={{ color: projectColors[index] }}>
                    {item.index}
                  </span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
            <p className="p-handnote">
              pick a card. there’s a whole story inside.{" "}
              <ArrowUpRight size={18} />
            </p>
          </div>
        </section>

        <section id="websites" className="p-section p-websites p-paper-edge">
          <div className="p-wrap">
            <div className="p-section-heading-row">
              <SectionIntro
                label="Interfaces & experiences"
                title={
                  <>
                    From a blank canvas
                    <br />
                    to something you can use.
                  </>
                }
              >
                I build the interface, the engine behind it, and the small
                details that make the two feel like one.
              </SectionIntro>
              <a className="p-button" href={`mailto:${profile.email}`}>
                <span className="p-live-dot" /> Have something in mind?{" "}
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div
            className="p-gallery"
            ref={galleryRef}
            onScroll={() => {
              const container = galleryRef.current;
              if (!container) return;
              const firstCard = container.children[0] as
                HTMLElement | undefined;
              const atEnd =
                container.scrollLeft + container.clientWidth >=
                container.scrollWidth - 4;
              if (firstCard)
                setGallery(
                  atEnd
                    ? 3
                    : Math.max(
                        0,
                        Math.min(
                          3,
                          Math.round(
                            container.scrollLeft / (firstCard.offsetWidth + 30),
                          ),
                        ),
                      ),
                );
            }}
          >
            {projects.slice(0, 4).map((item, index) => (
              <button
                key={item.id}
                className="p-browser-card"
                onClick={() => setPanel({ kind: "project", index })}
              >
                <div className="p-browser-chrome">
                  <span>
                    <i />
                    <i />
                    <i />
                  </span>
                  <small>
                    {item.title.toLowerCase().replaceAll(" ", "")}.project
                  </small>
                  <ArrowUpRight size={15} />
                </div>
                <Image
                  src={projectImages[item.id]}
                  width={projectSizes[item.id][0]}
                  height={projectSizes[item.id][1]}
                  alt={`${item.title} — ${item.category}`}
                  loading="lazy"
                />
                <div className="p-browser-caption">
                  <h3>{item.title}</h3>
                  <p>
                    {item.category} <ArrowUpRight size={14} />
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-wrap p-gallery-controls">
            <span>Made with a little obsession for the details.</span>
            <div>
              <button
                className="p-round"
                disabled={gallery === 0}
                onClick={() => moveGallery(-1)}
                aria-label="Previous interface"
              >
                <ChevronLeft size={21} />
              </button>
              <button
                className="p-round"
                disabled={gallery === 3}
                onClick={() => moveGallery(1)}
                aria-label="Next interface"
              >
                <ChevronRight size={21} />
              </button>
            </div>
          </div>
        </section>

        <section id="sanket" className="p-section p-founder p-paper-edge">
          <div className="p-wrap">
            <Image
              className="p-sanket-wordmark"
              src="/assets/logos/sanket.webp"
              alt="Sanket — Supply Chain & Forecasting"
              width={900}
              height={307}
              sizes="(max-width: 760px) 240px, 320px"
            />
            <SectionIntro
              label="My own company"
              title={
                <>
                  I’m building <span className="p-underline">Sanket.</span>
                </>
              }
            />
            <div className="p-founder-story">
              <p data-reveal>
                What if a planning team could see <span>what’s coming,</span>{" "}
                before the shelves were empty? I’m building Sanket to turn
                operational data into{" "}
                <span>clearer forecasts and better inventory decisions.</span>
              </p>
              <a
                href="/work/sanket/"
                className="p-founder-preview"
                aria-label="Explore Sanket case study"
              >
                <Image
                  src="/assets/work/sanket-dashboard.webp"
                  width={1672}
                  height={941}
                  alt="Sanket demand forecasting dashboard"
                  loading="lazy"
                />
                <span>
                  Inside Sanket <ArrowUpRight size={19} />
                </span>
              </a>
            </div>
            <p className="p-eyebrow p-hats-label">
              The hats I wear to build it
            </p>
            <div className="p-hats">
              {[
                [
                  "Co-founder & CEO",
                  "Product direction and the business behind it",
                  Flag,
                ],
                [
                  "Data & ML",
                  "Demand forecasting, model routing and uncertainty",
                  Database,
                ],
                [
                  "Product engineer",
                  "APIs, data isolation and the dashboard",
                  Code2,
                ],
                [
                  "Product thinker",
                  "Replenish. Hold. Investigate. Make it actionable.",
                  Sparkles,
                ],
              ].map(([title, text, Icon]) => {
                const HatIcon = Icon as typeof Flag;
                return (
                  <div key={title as string}>
                    <HatIcon size={24} />
                    <h3>{title as string}</h3>
                    <p>{text as string}</p>
                  </div>
                );
              })}
            </div>
            <div className="p-founder-numbers">
              <div>
                <strong>4</strong>
                <span>Industry verticals</span>
              </div>
              <div>
                <strong>SKU-level</strong>
                <span>Demand forecasting</span>
              </div>
              <div>
                <strong>Built for decisions</strong>
                <span>Not just another chart</span>
              </div>
            </div>
            <a href="/work/sanket/" className="p-button p-dark-button">
              Explore the Sanket story <ArrowUpRight size={18} />
            </a>
          </div>
        </section>

        <section id="stack" className="p-section p-stack p-paper-edge">
          <span id="skills" className="p-anchor-alias" aria-hidden />
          <div className="p-wrap">
            <SectionIntro
              label="My stack"
              title={
                <>
                  Everything I work with,
                  <br />
                  <span className="p-underline">unwrapped.</span>
                </>
              }
              center
            >
              From the first query to the shipped product. The tools behind the
              work.
            </SectionIntro>
            {!unwrapped ? (
              <div className="p-wrapped" data-reveal>
                <button
                  onClick={() => setUnwrapped(true)}
                  className="p-gift"
                  aria-label="Unwrap my toolkit"
                >
                  <Image
                    src="/assets/portfolio-toolkit-gift.webp"
                    width={560}
                    height={560}
                    alt="A navy gift box with a gold ribbon"
                    loading="lazy"
                  />
                  <span className="p-gift-tag">for the curious ones</span>
                </button>
                <button className="p-button" onClick={() => setUnwrapped(true)}>
                  <Gift size={18} /> Tap to unwrap <ArrowUpRight size={16} />
                </button>
                <p className="p-handnote">a few of my favourite tools.</p>
              </div>
            ) : (
              <div className="p-unwrapped">
                <div className="p-tool-grid">
                  {skills.map((item, index) => (
                    <motion.button
                      initial={reduced ? false : { opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduced ? 0 : Math.min(index * 0.018, 0.4),
                      }}
                      key={item.id}
                      className={tool === item.id ? "is-selected" : ""}
                      onClick={() => setTool(item.id)}
                      onFocus={() => setTool(item.id)}
                      onMouseEnter={() => setTool(item.id)}
                      aria-label={item.name}
                      aria-pressed={tool === item.id}
                    >
                      <span>
                        <SkillIcon skill={item} className="p-skill-icon" />
                      </span>
                      <strong>{item.name}</strong>
                    </motion.button>
                  ))}
                </div>
                <div className="p-tool-detail" aria-live="polite">
                  <SkillIcon skill={selectedSkill} className="p-skill-icon" />
                  <div>
                    <strong>{selectedSkill.name}</strong>
                    <p>{selectedSkill.usage}</p>
                  </div>
                </div>
                <button
                  className="p-text-link"
                  onClick={() => setUnwrapped(false)}
                >
                  <Gift size={16} /> Wrap it back up
                </button>
              </div>
            )}
          </div>
        </section>

        <section id="process" className="p-section p-process p-paper-edge">
          <div className="p-wrap">
            <SectionIntro
              label="How I work"
              title={
                <>
                  First, the right question.
                  <br />
                  Then, the useful answer.
                </>
              }
            >
              A dataset is a starting point. The work is turning it into
              something someone can trust and use.
            </SectionIntro>
            <div className="p-process-grid">
              {processSteps.map(([number, title, description, Icon]) => (
                <div key={number} data-reveal>
                  <span className="p-process-number">{number}</span>
                  <Icon size={24} strokeWidth={1.5} />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="highlights"
          className="p-section p-highlights p-paper-edge"
        >
          <span id="achievements" className="p-anchor-alias" aria-hidden />
          <div className="p-wrap">
            <SectionIntro
              label="Little milestones, big memories"
              title={
                <>
                  A few things
                  <br />
                  I’m proud of.
                </>
              }
            />
            <div className="p-achievements">
              {achievements.map((item, index) => (
                <div
                  key={item.title}
                  className={`p-achievement p-achievement-${index % 3}`}
                  data-reveal
                >
                  <Trophy size={22} strokeWidth={1.5} />
                  <strong>{item.metric}</strong>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
            {certifications.length > 0 && (
              <div className="p-certifications">
                <h3>Learning along the way</h3>
                {certifications.map((cert) => (
                  <p key={cert.title}>
                    {cert.href ? (
                      <a href={cert.href} target="_blank" rel="noreferrer">
                        {cert.title} <ExternalLink size={14} />
                      </a>
                    ) : (
                      cert.title
                    )}{" "}
                    · {cert.issuer} {cert.year}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="life"
          className="p-section p-life p-paper-edge"
          data-dock-section
        >
          <div className="p-wrap">
            <SectionIntro
              label="Off the clock"
              title={<>More than the work tabs.</>}
            >
              Hyderabad is home. Give me a football, a good film, a new place to
              explore, and Anirudh on repeat.
            </SectionIntro>
            <div className="p-pinboard" ref={board}>
              <PinCard
                className="p-polaroid p-me-photo"
                label="A photo of Baltej"
                constraints={board}
              >
                <Image
                  src="/assets/portrait.webp"
                  width={720}
                  height={1432}
                  alt="Baltej Goud"
                  loading="lazy"
                  draggable="false"
                />
                <p>hey, the person behind the projects.</p>
              </PinCard>
              <PinCard
                className="p-life-note"
                label="About me, off the clock"
                constraints={board}
              >
                <small>OFF THE CLOCK</small>
                <h3>
                  Hi, I’m Baltej.
                  <br />
                  The other version.
                </h3>
                <p>Things I’ll always make time for</p>
                <ul>
                  <li>Badminton, cricket & football</li>
                  <li>A really good movie</li>
                  <li>Visiting somewhere I haven’t been</li>
                  <li>Anirudh. Preferably turned up.</li>
                </ul>
                <span className="p-handnote">curiosity doesn’t clock out.</span>
              </PinCard>
              <PinCard
                className="p-football-note"
                label="Football captain and district player"
                constraints={board}
              >
                <Trophy size={39} strokeWidth={1.4} />
                <span>ON THE PITCH</span>
                <strong>Captain.</strong>
                <p>
                  College football team.
                  <br />
                  District-level player.
                </p>
                <small>Same team spirit. Different field.</small>
              </PinCard>
              <PinCard
                className="p-music-note"
                label="Anirudh on repeat"
                constraints={board}
              >
                <Headphones size={34} />
                <small>THE SOUNDTRACK</small>
                <h3>
                  Anirudh.
                  <br />
                  On repeat.
                </h3>
                <button className="p-record-play" onClick={openMusic}>
                  <Music2 size={17} /> Open the player{" "}
                  <ArrowUpRight size={15} />
                </button>
              </PinCard>
              <PinCard
                className="p-boarding-pass"
                label="Always up for a new place"
                constraints={board}
              >
                <span>BOARDING PASS / A STATE OF MIND</span>
                <div>
                  <strong>HYD</strong>
                  <ArrowRight size={28} />
                  <strong>NEXT</strong>
                </div>
                <p>
                  Hyderabad <span>Somewhere new</span>
                </p>
                <hr />
                <small>PASSENGER</small>
                <b>Baltej Goud</b>
                <small>SEAT: WINDOW, PLEASE.</small>
              </PinCard>
              <p className="p-board-caption">
                my board, your arrangement. drag things around ;)
              </p>
            </div>
          </div>
        </section>

        <section id="notes" className="p-section p-notes p-paper-edge">
          <div className="p-wrap">
            <div className="p-section-heading-row">
              <SectionIntro
                label="The wall"
                title={
                  <>
                    Before you go,
                    <br />
                    leave a little note.
                  </>
                }
              >
                Say hi, share a thought, or tell me what you’re building.
              </SectionIntro>
              <div className="p-notes-actions">
                <label className="p-sort">
                  <span className="sr-only">Note order</span>
                  <select
                    value={noteOrder}
                    onChange={(event) => setNoteOrder(event.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
                <button
                  className="p-button"
                  onClick={() => setPanel({ kind: "note" })}
                >
                  <Pencil size={17} /> Write a note
                </button>
              </div>
            </div>
            <div className="p-note-wall">
              <button
                className="p-empty-note"
                onClick={() => setPanel({ kind: "note" })}
              >
                <Plus size={28} />
                <span>Your note could be here.</span>
                <strong>
                  Write one <ArrowUpRight size={15} />
                </strong>
              </button>
              <div className="p-wall-note p-note-blue">
                <span className="p-tape" />
                <p>“Make complex data useful.”</p>
                <strong>Baltej</strong>
                <small>A small reminder to myself.</small>
              </div>
              <div className="p-wall-note p-note-yellow">
                <span className="p-tape" />
                <p>
                  The next interesting project probably starts with a
                  conversation.
                </p>
                <a href={`mailto:${profile.email}`}>
                  Let’s have one <ArrowUpRight size={15} />
                </a>
              </div>
              {(noteOrder === "newest" ? notes : [...notes].reverse()).map(
                (note, index) => (
                  <div
                    key={`${note.name}-${index}`}
                    className={`p-wall-note p-note-${note.color}`}
                  >
                    <span className="p-tape" />
                    <p>{note.message}</p>
                    <strong>{note.name}</strong>
                    <small>Saved on this device</small>
                    <button
                      className="p-remove-note"
                      aria-label={`Remove note from ${note.name}`}
                      onClick={() => {
                        const remaining = notes.filter((item) => item !== note);
                        setNotes(remaining);
                        try {
                          localStorage.setItem(
                            "baltej-notes-v1",
                            JSON.stringify(remaining),
                          );
                        } catch {
                          /* Optional device storage. */
                        }
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ),
              )}
            </div>
            <p className="p-notes-disclosure">
              This wall saves notes in your browser. To send one to me, use
              “Send by email” in the note editor.
            </p>
          </div>
        </section>

        <section
          id="hello"
          className="p-section p-contact p-paper-edge"
          data-dock-section
        >
          <span id="contact" className="p-anchor-alias" aria-hidden />
          <div className="p-wrap">
            <p className="p-eyebrow">The next good thing starts with hello</p>
            <h2 data-reveal>
              Let’s make
              <br />
              something <span>useful.</span>
            </h2>
            <p className="p-contact-description">
              Hiring for data or AI roles? Have a problem worth solving?
              <br />
              I’d love to hear about it.
            </p>
            <div className="p-contact-keys">
              <a
                href={`mailto:${profile.email}`}
                className="p-contact-key p-key-email"
              >
                <Mail size={32} />
                <span>Email me</span>
                <small>Roles, projects, or just hi.</small>
                <kbd>E</kbd>
              </a>
              <a
                href={profile.links.github}
                target="_blank"
                rel="noreferrer"
                className="p-contact-key p-key-github"
              >
                <Github size={32} />
                <span>GitHub</span>
                <small>The things I build.</small>
                <ArrowUpRight size={17} />
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-contact-key p-key-linkedin"
              >
                <Linkedin size={32} />
                <span>LinkedIn</span>
                <small>The work & the journey.</small>
                <ArrowUpRight size={17} />
              </a>
              <a
                href={profile.links.resume}
                className="p-contact-key p-key-resume"
              >
                <BriefcaseBusiness size={32} />
                <span>Résumé</span>
                <small>The story, on paper.</small>
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="p-contact-email">
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <button aria-label="Copy email address" onClick={copyEmail}>
                <Copy size={18} />
              </button>
            </div>
            <div className="p-footer">
              <span>
                © {profile.copyrightYear} {profile.name}
              </span>
              <span>Made with curiosity, in Hyderabad.</span>
              <a href="#top">
                Back to the valley <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <dialog
        ref={dialog}
        className={`p-dialog ${panel?.kind === "music" ? "p-music-dialog" : ""}`}
        data-lenis-prevent
        onCancel={() => setPanel(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
        aria-labelledby={
          panel?.kind === "music" ? "p-music-title" : "p-dialog-title"
        }
      >
        <div className="p-dialog-inner">
          <button
            className="p-dialog-close p-round"
            aria-label="Close dialog"
            onClick={() => setPanel(null)}
          >
            <X size={21} />
          </button>
          {selectedProject && (
            <>
              <p className="p-eyebrow">
                {selectedProject.index} / {selectedProject.category}
              </p>
              <h2 id="p-dialog-title">{selectedProject.title}</h2>
              <p className="p-dialog-role">{selectedProject.role}</p>
              <Image
                className="p-dialog-image"
                src={projectImages[selectedProject.id]}
                width={projectSizes[selectedProject.id][0]}
                height={projectSizes[selectedProject.id][1]}
                alt={`${selectedProject.title} product interface`}
              />
              <p className="p-dialog-summary">{selectedProject.summary}</p>
              <h3>What went into it</h3>
              <ul className="p-feature-list">
                {selectedProject.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="p-tags">
                {selectedProject.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="p-dialog-links">
                {selectedProject.links.caseStudy && (
                  <a
                    href={selectedProject.links.caseStudy}
                    className="p-button p-dark-button"
                  >
                    Full case study <ArrowUpRight size={17} />
                  </a>
                )}
                {selectedProject.links.github && (
                  <a
                    href={selectedProject.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-button"
                  >
                    <Github size={17} /> View source <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
              <div className="p-dialog-pagination">
                <button
                  className="p-text-link"
                  onClick={() =>
                    setPanel({
                      kind: "project",
                      index:
                        (panel!.kind === "project" ? panel!.index + 5 : 0) % 6,
                    })
                  }
                >
                  <ArrowLeft size={16} /> Previous project
                </button>
                <button
                  className="p-text-link"
                  onClick={() =>
                    setPanel({
                      kind: "project",
                      index:
                        (panel!.kind === "project" ? panel!.index + 1 : 0) % 6,
                    })
                  }
                >
                  Next project <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {musicLoaded && (
            <div hidden={panel?.kind !== "music"} className="p-music-content">
              <p className="p-eyebrow">The soundtrack to the tabs</p>
              <h2 id="p-music-title">A little Anirudh.</h2>
              <p>Pick a track, then head back to the valley.</p>
              <iframe
                className="p-spotify"
                title="Anirudh Ravichander music player"
                src="https://open.spotify.com/embed/artist/4zCH9qm4R2DADamUHMCa6O?utm_source=generator&theme=0"
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <a
                href={musicLink}
                className="p-button"
                target="_blank"
                rel="noreferrer"
              >
                Listen on Spotify <ArrowUpRight size={16} />
              </a>
              <small className="p-player-note">
                Playback is provided by Spotify. Availability depends on your
                region and account.
              </small>
            </div>
          )}
          {panel?.kind === "note" && (
            <>
              <p className="p-eyebrow">A little hello</p>
              <h2 id="p-dialog-title">Leave a note.</h2>
              <p>Keep it here, or send it straight to my inbox.</p>
              <form onSubmit={saveNote} className="p-note-form">
                <label>
                  Your name
                  <input
                    value={noteName}
                    onChange={(event) => setNoteName(event.target.value)}
                    maxLength={48}
                    required
                    placeholder="What should I call you?"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Your note
                  <textarea
                    value={noteMessage}
                    onChange={(event) => setNoteMessage(event.target.value)}
                    maxLength={360}
                    required
                    rows={4}
                    placeholder="A thought, a hello, or something you’re building…"
                  />
                </label>
                <div
                  className="p-note-colors"
                  role="group"
                  aria-label="Note colour"
                >
                  {["yellow", "blue", "pink"].map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`p-note-${color}`}
                      aria-label={`${color} note`}
                      aria-pressed={noteColor === color}
                      onClick={() => setNoteColor(color)}
                    >
                      {noteColor === color && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <button type="submit" className="p-button p-dark-button">
                  <Pencil size={16} /> Save on this device
                </button>
                <a
                  className="p-button"
                  href={`mailto:${profile.email}?subject=${encodeURIComponent(`A portfolio note from ${noteName.trim() || "a visitor"}`)}&body=${encodeURIComponent(noteMessage)}`}
                >
                  <Send size={16} /> Send by email
                </a>
                <small>
                  Saving adds a note to this browser only. Sending opens your
                  email app so you can review and send it.
                </small>
              </form>
            </>
          )}
        </div>
      </dialog>
      <div className={`p-toast ${notice ? "is-visible" : ""}`} role="status">
        {notice && (
          <>
            <Check size={17} />
            {notice}
          </>
        )}
      </div>
    </div>
  );
}
