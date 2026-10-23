"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowDown, BookOpen } from "lucide-react";
import { projects } from "@/content/projects";
import { projectBooks } from "@/content/projectBooks";
import { BookCover } from "@/components/work/BookCover";
import { ProjectBook } from "@/components/work/ProjectBook";
import "./work.css";

export function Work() {
  const [opened, setOpened] = useState<{
    index: number;
    opener: HTMLButtonElement;
  } | null>(null);
  const books = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <section
      id="work"
      className="p-section w-work p-paper-edge"
      data-dock="work"
      aria-labelledby="wb-heading"
    >
      <div className="p-wrap">
        <div className="wb-intro" data-reveal>
          <p className="p-eyebrow">Selected work</p>
          <h2 id="wb-heading">
            Every build has
            <br />a <em>story inside.</em>
          </h2>
          <p>
            Six projects, bound by curiosity.
            <br />
            Take a book off the shelf. See what went into it.
          </p>
        </div>

        <div className="wb-library">
          <div className="wb-library-top">
            <span>THE BUILD COLLECTION</span>
            <span>VOL. 01—06 / BY BALTEJ GOUD</span>
          </div>
          <div className="wb-shelf-scene">
            <span className="wb-shelf-note" aria-hidden="true">
              pick one to open <ArrowDown size={23} strokeWidth={1.3} />
            </span>
            <div
              className="wb-books"
              role="group"
              aria-label="Project bookshelf. Choose a book to open. Use arrow keys to browse."
            >
              {projects.map((project, index) => {
                const book = projectBooks[project.widget];
                return (
                  <button
                    key={project.id}
                    ref={(element) => {
                      books.current[index] = element;
                    }}
                    type="button"
                    className={`wb-book ${opened?.index === index ? "is-reading" : ""}`}
                    style={
                      {
                        "--book-color": book.color,
                        "--book-ink": book.ink,
                        "--book-accent": book.accent,
                        "--book-height": `${book.height}px`,
                        "--book-tilt": `${book.tilt}deg`,
                      } as CSSProperties
                    }
                    aria-label={`Open ${project.title}, ${book.subject}`}
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      setOpened({ index, opener: event.currentTarget });
                    }}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight"
                          ? (index + 1) % projects.length
                          : event.key === "ArrowLeft"
                            ? (index + projects.length - 1) % projects.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? projects.length - 1
                                : null;
                      if (next === null) return;
                      event.preventDefault();
                      books.current[next]?.focus({ preventScroll: true });
                    }}
                  >
                    <span className="wb-book-shadow" />
                    <span className="wb-volume">
                      <span className="wb-book-back" />
                      <span className="wb-book-pages" />
                      <span className="wb-book-top" />
                      <span className="wb-book-front">
                        <BookCover project={project} />
                      </span>
                      <span className="wb-book-binding" />
                    </span>
                    <span className="wb-book-label">
                      <span>{project.index}</span>
                      <span>
                        Open book <BookOpen size={12} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="wb-shelf" aria-hidden="true">
              <span className="wb-shelf-face" />
              <i />
              <i />
            </div>
          </div>
          <div className="wb-library-bottom">
            <span>
              <BookOpen size={15} /> A small library of things I’ve built.
            </span>
            <span>Pick up. Open. Explore.</span>
          </div>
        </div>
      </div>
      {opened !== null && (
        <ProjectBook
          initialIndex={opened.index}
          opener={opened.opener}
          onClose={() => setOpened(null)}
        />
      )}
    </section>
  );
}
