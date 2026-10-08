# Motion system — design spec

Date: 2026-10-08 · Branch: `feat/motion-system` · Baseline: `14d3cf0`

## Goal

The Signal redesign reads as static next to contemporary portfolios: it ships one 0.3s
page fade and 0.2s hover nudges, nothing else. Add a premium editorial motion layer
(reference: dennissnellenberg.com) plus four interactive surfaces — project quick view,
hover preview cards, a "Let's talk" panel and an intro loader — without giving up what the
site does well: static HTML on GitHub Pages, content that works without JavaScript, and
accessibility.

This reverses the restraint recorded in `DESIGN.md` ("no loading overlay … native
scrolling"). `DESIGN.md` is rewritten as part of this work.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Motion level | Premium editorial | Chosen by the user over "immersive 3D" and "refined subtle". |
| Libraries | GSAP 3.15.0 (core, ScrollTrigger, SplitText) + Lenis 1.3.26 | Industry standard for this style; GSAP and all its plugins are free under the GSAP Standard License, Lenis is MIT. |
| Delivery | Minified files copied into `assets/vendor/` and committed | GitHub Pages serves the repo as-is; no runtime CDN dependency. `node_modules/` stays ignored. |
| Module format | Native ES modules in `assets/js/motion/`, vendor files as classic `defer` scripts that expose globals | No bundler, no build step for the site itself. Classic deferred scripts and module scripts execute in document order, so globals exist before the modules run. |
| Pop-ups | Native `<dialog>` with `showModal()` | Focus trapping, Escape, inert background and top layer for free. |
| Page transitions | Cross-document View Transitions in CSS | Zero JS. Chromium and Safari 18.2+ animate; Firefox navigates normally. |
| Project content | `work/projects.json` stays the single source | The generator emits it into pages as a JSON data island; quick view renders from that. |

## Experience

### Global (every page)

- **Smooth scroll** — Lenis on fine-pointer devices, synced to ScrollTrigger. Touch devices
  keep native scrolling. In-page anchor links scroll through Lenis with the existing
  100px header offset.
- **Header** — hides on scroll down after 120px, returns on scroll up, and always shows
  while it contains focus or the mobile menu is open.
- **Scroll progress** — 2px orange line fixed at the top of the viewport.
- **Reveals** — elements marked `data-reveal` animate once when 15% into view:
  - `lines`: text split into lines with SplitText, each line rises from a mask (0.9s,
    0.08s stagger). Splitting waits for `document.fonts.ready`; `autoSplit` re-splits on
    resize; SplitText's ARIA handling keeps the heading read as one sentence.
  - `fade`: opacity and 24px rise.
  - `image`: clip-path inset unmasks from the bottom while the inner image settles from
    scale 1.15 to 1.
  - `rule`: hairline scales from 0 to 1 on the x axis from the left.
- **Parallax** — images marked `data-parallax` move up to ±8% of their height against scroll.
  Limited to the portrait and the hero sculpture so real product screenshots are never
  cropped or shifted.
- **Count-up** — elements marked `data-count` animate from 0 to their number once, keeping
  any suffix (`500+`).
- **Magnetic buttons** — `.button`, `.header-contact`, `.contact-arrow`, `.circle-arrow`
  follow the pointer by up to 30% of their distance from centre and spring back on leave.
- **Button fill** — orange or ink fill circle grows from the side the pointer entered.
- **Arrow swap** — `↗` slides out up-right and a copy slides in from bottom-left on hover.
- **Link underline** — `.text-link` underline sweeps left to right in, right out.
- **Accordions** — `details` open and close smoothly using `interpolate-size:
  allow-keywords` and `::details-content` (CSS only; browsers without support snap).
- **Page transitions** — `@view-transition { navigation: auto; }`; the new page wipes up
  from the bottom while the old page lifts and fades into charcoal (0.7s).

### Homepage

- **Intro loader** — first visit per browser session (sessionStorage key `bg-intro`).
  Full-screen charcoal overlay cycles "Hello" in: Hello, నమస్కారం, नमस्ते, Hola, Bonjour,
  Ciao, こんにちは, Hallo, then "Hello" again. The first word holds 0.35s and the rest 0.12s
  each (about 1.3s of words). The overlay then lifts in 0.8s with a curved bottom edge (SVG
  path morph) and the hero sequence plays; about 2.1s from first paint to an interactive hero.
  Any click, key or wheel skips straight to the hero. The overlay is `aria-hidden` and the
  hero `h1` is always in the DOM.
- **Hero sequence** — eyebrow fades, `h1` lines rise, description and actions fade up,
  sculpture scales from 0.92 and fades in.
- **Sculpture** — tilts up to 6° toward the pointer (perspective transform) and drifts up
  and rotates slightly (up to 8°) as the hero scrolls out.
- **Discipline marquee** — the strip becomes an infinite loop (duplicated track,
  `aria-hidden` duplicate). Base speed about 40px/s; scroll velocity adds speed and scroll
  direction sets direction.
- **Sanket dashboard** — scrubbed on scroll from scale 0.9 with 24px radius to scale 1 with
  3px radius as it enters the viewport.

### Project cards (homepage selected work, `/work/` gallery)

- **Hover** — image keeps the existing lift and zoom; a 96px orange "Quick view" bubble follows the pointer
  with easing (fine pointer only) and replaces the default cursor over the card's capture.
- **Click** — opens Quick view. Modifier clicks (Ctrl, Cmd, Shift, middle button) keep
  native link behaviour, so the case study opens normally. On touch, a tap opens Quick view.
- The card markup is unchanged: it stays a link to the case study and gains
  `data-quickview="<slug>"`.

### Quick view

- Built from the data island for the clicked slug. Content: number, name, discipline,
  status, tagline, primary image, role, stack, problem, the three decisions, secondary
  image with its title, caption text, and a "Read the full story ↗" link to the case
  study. Optional fields are omitted when absent (ExtraTicket has no secondary image).
- **Open** — a fixed-position copy of the card image flies into the dialog's hero image
  (0.8s, `power4.inOut`); the panel fades in behind it, then the text staggers up. (GSAP Flip
  was dropped: the dialog's scrolling body would clip a Flip-animated image.)
- **Close** — Escape, the close button or a backdrop click; the image flips back to its card
  and focus returns to the card link.
- **Navigation** — previous/next buttons and ←/→ keys cycle through the visible cards in page
  order, cross-fading content.
- **Scroll** — Lenis stops while open; the dialog body scrolls natively.
- **Layout** — desktop is a centred panel up to 1180px wide and 88vh tall; below 800px it is
  a full-screen sheet sliding up from the bottom.

### Hover preview cards

- Applies to the homepage archive rows (05–08) and experience rows (01–05), on fine-pointer
  devices only.
- A 320×220 card follows the pointer with lerp (0.15) and tilts up to 8° from horizontal
  velocity. It scales in on row enter and out on leave.
- **Content** — rows with a real image (`data-preview-image`: Deepfake pipeline, Let's Get
  Cooking) show that image. All other rows show a typographic card: row number, title and
  category on an orange, ivory or charcoal field, cycling by row. No images are invented.
- Purely decorative: `aria-hidden`, never focusable; the row's own content is unchanged.
- **Dropped from part 1:** the `/work/` list view already shows each screenshot inline at
  42% width, so a hover card there would duplicate it.

### "Let's talk" panel

- Triggered by `.header-contact` and the mobile-nav "Let's talk" link on every page. Without
  JavaScript they remain links to `#contact` / `index.html#contact`.
- A right-side `<dialog>` panel (min(520px, 100vw)) slides in over a dimmed backdrop. Content:
  "Let's talk." heading, email as a mailto link, a copy button, LinkedIn, GitHub, Résumé,
  and the live Hyderabad time.
- Built at runtime by `contact.js` so the markup is defined once for all pages.

### Toast

- One shared `toast(message)` used by every copy-email button (contact section, panel): a
  pill slides up from the bottom centre with an animated check, `role="status"`, and
  dismisses after 2.4s.
- The existing inline `.copy-status` text stays as the no-motion and screen-reader fallback.

### Résumé

- Page transitions and `fade` reveals only. Print styles force all reveal states visible and
  hide the progress bar, toast and panel.

## Architecture

### Files

```
assets/vendor/            gsap.min.js, ScrollTrigger.min.js, SplitText.min.js,
                          lenis.min.js, LICENSES.md
assets/js/motion/
  index.js                entry: reads gate, calls each init, sets html.motion-ready
  gate.js                 motion/pointer capability flags, shared constants (eases, durations)
  loader.js               init(): intro sequence; resolves when the hero may play
  scroll.js               init(): Lenis + ScrollTrigger sync, header hide, progress,
                          marquee; exports stopScroll()/startScroll()
  reveal.js               init(root?): data-reveal, data-parallax, data-count, hero
                          sequence, Sanket scrub
  cursor.js               init(): magnetic, button fill, quick-view bubble, hover previews
  quickview.js            init(): dialog build, image-morph open/close, prev/next
  contact.js              init(): contact panel; exports toast()
motion.css                tokens, motion-only initial states, loader, marquee, dialogs,
                          bubble, preview card, toast, progress, view transitions,
                          reduced-motion and print overrides
```

Every module exports `init()` and is safe to call when its target elements are absent
(the module no-ops). Modules depend on `gate.js` and the GSAP/Lenis globals only;
`quickview.js` and `contact.js` import `stopScroll`/`startScroll` from `scroll.js`.

### Gating and failure handling

An inline head script on every page (identical copy, about 300 bytes):

1. Adds `js` to `<html>`.
2. Adds `motion` unless `prefers-reduced-motion: reduce` matches or the URL contains
   `?nomotion`.
3. On the homepage only, adds `intro` when `motion` is set and sessionStorage has no
   `bg-intro`.
4. Starts a 3s failsafe: if `motion-ready` has not been set by then, removes `motion` and
   `intro` so everything is visible.

CSS hides reveal targets and shows the loader only under `.motion` / `.intro`, so:

- **No JavaScript** — no classes, everything visible, all links work.
- **Library fails to load** — the failsafe restores visibility within 3s; `index.js` also
  removes the classes immediately if `window.gsap` is missing.
- **Reduced motion** — no `motion` class: no loader, no smooth scroll, no reveals, no
  cursor effects, no view transitions (CSS guarded by
  `prefers-reduced-motion: no-preference`). Quick view and the contact panel still work but
  open and close instantly.
- **Coarse pointer** — reveals, marquee, quick view (bottom sheet) and panel run; Lenis,
  magnetic, bubble and hover previews do not.

### Data flow for quick view

`build-work.cjs` adds to each generated card `data-quickview="<slug>"` and appends, inside
the existing `SELECTED_WORK` block on the homepage and once on `/work/`:

```html
<script type="application/json" id="project-data">[{ slug, name, number, … }]</script>
```

The island contains only the fields Quick view renders, with image paths resolved for that
page's location. `quickview.js` parses it once, builds DOM with `textContent` (no
`innerHTML` from data) and caches it.

### Generator and page edits

- `build-work.cjs`: head template gains `motion.css` and the gate script; footer template
  gains the vendor scripts and `<script type="module" src="…/assets/js/motion/index.js">`;
  cards gain `data-quickview`; the data island is emitted; gallery and case-study templates
  gain `data-reveal` on headings, images and rules.
  Run `npm run build:work` to regenerate.
- `index.html` (hand-authored outside the `SELECTED_WORK` block): the same head/footer
  additions, loader markup, `data-reveal` / `data-parallax` / `data-count` /
  `data-preview-image` attributes, and the marquee duplicate track.
- `resume.html`: head/footer additions and `fade` reveals.
- `script.js`: unchanged except the copy handler, which calls `window.bgToast?.(…)` when
  present (exposed by `contact.js`).
- `scripts/check-site.cjs`: additionally asserts that every page with `data-quickview`
  has a parseable `#project-data` containing every referenced slug, and that every image
  path in it exists.

## Performance budget

- Added JS no more than 75KB gzipped (vendor ~55KB plus modules); no new CSS framework.
- Animate only `transform`, `opacity` and `clip-path`; `will-change` set only during an
  active animation.
- No layout shift from motion: the loader is a fixed overlay and initial states use
  opacity and transform only. Measured with a `layout-shift` PerformanceObserver during
  verification: CLS under 0.02.
- ScrollTrigger instances use `once: true` for reveals and are batched with
  `ScrollTrigger.batch` where elements share a section.

## Verification (acceptance criteria)

1. `npm run check` passes, including the new data-island assertions.
2. In the browser pane at 390, 768 and 1440 px widths, no console errors and no horizontal
   overflow (also at 320 px).
3. Loader plays on a first visit, is skipped on reload in the same session, and is skippable
   by click and key.
4. Reveals, count-up, marquee direction change, Sanket scrub and header hide/show behave as
   specified.
5. Quick view: opens from every card on `/` and `/work/`; Escape, close and backdrop close it;
   focus returns to the card; Tab stays inside; ←/→ cycle; Ctrl-click opens the case study;
   bottom-sheet layout at 390 px.
6. Contact panel opens from the header on `/`, `/work/` and a case study (the résumé has no
   site header); copy
   shows the toast; Escape closes and returns focus.
7. Hover previews show the real image for rows 07/08 and typographic cards for the rest.
8. `?nomotion` shows all content immediately with no loader and no transforms; dialogs still
   work.
9. With `assets/vendor/gsap.min.js` temporarily renamed, all content is visible within 3s and
   links work.
10. Résumé print preview matches the baseline.
11. CLS under 0.02 on the homepage, including the loader.

## Out of scope

- WebGL/3D hero, a global custom cursor and pinned scroll storytelling (the "Immersive 3D"
  option).
- Back-button closing of Quick view, deep links to an open Quick view, and analytics.
- New images or content; changes to case-study copy.
