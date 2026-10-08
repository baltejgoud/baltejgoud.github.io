# Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium editorial motion layer (smooth scroll, line/image reveals, marquee, magnetic buttons, page transitions) plus an intro loader, project quick view, hover preview cards and a "Let's talk" panel to the static portfolio.

**Architecture:** Vendored GSAP + Lenis loaded as classic `defer` scripts; small native ES modules in `assets/js/motion/` started by `index.js`; all motion CSS in `motion.css`. An inline head "gate" script adds `motion` to `<html>` only when JS runs and reduced motion is not requested; every hidden initial state is scoped under `.motion` inside `@media screen`, with a 3s failsafe. Quick view renders from a JSON data island the existing generator emits from `work/projects.json`.

**Tech Stack:** Static HTML/CSS, vanilla ES modules, GSAP 3.15.0 (core, ScrollTrigger, SplitText), Lenis 1.3.26, Node 18+ scripts (`build-work.cjs`, `check-site.cjs`, new `vendor.cjs`), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-08-motion-system-design.md`

## Global Constraints

- Pages: `index.html`, `resume.html`, `work/index.html`, `work/{sanket,axon,vigor,extraticket}/index.html`. Work pages and the homepage `SELECTED_WORK` block are generated: edit `scripts/build-work.cjs`, then run `npm run build:work`. Never hand-edit generated files.
- Library versions pinned exactly: `gsap@3.15.0`, `lenis@1.3.26` (devDependencies, already installed). Browser copies live in `assets/vendor/` (committed); `node_modules/` stays ignored.
- No content invented: no new images, metrics, clients or copy beyond UI labels ("Quick view", "Let's talk.", "Email copied").
- Contact email: `baltej.panagatla@gmail.com`.
- Hidden initial states only under `.motion` and only in `@media screen`; print and no-JS always show everything.
- `prefers-reduced-motion: reduce` or `?nomotion`: no loader, smooth scroll, reveals, cursor effects or page transitions. Quick view, contact panel and toast still work, instantly.
- Fine pointer (`(hover: hover) and (pointer: fine)`) required for Lenis, magnetic, fills, arrow swaps, tilt, bubble and hover previews.
- Animate only `transform`, `opacity`, `clip-path`, CSS custom properties. No layout shift.
- Added JS no more than 75KB gzipped.
- Eases: `power4.out` (EASE.out), `power4.inOut` (EASE.inOut), `power3.out` (EASE.soft); CSS `--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1)`, `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
- Match existing code style: two-space indent, double quotes, semicolons, short leading comment per file.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Deviations from the spec (approved in planning)

1. **No GSAP Flip.** The quick view body is a scroll container and would clip a Flip-animated image. A fixed-position "flyer" image does the card-to-dialog morph (same FLIP technique, by hand). Saves ~10KB gzipped.
2. **Parallax only on the portrait image and the hero sculpture.** Case-study screenshots get `image` reveals but no parallax, so real UI is never cropped or shifted.
3. **Quick view prev/next follow on-page card order** (visible cards only), not data order. On the homepage the card order differs from `projects.json`.
4. **Page transition:** cross-document View Transitions cannot insert a curtain element, so the new page wipes up from the bottom while the old page lifts and fades into charcoal.
5. **Card hover** keeps the existing lift and zoom (`translateY(-5px) scale(1.025)`).
6. **Résumé** has no site header, so it gets no contact panel; acceptance criterion 6 covers `/`, `/work/` and case studies.

## Verification tooling

There is no browser test runner. Each task verifies with:
- `npm run check` (Node; static assertions) where the task touches markup or data.
- The Claude browser pane: `preview_start` with name `portfolio` (serves the repo on `http://localhost:5301`), then `javascript_tool` snippets whose expected output is given in each step, plus a screenshot.

## File map

| File | Responsibility |
|---|---|
| `scripts/vendor.cjs` (new) | Copy pinned library builds from `node_modules` to `assets/vendor/`, stripping source-map comments. |
| `assets/vendor/*.min.js`, `assets/vendor/LICENSES.md` (new) | Committed browser builds and license notes. |
| `motion.css` (new) | Motion tokens and every motion-only style, by section. |
| `assets/js/motion/gate.js` (new) | Capability checks (`motionOn`, `finePointer`, `compact`) and constants (`EASE`, `EMAIL`). |
| `assets/js/motion/index.js` (new) | Entry: starts dialogs always, motion modules behind the gate, sets `motion-ready`. |
| `assets/js/motion/scroll.js` (new) | Lenis, header hide/show, progress line, marquee, `stopScroll`/`startScroll`. |
| `assets/js/motion/reveal.js` (new) | `data-reveal`, `data-hero`, `data-parallax`, `data-count`, Sanket scrub, sculpture drift. |
| `assets/js/motion/loader.js` (new) | Intro "Hello" sequence. |
| `assets/js/motion/cursor.js` (new) | Magnetic, directional fill, arrow swap, tilt, quick-view bubble, hover previews. |
| `assets/js/motion/contact.js` (new) | "Let's talk" dialog, `toast()`, `copyEmail()`. |
| `assets/js/motion/quickview.js` (new) | Quick view dialog from `#project-data`. |
| `scripts/build-work.cjs` | Gate + motion assets in templates, reveal attributes, `data-quickview`, data island. |
| `scripts/check-site.cjs` | Assert motion assets on every page; validate data island. |
| `index.html`, `resume.html` | Gate, assets, loader markup, marquee markup, reveal attributes. |
| `script.js` | Copy handler reports through `window.bgToast` when present. |
| `style.css` | 560px discipline-strip rule adjusted for the new marquee markup. |
| `package.json` | `vendor` script. |
| `DESIGN.md`, `README.md`, spec | Documentation. |

---

### Task 1: Foundation — vendor files, gate, entry module, page wiring

**Files:**
- Create: `scripts/vendor.cjs`, `assets/vendor/LICENSES.md`, `motion.css`, `assets/js/motion/gate.js`, `assets/js/motion/index.js`
- Modify: `package.json`, `scripts/check-site.cjs`, `scripts/build-work.cjs` (head/footer templates), `index.html` (head, end of body), `resume.html` (html tag, head, end of body), `docs/superpowers/specs/2026-10-08-motion-system-design.md`

**Interfaces:**
- Produces: `gate.js` exports `motionOn(): boolean`, `finePointer(): boolean`, `compact(): boolean`, `EASE = { out, inOut, soft }`, `EMAIL`. `<html>` classes `js`, `motion`, `intro`, `motion-ready`. `<html data-motion="lite">` on the résumé, `<html data-intro>` on the homepage. Gate script marker attribute `data-motion-gate`.

- [ ] **Step 1: Add the failing check.** In `scripts/check-site.cjs`, inside the `for (const file of pages)` loop, directly after the `h1` check, add:

```js
  for (const needle of [
    "data-motion-gate",
    "motion.css",
    "assets/vendor/gsap.min.js",
    "assets/js/motion/index.js",
  ])
    if (!html.includes(needle))
      failures.push(`${file}: missing motion asset ${needle}`);
```

- [ ] **Step 2: Run it and confirm failure.** Run `npm run check`. Expected: exit code 1, 28 lines like `index.html: missing motion asset data-motion-gate`.

- [ ] **Step 3: Vendor script.** Create `scripts/vendor.cjs`:

```js
/* Copy pinned animation libraries into assets/vendor. Run after npm install: npm run vendor */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const files = {
  "gsap.min.js": "gsap/dist/gsap.min.js",
  "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js",
  "SplitText.min.js": "gsap/dist/SplitText.min.js",
  "lenis.min.js": "lenis/dist/lenis.min.js",
};
const out = path.join(root, "assets/vendor");
fs.mkdirSync(out, { recursive: true });
for (const [name, source] of Object.entries(files)) {
  const code = fs
    .readFileSync(path.join(root, "node_modules", source), "utf8")
    .replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n");
  fs.writeFileSync(path.join(out, name), code);
}
console.log(`Copied ${Object.keys(files).length} files to assets/vendor.`);
```

In `package.json` `scripts`, add `"vendor": "node scripts/vendor.cjs"` after `"check"`. Run `npm run vendor`. Expected: `Copied 4 files to assets/vendor.`

Create `assets/vendor/LICENSES.md`:

```md
# Vendored libraries

Copied from `node_modules` by `npm run vendor`. Versions are pinned in `package.json`.

- GSAP 3.15.0 — `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`. GSAP Standard "no charge" License: https://gsap.com/standard-license
- Lenis 1.3.26 — `lenis.min.js`. MIT License: https://github.com/darkroomengineering/lenis/blob/main/LICENSE
```

- [ ] **Step 4: `gate.js`.** Create `assets/js/motion/gate.js`:

```js
// Shared capability checks and constants for the motion modules.
const root = document.documentElement;
const finePointerQuery = matchMedia("(hover: hover) and (pointer: fine)");
const compactQuery = matchMedia("(max-width: 800px)");

/** Motion allowed by the head gate and GSAP with ScrollTrigger loaded. */
export const motionOn = () =>
  root.classList.contains("motion") &&
  Boolean(window.gsap && window.ScrollTrigger);
/** A mouse or trackpad: cursor effects and smooth scrolling. */
export const finePointer = () => finePointerQuery.matches;
/** Below the 800px breakpoint used by style.css. */
export const compact = () => compactQuery.matches;

export const EASE = {
  out: "power4.out",
  inOut: "power4.inOut",
  soft: "power3.out",
};
export const EMAIL = "baltej.panagatla@gmail.com";
```

- [ ] **Step 5: `index.js`.** Create `assets/js/motion/index.js` (later tasks add imports and calls where marked):

```js
// Entry point for the motion layer. Dialogs work everywhere; animation runs only behind the gate.
import { motionOn } from "./gate.js";

const root = document.documentElement;
const lite = root.dataset.motion === "lite";
const disable = (error) => {
  root.classList.remove("motion", "intro");
  if (error) console.error("Motion disabled:", error);
};
const safely = (start) => {
  try {
    start();
  } catch (error) {
    console.error(error);
  }
};

if (motionOn()) {
  try {
    const { gsap, ScrollTrigger, SplitText } = window;
    gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
    if (!lite) {
      // full-page modules
    }
    root.classList.add("motion-ready");
  } catch (error) {
    disable(error);
  }
} else {
  disable();
}
```

- [ ] **Step 6: `motion.css` foundation.** Create `motion.css`:

```css
/* Motion layer. Every hidden initial state sits under .motion inside @media screen. */
:root {
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Lenis */
html.lenis,
html.lenis body {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-stopped {
  overflow: clip;
}
.lenis [data-lenis-prevent] {
  overscroll-behavior: contain;
}
html.scroll-locked {
  overflow: hidden;
}

/* The page-in keyframe in work.css is replaced by reveals. */
.motion .gallery-intro,
.motion .case-intro {
  animation: none;
}

@media print {
  .intro,
  .scroll-progress,
  .toast,
  .qv-bubble,
  .hover-preview,
  dialog {
    display: none !important;
  }
  [data-reveal],
  [data-reveal] img,
  [data-hero],
  .reveal-line {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
    visibility: visible !important;
  }
}
```

- [ ] **Step 7: Generator templates.** In `scripts/build-work.cjs`, after the `arrow` constant add:

```js
const gate = String.raw`<script data-motion-gate>(function(d,w){var h=d.documentElement,c=h.classList;c.add("js");if(w.matchMedia("(prefers-reduced-motion: reduce)").matches||/[?&]nomotion\b/.test(w.location.search))return;c.add("motion");try{if(h.hasAttribute("data-intro")&&!w.sessionStorage.getItem("bg-intro"))c.add("intro")}catch(e){}w.setTimeout(function(){if(!c.contains("motion-ready"))c.remove("motion","intro")},3000)})(document,window);</script>`;
const motionScripts = (prefix) =>
  ["gsap", "ScrollTrigger", "SplitText", "lenis"]
    .map(
      (name) =>
        `<script src="${prefix}assets/vendor/${name}.min.js" defer></script>`,
    )
    .join("") +
  `<script type="module" src="${prefix}assets/js/motion/index.js"></script>`;
```

In `head`, replace `<link rel="stylesheet" href="${prefix}work.css">` with `<link rel="stylesheet" href="${prefix}work.css"><link rel="stylesheet" href="${prefix}motion.css">${gate}`.

In `footer`, replace `<script src="${prefix}script.js" defer></script></body></html>` with `<script src="${prefix}script.js" defer></script>${motionScripts(prefix)}</body></html>`.

Run `npm run build:work`. Expected: `Generated work gallery, four case studies and homepage cards.`

- [ ] **Step 8: Homepage.** In `index.html`:
  - `<html lang="en">` → `<html lang="en" data-intro>`
  - After `<link rel="stylesheet" href="work.css" />` insert `<link rel="stylesheet" href="motion.css" />` and, on the next line, the gate script exactly as in the `gate` constant above (literal text, single backslash in `\b`).
  - After `<script src="script.js" defer></script>` insert:

```html
    <script src="assets/vendor/gsap.min.js" defer></script>
    <script src="assets/vendor/ScrollTrigger.min.js" defer></script>
    <script src="assets/vendor/SplitText.min.js" defer></script>
    <script src="assets/vendor/lenis.min.js" defer></script>
    <script type="module" src="assets/js/motion/index.js"></script>
```

- [ ] **Step 9: Résumé.** In `resume.html`: `<html lang="en">` → `<html lang="en" data-motion="lite">`; before `</head>` insert `<link rel="stylesheet" href="motion.css" />` and the gate script; before `</body>` insert:

```html
    <script src="assets/vendor/gsap.min.js" defer></script>
    <script src="assets/vendor/ScrollTrigger.min.js" defer></script>
    <script type="module" src="assets/js/motion/index.js"></script>
```

- [ ] **Step 10: Run the check.** Run `npm run check`. Expected: `7 pages, … local references checked.` and `No missing local links, duplicate IDs or h1 errors.`

- [ ] **Step 11: Browser check.** `preview_start` `portfolio`, navigate to `http://localhost:5301/`, run:

```js
[document.documentElement.className, typeof gsap, typeof Lenis, typeof SplitText]
```

Expected: `["js motion motion-ready", "object", "function", "function"]` (an `intro` class may also be present; it has no effect yet). Navigate to `/?nomotion` and run `document.documentElement.className`. Expected: `"js"`. Navigate to `/resume.html`: expected class `js motion motion-ready`. `read_console_messages` with `onlyErrors: true`: none.

- [ ] **Step 12: Align the spec with the approved deviations.** In the spec: replace "GSAP 3.15.0 (core, ScrollTrigger, SplitText, Flip)" with "GSAP 3.15.0 (core, ScrollTrigger, SplitText)"; replace the Quick view "Open" bullet's "GSAP Flip morphs" sentence with "a fixed-position copy of the card image flies into the dialog's hero image (0.8s, `power4.inOut`)"; change "cycle through the projects in the order they appear in the data" to "cycle through the visible cards in page order"; change the page-transition bullet to "the new page wipes up from the bottom while the old page lifts and fades into charcoal (0.7s)"; change the Hover bullet to "image keeps the existing lift and zoom"; in Generator and page edits remove "and `data-parallax` on case-study images"; in Files remove `Flip.min.js`; in the budget change "vendor ~65KB" to "vendor ~55KB"; in Verification item 6 remove "and the résumé".

- [ ] **Step 13: Commit.**

```bash
git add scripts/vendor.cjs assets/vendor motion.css assets/js/motion package.json package-lock.json scripts/check-site.cjs scripts/build-work.cjs index.html resume.html work docs/superpowers/specs/2026-10-08-motion-system-design.md
git commit -m "feat(motion): vendor GSAP and Lenis, add motion gate and entry module"
```

---

### Task 2: Scroll layer — Lenis, header, progress, marquee

**Files:**
- Create: `assets/js/motion/scroll.js`
- Modify: `assets/js/motion/index.js`, `motion.css`, `index.html` (discipline strip), `style.css:2271-2274`

**Interfaces:**
- Consumes: `finePointer()` from `gate.js`.
- Produces: `scroll.js` exports `init(): void`, `stopScroll(): void`, `startScroll(): void` (safe to call when Lenis is absent).

- [ ] **Step 1: `scroll.js`.** Create `assets/js/motion/scroll.js`:

```js
// Smooth scrolling, header visibility, the progress line and the discipline marquee.
import { finePointer } from "./gate.js";

const root = document.documentElement;
let lenis = null;

export function stopScroll() {
  lenis?.stop();
  root.classList.add("scroll-locked");
}

export function startScroll() {
  lenis?.start();
  root.classList.remove("scroll-locked");
}

export function init() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (finePointer() && Lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -100 } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  initHeader();
  initProgress(gsap);
  initMarquee(gsap, ScrollTrigger);
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const menu = document.querySelector("#mobile-nav");
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 4) return;
    const menuOpen = menu && !menu.hidden;
    const keyboardFocus = header.querySelector(":focus-visible");
    header.classList.toggle(
      "is-hidden",
      y > 120 && y > lastY && !menuOpen && !keyboardFocus,
    );
    lastY = y;
  };
  window.addEventListener("scroll", update, { passive: true });
  header.addEventListener("focusin", () => {
    if (header.querySelector(":focus-visible")) header.classList.remove("is-hidden");
  });
}

function initProgress(gsap) {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });
}

function initMarquee(gsap, ScrollTrigger) {
  const strip = document.querySelector(".discipline-strip");
  const track = strip?.querySelector(".marquee-track");
  const group = track?.querySelector(".marquee-group");
  if (!group) return;
  strip.classList.add("is-marquee");
  let width = 0;
  const fill = () => {
    track.querySelectorAll("[data-clone]").forEach((clone) => clone.remove());
    width = group.offsetWidth;
    const copies = Math.ceil(strip.offsetWidth / width) + 1;
    for (let i = 0; i < copies; i++) {
      const clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.clone = "";
      track.append(clone);
    }
  };
  fill();
  new ResizeObserver(fill).observe(strip);

  let x = 0;
  let direction = 1;
  let boost = 0;
  const trigger = ScrollTrigger.create({
    trigger: strip,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      direction = self.direction;
      boost = Math.min(Math.abs(self.getVelocity()) / 300, 6);
    },
  });
  gsap.ticker.add((time, deltaTime) => {
    if (!trigger.isActive || !width) return;
    boost *= 0.94;
    x -= direction * 40 * (1 + boost) * (deltaTime / 1000);
    x = gsap.utils.wrap(-width, 0, x);
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}
```

- [ ] **Step 2: Start it.** In `index.js`, add `import * as scroll from "./scroll.js";` below the gate import, and replace `// full-page modules` with `scroll.init();`.

- [ ] **Step 3: Marquee markup.** In `index.html`, replace the whole `<div class="discipline-strip" …>…</div>` block with:

```html
        <div class="discipline-strip" aria-label="Areas of expertise">
          <div class="marquee-track">
            <div class="marquee-group">
              <span>Product strategy</span><i aria-hidden="true">✳</i
              ><span>AI &amp; machine learning</span><i aria-hidden="true">✳</i
              ><span>Data intelligence</span><i aria-hidden="true">✳</i
              ><span>Digital experiences</span><i aria-hidden="true">✳</i
              ><span>Entrepreneurship</span><i aria-hidden="true">✳</i>
            </div>
          </div>
        </div>
```

In `style.css`, inside `@media (max-width: 560px)`, replace

```css
  .discipline-strip i:last-of-type,
  .discipline-strip span:last-child {
    display: none;
  }
```

with

```css
  .discipline-strip:not(.is-marquee) .marquee-group > :nth-last-child(-n + 3) {
    display: none;
  }
```

- [ ] **Step 4: CSS.** Append to `motion.css`:

```css
/* Header, progress line and marquee */
.motion .site-header {
  transition: transform 0.45s var(--ease-in-out);
}
.motion .site-header.is-hidden {
  transform: translateY(-100%);
}
.scroll-progress {
  position: fixed;
  inset: 0 0 auto;
  height: 2px;
  z-index: 60;
  background: var(--orange);
  transform: scaleX(0);
  transform-origin: left;
  pointer-events: none;
}
.marquee-track,
.marquee-group {
  display: contents;
}
.discipline-strip:not(.is-marquee) .marquee-group > i:last-child {
  display: none;
}
.discipline-strip.is-marquee {
  display: block;
  overflow: hidden;
  padding-inline: 0;
}
.is-marquee .marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
}
.is-marquee .marquee-group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 1.8em;
  padding-right: 1.8em;
  white-space: nowrap;
}
```

- [ ] **Step 5: Browser check.** Reload `/` (close nothing). Run:

```js
(async () => {
  const strip = document.querySelector(".discipline-strip");
  const t1 = getComputedStyle(strip.querySelector(".marquee-track")).transform;
  await new Promise((r) => setTimeout(r, 600));
  const t2 = getComputedStyle(strip.querySelector(".marquee-track")).transform;
  window.scrollTo(0, 900);
  await new Promise((r) => setTimeout(r, 900));
  return {
    marquee: strip.classList.contains("is-marquee"),
    moving: t1 !== t2,
    groups: strip.querySelectorAll(".marquee-group").length > 1,
    lenis: document.documentElement.classList.contains("lenis"),
    headerHidden: document.querySelector(".site-header").classList.contains("is-hidden"),
    progress: getComputedStyle(document.querySelector(".scroll-progress")).transform !== "matrix(0, 0, 0, 1, 0, 0)",
  };
})()
```

Expected: every value `true`. Then scroll up with the `computer` scroll action (3 ticks up) and confirm `.site-header` no longer has `is-hidden`. Click the desktop nav "Experience" link and confirm `document.querySelector("#experience").getBoundingClientRect().top` is between 80 and 120. Resize to 390px (`resize_window` preset `mobile`), reload, and confirm `document.documentElement.classList.contains("lenis") === false` and the strip still scrolls. Reset with preset `desktop`.

- [ ] **Step 6: Commit.**

```bash
git add assets/js/motion/scroll.js assets/js/motion/index.js motion.css index.html style.css
git commit -m "feat(motion): smooth scroll, auto-hiding header, progress line and marquee"
```

---

### Task 3: Reveal layer

**Files:**
- Create: `assets/js/motion/reveal.js`
- Modify: `assets/js/motion/index.js`, `motion.css`, `index.html` (attributes, via script below), `scripts/build-work.cjs` (card, gallery and case templates), `resume.html`

**Interfaces:**
- Consumes: `EASE` from `gate.js`.
- Produces: `reveal.js` exports `init({ heroReady?: Promise<void> }): Promise<void>`. Attributes: `data-reveal="lines|fade|image|rule"`, `data-hero="lines|fade|art"`, `data-parallax="<percent>"`, `data-count="<number>"`. Classes: `is-split`, `is-revealed`, line class `reveal-line` (mask `reveal-line-mask`).

- [ ] **Step 1: `reveal.js`.** Create `assets/js/motion/reveal.js`:

```js
// Entrance and scroll reveals: split lines, fades, image unmasking, rules, parallax, count-up.
import { EASE } from "./gate.js";

const START = "top 85%";
const fontsReady = () =>
  Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);

export async function init({ heroReady = Promise.resolve() } = {}) {
  const { gsap, ScrollTrigger } = window;
  revealFades(gsap, ScrollTrigger);
  revealImages(gsap);
  revealRules(gsap, ScrollTrigger);
  parallax(gsap);
  countUp(gsap);
  sanketScrub(gsap);
  refreshOnLayoutChange(ScrollTrigger);
  await fontsReady();
  revealLines(gsap);
  await hero(gsap, heroReady);
}

function revealFades(gsap, ScrollTrigger) {
  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: START,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: EASE.soft,
        onComplete: () => batch.forEach((el) => el.classList.add("is-revealed")),
      }),
  });
}

function revealImages(gsap) {
  gsap.utils.toArray('[data-reveal="image"]').forEach((frame) => {
    const img = frame.querySelector("img");
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: frame, start: START, once: true },
      onComplete: () => {
        frame.classList.add("is-revealed");
        gsap.set(frame, { clearProps: "clipPath" });
        if (img)
          gsap.set(img, {
            clearProps: img.hasAttribute("data-parallax")
              ? "transition"
              : "transform,transition",
          });
      },
    });
    timeline.fromTo(
      frame,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: EASE.inOut },
    );
    if (img)
      timeline.fromTo(
        img,
        { scale: 1.15, transition: "none" },
        { scale: 1, duration: 1.4, ease: EASE.out },
        0,
      );
  });
}

function revealRules(gsap, ScrollTrigger) {
  const rules = gsap.utils.toArray('[data-reveal="rule"]');
  if (!rules.length) return;
  gsap.set(rules, { "--rule": 0 });
  ScrollTrigger.batch(rules, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        "--rule": 1,
        duration: 1.1,
        stagger: 0.06,
        ease: EASE.inOut,
        onComplete: () => batch.forEach((el) => el.classList.add("is-revealed")),
      }),
  });
}

function revealLines(gsap) {
  const { SplitText } = window;
  if (!SplitText) return;
  gsap.utils.toArray('[data-reveal="lines"]').forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "reveal-line",
      autoSplit: true,
      onSplit(self) {
        el.classList.add("is-split");
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.08,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: START, once: true },
          onComplete: () => {
            self.kill();
            self.revert();
            el.classList.add("is-revealed");
          },
        });
      },
    });
  });
}

async function hero(gsap, heroReady) {
  const items = gsap.utils.toArray("[data-hero]");
  if (!items.length) return;
  const { SplitText } = window;
  const title = items.find((el) => el.dataset.hero === "lines");
  const fades = items.filter((el) => el.dataset.hero === "fade");
  const art = items.find((el) => el.dataset.hero === "art");
  const split =
    title && SplitText
      ? SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "reveal-line",
        })
      : null;
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: EASE.out },
    onComplete: () => {
      split?.revert();
      items.forEach((el) => el.classList.add("is-revealed"));
    },
  });
  if (split) {
    title.classList.add("is-split");
    timeline.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.1 }, 0.1);
  } else if (title) title.classList.add("is-split");
  timeline.to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.3);
  if (art)
    timeline.to(art, { opacity: 1, scale: 1, duration: 1.6, ease: "expo.out" }, 0.2);
  await heroReady;
  timeline.play();
}

function parallax(gsap) {
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax) || 8;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
  const sculpture = document.querySelector(".hero-art img");
  if (sculpture)
    gsap.to(sculpture, {
      yPercent: -12,
      rotation: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
}

function countUp(gsap) {
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const node = [...el.childNodes].find(
      (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
    );
    const target = Number(el.dataset.count);
    if (!node || !Number.isFinite(target)) return;
    const value = { n: 0 };
    node.textContent = "0";
    gsap.to(value, {
      n: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: START, once: true },
      onUpdate: () => (node.textContent = String(Math.round(value.n))),
    });
  });
}

function sanketScrub(gsap) {
  const frame = document.querySelector(".sanket-product > a");
  if (!frame) return;
  gsap.fromTo(
    frame,
    { scale: 0.9, borderRadius: 24 },
    {
      scale: 1,
      borderRadius: 3,
      ease: "none",
      scrollTrigger: {
        trigger: frame,
        start: "top bottom",
        end: "top 30%",
        scrub: true,
      },
    },
  );
}

function refreshOnLayoutChange(ScrollTrigger) {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-filter], [data-view], summary"))
      setTimeout(() => ScrollTrigger.refresh(), 600);
  });
}
```

- [ ] **Step 2: Start it.** In `index.js` add `import * as reveal from "./reveal.js";` and, directly after the `if (!lite) { … }` block, add `reveal.init().catch(disable);`.

- [ ] **Step 3: CSS.** Append to `motion.css`:

```css
/* Reveals */
@media screen {
  .motion [data-reveal="lines"]:not(.is-split),
  .motion [data-hero="lines"]:not(.is-split) {
    visibility: hidden;
  }
  .motion [data-reveal="fade"]:not(.is-revealed),
  .motion [data-hero="fade"]:not(.is-revealed) {
    opacity: 0;
    transform: translateY(24px);
  }
  .motion [data-hero="art"]:not(.is-revealed) {
    opacity: 0;
    transform: scale(0.92);
  }
  .motion [data-reveal="image"]:not(.is-revealed) {
    clip-path: inset(100% 0 0 0);
  }
  .motion [data-reveal="rule"]:not(.is-revealed) {
    border-top-color: transparent;
    background: linear-gradient(var(--rule-color), var(--rule-color)) no-repeat
      left top / calc(var(--rule, 0) * 100%) 1px;
  }
  .motion .experience-row[data-reveal="rule"]:not(.is-revealed) {
    border-bottom-color: transparent;
    background-position: left bottom;
  }
}
[data-reveal="rule"] {
  --rule-color: var(--line);
}
.light-section [data-reveal="rule"] {
  --rule-color: var(--light-line);
}
.contact-bottom[data-reveal="rule"] {
  --rule-color: #b94729;
}
.reveal-line-mask {
  padding-bottom: 0.14em;
  margin-bottom: -0.14em;
}
.motion .portrait img[data-parallax] {
  scale: 1.2;
}
```

- [ ] **Step 4: Homepage attributes.** Save this script as `<scratchpad>/annotate-home.cjs` and run `node <scratchpad>/annotate-home.cjs index.html`. Each rule must match exactly `count` times or the script exits without writing.

```js
// One-off: add reveal attributes to the hand-authored homepage.
const fs = require("node:fs");
const file = process.argv[2];
let html = fs.readFileSync(file, "utf8");
const rules = [
  [/<div class="hero-meta">/g, '<div class="hero-meta" data-hero="fade">', 1],
  [/<p class="eyebrow">Hello, I’m Baltej\.<\/p>/g, '<p class="eyebrow" data-hero="fade">Hello, I’m Baltej.</p>', 1],
  [/<h1 id="hero-title">/g, '<h1 id="hero-title" data-hero="lines">', 1],
  [/<p class="hero-description">/g, '<p class="hero-description" data-hero="fade">', 1],
  [/<div class="hero-actions">/g, '<div class="hero-actions" data-hero="fade">', 1],
  [/<figure class="hero-art">/g, '<figure class="hero-art" data-hero="art">', 1],
  [/<div class="hero-bottom">/g, '<div class="hero-bottom" data-hero="fade">', 1],
  [/<div class="section-kicker">/g, '<div class="section-kicker" data-reveal="fade">', 5],
  [/<h2 id="(sanket|work|range|experience|about|contact)-title">/g, '<h2 id="$1-title" data-reveal="lines">', 6],
  [/<p>Less guesswork\./g, '<p data-reveal="fade">Less guesswork.', 1],
  [/<div class="sanket-story">/g, '<div class="sanket-story" data-reveal="fade">', 1],
  [/<p>(\s+)Products I’m building/g, '<p data-reveal="fade">$1Products I’m building', 1],
  [/<div class="work-toolbar">/g, '<div class="work-toolbar" data-reveal="fade">', 1],
  [/<div class="more-work-title">/g, '<div class="more-work-title" data-reveal="fade">', 1],
  [/<details class="archive-item">(\s*)<summary>/g, '<details class="archive-item" data-reveal="rule">$1<summary data-preview>', 4],
  [/<summary data-preview>(\s*<span class="archive-number">07<\/span)/g, '<summary data-preview data-preview-image="deepfake_pipeline.png">$1', 1],
  [/<summary data-preview>(\s*<span class="archive-number">08<\/span)/g, '<summary data-preview data-preview-image="cooking_vision_ui.jpg">$1', 1],
  [/class="work-footnote"/g, 'class="work-footnote" data-reveal="fade"', 1],
  [/<p class="eyebrow">Connecting the dots<\/p>/g, '<p class="eyebrow" data-reveal="fade">Connecting the dots</p>', 1],
  [/<p class="range-intro">/g, '<p class="range-intro" data-reveal="fade">', 1],
  [/<details open>/g, '<details open data-reveal="rule">', 1],
  [/<details>/g, '<details data-reveal="rule">', 3],
  [/<p>(\s+)Building a business and working/g, '<p data-reveal="fade">$1Building a business and working', 1],
  [/<article class="experience-row">/g, '<article class="experience-row" data-reveal="rule" data-preview>', 5],
  [/<div class="education-note">/g, '<div class="education-note" data-reveal="fade">', 1],
  [/<figure class="portrait">/g, '<figure class="portrait" data-reveal="image">', 1],
  [/src="assets\/portrait\.webp"/g, 'src="assets/portrait.webp"\n                data-parallax="8"', 1],
  [/<p class="eyebrow">Founder by choice\./g, '<p class="eyebrow" data-reveal="fade">Founder by choice.', 1],
  [/<p class="about-lede">/g, '<p class="about-lede" data-reveal="fade">', 1],
  [/<p>(\s+)I’m Baltej, a founder/g, '<p data-reveal="fade">$1I’m Baltej, a founder', 1],
  [/<p>(\s+)Teaching computer science/g, '<p data-reveal="fade">$1Teaching computer science', 1],
  [/<div class="personal-note">/g, '<div class="personal-note" data-reveal="fade">', 1],
  [/<div class="about-marks">/g, '<div class="about-marks" data-reveal="fade">', 1],
  [/<strong>500<span>\+<\/span><\/strong/g, '<strong data-count="500">500<span>+</span></strong', 1],
  [/<div class="contact-bottom">/g, '<div class="contact-bottom" data-reveal="rule">', 1],
];
for (const [pattern, replacement, count] of rules) {
  const found = html.match(pattern)?.length ?? 0;
  if (found !== count) {
    console.error(`${pattern}: expected ${count}, found ${found}`);
    process.exit(1);
  }
  html = html.replace(pattern, replacement);
}
fs.writeFileSync(file, html);
console.log(`Applied ${rules.length} annotation rules.`);
```

Expected: `Applied 35 annotation rules.`

- [ ] **Step 5: Generator attributes.** In `scripts/build-work.cjs`:
  - `card` (leave the link itself alone; Task 7 marks it): change `<div class="project-capture capture-${p.theme}">` → `<div class="project-capture capture-${p.theme}" data-reveal="image">`; `<div class="project-heading">` → `<div class="project-heading" data-reveal="fade">`; `<p class="project-description">` → `<p class="project-description" data-reveal="fade">`.
  - `gallery`: `<div class="section-kicker">` → `<div class="section-kicker" data-reveal="fade">`; `<h1>Work, with` → `<h1 data-reveal="lines">Work, with`; `<div class="gallery-lede">` → `<div class="gallery-lede" data-reveal="fade">`; `<div class="work-toolbar">` → `<div class="work-toolbar" data-reveal="fade">`; `<p class="gallery-note">` → `<p class="gallery-note" data-reveal="fade">`; `<span class="eyebrow">Have a problem` → `<span class="eyebrow" data-reveal="fade">Have a problem`; `<h2>Let’s make` → `<h2 data-reveal="lines">Let’s make`.
  - case page: `<h1>${esc(p.name)}</h1>` → `<h1 data-reveal="lines">${esc(p.name)}</h1>`; `<p class="case-tagline">` → `<p class="case-tagline" data-reveal="fade">`; `<dl class="case-meta">` → `<dl class="case-meta" data-reveal="fade">`; `<a class="case-capture capture-${p.theme}"` → `<a class="case-capture capture-${p.theme}" data-reveal="image"`; `<h2>${esc(p.tagline)}</h2></div><div class="case-prose">` → `<h2 data-reveal="lines">${esc(p.tagline)}</h2></div><div class="case-prose" data-reveal="fade">`; `<div class="section-kicker"><span>02 /` → `<div class="section-kicker" data-reveal="fade"><span>02 /`; `<h2>The details` → `<h2 data-reveal="lines">The details`; `` `<article><span class="decision-number">`` → `` `<article data-reveal="fade"><span class="decision-number">``; `<div><h2>${esc(p.secondaryTitle)}</h2>` → `<div><h2 data-reveal="lines">${esc(p.secondaryTitle)}</h2>`; `<figure class="case-secondary"><a href=` → `<figure class="case-secondary"><a data-reveal="image" href=`; `<h2>${esc(p.evidenceTitle)}</h2><p>` → `<h2 data-reveal="lines">${esc(p.evidenceTitle)}</h2><p data-reveal="fade">`; `<div><h2>${esc(next.name)}</h2>` → `<div><h2 data-reveal="lines">${esc(next.name)}</h2>`.

Run `npm run build:work`, then `npm run check`. Expected: both succeed.

- [ ] **Step 6: Résumé.** In `resume.html`, `<header class="head">` → `<header class="head" data-reveal="fade">` and each of the six `<section>` → `<section data-reveal="fade">`.

- [ ] **Step 7: Browser check.** Reload `/`, wait 2.5s, run:

```js
(async () => {
  const q = (s) => document.querySelector(s);
  const heroDone = q("#hero-title").classList.contains("is-revealed") && getComputedStyle(q(".hero-art")).opacity === "1";
  window.scrollTo(0, q("#about").offsetTop - 200);
  await new Promise((r) => setTimeout(r, 2600));
  return {
    heroDone,
    aboutTitle: q("#about-title").classList.contains("is-revealed"),
    linesReverted: q("#about-title .reveal-line") === null,
    portrait: q(".portrait").classList.contains("is-revealed"),
    count: q("[data-count]").firstChild.textContent,
    rows: document.querySelectorAll('.experience-row.is-revealed').length,
  };
})()
```

Expected: `{ heroDone: true, aboutTitle: true, linesReverted: true, portrait: true, count: "500", rows: 5 }` (scroll through `#experience` first if `rows` is lower: rules fire when scrolled into view). Navigate to `/work/axon/` and `/work/`: no console errors, headings visible after load. Navigate to `/resume.html`: sections fade in. Take a screenshot of the homepage mid-scroll.

- [ ] **Step 8: Commit.**

```bash
git add assets/js/motion/reveal.js assets/js/motion/index.js motion.css index.html resume.html scripts/build-work.cjs work
git commit -m "feat(motion): line, fade, image and rule reveals, hero sequence, parallax and count-up"
```

---

### Task 4: Intro loader

**Files:**
- Create: `assets/js/motion/loader.js`
- Modify: `assets/js/motion/index.js`, `motion.css`, `index.html`

**Interfaces:**
- Consumes: `EASE` from `gate.js`; `stopScroll`, `startScroll` from `scroll.js`.
- Produces: `loader.js` exports `init(): Promise<void>` that resolves when the hero may play (immediately when no intro).

- [ ] **Step 1: `loader.js`.** Create `assets/js/motion/loader.js`:

```js
// First-visit intro: "Hello" in several languages, then a curved curtain lifts.
import { EASE } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

const WORDS = ["Hello", "నమస్కారం", "नमस्ते", "Hola", "Bonjour", "Ciao", "こんにちは", "Hallo", "Hello"];
const FLAT = "M0 0 L1000 0 L1000 0 Q500 0 0 0 Z";

export function init() {
  const root = document.documentElement;
  const intro = document.querySelector(".intro");
  if (!root.classList.contains("intro") || !intro) return Promise.resolve();
  try {
    sessionStorage.setItem("bg-intro", "1");
  } catch {}
  const { gsap } = window;
  const text = intro.querySelector(".intro-text");
  const curve = intro.querySelector(".intro-curve path");
  stopScroll();
  return new Promise((resolve) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      resolve();
    };
    const skip = () => timeline.progress(1);
    const finish = () => {
      root.classList.remove("intro");
      ["pointerdown", "keydown", "wheel"].forEach((type) =>
        window.removeEventListener(type, skip),
      );
      startScroll();
      release();
    };
    const timeline = gsap.timeline({ onComplete: finish });
    timeline.from(intro.querySelector(".intro-word"), {
      opacity: 0,
      y: 14,
      duration: 0.35,
      ease: EASE.soft,
    });
    WORDS.slice(1).forEach((word, index) =>
      timeline.call(() => (text.textContent = word), null, 0.35 + index * 0.12),
    );
    timeline
      .to(intro, { yPercent: -100, duration: 0.8, ease: EASE.inOut }, "+=0.12")
      .to(curve, { attr: { d: FLAT }, duration: 0.8, ease: EASE.inOut }, "<")
      .call(release, null, "-=0.45");
    ["pointerdown", "keydown", "wheel"].forEach((type) =>
      window.addEventListener(type, skip, { passive: true }),
    );
  });
}
```

- [ ] **Step 2: Start it.** In `index.js` add `import * as loader from "./loader.js";` and replace `reveal.init().catch(disable);` with:

```js
    const heroReady = lite ? Promise.resolve() : loader.init();
    reveal.init({ heroReady }).catch(disable);
```

- [ ] **Step 3: Markup.** In `index.html`, directly after `<body>` insert:

```html
    <div class="intro" aria-hidden="true">
      <p class="intro-word">
        <span class="intro-dot"></span><span class="intro-text">Hello</span>
      </p>
      <svg
        class="intro-curve"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d="M0 0 L1000 0 L1000 0 Q500 100 0 0 Z" />
      </svg>
    </div>
```

- [ ] **Step 4: CSS.** Append to `motion.css`:

```css
/* Intro loader */
.intro {
  display: none;
}
@media screen {
  html.intro {
    overflow: hidden;
  }
  html.intro .intro {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    color: var(--text);
  }
}
.intro-word {
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: var(--display);
  font-size: clamp(36px, 5vw, 64px);
  letter-spacing: -0.04em;
}
.intro-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--orange);
}
.intro-curve {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  width: 100%;
  height: 14vh;
  fill: var(--bg);
}
```

- [ ] **Step 5: Browser check.** Run `sessionStorage.clear()`, reload `/`, take a screenshot within 0.5s (loader visible with a word), then after 3s run:

```js
[document.documentElement.classList.contains("intro"), sessionStorage.getItem("bg-intro"), getComputedStyle(document.querySelector(".intro")).display]
```

Expected: `[false, "1", "none"]`. Reload: no loader (screenshot shows the hero immediately). Clear `sessionStorage`, reload and click immediately: loader skips straight to the hero. Measure CLS:

```js
new Promise((r) => { let cls = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) cls += e.value; })).observe({ type: "layout-shift", buffered: true }); setTimeout(() => r(cls), 3500); })
```

after `sessionStorage.clear()` and a reload. Expected: below `0.02`.

- [ ] **Step 6: Commit.**

```bash
git add assets/js/motion/loader.js assets/js/motion/index.js motion.css index.html
git commit -m "feat(motion): first-visit intro loader with curved curtain"
```

---

### Task 5: Micro-interactions and page transitions

**Files:**
- Create: `assets/js/motion/cursor.js`
- Modify: `assets/js/motion/index.js`, `motion.css`

**Interfaces:**
- Consumes: `finePointer`, `EASE` from `gate.js`.
- Produces: `cursor.js` exports `init(): void`. Classes `is-magnetic` (CSS vars `--mx`, `--my`), `has-fill` (CSS vars `--fx`, `--fy`, `--fill`), `arrow-swap`.

- [ ] **Step 1: `cursor.js`.** Create `assets/js/motion/cursor.js`:

```js
// Pointer effects for mouse and trackpad: magnetic buttons, directional fills,
// arrow swaps and the hero sculpture tilt.
import { finePointer, EASE } from "./gate.js";

const MAGNETIC = ".button, .header-contact, .contact-arrow, .circle-arrow";
const FILL = ".button, .header-contact";

export function init() {
  if (!finePointer()) return;
  const { gsap } = window;
  wrapArrows();
  document.querySelectorAll(MAGNETIC).forEach((el) => magnetic(gsap, el));
  document.querySelectorAll(FILL).forEach(directionalFill);
  tilt(gsap);
}

function magnetic(gsap, el) {
  el.classList.add("is-magnetic");
  el.addEventListener("pointermove", (event) => {
    const box = el.getBoundingClientRect();
    gsap.to(el, {
      "--mx": (event.clientX - box.left - box.width / 2) * 0.3,
      "--my": (event.clientY - box.top - box.height / 2) * 0.3,
      duration: 0.6,
      ease: EASE.soft,
      overwrite: "auto",
    });
  });
  el.addEventListener("pointerleave", () =>
    gsap.to(el, {
      "--mx": 0,
      "--my": 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    }),
  );
}

function directionalFill(el) {
  el.classList.add("has-fill");
  const place = (event) => {
    const box = el.getBoundingClientRect();
    el.style.setProperty("--fx", `${event.clientX - box.left}px`);
    el.style.setProperty("--fy", `${event.clientY - box.top}px`);
  };
  el.addEventListener("pointerenter", place);
  el.addEventListener("pointerleave", place);
}

function wrapArrows() {
  document
    .querySelectorAll('a > span[aria-hidden="true"], button > span[aria-hidden="true"]')
    .forEach((span) => {
      if (
        span.textContent.trim() !== "↗" ||
        span.closest(".capture-cta, .contact-arrow, .brand-symbol, .next-arrow")
      )
        return;
      span.classList.add("arrow-swap");
      span.innerHTML = "<span>↗</span><span>↗</span>";
    });
}

function tilt(gsap) {
  const hero = document.querySelector(".hero");
  const art = hero?.querySelector(".hero-art");
  if (!art) return;
  gsap.set(art, { transformPerspective: 900 });
  const rotateX = gsap.quickTo(art, "rotationX", { duration: 0.8, ease: EASE.soft });
  const rotateY = gsap.quickTo(art, "rotationY", { duration: 0.8, ease: EASE.soft });
  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    rotateY(((event.clientX - box.left) / box.width - 0.5) * 12);
    rotateX(-((event.clientY - box.top) / box.height - 0.5) * 12);
  });
  hero.addEventListener("pointerleave", () => {
    rotateX(0);
    rotateY(0);
  });
}
```

- [ ] **Step 2: Start it.** In `index.js` add `import * as cursor from "./cursor.js";` and inside `if (!lite) { … }` add `cursor.init();` after `scroll.init();`.

- [ ] **Step 3: CSS.** Append to `motion.css`:

```css
/* Micro-interactions (mouse and trackpad) */
@media (hover: hover) and (pointer: fine) {
  .motion .is-magnetic {
    --mx: 0;
    --my: 0;
    translate: calc(var(--mx) * 1px) calc(var(--my) * 1px);
  }
  .motion .has-fill {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    transition: color 0.4s var(--ease-in-out);
  }
  .motion .has-fill::before {
    content: "";
    position: absolute;
    left: var(--fx, 50%);
    top: var(--fy, 50%);
    width: 0;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--fill, var(--cream));
    transform: translate(-50%, -50%);
    transition: width 0.6s var(--ease-in-out);
    z-index: -1;
    pointer-events: none;
  }
  .motion .has-fill:hover::before {
    width: 260%;
  }
  .motion .button-orange.has-fill:hover {
    background: var(--orange);
  }
  .motion .button-ink.has-fill {
    --fill: var(--orange);
  }
  .motion .button-ink.has-fill:hover {
    background: var(--ink);
    color: var(--ink);
  }
  .motion .header-contact.has-fill:hover {
    background: transparent;
  }
  .motion .arrow-swap {
    display: inline-grid;
    overflow: hidden;
    vertical-align: middle;
    line-height: 1;
  }
  .motion .arrow-swap > span {
    grid-area: 1 / 1;
    transition: transform 0.5s var(--ease-in-out);
  }
  .motion .arrow-swap > span:last-child {
    transform: translate(-110%, 110%);
  }
  .motion :is(a, button):hover > .arrow-swap > span:first-child {
    transform: translate(110%, -110%);
  }
  .motion :is(a, button):hover > .arrow-swap > span:last-child {
    transform: none;
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .motion .text-link {
    border-bottom-color: transparent;
    background: linear-gradient(currentColor, currentColor) no-repeat left bottom /
      100% 1px border-box;
  }
  .motion .text-link:hover {
    animation: underline-sweep 0.7s var(--ease-in-out);
  }
}
@keyframes underline-sweep {
  0% {
    background-position: right bottom;
    background-size: 100% 1px;
  }
  45% {
    background-position: right bottom;
    background-size: 0 1px;
  }
  55% {
    background-position: left bottom;
    background-size: 0 1px;
  }
  100% {
    background-position: left bottom;
    background-size: 100% 1px;
  }
}

/* Accordions */
@media (prefers-reduced-motion: no-preference) {
  .motion {
    interpolate-size: allow-keywords;
  }
  .motion details::details-content {
    block-size: 0;
    overflow-y: clip;
    transition:
      block-size 0.55s var(--ease-in-out),
      content-visibility 0.55s allow-discrete;
  }
  .motion details[open]::details-content {
    block-size: auto;
  }
}

/* Page transitions (Chromium, Safari 18.2+) */
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
  ::view-transition-group(root) {
    background: var(--bg, #141414);
  }
  ::view-transition-old(root) {
    animation: vt-lift 0.7s var(--ease-in-out) both;
  }
  ::view-transition-new(root) {
    animation: vt-wipe 0.7s var(--ease-in-out) both;
  }
}
@keyframes vt-lift {
  to {
    transform: translateY(-12%);
    opacity: 0.2;
  }
}
@keyframes vt-wipe {
  from {
    clip-path: inset(100% 0 0 0);
  }
  to {
    clip-path: inset(0);
  }
}
```

- [ ] **Step 4: Browser check.** Reload `/`, wait 3s. Hover "Explore my work" with the `computer` hover action at its left edge, then run:

```js
const b = document.querySelector(".hero-actions .button");
[b.classList.contains("has-fill"), b.classList.contains("is-magnetic"), getComputedStyle(b, "::before").width !== "0px", document.querySelectorAll(".arrow-swap").length > 5]
```

Expected: `[true, true, true, true]`. Open the first capability (`summary` in `.capabilities`) and screenshot mid-animation; it should expand smoothly. Click the "Work" nav link and screenshot immediately: the new page wipes up. Back on `/`, run `document.querySelector(".hero-art").style.transform` after hovering the hero: contains `rotateX`/`rotateY` (or `perspective`).

- [ ] **Step 5: Commit.**

```bash
git add assets/js/motion/cursor.js assets/js/motion/index.js motion.css
git commit -m "feat(motion): magnetic buttons, directional fills, arrow swaps, accordions and page transitions"
```

---

### Task 6: "Let's talk" panel and toast

**Files:**
- Create: `assets/js/motion/contact.js`
- Modify: `assets/js/motion/index.js`, `motion.css`, `script.js` (copy handler)

**Interfaces:**
- Consumes: `motionOn`, `EASE`, `EMAIL` from `gate.js`; `stopScroll`, `startScroll` from `scroll.js`.
- Produces: `contact.js` exports `init(): void`, `toast(message: string): void`, `copyEmail(): Promise<void>`; sets `window.bgToast = toast`.

- [ ] **Step 1: `contact.js`.** Create `assets/js/motion/contact.js`:

```js
// The "Let's talk" panel, built once for every page, and the shared toast.
import { motionOn, EASE, EMAIL } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

const LINKS = [
  ["LinkedIn", "https://www.linkedin.com/in/baltejgoud"],
  ["GitHub", "https://github.com/baltejgoud"],
];
let toastTimer;

export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg><span></span>';
    document.body.append(el);
  }
  el.querySelector("span").textContent = message;
  el.classList.remove("is-visible");
  void el.offsetWidth;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast("Email copied.");
  } catch {
    toast("Select the email address to copy it.");
  }
}

export function init() {
  window.bgToast = toast;
  const triggers = document.querySelectorAll(
    '.header-contact, #mobile-nav a[href$="#contact"]',
  );
  if (!triggers.length) return;
  const panel = build();
  const inner = panel.querySelector(".panel-inner");
  let opener = null;
  let closing = false;

  const open = (trigger) => {
    opener = trigger;
    panel.querySelector(".panel-clock").textContent =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()) + " IST";
    panel.showModal();
    stopScroll();
    if (!motionOn()) return;
    const { gsap } = window;
    gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: EASE.inOut });
    gsap.from(inner.children, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
      delay: 0.25,
      ease: EASE.out,
    });
  };

  const close = () => {
    if (!panel.open || closing) return;
    const finish = () => {
      panel.close();
      closing = false;
      startScroll();
      window.gsap?.set(panel, { clearProps: "transform" });
      (opener?.offsetParent ? opener : document.querySelector(".menu-toggle"))?.focus();
    };
    if (!motionOn()) return finish();
    closing = true;
    window.gsap.to(panel, { xPercent: 100, duration: 0.5, ease: "power3.in", onComplete: finish });
  };

  triggers.forEach((trigger) =>
    trigger.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      open(trigger);
    }),
  );
  panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  panel.querySelector(".panel-close").addEventListener("click", close);
  panel.querySelector(".panel-copy").addEventListener("click", copyEmail);
}

function build() {
  const resume = new URL(
    "resume.html",
    document.querySelector(".brand")?.href ?? location.href,
  ).href;
  const dialog = document.createElement("dialog");
  dialog.className = "contact-panel";
  dialog.setAttribute("aria-labelledby", "contact-panel-title");
  dialog.setAttribute("data-lenis-prevent", "");
  dialog.innerHTML = `<div class="panel-inner">
    <div class="panel-top"><span class="eyebrow">Good things start with a conversation</span><button class="panel-close" type="button">Close <span aria-hidden="true">✕</span></button></div>
    <h2 id="contact-panel-title">Let’s <em>talk.</em></h2>
    <p class="panel-lede">A business idea, a technical challenge, or an interesting conversation. I’m listening.</p>
    <a class="panel-email" href="mailto:${EMAIL}">${EMAIL} <span aria-hidden="true">↗</span></a>
    <button class="panel-copy" type="button">Copy email <span aria-hidden="true">+</span></button>
    <ul class="panel-links">${LINKS.map(([label, href]) => `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a></li>`).join("")}<li><a href="${resume}">Résumé <span aria-hidden="true">↗</span></a></li></ul>
    <p class="panel-time">Hyderabad, India · <span class="panel-clock"></span></p>
  </div>`;
  document.body.append(dialog);
  return dialog;
}
```

- [ ] **Step 2: Start it.** In `index.js` add `import * as contact from "./contact.js";` and, directly after the `safely` helper, add `safely(contact.init);` (it runs with or without motion).

- [ ] **Step 3: `script.js` copy handler.** Replace the whole `document.querySelector(".copy-email")?.addEventListener(…)` block with:

```js
document.querySelector(".copy-email")?.addEventListener("click", async () => {
  const status = document.querySelector(".copy-status");
  const report = (message) => {
    if (window.bgToast) return window.bgToast(message);
    status.textContent = message;
    setTimeout(() => {
      status.textContent = "";
    }, 5000);
  };
  try {
    await navigator.clipboard.writeText("baltej.panagatla@gmail.com");
    report("Email copied.");
  } catch {
    report("Select the email address above to copy it.");
  }
});
```

- [ ] **Step 4: CSS.** Append to `motion.css`:

```css
/* Contact panel */
.contact-panel {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(520px, 100vw);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: var(--orange);
  color: var(--bg);
  overflow-y: auto;
}
.contact-panel::backdrop {
  background: rgb(10 10 10 / 0.6);
}
.motion .contact-panel[open]::backdrop {
  animation: backdrop-in 0.5s ease both;
}
@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}
.panel-inner {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 100%;
  padding: clamp(24px, 5vw, 48px);
}
.panel-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}
.panel-close {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid #52291e;
  border-radius: 100px;
  background: none;
  color: inherit;
  font-size: 13px;
}
.contact-panel h2 {
  margin-top: auto;
  font-size: clamp(56px, 9vw, 96px);
  line-height: 1;
}
.panel-lede {
  font-size: 15px;
  max-width: 34ch;
}
.panel-email {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-block: 18px;
  border-block: 1px solid #b94729;
  font-size: clamp(17px, 2.2vw, 22px);
  letter-spacing: -0.02em;
}
.panel-copy {
  align-self: flex-start;
  display: flex;
  gap: 24px;
  min-height: 44px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid #74371f;
  background: none;
  color: inherit;
  font-size: 13px;
}
.panel-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  padding: 0;
  list-style: none;
  font-size: 15px;
}
.panel-links a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
}
.panel-time {
  font-size: 12px;
}

/* Toast */
.toast {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 400;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 12px 14px;
  border-radius: 100px;
  background: var(--cream, #f1f0e9);
  color: #20211f;
  font-size: 14px;
  box-shadow: 0 18px 40px #0005;
  transform: translate(-50%, 160%);
  transition: transform 0.5s var(--ease-in-out);
  pointer-events: none;
}
.toast.is-visible {
  transform: translate(-50%, 0);
}
.toast svg {
  width: 24px;
  height: 24px;
  padding: 3px;
  border-radius: 50%;
  background: var(--orange, #ff693f);
  fill: none;
  stroke: #141414;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.toast path {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
}
.toast.is-visible path {
  animation: toast-check 0.45s 0.25s var(--ease-in-out) forwards;
}
@keyframes toast-check {
  to {
    stroke-dashoffset: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .toast path {
    stroke-dashoffset: 0;
  }
}
```

- [ ] **Step 5: Browser check.** On `/` click "Let's talk" in the header. Run:

```js
const p = document.querySelector(".contact-panel");
[p.open, document.activeElement.closest(".contact-panel") !== null, p.querySelector('a[href$="resume.html"]').href]
```

Expected: `[true, true, "http://localhost:5301/resume.html"]`. Click "Copy email": a toast slides up (screenshot). Press Escape (`computer` key `Escape`): run `[document.querySelector(".contact-panel").open, document.activeElement.className]`. Expected: `[false, "header-contact has-fill is-magnetic"]` (class order may vary; `header-contact` must be present). Repeat on `/work/vigor/` (résumé link must be `http://localhost:5301/resume.html`). At 390px open the mobile menu, tap "Let's talk": the panel fills the screen. On `/?nomotion`, the panel opens and closes instantly.

- [ ] **Step 6: Commit.**

```bash
git add assets/js/motion/contact.js assets/js/motion/index.js motion.css script.js
git commit -m "feat(motion): Let's talk slide-in panel and shared toast"
```

---

### Task 7: Project quick view

**Files:**
- Create: `assets/js/motion/quickview.js`
- Modify: `scripts/check-site.cjs`, `scripts/build-work.cjs`, `assets/js/motion/index.js`, `motion.css`

**Interfaces:**
- Consumes: `motionOn`, `compact`, `EASE` from `gate.js`; `stopScroll`, `startScroll` from `scroll.js`.
- Produces: `quickview.js` exports `init(): void`. Card links carry `data-quickview="<slug>"`. Data island `<script type="application/json" id="project-data">` holds an array of `{ slug, name, number, theme, discipline, status, tagline, role, stack, problem, decisions: [string, string][], caption, url, image: { src, width, height, alt }, secondary: { src, width, height, alt, title } | null }`, with `src` and `url` relative to the page.

- [ ] **Step 1: Add the failing data-island check.** In `scripts/check-site.cjs`, inside the per-page loop after the motion asset check, add:

```js
  const quickSlugs = [...html.matchAll(/data-quickview="([^"]+)"/g)].map(
    (m) => m[1],
  );
  if (quickSlugs.length) {
    const island = html.match(
      /<script type="application\/json" id="project-data">([\s\S]*?)<\/script>/,
    );
    let data = [];
    try {
      data = island ? JSON.parse(island[1]) : [];
    } catch {
      failures.push(`${file}: #project-data is not valid JSON`);
    }
    if (!island) failures.push(`${file}: quick view cards without #project-data`);
    const known = new Set(data.map((p) => p.slug));
    for (const slug of quickSlugs)
      if (!known.has(slug)) failures.push(`${file}: no quick view data for ${slug}`);
    for (const p of data)
      for (const image of [p.image, p.secondary].filter(Boolean))
        if (!fs.existsSync(path.resolve(path.dirname(path.join(root, file)), image.src)))
          failures.push(`${file}: missing quick view image ${image.src}`);
  }
```

- [ ] **Step 2: Mark cards and confirm failure.** In `build-work.cjs` `card`, change `<a class="project-story-link" href=` to `<a class="project-story-link" data-quickview="${p.slug}" href=`. Run `npm run build:work && npm run check`. Expected: exit code 1 with `index.html: quick view cards without #project-data` and `work/index.html: quick view cards without #project-data`.

- [ ] **Step 3: Emit the data island.** In `build-work.cjs`, after `motionScripts`, add:

```js
const dataIsland = (prefix) =>
  `<script type="application/json" id="project-data">${JSON.stringify(
    projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      number: p.number,
      theme: p.theme,
      discipline: p.discipline,
      status: p.status,
      tagline: p.tagline,
      role: p.role,
      stack: p.stack,
      problem: p.problem,
      decisions: p.decisions,
      caption: p.caption,
      url: `${prefix}work/${p.slug}/`,
      image: {
        src: `${prefix}assets/work/${p.image}.webp`,
        width: p.imageWidth,
        height: p.imageHeight,
        alt: p.alt,
      },
      secondary: p.secondary
        ? {
            src: `${prefix}assets/work/${p.secondary}.webp`,
            width: p.secondaryWidth,
            height: p.secondaryHeight,
            alt: p.secondaryAlt,
            title: p.secondaryTitle,
          }
        : null,
    })),
  ).replace(/</g, "\\u003c")}</script>`;
```

In `gallery`, change `<p class="gallery-note"` to `${dataIsland("../")}<p class="gallery-note"`. In the homepage replacement, change `<!-- SELECTED_WORK_END -->\`` at the end of the template to `${dataIsland("")}\n<!-- SELECTED_WORK_END -->\``. Run `npm run build:work && npm run check`. Expected: success.

- [ ] **Step 4: `quickview.js`.** Create `assets/js/motion/quickview.js`:

```js
// Project quick view: a dialog rendered from the #project-data island, opened from project cards.
import { motionOn, compact, EASE } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

let projects = new Map();
let dialog;
let shell;
let content;
let counter;
let current = null;
let closing = false;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const picture = (image) =>
  Object.assign(el("img"), {
    src: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt,
    decoding: "async",
  });
const visibleCards = () =>
  [...document.querySelectorAll("[data-quickview]")].filter(
    (link) => link.offsetParent !== null,
  );
const onScreen = (box) =>
  box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;

export function init() {
  const island = document.getElementById("project-data");
  if (!island || !document.querySelector("[data-quickview]")) return;
  projects = new Map(JSON.parse(island.textContent).map((p) => [p.slug, p]));
  build();
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-quickview]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !projects.has(link.dataset.quickview)
    )
      return;
    event.preventDefault();
    open(link);
  });
}

function build() {
  dialog = el("dialog", "quickview");
  dialog.setAttribute("aria-labelledby", "qv-title");
  dialog.setAttribute("data-lenis-prevent", "");
  dialog.innerHTML = `<div class="qv-shell">
    <div class="qv-bar"><span class="qv-count"></span><div class="qv-controls">
      <button class="qv-prev" type="button" aria-label="Previous project">←</button>
      <button class="qv-next" type="button" aria-label="Next project">→</button>
      <button class="qv-close" type="button">Close <span aria-hidden="true">✕</span></button>
    </div></div>
    <div class="qv-body"><article class="qv-content"></article></div>
  </div>`;
  document.body.append(dialog);
  shell = dialog.querySelector(".qv-shell");
  content = dialog.querySelector(".qv-content");
  counter = dialog.querySelector(".qv-count");
  dialog.querySelector(".qv-prev").addEventListener("click", () => step(-1));
  dialog.querySelector(".qv-next").addEventListener("click", () => step(1));
  dialog.querySelector(".qv-close").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}

function render(link) {
  const project = projects.get(link.dataset.quickview);
  const cardImg = link.querySelector("img");
  const images = [project.image, project.secondary].filter(Boolean);
  const isCardImage = (image) =>
    cardImg && new URL(image.src, location.href).href === cardImg.src;
  const lead = images.find(isCardImage) ?? images[0];
  const other = images.find((image) => image !== lead);

  const hero = el("div", `qv-hero capture-${project.theme}`);
  const heroImg = picture(lead);
  hero.append(heroImg);

  const head = el("header", "qv-head");
  const title = el("h2", null, project.name);
  title.id = "qv-title";
  head.append(
    el("span", "qv-kicker", `${project.number} / ${project.status}`),
    title,
    el("p", "qv-tagline", project.tagline),
  );

  const meta = el("dl", "qv-meta");
  [
    ["Role", project.role],
    ["Focus", project.discipline],
    ["Built with", project.stack],
  ].forEach(([term, detail]) => {
    const row = el("div");
    row.append(el("dt", null, term), el("dd", null, detail));
    meta.append(row);
  });

  const problem = el("section", "qv-problem");
  problem.append(el("span", "tiny-label", "The challenge"), el("p", null, project.problem));

  const decisions = el("ol", "qv-decisions");
  project.decisions.forEach(([heading, text], index) => {
    const item = el("li");
    item.append(
      el("span", "qv-decision-number", String(index + 1).padStart(2, "0")),
      el("h3", null, heading),
      el("p", null, text),
    );
    decisions.append(item);
  });

  content.replaceChildren(hero, head, meta, problem, decisions);
  if (other) {
    const figure = el("figure", `qv-secondary capture-${project.theme}`);
    figure.append(picture(other));
    if (other.title) figure.append(el("figcaption", null, other.title));
    content.append(figure);
  }
  const foot = el("footer", "qv-foot");
  const cta = el("a", "button button-orange qv-cta", "Read the full story ");
  cta.href = project.url;
  const arrow = el("span", null, "↗");
  arrow.setAttribute("aria-hidden", "true");
  cta.append(arrow);
  foot.append(el("p", "qv-caption", project.caption), cta);
  content.append(foot);

  const cards = visibleCards();
  const pad = (n) => String(n).padStart(2, "0");
  counter.textContent = `${pad(cards.indexOf(link) + 1)} / ${pad(cards.length)}`;
  current = { link, cardImg, heroImg };
}

function fly(from, to, src, onLand) {
  const flyer = el("img", "qv-flyer");
  flyer.src = src;
  flyer.alt = "";
  Object.assign(flyer.style, {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  });
  dialog.append(flyer);
  return window.gsap.fromTo(
    flyer,
    {
      x: from.left - to.left,
      y: from.top - to.top,
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
    },
    {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.8,
      ease: EASE.inOut,
      onComplete: () => {
        onLand?.();
        flyer.remove();
      },
    },
  );
}

function open(link) {
  render(link);
  dialog.classList.remove("is-closing");
  dialog.showModal();
  stopScroll();
  dialog.querySelector(".qv-body").scrollTop = 0;
  dialog.querySelector(".qv-close").focus();
  if (!motionOn()) return;
  const { gsap } = window;
  const parts = [dialog.querySelector(".qv-bar"), ...content.querySelectorAll(":scope > :not(.qv-hero)")];
  const cardBox = current.cardImg?.getBoundingClientRect();
  if (compact() || !cardBox || !onScreen(cardBox)) {
    gsap.fromTo(shell, { yPercent: compact() ? 100 : 6, opacity: compact() ? 1 : 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: EASE.inOut, clearProps: "transform,opacity" });
    return;
  }
  const { heroImg, cardImg } = current;
  const heroBox = heroImg.getBoundingClientRect();
  heroImg.style.visibility = "hidden";
  cardImg.style.visibility = "hidden";
  gsap
    .timeline()
    .fromTo(shell, { backgroundColor: "rgba(20, 20, 20, 0)" }, { backgroundColor: "rgba(20, 20, 20, 1)", duration: 0.5, clearProps: "backgroundColor" }, 0)
    .from(heroImg.parentElement, { backgroundColor: "rgba(0, 0, 0, 0)", duration: 0.6, clearProps: "backgroundColor" }, 0.2)
    .add(fly(cardBox, heroBox, cardImg.currentSrc || cardImg.src, () => (heroImg.style.visibility = "")), 0)
    .from(parts, { opacity: 0, y: 30, duration: 0.6, stagger: 0.05, ease: EASE.out }, 0.45);
}

function step(direction) {
  if (!current || closing) return;
  const cards = visibleCards();
  const next = cards[(cards.indexOf(current.link) + direction + cards.length) % cards.length];
  if (!next || next === current.link) return;
  const apply = () => {
    if (current.cardImg) current.cardImg.style.visibility = "";
    render(next);
    dialog.querySelector(".qv-body").scrollTop = 0;
  };
  if (!motionOn()) return apply();
  const { gsap } = window;
  gsap.to(content, {
    opacity: 0,
    y: -16,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      apply();
      gsap.fromTo(content, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: EASE.out, clearProps: "transform,opacity" });
    },
  });
}

function close() {
  if (!dialog.open || closing) return;
  const { link, cardImg, heroImg } = current;
  const finish = () => {
    dialog.close();
    dialog.classList.remove("is-closing");
    closing = false;
    startScroll();
    if (cardImg) cardImg.style.visibility = "";
    window.gsap?.set(shell, { clearProps: "all" });
    link.focus({ preventScroll: true });
  };
  if (!motionOn()) return finish();
  const { gsap } = window;
  closing = true;
  dialog.classList.add("is-closing");
  const cardBox = cardImg?.getBoundingClientRect();
  const heroBox = heroImg.getBoundingClientRect();
  if (!compact() && cardBox && onScreen(cardBox) && onScreen(heroBox)) {
    cardImg.style.visibility = "hidden";
    heroImg.style.visibility = "hidden";
    gsap
      .timeline({ onComplete: finish })
      .to(shell, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0)
      .add(fly(heroBox, cardBox, heroImg.currentSrc || heroImg.src), 0);
  } else {
    gsap.to(shell, compact() ? { yPercent: 100, duration: 0.5, ease: "power3.in", onComplete: finish } : { opacity: 0, y: 40, duration: 0.35, ease: "power2.in", onComplete: finish });
  }
}
```

- [ ] **Step 5: Start it.** In `index.js` add `import * as quickview from "./quickview.js";` and `safely(quickview.init);` after `safely(contact.init);`.

- [ ] **Step 6: CSS.** Append to `motion.css`:

```css
/* Quick view */
.quickview {
  width: min(1180px, calc(100vw - 48px));
  max-width: none;
  height: min(88vh, 980px);
  max-height: none;
  margin: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  overflow: visible;
}
.quickview::backdrop {
  background: rgb(10 10 10 / 0.72);
  transition: opacity 0.5s ease;
}
.motion .quickview[open]::backdrop {
  animation: backdrop-in 0.5s ease both;
}
.quickview.is-closing::backdrop {
  opacity: 0;
}
.qv-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.qv-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 16px 12px 24px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}
.qv-controls {
  display: flex;
  gap: 8px;
}
.qv-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 100px;
  background: none;
  color: var(--text);
  font-size: 14px;
}
.qv-controls button:hover {
  border-color: var(--orange);
  color: var(--orange);
}
.qv-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.qv-content {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 36px 56px;
  padding: clamp(20px, 3vw, 36px);
}
.qv-hero,
.qv-secondary,
.qv-foot,
.qv-decisions {
  grid-column: 1 / -1;
}
.qv-hero,
.qv-secondary {
  padding: clamp(16px, 4vw, 52px);
  border-radius: 4px;
}
.qv-hero img,
.qv-secondary img {
  width: 100%;
  height: auto;
  box-shadow: 0 18px 40px #0003;
}
.qv-secondary figcaption {
  margin-top: 16px;
  color: var(--ink);
  font-size: 14px;
}
.qv-kicker {
  font-size: 12px;
  color: var(--muted);
}
.qv-head h2 {
  margin-top: 10px;
  font-size: clamp(40px, 5vw, 72px);
  line-height: 1;
}
.qv-tagline {
  margin-top: 14px;
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(20px, 2vw, 26px);
  color: var(--muted);
}
.qv-meta {
  display: grid;
  gap: 14px;
  align-content: start;
  font-size: 14px;
}
.qv-meta div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.qv-meta dt {
  color: var(--muted);
}
.qv-meta dd {
  margin: 0;
}
.qv-problem {
  grid-column: 1 / -1;
  max-width: 70ch;
}
.qv-problem p {
  margin-top: 10px;
  font-size: 17px;
}
.qv-decisions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 0;
  list-style: none;
}
.qv-decisions li {
  padding-top: 18px;
  border-top: 1px solid var(--line);
}
.qv-decision-number {
  font-size: 12px;
  color: var(--orange);
}
.qv-decisions h3 {
  margin-top: 10px;
  font-size: 20px;
}
.qv-decisions p {
  margin-top: 10px;
  font-size: 14px;
  color: var(--muted);
}
.qv-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.qv-caption {
  font-size: 12px;
  color: var(--muted);
  max-width: 60ch;
}
.qv-flyer {
  position: fixed;
  margin: 0;
  z-index: 2;
  transform-origin: 0 0;
  pointer-events: none;
  box-shadow: 0 18px 40px #0004;
}
@media (max-width: 800px) {
  .quickview {
    width: 100vw;
    height: 100dvh;
    margin: 0;
  }
  .qv-shell {
    border: 0;
    border-radius: 0;
  }
  .qv-content,
  .qv-decisions {
    grid-template-columns: 1fr;
  }
  .qv-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Step 7: Browser check.** On `/` (desktop), click the Axon card capture. Run:

```js
const d = document.querySelector(".quickview");
[d.open, d.querySelector("#qv-title").textContent, d.querySelector(".qv-count").textContent, document.activeElement.className, d.querySelectorAll(".qv-decisions li").length]
```

Expected: `[true, "Axon AI Studio", "01 / 04", "qv-close", 3]`. Screenshot mid-open (flyer visible). Press `ArrowRight` three times: titles go VIGOR → ExtraTicket → Sanket; ExtraTicket shows no `.qv-secondary`. Press Escape: dialog closes, image flies back, `document.activeElement` is the Sanket card link. Ctrl+click the Axon card (`computer` left_click with `modifiers: "ctrl"`): a new tab opens on `/work/axon/` and no dialog opens. Repeat on `/work/` (data island prefix `../`). At 390px: quick view opens as a full-screen sheet. On `/?nomotion`: opens and closes instantly. Run `npm run check`: passes.

- [ ] **Step 8: Commit.**

```bash
git add assets/js/motion/quickview.js assets/js/motion/index.js motion.css scripts/build-work.cjs scripts/check-site.cjs index.html work
git commit -m "feat(motion): project quick view with card-to-dialog image morph"
```

---

### Task 8: Quick-view bubble and hover preview cards

**Files:**
- Modify: `assets/js/motion/cursor.js`, `motion.css`

**Interfaces:**
- Consumes: `[data-quickview]` links (Task 7), `[data-preview]` / `[data-preview-image]` rows (Task 3).
- Produces: elements `.qv-bubble`, `.hover-preview` (classes `has-image`, `tone-orange|tone-ivory|tone-charcoal`).

- [ ] **Step 1: Extend `cursor.js`.** In `init()`, after `tilt(gsap);` add:

```js
  quickViewBubble(gsap);
  hoverPreviews(gsap);
```

Append to the file:

```js
// Eased pointer follower shared by the bubble and the preview card (lerp 0.15).
function follower(gsap, el, { tilt = 0 } = {}) {
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let rotation = 0;
  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    },
    { passive: true },
  );
  gsap.ticker.add(() => {
    const dx = targetX - x;
    const dy = targetY - y;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(rotation) < 0.01) return;
    x += dx * 0.15;
    y += dy * 0.15;
    if (tilt) rotation += (gsap.utils.clamp(-tilt, tilt, dx * 0.1) - rotation) * 0.15;
    gsap.set(el, { x, y, rotation });
  });
  return {
    jump(event) {
      targetX = x = event.clientX;
      targetY = y = event.clientY;
      gsap.set(el, { x, y });
    },
  };
}

function quickViewBubble(gsap) {
  const captures = document.querySelectorAll("[data-quickview] .project-capture");
  if (!captures.length) return;
  const bubble = document.createElement("div");
  bubble.className = "qv-bubble";
  bubble.setAttribute("aria-hidden", "true");
  bubble.textContent = "Quick view";
  document.body.append(bubble);
  gsap.set(bubble, { scale: 0, opacity: 0 });
  const follow = follower(gsap, bubble);
  captures.forEach((capture) => {
    capture.addEventListener("pointerenter", (event) => {
      follow.jump(event);
      gsap.to(bubble, { scale: 1, opacity: 1, duration: 0.4, ease: EASE.soft, overwrite: "auto" });
    });
    capture.addEventListener("pointerleave", () =>
      gsap.to(bubble, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" }),
    );
  });
}

const TONES = ["tone-orange", "tone-ivory", "tone-charcoal"];

function hoverPreviews(gsap) {
  const rows = document.querySelectorAll("[data-preview]");
  if (!rows.length) return;
  const card = document.createElement("div");
  card.className = "hover-preview";
  card.setAttribute("aria-hidden", "true");
  document.body.append(card);
  gsap.set(card, { scale: 0.6, opacity: 0 });
  const follow = follower(gsap, card, { tilt: 8 });
  let visible = false;
  rows.forEach((row, index) => {
    row.addEventListener("pointerenter", (event) => {
      renderPreview(card, row, index);
      if (!visible) follow.jump(event);
      visible = true;
      gsap.to(card, { scale: 1, opacity: 1, duration: 0.45, ease: EASE.soft, overwrite: "auto" });
    });
    row.addEventListener("pointerleave", () => {
      visible = false;
      gsap.to(card, { scale: 0.6, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
    });
  });
}

function renderPreview(card, row, index) {
  const image = row.dataset.previewImage;
  card.className = `hover-preview ${image ? "has-image" : TONES[index % TONES.length]}`;
  if (image) {
    const img = new Image();
    img.src = image;
    img.alt = "";
    card.replaceChildren(img);
    return;
  }
  const text = (selector) => row.querySelector(selector)?.textContent.trim() ?? "";
  const number = document.createElement("span");
  number.className = "hover-preview-number";
  number.textContent = text(".archive-number, .experience-index");
  const title = document.createElement("strong");
  title.textContent = text(":scope > span:nth-child(2), h3");
  const meta = document.createElement("span");
  meta.className = "hover-preview-meta";
  meta.textContent = text(".archive-category, .experience-role");
  card.replaceChildren(number, title, meta);
}
```

- [ ] **Step 2: CSS.** Append to `motion.css`:

```css
/* Cursor bubble and hover previews */
.qv-bubble,
.hover-preview {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 120;
  pointer-events: none;
}
.qv-bubble {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  margin: -48px 0 0 -48px;
  border-radius: 50%;
  background: var(--orange);
  color: var(--bg);
  font-size: 12px;
  font-weight: 600;
}
@media (hover: hover) and (pointer: fine) {
  .motion-ready [data-quickview] .project-capture {
    cursor: none;
  }
}
.hover-preview {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 320px;
  height: 220px;
  margin: -110px 0 0 -160px;
  padding: 22px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 24px 50px #0003;
}
.hover-preview.has-image {
  padding: 0;
  background: var(--ink);
}
.hover-preview.has-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hover-preview.tone-orange {
  background: var(--orange);
  color: var(--bg);
}
.hover-preview.tone-ivory {
  background: var(--cream);
  color: var(--ink);
  border: 1px solid var(--light-line);
}
.hover-preview.tone-charcoal {
  background: var(--bg);
  color: var(--text);
}
.hover-preview-number {
  font-size: 12px;
  opacity: 0.7;
}
.hover-preview strong {
  font-family: var(--display);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.hover-preview-meta {
  font-size: 12px;
  opacity: 0.75;
}
```

- [ ] **Step 3: Browser check.** On `/` (desktop), hover the Axon card capture: screenshot shows the orange "Quick view" bubble at the cursor. Scroll to `#work` archive, hover row 07: screenshot shows the deepfake pipeline image card; hover row 05: an orange typographic card reading "05 / AgriTrust / Supply-chain evidence". Hover experience row 02: a typographic card with "Haritha Industries". Run `document.querySelector(".hover-preview").getAttribute("aria-hidden")`. Expected: `"true"`. At 390px (mobile preset, reload): `document.querySelector(".qv-bubble, .hover-preview")` is `null`.

- [ ] **Step 4: Commit.**

```bash
git add assets/js/motion/cursor.js motion.css
git commit -m "feat(motion): quick-view cursor bubble and hover preview cards"
```

---

### Task 9: Documentation and full verification

**Files:**
- Modify: `DESIGN.md`, `README.md`

- [ ] **Step 1: `DESIGN.md`.** Replace the "Behavior and accessibility" bullets about motion ("Brief page-introduction entrances…", "No loading overlay, custom cursor or hidden-on-load content…") with a "Motion" section summarizing: the gate (`js`/`motion`/`motion-ready`, 3s failsafe, `?nomotion`), smooth scroll on fine pointers, reveals (`data-reveal`, `data-hero`, `data-parallax`, `data-count`), intro loader (once per session), marquee, magnetic buttons and fills, quick view, hover previews, contact panel, toast, page transitions, reduced-motion and print behavior, and the vendored libraries with versions and licenses. Note in Direction that the restraint of the first redesign was reversed on 2026-10-08 at the user's request (reference: dennissnellenberg.com).

- [ ] **Step 2: `README.md`.** In Edit, add bullets: `motion.css` (motion styles), `assets/js/motion/` (one module per behavior, entry `index.js`), `assets/vendor/` (run `npm install` then `npm run vendor` after changing library versions). Mention `?nomotion` for checking the static version.

- [ ] **Step 3: Full verification (spec acceptance criteria).** Run each and record the result:
  1. `npm run check` passes.
  2. At 390, 768 and 1440 px on `/`, `/work/`, `/work/sanket/`, `/resume.html`: `read_console_messages` `onlyErrors` empty; `document.documentElement.scrollWidth <= innerWidth` true. Also at 320 px on `/`.
  3. Loader: first visit plays, reload skips, click skips.
  4. Reveals, count-up, marquee direction change (scroll up and confirm movement reverses), Sanket scrub, header hide/show.
  5. Quick view checks from Task 7 Step 7 on `/` and `/work/`.
  6. Contact panel on `/`, `/work/`, `/work/axon/`; toast; Escape returns focus.
  7. Hover previews: image for 07/08, typographic for the rest.
  8. `/?nomotion`: `document.querySelectorAll("[data-reveal]")` all have computed `opacity` `"1"`, no loader, dialogs work.
  9. Failsafe: rename `assets/vendor/gsap.min.js` to `gsap.min.js.off`, reload `/`, wait 3.5s: `document.documentElement.className === "js"` and the hero is visible; rename back.
  10. Print safety (the browser pane cannot open a print preview): on `/resume.html`, before scrolling, run `[...document.styleSheets].some((s) => [...s.cssRules].some((r) => r.media?.mediaText === "print" && r.cssText.includes("[data-reveal]")))`. Expected `true`. Hidden states live only in `@media screen`, so print renders every section. Ask the user to do one manual Print / Save as PDF check.
  11. CLS below 0.02 on `/` with the loader (Task 4 Step 5 snippet).

- [ ] **Step 4: Measure the budget.** Run `cat assets/vendor/*.js assets/js/motion/*.js | gzip -c | wc -c`. Expected: below 76800.

- [ ] **Step 5: Commit.**

```bash
git add DESIGN.md README.md
git commit -m "docs: document the motion system"
```
