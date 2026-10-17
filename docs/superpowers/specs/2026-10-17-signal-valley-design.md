# Signal Valley — design

Date: 2026-10-17 · Branch: `feat/editorial-portfolio` · Supersedes the section designs in the
uncommitted reference-matching pass (checkpoint `c6c3e70`).

## Goal

Bring the portfolio to the craft level of https://www.jameschugh.com/ (smoothness, depth, motion,
interactive features) without copying it. The signature is data: "Sanket" means *signal*, so every
place the reference uses decoration, this site uses an analyst's device. The improvement over the
reference: visitors can run Baltej's work, not just read numbers about it.

## Decisions (from the brainstorm)

- Concept **A, Signal Valley**: keep the painted valley and the journey map; data is the signature.
- **No backend.** The visitor counter is dropped, not faked. Notes are composed on the page and sent
  by email; a wall shows only notes Baltej adds to `src/content/notes.ts`.
- Baltej supplies personal photos, a full-body cutout and AI-generated art from prompts in
  `docs/signal-valley-art.md`. No Sanket metrics are on record, so Sanket shows facts, not KPIs.
- Never invent metrics, dates, quotes or links. Synthetic widget data stays labelled "Illustrative".

## Page order

1. **Hero** (`#top`) — camera fly-in through depth layers made from the painting (sky slow, ground
   base, foreground fast with a soft blur), drifting light and birds, pins anchored to painting
   coordinates styled as chart markers with real facts, a self-drawing trend line under the headline,
   blurred placeholder to remove the grey first paint, night grade in dark mode. Real layer art and
   the standing cutout slot in when supplied (`src/content/hero.ts`).
2. **Story** (`#story`, alias `#about`) — scroll-scrubbed word ink-in; analyst annotations draw
   themselves (highlighter, circled phrase with a margin note, trend underline); draggable notes; a
   chart-footnote style "Sources" strip with the four real logos.
3. **Work** (`#work`) — the card fan selects a project; a stage below has *Try it* (the live widget),
   *See it* (screenshots; replaces the separate Interfaces section) and *What went in* (features,
   stack, links). Widgets load when the stage first nears the viewport.
4. **Sanket** (`#sanket`) — ink-in pitch with inline icon chips; roles as a pipeline with data
   flowing through it; real facts with count-ups (4 verticals, 3 model routes + 1 zero-shot
   fallback); dashboard preview with pointer tilt.
5. **Journey** (`#journey`) — existing map; own heading copy.
6. **Process** (`#process`) — a forecast chart: dashed forecast and confidence band first, the solid
   actual line traces with scroll and each step's card pops at its point. Vertical on phones.
7. **Toolkit** (`#stack`, alias `#skills`) — periodic table of tools with category filters, keyboard
   grid navigation, detail card; tiles populate like points on a chart.
8. **Life** (`#life`) — draggable corkboard; photos from `src/content/life.ts`; highlights merged in
   as pinned medal, ticket and pennant (Captain, Code for Good Top 2, MUN 1st).
9. **Contact** (`#hello`, alias `#contact`) — "Send a signal": radar rings, a note composer that
   transmits by email (with copy fallback), channel tiles with E / L / G / R shortcuts, the curated
   notes strip when notes exist, footer.

Dock: Home · Work · Journey · About · Contact · Résumé. Music (Anirudh) dialog and Night mode stay.

## Architecture

- `src/components/portfolio/Portfolio.tsx` is a thin shell (header, dock, sections, music dialog,
  toast) over `SiteContext` (toast, music, journey jump). One component + one stylesheet per
  section in `src/components/portfolio/sections/`; shared tokens and primitives in `base.css`.
- Motion primitives in `src/components/portfolio/motion/`: `InkText`, `Sketch` annotations,
  `CountUp`, `useSectionProgress`. All transforms/opacity only; every primitive has a
  reduced-motion path that renders the final state.
- Pure, tested logic in `src/lib/valley/`: hero camera, ink timing, hand-drawn path generation,
  process forecast series, note mailto builder, blurred placeholder data.
- Unused Editorial components are deleted at the end; project widgets and skill icons stay.

## Quality bar

- 60fps scroll on desktop: no layout reads in scroll handlers, motion values instead of state.
- No horizontal overflow at 360 px; dock and header fit at 360 px.
- Keyboard: every interactive element reachable; draggables move with arrow keys.
- `npm run lint`, `npm test`, `npm run build`, `npm run check` pass; browser QA at 1440×900 and
  390×844 with console clean.
