# Baltej Goud — an illustrated portfolio

Redesigned on 2026-10-17 using James Chugh’s portfolio as the user-selected visual reference. The implementation uses Baltej’s own experience, projects, imagery, interests and contact details. The reference’s personal photographs, testimonials, visitor counts and affiliations are not reused.

## Visual language

Warm paper, navy ink, buttery yellow and restrained terracotta accents. Bricolage Grotesque headings, DM Sans body text, and Instrument Serif handwritten-style annotations. Torn-paper transitions, tactile project cards, a miniature career map, pinned notes and oversized contact keys. Dark mode has its own semantic colours.

The current homepage is `src/components/portfolio/Portfolio.tsx` with scoped styling in `portfolio.css`. Older components are retained for reusable project widgets and existing tests; `src/app/page.tsx` renders the new portfolio.

## Sections and behaviour

1. Illustrated valley: desktop and mobile artwork, scroll parallax, career hotspots and an on-demand music player.
2. How I got here: biography and movable sticky notes.
3. Journey: a pinned, scroll-driven city map with seven story stops, a following camera, progressive blue route, official company-logo pins, floating cards, compass, zoom, recenter and drag-to-pan. Phones use a single-screen tap/swipe journey with expandable cards; reduced motion uses manual steps. Haritha is full-time, with the Tectoro internship explicitly overlapping it.
4. Selected work: six fanned project cards, selection buttons, native modal dialogs, project details and case-study/source links.
5. Interfaces: horizontally scrollable gallery with working previous/next controls.
6. Sanket: founder story, responsibilities, supported product facts and case-study links.
7. Toolkit: gift reveal, all 32 skills, focus/hover/click descriptions, and rewrapping.
8. Process: six stages from problem framing to learning.
9. Highlights: nine supported achievements, including college football captaincy and district-level play.
10. Off the clock: draggable/keyboard-movable portrait, sports, hobbies, Anirudh player and a travel note. No invented travel history.
11. Notes: device-local drafts with colour choice, sorting, deletion and optional email handoff. There is no shared notes backend.
12. Contact: email, GitHub, LinkedIn, résumé, copy-email and return-to-top.

## Content and dates

Existing content remains in `src/content/`. Dates supplied in this chat: tutoring Jan–Jun 2023; freelance Jun 2023–Feb 2024; Haritha Mar 2024–present; Tectoro internship Oct–Dec 2025. Sanket’s founding date has not been supplied, so it is shown as “Now”. The linked résumé has the same dates and internship distinction.

Certifications render only when entries exist. Compatibility anchors preserve old links to `#about`, `#skills`, `#experience`, `#achievements` and `#contact`.

## Assets

All generated art uses the built-in Image Generation tool, is saved locally under `public/assets/`, and is encoded as WebP with Sharp. Portrait and project interfaces reuse existing project assets. Prompts and provenance are in `docs/portfolio-artwork.md`.

## Accessibility and rendering

Native buttons/links, one h1, skip link, focus rings, labelled controls, modal focus containment/Escape dismissal, reduced-motion support, keyboard pinboard movement and live status messages. Smooth scrolling stops while a modal is open. Core content is statically exported for GitHub Pages; local storage and the Spotify player are client enhancements.

## Verification

Run `npm run lint`, `npm test`, `npm run build`, and `npm run check`. Check desktop (1440 × 900), phone (390 × 844), and narrow-phone layouts. Verify project selection/dialogs, journey chronology, toolkit descriptions, theme switching, pinboard controls, notes and music. The résumé and case-study directories must also be inspected using a static server pointing to `out/`.