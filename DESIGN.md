# Editorial — Baltej Goud

The homepage of baltejgoud.github.io, rebuilt on 2026-10-16 as a warm, light, editorial portfolio. The full design is in `docs/superpowers/specs/2026-10-16-editorial-portfolio-design.md`; this file is the working reference. The case studies (`public/work/`) and the résumé (`public/resume.html`) keep the earlier “Signal” styling until they are restyled.

## Principles

- Every fact comes from Baltej’s own résumé and site. No invented metrics, dates, certifications, coding-profile stats, quotes or repository links. Synthetic data inside project widgets is labelled “Illustrative”.
- Motion is rich but never required: everything reads without JavaScript and with reduced motion.
- Content lives in `src/content/`. Components only render it.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `cream` | `#F6F4EE` | Page background |
| `ink` | `#181818` | Text, active pills, inverted rows |
| `stone` | `#7A756D` | Secondary text, metadata |
| `line` | `#E5E0D8` | Hairlines and borders |
| `paper` | `#FFFFFF` | Cards |
| `watermark` | `rgb(122 117 109 / 0.10)` | Giant background words and years |
| `live` | `#22C55E` | Availability dot |
| `alert` | `#B4483A` | Broken chain, blocked listing |

Skill categories: Languages `#D08A3C`, Frontend `#4A7FB0`, Backend `#5B8C5A`, Databases `#8B6BB1`, Tools `#B85C45`, Core `#B8962E`.

## Typography

- **Plus Jakarta Sans** (400–800) for headings and body.
- **Instrument Serif italic** for one accent word or phrase in every section title.
- **JetBrains Mono** for index numbers, labels and tags: uppercase, 0.72rem, 0.14em tracking.
- Section titles: `clamp(2.4rem, 5.5vw, 4.75rem)`, weight 800, −0.035em tracking.

## Sections

Hero · 01 About · 02 Skills · 03 Selected work · (Certifications, hidden while empty) · Journey · Achievements · Contact. Numbers come from `src/lib/sections.ts`, so adding certifications renumbers the sections after it.

## Interactions

| Area | Behaviour |
| --- | --- |
| Navbar | Ink pill slides to the section in view; glass background after 24px; full-screen menu below 900px. |
| Hero | “BALTEJ” spans the full width; the cutout and watermark drift with a fine pointer; entrance on load. |
| Lanyard | Verlet strap and spring-twisted card (`src/lib/physics/rope.ts`). Drag, fling or use the arrow keys. Sleeps at rest and off screen. |
| Skills | Filter pills highlight a category; hover or focus updates the preview; arrow keys move across the grid. |
| Work | Horizontal accordion of spines at ≥1280px, vertical accordion below. Each project has a live widget, loaded when opened. |
| Journey | A dot travels a dashed S-curve with scroll progress. |
| Achievements | Snap carousel with mouse drag, buttons and a progress bar. |
| Contact | Copy-email pill with a toast; live Hyderabad time. |

## Motion rules

- An inline script in `<head>` adds `js` (and `reduced` under reduced motion) before first paint. Scroll reveals hide content only under `html.js:not(.reduced):not(.reveal-all)`. If the app has not booted after 3s, `reveal-all` shows everything.
- Scroll reveals are CSS (`[data-reveal]`, `[data-reveal="mask"]`) driven by one IntersectionObserver. Motion (`motion/react`) is used for interactive pieces only, and never for content that must be visible before hydration.
- Under reduced motion: no Lenis, parallax, entrance, physics, magnetism or cursor follower. Every feature still works.
- Lenis yields to inner panels marked `data-scroll-area` when they can scroll.

## Imagery

- `public/images/portrait-cutout.webp`: background removed from `public/assets/portrait.webp` with rembg (`u2net_human_seg`, alpha matting), then trimmed and encoded by `scripts/prepare-images.cjs`.
- `public/images/id-photo.webp`: a square head-and-shoulders crop of the same portrait.
- Brand logos: simple-icons. Playwright has no entry and shows its symbol.
- Case-study imagery provenance: `public/assets/work/README.md`.

## Adding content

- **Certification:** add `{ title, issuer, year?, href? }` to `src/content/certifications.ts`. Section 04 appears and later sections renumber.
- **Talking-avatar video:** set `hero.video = { src, poster }` in `src/content/profile.ts`, with the files in `public/`. The sound toggle appears.
- **Skill, project, journey milestone or achievement:** edit the matching file in `src/content/`. `npm test` checks its shape.

## Verification

`npm run lint`, `npm test`, `npm run build` and `npm run check` must pass. Check the page in a browser at 1440×900 and 375×812.
