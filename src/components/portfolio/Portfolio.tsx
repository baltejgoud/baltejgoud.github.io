"use client";

// Shared styles first, so each section's stylesheet can override them.
import "./base.css";
import "./motion/motion.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight, BriefcaseBusiness, Check, Home, Mail, Map, Moon, Music2, Sun, UserRound, X } from "lucide-react";
import { profile } from "@/content/profile";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { CareerJourney, type CareerJourneyHandle } from "./CareerJourney";
import { SiteContext, type SiteApi } from "./SiteContext";
import { Hero } from "./sections/Hero";
import { Story } from "./sections/Story";
import { Work } from "./sections/Work";
import { Sanket } from "./sections/Sanket";
import { Process } from "./sections/Process";
import { Toolkit } from "./sections/Toolkit";
import { Life } from "./sections/Life";
import { Contact } from "./sections/Contact";

const musicLink = "https://open.spotify.com/artist/4zCH9qm4R2DADamUHMCa6O";

const dockItems = [
  ["top", "Home", Home],
  ["work", "Work", BriefcaseBusiness],
  ["journey", "Journey", Map],
  ["life", "About", UserRound],
  ["hello", "Contact", Mail],
] as const;

export function Portfolio() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState("top");
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicLoaded, setMusicLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const journey = useRef<CareerJourneyHandle>(null);
  const { stop: stopScroll, start: startScroll } = useSmoothScroll();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("baltej-theme") === "dark";
      if (saved) queueMicrotask(() => setDark(true));
    } catch {
      /* Storage is optional, including in private browsing. */
    }
  }, []);

  // The dock follows whichever section owns the middle of the screen. Sections that belong to a
  // dock item without being its anchor say so with data-dock (Sanket counts as Work, and so on).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          setActive(el.dataset.dock ?? el.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    document.querySelectorAll("main > section").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (musicOpen) {
      if (!el.open) el.showModal();
      stopScroll();
    } else {
      el.close();
      startScroll();
    }
  }, [musicOpen, startScroll, stopScroll]);

  const toggleTheme = () => {
    const next = !dark;
    const apply = () => setDark(next);
    // A view transition cross-fades the whole page between day and night where supported.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      doc.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem("baltej-theme", next ? "dark" : "light");
    } catch {
      /* Optional preference. */
    }
  };

  const openMusic = useCallback(() => {
    setMusicLoaded(true);
    setMusicOpen(true);
  }, []);
  const goToStop = useCallback((index: number) => journey.current?.goTo(index), []);
  const api = useMemo<SiteApi>(() => ({ toast: setNotice, openMusic, goToStop, dark }), [dark, goToStop, openMusic]);

  return (
    <SiteContext.Provider value={api}>
      <div className="p-site" data-theme={dark ? "dark" : "light"}>
        <header className="p-header">
          <a className="p-avatar" href="#top" aria-label="Baltej Goud, back to top">
            <Image src="/images/id-photo.webp" width={48} height={48} alt="Baltej Goud" />
          </a>
          <div className="p-header-right">
            {musicLoaded && (
              <button className="p-music-header" aria-label="Open the music player" onClick={openMusic}>
                <Music2 size={17} />
              </button>
            )}
            <a className="p-availability" href="#hello">
              <span />
              Open to data & AI roles
            </a>
            <button className="p-theme" onClick={toggleTheme} aria-label={`Switch to ${dark ? "day" : "night"}`}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{dark ? "Day" : "Night"}</span>
            </button>
          </div>
        </header>

        <nav className="p-dock" aria-label="Main navigation">
          {dockItems.map(([id, label, Icon]) => (
            <a key={id} href={`#${id}`} className={active === id ? "is-active" : ""} aria-current={active === id ? "location" : undefined}>
              {active === id && <motion.span layoutId="dock-pill" className="p-dock-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icon size={15} />
              <span>{label}</span>
            </a>
          ))}
          <a href={profile.links.resume} className="p-dock-resume">
            Résumé <ArrowUpRight size={14} />
          </a>
        </nav>

        <main id="main">
          <Hero />
          <Story />
          <Work />
          <Sanket />
          <CareerJourney ref={journey} />
          <Process />
          <Toolkit />
          <Life />
          <Contact />
        </main>

        <dialog
          ref={dialog}
          className="p-dialog p-music-dialog"
          data-lenis-prevent
          onCancel={() => setMusicOpen(false)}
          onClose={() => setMusicOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setMusicOpen(false);
          }}
          aria-labelledby="p-music-title"
        >
          <div className="p-dialog-inner p-music-content">
            <button className="p-dialog-close p-round" aria-label="Close" onClick={() => setMusicOpen(false)}>
              <X size={21} />
            </button>
            <p className="p-eyebrow">The soundtrack to the tabs</p>
            <h2 id="p-music-title">A little Anirudh.</h2>
            <p>Pick a track, then head back to the valley.</p>
            {musicLoaded && (
              <iframe
                className="p-spotify"
                title="Anirudh Ravichander music player"
                src="https://open.spotify.com/embed/artist/4zCH9qm4R2DADamUHMCa6O?utm_source=generator&theme=0"
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            )}
            <a href={musicLink} className="p-button" target="_blank" rel="noreferrer">
              Listen on Spotify <ArrowUpRight size={16} />
            </a>
            <small className="p-player-note">Playback is provided by Spotify. Availability depends on your region and account.</small>
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
    </SiteContext.Provider>
  );
}
