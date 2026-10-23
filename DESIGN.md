# Baltej Goud — Signal Valley

An illustrated portfolio held to the craft bar of https://www.jameschugh.com/ without copying it.
The signature is data: "Sanket" means *signal*, so wherever a portfolio would use decoration, this
one uses an analyst's device — chart markers, annotations, a forecast, a periodic table. Visitors
can run Baltej's work, not just read about it. Decisions and scope: `docs/superpowers/specs/2026-10-17-signal-valley-design.md`.

## Visual language

Warm paper, navy ink, marker yellow, terracotta, and a signal blue for data marks. Bricolage
Grotesque headings, DM Sans body, Instrument Serif for handwritten asides, JetBrains Mono for chart
labels. Torn-paper section edges. Night mode re-grades the painting and every section through
semantic tokens in `base.css`.

## Sections

1. **Hero** — painted valley with a scroll camera (layers drift and zoom at different depths, see
   `src/lib/valley/camera.ts`), pins drawn as chart markers anchored to painting coordinates with
   real dates, Baltej standing in the foreground, birds, drifting light, a self-drawing trend line,
   blurred placeholder, music.
2. **Story** — copy inks in word by word as it scrolls; a marker, a circled phrase with a margin
   note and a trend underline draw themselves; draggable notes; "Fig. 1, Sources" logo footnote.
3. **Work** — card deck (click, arrow keys or swipe) plus a stage: *Try it* runs the live widget,
   *See it* shows real captures (concepts are labelled), *What went in* lists features.
4. **Sanket** — definition of the word, ink-in pitch with inline chips, roles as a pipeline with
   data flowing through it, real facts with count-ups.
5. **Journey** — the scroll-driven city map (`CareerJourney.tsx`).
6. **Process** — a forecast chart: plan, uncertainty band, and the actual line tracing with scroll;
   step cards pin to their points. A vertical line on phones.
7. **Toolkit** — periodic table with category filters, keyboard grid navigation, detail card.
8. **Life** — corkboard; everything draggable or arrow-key movable; highlights pinned as a ticket,
   a pennant and a note; photos from `src/content/life.ts`.
9. **Contact** — radar rings, a note composer that opens the visitor's mail app (copy fallback),
   pressable channel keys with E / L / G / R shortcuts while the section is on screen, curated notes
   from `src/content/notes.ts`.

## Motion rules

- One scroll value per block, written to a CSS variable (`useScrollVar`); CSS derives the rest.
- Transform and opacity only. Entrance keyframes use `translate`/`scale`/`rotate` so they never
  fight a transform owned by Motion (dragging, parallax).
- Every effect has a final state: without JS, under reduced motion, or after the 3 s safety net,
  content renders complete.

## Honesty rules

Never invent metrics, dates, quotes, notes or links. Widget data is labelled "Illustrative";
concept images are labelled "Concept". The notes strip shows only notes added by hand with the
writer's permission. There is no backend and no visitor counter.

## Verification

`npm run lint`, `npm test`, `npm run build`, `npm run check`. Check desktop and a 375 px phone,
day and night, and the static export (`npm start`) for the résumé and case studies.
