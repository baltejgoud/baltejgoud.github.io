"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  GitFork,
  ImageIcon,
  Play,
  X,
} from "lucide-react";
import { projects } from "@/content/projects";
import { projectBooks } from "@/content/projectBooks";
import { workMedia } from "@/content/workMedia";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { BookCover } from "./BookCover";
import { ProjectWidget } from "./ProjectWidget";

const chapters = [
  { label: "The story", icon: BookOpen },
  { label: "In pictures", icon: ImageIcon },
  { label: "Try it", icon: Play },
  { label: "The build", icon: Code2 },
];

export function ProjectBook({
  initialIndex,
  opener,
  onClose,
}: {
  initialIndex: number;
  opener: HTMLButtonElement | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [chapter, setChapter] = useState(0);
  const [shot, setShot] = useState(0);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = usePrefersReducedMotion();
  const { start, stop } = useSmoothScroll();
  const project = projects[index];
  const book = projectBooks[project.widget];
  const media = workMedia[project.id];
  const image = media.shots[shot];

  useEffect(() => {
    const element = dialog.current;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const gutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    stop();
    if (element && !element.open) element.showModal();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      element?.close();
      root.style.overflow = overflow;
      root.style.scrollbarGutter = gutter;
      start();
      requestAnimationFrame(() => {
        if (!element?.isConnected) opener?.focus({ preventScroll: true });
      });
    };
  }, [opener, start, stop]);

  const close = () => {
    if (closing) return;
    setClosing(true);
    timer.current = setTimeout(onClose, reduced ? 0 : 220);
  };
  const turn = (next: number, focusTab = false) => {
    setChapter(next);
    if (focusTab) tabs.current[next]?.focus({ preventScroll: true });
  };
  const changeBook = (next: number) => {
    setIndex((next + projects.length) % projects.length);
    setChapter(0);
    setShot(0);
    dialog.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const onTabKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    current: number,
  ) => {
    const next =
      event.key === "ArrowRight"
        ? (current + 1) % chapters.length
        : event.key === "ArrowLeft"
          ? (current + chapters.length - 1) % chapters.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? chapters.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    turn(next, true);
  };

  return (
    <dialog
      ref={dialog}
      className="wb-dialog"
      aria-labelledby="wb-book-title"
      data-lenis-prevent
      data-closing={closing}
      style={
        {
          "--book-color": book.color,
          "--book-ink": book.ink,
          "--book-accent": book.accent,
        } as CSSProperties
      }
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="wb-reader">
        <header className="wb-reader-bar">
          <button type="button" onClick={close} className="wb-back">
            <ArrowLeft size={16} />
            <span>Back to the shelf</span>
          </button>
          <span className="wb-reader-edition">
            THE BUILD COLLECTION / VOL. {project.index}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close book"
            className="wb-close"
            autoFocus
          >
            <X size={21} />
          </button>
        </header>
        <div
          className="wb-chapters"
          role="tablist"
          aria-label={`${project.title} chapters`}
        >
          {chapters.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              ref={(element) => {
                tabs.current[i] = element;
              }}
              type="button"
              role="tab"
              id={`wb-chapter-${i}`}
              aria-selected={chapter === i}
              aria-controls="wb-chapter-panel"
              tabIndex={chapter === i ? 0 : -1}
              onClick={() => turn(i)}
              onKeyDown={(event) => onTabKey(event, i)}
            >
              <span className="wb-chapter-number">0{i + 1}</span>
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="wb-spread" key={project.id}>
          <aside className="wb-title-page">
            <p className="wb-running-head">{project.category}</p>
            <h2 id="wb-book-title">{project.title}</h2>
            <p className="wb-book-headline">{book.headline}</p>
            <p className="wb-book-summary">{project.summary}</p>
            <div className="wb-mini-cover" aria-hidden="true">
              <BookCover project={project} />
            </div>
            <div className="wb-book-links">
              {project.links.caseStudy && (
                <a href={project.links.caseStudy}>
                  Full case study <ArrowUpRight size={16} />
                </a>
              )}
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noreferrer">
                  <GitFork size={15} /> Source code <ArrowUpRight size={15} />
                </a>
              )}
            </div>
            <span className="wb-folio" aria-hidden="true">
              BALTEJ GOUD <span>{project.index} / THE STORY</span>
            </span>
          </aside>

          <div
            id="wb-chapter-panel"
            className="wb-reading-page"
            role="tabpanel"
            aria-labelledby={`wb-chapter-${chapter}`}
            tabIndex={0}
          >
            <div className="wb-page-content" key={chapter}>
              <p className="wb-running-head">
                CHAPTER 0{chapter + 1} / {chapters[chapter].label}
              </p>
              {chapter === 0 && (
                <div className="wb-story-content">
                  <h3>
                    From an idea
                    <br />
                    to something useful.
                  </h3>
                  <figure className="wb-story-image">
                    <Image
                      src={media.cover.src}
                      width={media.cover.width}
                      height={media.cover.height}
                      alt={`${project.title}: ${media.cover.caption}`}
                      sizes="(max-width: 700px) 85vw, 500px"
                    />
                    <figcaption>
                      {media.cover.kind === "concept"
                        ? "Concept illustration"
                        : media.cover.caption}
                    </figcaption>
                  </figure>
                  <div className="wb-role">
                    <span>My part</span>
                    <p>{project.role}</p>
                  </div>
                  <p className="wb-story-prompt">{book.invitation}</p>
                  <button
                    type="button"
                    className="wb-text-button"
                    onClick={() => turn(2, true)}
                  >
                    Try the interactive model <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {chapter === 1 && (
                <div className="wb-gallery">
                  <h3>A closer look.</h3>
                  <figure>
                    <a
                      className="wb-screen"
                      href={image.src}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open full image: ${image.caption}`}
                    >
                      <Image
                        src={image.src}
                        width={image.width}
                        height={image.height}
                        alt={`${project.title}: ${image.caption}`}
                        sizes="(max-width: 700px) 85vw, 500px"
                      />
                      <span>
                        <ArrowUpRight size={14} /> Full image
                      </span>
                    </a>
                    <figcaption>
                      {image.kind === "concept" && (
                        <strong>Concept illustration · </strong>
                      )}
                      {image.caption}
                    </figcaption>
                  </figure>
                  {media.shots.length > 1 && (
                    <div
                      className="wb-shots"
                      role="group"
                      aria-label="Project screenshots"
                    >
                      {media.shots.map((item, i) => (
                        <button
                          key={item.src}
                          type="button"
                          aria-pressed={shot === i}
                          aria-label={item.caption}
                          onClick={() => setShot(i)}
                        >
                          <Image
                            src={item.src}
                            width={item.width}
                            height={item.height}
                            alt=""
                            sizes="70px"
                          />
                          <span>0{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {chapter === 2 && (
                <div className="wb-demo">
                  <h3>Go on. Try the idea.</h3>
                  <p className="wb-demo-intro">{book.invitation}</p>
                  <ProjectWidget kind={project.widget} />
                </div>
              )}
              {chapter === 3 && (
                <div className="wb-build">
                  <h3>Under the cover.</h3>
                  <ul>
                    {project.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="wb-stack-label">Built with</p>
                  <div className="wb-stack">
                    {project.stack.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <nav className="wb-page-turns" aria-label="Book pages">
              <button
                type="button"
                disabled={chapter === 0}
                onClick={() => turn(chapter - 1, true)}
                aria-label="Previous page"
              >
                <ArrowLeft size={17} />
              </button>
              <span>
                0{chapter + 1} <span>/ 04</span>
              </span>
              <button
                type="button"
                disabled={chapter === chapters.length - 1}
                onClick={() => turn(chapter + 1, true)}
                aria-label="Next page"
              >
                <ArrowRight size={17} />
              </button>
            </nav>
          </div>
          <div className="wb-opening-cover" aria-hidden="true">
            <BookCover project={project} />
          </div>
        </div>

        <footer className="wb-reader-footer">
          <button type="button" onClick={() => changeBook(index - 1)}>
            <ArrowLeft size={15} />
            <span>Previous book</span>
          </button>
          <span>
            {project.index} <span>of 06</span>
          </span>
          <button type="button" onClick={() => changeBook(index + 1)}>
            <span>Next book</span>
            <ArrowRight size={15} />
          </button>
        </footer>
      </div>
    </dialog>
  );
}
