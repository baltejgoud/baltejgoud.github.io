# Editorial Portfolio — Design Spec

- **Date:** 2026-10-16
- **Status:** Design approved by Baltej on 2026-10-16
- **Branch:** `feat/editorial-portfolio`
- **Supersedes:** the "Signal" homepage (charcoal / ivory / orange) and its motion layer. The case studies and résumé page stay, unchanged, at their current URLs.

## 1. Goal

Rebuild the homepage of `baltejgoud.github.io` as a warm, light, editorial single-page portfolio with six numbered sections, high-craft interactions and a component architecture that is modular and production-ready. The look and section architecture follow Baltej's brief; every fact on the page comes from his existing site and résumé.

## 2. Locked decisions

| Topic | Decision |
|---|---|
| Hero title | **Data** (bold sans) / **Analyst.** (italic serif). Tagline: "Data analyst · AI engineer · Co-founder of Sanket". |
| Stack | Next.js (App Router, `output: "export"`), TypeScript, Tailwind CSS v4, `motion` (Framer Motion), Lenis. |
| Hero media | Local background removal of `assets/portrait.webp` → transparent cutout. The media component also accepts an optional talking-avatar video. |
| Missing data | Nothing invented. Certifications stay hidden while their data file is empty. Jobs carry no dates. Achievements use only real numbers. |
| CGPA | Shown as `6.1 / 10` (already public on `resume.html`). |
| Job order | Résumé lists jobs newest first, so chronologically: BVRIT tutor → Tectoro → Haritha → Sanket. |
| Repos | Public GitHub links exist only for Axon, AgriTrust and Tandem. Sanket, VIGOR and ExtraTicket link to their case study instead. |

## 3. Non-goals

- Restyling `resume.html` or the `work/` case studies (they keep the Signal dark theme; a restyle is a follow-up).
- Dark mode. The brief specifies a light editorial theme; `color-scheme: light`.
- A CMS, analytics, a contact form or any server runtime.
- Fabricated content: no invented metrics, dates, certifications, coding-profile stats, quotes or repository links. Synthetic data inside project widgets is labelled "Illustrative".

## 4. Design system

### 4.1 Colour tokens (Tailwind v4 `@theme` in `src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--color-cream` | `#F6F4EE` | Page background |
| `--color-ink` | `#181818` | Primary text, active pills, inverted rows |
| `--color-stone` | `#7A756D` | Secondary text, metadata |
| `--color-line` | `#E5E0D8` | Hairline borders, dividers |
| `--color-paper` | `#FFFFFF` | Card surfaces |
| `--color-glass` | `rgb(255 255 255 / 0.62)` | Translucent cards (with `backdrop-blur`) |
| `--color-watermark` | `rgb(122 117 109 / 0.10)` | Giant background words and years |
| `--color-live` | `#22C55E` | Availability dot (with glow) |

Skill category dots (muted, editorial):

| Category | Token | Value |
|---|---|---|
| Languages | `--color-cat-lang` | `#D08A3C` |
| Frontend | `--color-cat-front` | `#4A7FB0` |
| Backend | `--color-cat-back` | `#5B8C5A` |
| Databases | `--color-cat-data` | `#8B6BB1` |
| Tools | `--color-cat-tools` | `#B85C45` |
| Core | `--color-cat-core` | `#B8962E` |

Body text on cream (`#181818` on `#F6F4EE`) and stone metadata (`#7A756D` on `#F6F4EE`, ≈ 4.5:1) meet WCAG AA for their sizes; stone is never used below 12px for meaningful text.

### 4.2 Typography (self-hosted with `next/font/google`)

| Role | Font | Notes |
|---|---|---|
| Sans (headings, body) | Plus Jakarta Sans 400–800 | `--font-sans` |
| Accent | Instrument Serif, italic 400 | `--font-serif`. One accent word or phrase in every section title. |
| Mono | JetBrains Mono 400–500 | `--font-mono`. Index numbers `01`–`06`, metadata labels, tags. Uppercase with `0.14em` tracking for labels. |

Scale (fluid with `clamp`): section titles `clamp(2.4rem, 5.5vw, 4.75rem)` with `-0.035em` tracking; body `1rem / 1.65`; labels `0.72rem`.

### 4.3 Shape and space

- Radius: pills `9999px`; cards `20px`; tiles `14px`; monogram badge `10px`.
- Container: `max-width: 1320px`, side gutter `clamp(16px, 4vw, 40px)`.
- Section rhythm: `padding-block: clamp(88px, 12vw, 160px)`.
- Shadows: one soft card shadow `0 1px 0 rgb(0 0 0 / .04), 0 18px 40px -24px rgb(24 24 24 / .18)`.

## 5. Information architecture

Section order, anchor ids and nav labels:

| Section | id | Nav label | Index (certs hidden) | Index (certs shown) |
|---|---|---|---|---|
| Hero | `top` | — | — | — |
| About — "Hi, I'm *Baltej.*" | `about` | About | 01 | 01 |
| Skills — "The periodic table *of my stack.*" | `skills` | Skills | 02 | 02 |
| Selected work — "Things I've *built.*" | `work` | Work | 03 | 03 |
| Certifications — "Always *learning.*" | `certifications` | — | hidden | 04 |
| Journey — "Education & *experience.*" | `experience` | Experience | 04 | 05 |
| Achievements — "Proud *moments.*" | `achievements` | Achievements | 05 | 06 |
| Contact — "Let's build something *useful.*" | `contact` | Contact | — | — |

Ids `about`, `experience`, `work` and `contact` match the anchors the legacy case-study pages already link to (`../../index.html#about`, `#experience`, `#contact`). Index numbers are computed by `lib/sections.ts` from the list of visible sections, never hard-coded.

## 6. Content model

All copy and data live in `src/content/` as typed TypeScript modules. Components import data; they contain no personal facts.

```ts
// src/content/types.ts
export type SkillCategory = "languages" | "frontend" | "backend" | "databases" | "tools" | "core";
export interface Skill { id: string; symbol: string; name: string; category: SkillCategory; icon?: string /* simple-icons slug */; usage: string; }
export interface Project {
  id: string; index: string; title: string; category: string; role: string; summary: string;
  features: string[]; stack: string[];
  links: { github?: string; caseStudy?: string };
  widget: "forecast" | "atlas" | "import" | "fairPrice" | "custody" | "reconcile";
}
export interface Certification { title: string; issuer: string; year?: string; href?: string; }
export interface Milestone { kind: "education" | "experience" | "next"; dates?: string; role: string; org: string; bullets: string[]; tags: string[]; }
export interface Achievement { icon: string /* lucide name */; title: string; description: string; metric: string; size?: "wide"; }
```

### 6.1 Profile (`profile.ts`)

- Name: **Baltej Goud** (nav); full name **Panagatla Baltej Goud** (hero mono label, ID card). Monogram: **BG**.
- Email `baltej.panagatla@gmail.com` · LinkedIn `https://www.linkedin.com/in/baltejgoud` · GitHub `https://github.com/baltejgoud` · Résumé `/resume.html` · Location Hyderabad, India (time zone `Asia/Kolkata`).
- Bio paragraph 1: "I'm a data analyst and AI engineer who makes complex data useful — through clear analysis, machine learning and software that solves real problems. I've worked on data analysis at Haritha Industries and machine-learning delivery at Tectoro Consulting."
- Bio paragraph 2: "As co-founder & CEO of Sanket, I connect product direction with demand forecasting and inventory intelligence. Outside of that, I keep building — from a 3D AI workspace to privacy-first health tools."
- What I do: 01 Data analysis & business reporting · 02 Forecasting & machine learning · 03 Agentic AI & MCP integrations · 04 Full-stack product engineering · 05 Dashboards & data visualisation · 06 Product strategy at Sanket.
- Quick facts: Location — Hyderabad, India · Education — B.Tech CSE, BVRIT Narsapur · CGPA — 6.1 / 10 · Graduation — 2023 · Focus — Data analysis · AI/ML · Status — ● Open to data & AI roles.
- Quote: *"Make complex data useful."* (adapted from the current hero copy).

### 6.2 Skills (`skills.ts`) — 32 elements, ordered by category

| # | Sym | Name | Cat | Icon slug | How I use it |
|---|---|---|---|---|---|
| 1 | Py | Python | languages | `python` | Sanket's forecasting services, Tandem's automation backend and the deepfake-detection models. |
| 2 | Sq | SQL | languages | — | Everyday querying, joins and aggregation for analysis; the relational schemas behind Sanket and AgriTrust. |
| 3 | Ts | TypeScript | languages | `typescript` | Axon's Electron + React desktop app, Sanket's dashboard and AgriTrust's Next.js / NestJS stack. |
| 4 | Js | JavaScript | languages | `javascript` | ExtraTicket's Node / Express API and the browser layer of everything web. |
| 5 | C | C | languages | `c` | Computer-science foundations from my B.Tech, and a topic I tutored. |
| 6 | Re | React | frontend | `react` | Interfaces for Sanket, Axon, VIGOR and ExtraTicket. |
| 7 | Nx | Next.js | frontend | `nextdotjs` | AgriTrust's web app — and this portfolio. |
| 8 | Th | Three.js | frontend | `threedotjs` | Axon's procedural 3D campus, with 208 monitor screens batched into one texture atlas. |
| 9 | El | Electron | frontend | `electron` | Axon's sandboxed desktop shell with an explicit preload API. |
| 10 | Tw | Tailwind CSS | frontend | `tailwindcss` | ExtraTicket's interface and this site's design tokens. |
| 11 | No | Node.js | backend | `nodedotjs` | VIGOR's API and cancellable import worker; ExtraTicket's server. |
| 12 | Fa | FastAPI | backend | `fastapi` | Sanket's API gateway and Tandem's automation service. |
| 13 | Ex | Express | backend | `express` | ExtraTicket's REST API. |
| 14 | Ns | NestJS | backend | `nestjs` | AgriTrust's provenance and verification backend. |
| 15 | Ap | REST APIs | backend | `openapiinitiative` | VIGOR's OpenAPI 3.1 contract and the service boundaries across my projects. |
| 16 | Pg | PostgreSQL | databases | `postgresql` | Sanket's multi-tenant store with Row-Level Security; ExtraTicket and AgriTrust data layers. |
| 17 | Sl | SQLite | databases | `sqlite` | VIGOR's local-first records and Tandem's append-only execution ledger. |
| 18 | Mg | MongoDB | databases | `mongodb` | Document-shaped data for prototypes. |
| 19 | Sb | Supabase | databases | `supabase` | ExtraTicket's hosted data and auth. |
| 20 | Fb | Firebase | databases | `firebase` | Realtime data and hosting for quick builds. |
| 21 | Gt | Git | tools | `git` | Version control across every project. |
| 22 | Dk | Docker | tools | `docker` | Containerised Sanket services. |
| 23 | Ku | Kubernetes | tools | `kubernetes` | Sanket's deployment target. |
| 24 | Pw | Playwright | tools | `playwright`* | Tandem's browser automation across simulated legacy banking interfaces. |
| 25 | Fg | Figma | tools | `figma` | Interface design and design systems before code. |
| 26 | Gc | Google Cloud | tools | `googlecloud` | Cloud infrastructure for deployments and data. |
| 27 | Da | Data Analysis | core | — | Cleaning, exploration and reporting at Haritha Industries; taught to 500+ students. |
| 28 | Dv | Data Visualisation | core | — | Dashboards that lead with decisions, like Sanket's forecasts with uncertainty bands. |
| 29 | Ml | Machine Learning | core | — | AI/ML delivery at Tectoro; Sanket's model routing across XGBoost, Prophet and ensembles. |
| 30 | Fc | Forecasting | core | — | Prophet, ensembles and zero-shot Amazon Chronos for cold-start SKUs. |
| 31 | Pt | PyTorch | core | `pytorch` | A ResNeXt + LSTM deepfake detector evaluated on FaceForensics++, DFDC and Celeb-DF. |
| 32 | Ag | Agentic AI | core | `modelcontextprotocol`* | Agent orchestration, function calling and 39 MCP connectors in Axon; consent-scoped agent access in VIGOR. |

\* Slugs marked with an asterisk, and any slug missing from the installed `simple-icons` version, fall back to the symbol glyph. A unit test asserts symbols are unique.

### 6.3 Projects (`projects.ts`) — six, in this order

1. **Sanket** — *Predictive intelligence · Co-founder & CEO.* Multi-tenant platform forecasting SKU-level demand across fashion, electronics, pharma and agro — built around the decisions a planning team has to make. Features: PostgreSQL 16 with Row-Level Security tenant isolation · ML routing across XGBoost, Prophet and ensembles · Zero-shot Amazon Chronos fallback for cold-start SKUs · Forecasts shown with uncertainty bands · Decision-first dashboard: replenish, hold, investigate · FastAPI gateway with a React + TypeScript dashboard. Stack: React, TypeScript, FastAPI, PostgreSQL, XGBoost, Chronos, Docker, Kubernetes. Links: case study `/work/sanket/`. Widget: `forecast`.
2. **Axon AI Studio** — *AI workspace · Desktop & 3D.* A local-first desktop workspace where 200+ specialist AI coworkers collaborate in a procedural 3D campus — with approval required for every file change. Features: 208 monitor screens batched into one texture atlas · Streaming adapters across AI providers · 39 MCP connectors · Diff approval for every proposed edit · 500-version undo · Sandboxed Electron renderer with an explicit preload API. Stack: TypeScript, Electron, React, Three.js, Zustand, MCP. Links: GitHub `https://github.com/baltejgoud/Axon-AI-Office-`, case study `/work/axon/`. Widget: `atlas`.
3. **VIGOR** — *Personal data · Health & nutrition.* Turns Apple Health exports and food diaries into goals, trends and answers — with consent-based, read-only access for AI assistants. Features: Cancellable XML / ZIP importer with review-before-save · 8,159-food USDA catalogue · Missing measurements stay unknown, never zero · Opt-in, read-only AI coach with visible record access · Scoped agent connectors with owner checks · OpenAPI 3.1 contract. Stack: React, Vite, Node.js, SQLite, MCP, OAuth. Links: case study `/work/vigor/`. Widget: `import`.
4. **ExtraTicket** — *Marketplace · Digital experience.* A peer-to-peer marketplace for spare event tickets across India, sold at or below face value. Features: Listings capped at face value · City and category discovery · Event cards with time, place and price in one scan · React interface with a Node / Express API · PostgreSQL data layer. Stack: React, Node.js, Express, PostgreSQL, Tailwind CSS (source: `resume.html`). Links: case study `/work/extraticket/`. Widget: `fairPrice`.
5. **AgriTrust** — *Supply-chain evidence · Backend & verification.* Helps farmers, labs, carriers and distributors prove where food came from and how it was handled. Features: Provenance ledger with cryptographically signed proofs · Automated custody-chain verification · Evidence anchoring · Batch provenance. Stack: TypeScript, Next.js, NestJS, PostgreSQL, Solidity. Links: GitHub `https://github.com/baltejgoud/AgriTrust`. Widget: `custody`.
6. **Tandem** — *Browser automation · Architecture.* A prototype for effect-aware browser automation across simulated legacy banking interfaces. Features: Append-only execution ledger · Entity prechecks before every action · Post-action reconciliation · Operator console for ambiguous outcomes. Stack: Python, FastAPI, Playwright, SQLite. Links: GitHub `https://github.com/baltejgoud/Tandem-`. Widget: `reconcile`.

Primary button: "View on GitHub ↗" when `links.github` exists, otherwise "Read case study ↗". A secondary text link shows the case study when both exist.

### 6.4 Certifications (`certifications.ts`)

`export const certifications: Certification[] = [];` — the section renders nothing (and drops out of the numbering) while the array is empty.

### 6.5 Journey (`journey.ts`) — chronological, top to bottom

1. **Education** · 2019 – 2023 · B.Tech, Computer Science & Engineering · B V Raju Institute of Technology, Narsapur · Bullets: Graduated in 2023 · CGPA 6.1 / 10 · Tags: CSE, B.Tech.
2. **Experience** · Lead Computer Science Tutor · B V Raju Institute of Technology · Bullets: Tutored 500+ students · Data cleaning, visualisation, statistical analysis and core computer-science topics · Tags: Teaching, Statistics, Data analysis.
3. **Experience** · AI/ML Engineer · Tectoro Consulting Private Limited · Bullets: Developed and deployed AI/ML solutions · Real-world machine-learning pipelines and intelligent application development · Tags: Machine learning, Python, Pipelines.
4. **Experience** · Data Analyst · Haritha Industries · Bullets: Data cleaning, exploratory analysis and visual reporting · Business insights from operational data · Tags: Data cleaning, EDA, Reporting.
5. **Experience** · Now · Co-founder & CEO · Sanket · Bullets: Building a predictive intelligence business that connects operational data, machine learning and product design · Demand forecasting and inventory intelligence across four verticals · Tags: Forecasting, Product, Leadership.
6. **Next** · Next? · "Your team?" · Open to data & AI roles · Links to `#contact`.

Watermark years: **2019** (beside milestone 1), **2023** (between 1 and 2), **Now** (beside 5), **Next?** (beside 6).

### 6.6 Achievements (`achievements.ts`) — eight cards

| # | Icon | Metric | Title | Description |
|---|---|---|---|---|
| 01 | Trophy | Top 2 | Code for Good Hackathon | Finished in the top two at Code for Good, 2024. |
| 02 | Award | 1st | Model United Nations | First place in a Model United Nations competition. |
| 03 | GraduationCap | 500+ | Students tutored | Lead computer-science tutor at BVRIT: data cleaning, visualisation and statistics. |
| 04 | Layers | 208→1 | Draw calls in Axon | Batched 208 monitor screens into a single texture atlas. (`wide`) |
| 05 | Bot | 200+ | AI coworkers | Specialist agents collaborating in Axon's procedural 3D campus. |
| 06 | Plug | 39 | MCP connectors | Built for Axon's agent tool access. |
| 07 | Apple | 8,159 | Foods catalogued | The USDA catalogue behind VIGOR's food diary. (`wide`) |
| 08 | LineChart | 4 | Industry verticals | Sanket forecasts fashion, electronics, pharma and agro demand. |

## 7. Section specifications

### 7.1 Navbar (`components/layout/Navbar.tsx`, client)

- Sticky, `height: 72px`. Left: 40×40 ink rounded-square monogram "BG" + "Baltej Goud". Right: About · Skills · Work · Experience · Achievements · Contact.
- Active link sits in an ink pill (white text) that slides between links with a shared `layoutId` spring. Active section from an `IntersectionObserver` with `rootMargin: "-45% 0px -50% 0px"`; hero = no active link.
- After 24px of scroll: cream glass background with `backdrop-blur` and a bottom hairline.
- Below 900px: links collapse into a "Menu" pill opening a full-screen cream sheet with large numbered links; focus is trapped, `Esc` closes, body scroll locks (Lenis stopped).
- Anchor clicks scroll with Lenis (`offset: -80`); without JS, native anchors plus `scroll-margin-top: 88px` work.

### 7.2 Hero (`components/hero/*`)

- Full viewport height (`min-height: 100svh`, minimum 640px).
- Watermark: "BALTEJ" as SVG `<text>` with `textLength` equal to the viewBox width and `lengthAdjust="spacingAndGlyphs"`, so it spans the full width at every size; Plus Jakarta Sans 800, uppercase, `--color-watermark`. Sits behind the portrait, vertically centred slightly above the middle.
- Centerpiece `HeroMedia`: the cutout (`public/images/portrait-cutout.webp`, transparent) anchored to the bottom edge, max height `82svh`. Props `{ image; video?: { src; poster } }`. With a video: muted, looping, `playsInline` autoplay (no autoplay under reduced motion — a play button instead) and a sound pill with `aria-pressed` and four animated equaliser bars. No video exists today, so only the image renders.
- Pointer parallax (fine pointers, motion allowed): watermark shifts up to ±12px opposite the pointer, portrait up to ±6px with it.
- Bottom-left: mono small-caps "PANAGATLA BALTEJ GOUD"; title "Data" (sans 800) over "Analyst." (serif italic), `clamp(3rem, 8vw, 7.5rem)`; tagline in stone.
- Bottom-right: magnetic ink pill "Explore work ↓" → `#work`.
- Entrance (CSS keyframes gated by `html.js`): watermark letters rise with a 40ms stagger, portrait fades and rises 24px, title lines reveal through a mask, CTA fades in. Total ≤ 1.2s.
- Mobile: watermark stays full width; portrait is centred at `62svh`; the text block stacks under it with the CTA full width.

### 7.3 About (`components/about/*`)

- Grid `lg:grid-cols-[1.05fr_0.9fr_1.05fr]`, collapsing to one column (left → lanyard → right) below 1024px.
- **Left:** index label, heading "Hi, I'm" + *Baltej.*, two bio paragraphs, pills: `Resume ↓` (solid ink, links to `/resume.html`), `GitHub ↗` and `LinkedIn ↗` (outlined, new tab, `rel="noopener noreferrer"`).
- **Center — lanyard:**
  - A strap hangs from an anchor at the top of the column; a metal clip joins it to the card.
  - Card (≈ 260×370, paper, 20px radius): header "DEVELOPER ID" and a punched slot; square photo (`public/images/id-photo.webp`, cropped from the portrait); "Panagatla Baltej Goud"; role tags Data Analyst · AI Engineer · Founder; barcode (SVG bars from `lib/barcode.ts`, seeded with "BALTEJGOUD"); ID number "BG-2023-HYD".
  - Physics (`lib/physics/rope.ts`, pure, no DOM): Verlet chain of 10 particles from a fixed anchor, gravity, damping `0.985`, 12 constraint iterations per frame, fixed 1/120 s substeps. The card hangs from the last particle; its rotation follows the last segment's angle through an angular spring, so it twists and settles.
  - Dragging: pointer down on the card captures the pointer and pins the last particle to the pointer position minus the grab offset; release keeps the Verlet velocity, so the card swings. Maximum stretch is clamped.
  - Rendering: the strap is a smooth SVG path through the particles with "BALTEJ GOUD · DATA ANALYST ·" repeated along it via `<textPath>`; the card is a DOM element positioned with `transform`.
  - Efficiency: the loop sleeps once kinetic energy stays below a threshold for 60 frames, wakes on interaction, and pauses off screen (`IntersectionObserver`).
  - Accessibility: the card is focusable (`role="button"`, label "Developer ID card. Press the arrow keys to swing it."); arrow keys apply an impulse. Under reduced motion there is no simulation — the card hangs straight and still.
  - Hint below, italic serif: *"Pull the ID card — it swings!"*
- **Right:** "What I do" numbered 01–06 list; "Quick Facts" two-column table with hairline rows and a pulsing green dot for Status; the italic quote with a hairline above.

### 7.4 Skills (`components/skills/*`)

- Header: index, "The periodic table" + *of my stack.*
- Filter pills above the grid: All · Languages · Frontend · Backend · Databases · Tools · Core, each with its category dot. Single select; clicking the active category returns to All. `aria-pressed`, and a polite live region announces "6 Frontend elements highlighted".
- Grid (`lg`+): 8 columns × 4 rows of square tiles beside a sticky preview card (`grid-cols-[1fr_340px]`). Tile: atomic number top-left (mono), symbol centre (sans 800, ~2.25rem), name bottom (small), category dot top-right.
- Filter state: matching tiles turn ink with white text; others drop to `opacity: .35`. Transition 250ms.
- Preview card: logo (from `simple-icons`, coloured with the brand hex; symbol fallback), full name, category tag with dot, "How I use it". Updates on hover **and** keyboard focus with a crossfade. Default: Python, with the prompt "Hover or tap any element".
- Tiles are `<button>`s; arrow keys move focus across the grid (roving tabindex).
- 768–1023px: 8 columns full width, preview below. Below 640px: 4 columns × 8 rows (even rows, ~80px tiles), filter pills scroll sideways, the preview card sits above the grid and updates on tap.

### 7.5 Selected work (`components/work/*`)

- Header: index, "Things I've" + *built.*
- **≥ 1280px — horizontal accordion:** a 640px-high flex row. The active panel grows (`flex-grow: 1`); the others are 76px spines (`flex: 0 0 76px`) showing their index and a vertically rotated title (`writing-mode: vertical-rl`). The `flex-grow` change animates over 600ms with an ease-out curve; the active panel's content fades in after 200ms. The cursor shows "Open" over spines.
- Expanded panel: left column — index, category metadata, title, summary, two-column feature list, stack badges, primary pill ("View on GitHub ↗" or "Read case study ↗") plus a case-study text link when both exist. Right column — the project widget in a paper card.
- **< 1280px — vertical accordion:** stacked cards; each header (index, title, category, chevron) toggles its panel; one open at a time; the widget sits below the content.
- Semantics: every header or spine is a `<button aria-expanded aria-controls>`; Left/Right (desktop) or Up/Down (mobile) move focus between them; Enter or Space opens.
- Widgets load with `next/dynamic` when their panel first opens.

### 7.6 Project widgets (`components/work/widgets/*`)

Each widget is a self-contained client component in a paper card about 340–380px high, with a mono caption, keyboard operation and reduced-motion support. Its logic lives in a pure, tested function in `lib/widgets/`.

| Widget | Behaviour |
|---|---|
| `ForecastWidget` (Sanket) | Vertical tabs Fashion / Electronics / Pharma / Agro. A seeded synthetic series: 26 weeks of history, then an 8-week forecast with an uncertainty band. Scrub with the pointer or a visually hidden range input. A chip shows the decision for the scrubbed week: **Replenish** if the upper band exceeds stock on hand, **Investigate** if the band is wider than 40% of the mean, otherwise **Hold**. Caption: "Illustrative data". |
| `AtlasWidget` (Axon) | A 16×13 grid of 208 flickering "monitor" tiles. "Batch into atlas" animates them into a single tile while a counter runs 208 → 1 draw calls; "Unbatch" reverses it. |
| `ImportWidget` (VIGOR) | A simulated `export.zip`. Steps Parse → Review → Save with a progress bar and a working **Cancel** ("Import cancelled — nothing saved"). Review shows illustrative counts and a Save button. Afterwards, a 14-day timeline: filled dots for recorded days, hollow dots labelled "unknown" for missing ones — never zero. |
| `FairPriceWidget` (ExtraTicket) | Face value ₹2,500 (illustrative). A slider for the asking price (₹1,000–₹4,000, step ₹50). At or below face value the listing shows **Listed** and the saving; above it shows **Blocked — listings are capped at face value**. |
| `CustodyWidget` (AgriTrust) | Farm → Lab → Carrier → Distributor. Each step's hash is SHA-256(payload + previous hash) via `crypto.subtle`, shown as 8 hex characters, compared with the signed hashes recorded at creation. "Tamper" on a step changes its payload (e.g. 4 °C → 9 °C); verification marks that step and every later one as broken. "Reset" restores the chain. Falls back to a labelled non-cryptographic hash if `crypto.subtle` is unavailable. |
| `ReconcileWidget` (Tandem) | Two runs of the same transfer. **Naive retry**: submit → timeout → retry → "2 transfers — duplicate". **Tandem**: precheck → submit → timeout (ambiguous) → reconcile against the ledger and the UI → "Executed once — retry skipped". Steps appear as mono log lines. |

### 7.7 Certifications (`components/certs/Certifications.tsx`)

Rendered only when the array is non-empty. Two columns: left sticky (`top: 112px`) with index, "Always" + *learning.* and the count ("03 certifications"); right, a table of rows — number, title, issuer (and year), `↗`. Hover or focus inverts the row to ink with white text over 250ms. Rows with `href` are links that open in a new tab.

### 7.8 Journey (`components/journey/*`)

- Header: index, "Education &" + *experience.*
- A dashed S-curve SVG path runs down the centre. Its `d` is generated from the measured section height (`ResizeObserver`) as cubic segments that swing between 42% and 58% of the width once per milestone. The stroke is dashed and has `vector-effect: non-scaling-stroke`.
- Scroll progress (`useScroll` with `offset: ["start center", "end center"]`) drives an ink dot along the path via `getPointAtLength`, and a solid ink stroke draws over the dashed one up to the dot.
- Giant watermark years sit behind the path at their milestones.
- Milestone cards alternate left and right on desktop and fade and rise in when they enter the viewport. Each card shows a mono kind label (EDUCATION / EXPERIENCE), dates if present, role, organisation, bullets and tags. The "Next?" card is a dashed outline linking to `#contact`.
- Below 1024px the path moves to the left (x = 20px) with a small amplitude, and cards sit to its right.
- Reduced motion: the dot sits at the end and the full path is drawn.

### 7.9 Achievements (`components/achievements/*`)

- Header: index, "Proud" + *moments.*
- A horizontally scrolling row with `scroll-snap-type: x mandatory`. Cards are 340×300; `wide` cards are 520px. Each card shows the lucide icon in an ink badge top-left, the mono index top-right, title and description bottom-left, and the metric bottom-right (`clamp(3rem, 6vw, 5rem)`, sans 800).
- Drag to scroll with a mouse (pointer capture, momentum from release velocity), shift-wheel and trackpad scrolling, prev/next round buttons (scroll by one card), and a progress bar under the row. The cursor shows "Drag" over the row.
- The row is a focusable region labelled "Achievements"; arrow keys scroll it.

### 7.10 Contact and footer (`components/contact/Contact.tsx`)

- Big heading "Let's build something" + *useful.*, a line inviting data and AI roles or collaborations, the email as a large link with a "Copy" pill (clipboard + toast "Email copied"), and pills for LinkedIn, GitHub and Résumé.
- Live Hyderabad time (`Intl.DateTimeFormat`, `Asia/Kolkata`, updated every minute).
- Footer: © 2026 Baltej Goud · "Designed & built with Next.js" · "Back to top ↑".

## 8. Motion system

| Layer | Implementation |
|---|---|
| Smooth scroll | `SmoothScroll` client provider creates one Lenis instance (`lerp 0.1`); it is not created under reduced motion. Exposes `scrollTo` through context for nav links and CTAs. |
| Scroll reveals | `useReveal` hook (one shared `IntersectionObserver`) adds `.is-in` to `[data-reveal]` elements; CSS handles fade-up and masked heading lines. Hidden states apply only under `html.js`. |
| No-JS safety | An inline head script (same pattern as today's motion gate) adds `js`, skips motion when reduced motion is set, and adds `reveal-all` after 3s unless the app has marked itself ready. Content is never permanently hidden. |
| Interactive motion | `motion` for the nav pill, accordion content, preview crossfade, widgets, toast and mobile menu. |
| Magnetic buttons | `Pill` with `magnetic` prop: translates toward the pointer up to 8px with a spring, resets on leave. Fine pointers only. |
| Cursor | A follower ring with a label (Drag / Open) and a grow state over links. The native cursor stays visible. Not rendered on coarse pointers or under reduced motion. |
| Reduced motion | No Lenis, no parallax, no entrance, no physics, no magnetism, instant transitions. Every feature still works. |

## 9. Architecture and file layout

```
next.config.ts          output: "export", images.unoptimized, trailingSlash: false
src/app/layout.tsx      fonts, metadata, JSON-LD, head gate script, providers
src/app/page.tsx        composes the sections in order (server component)
src/app/globals.css     Tailwind import, @theme tokens, base, reveal and keyframe CSS
src/content/            types.ts, profile.ts, skills.ts, projects.ts, certifications.ts, journey.ts, achievements.ts
src/lib/                sections.ts, barcode.ts, skills.ts, physics/rope.ts, widgets/{forecast,custody,reconcile,fairPrice,importer}.ts
src/hooks/              useActiveSection.ts, useReveal.ts, usePointerFine.ts
src/components/
  layout/               Navbar, MobileMenu, SmoothScroll, Cursor, Footer
  ui/                   Pill, SectionHeading, IndexLabel, Toast
  hero/                 Hero, HeroMedia, Watermark
  about/                About, Lanyard, IdCard, QuickFacts
  skills/               Skills, PeriodicTable, SkillTile, SkillPreview, SkillIcon
  work/                 Work, ProjectAccordion, ProjectPanel, widgets/*
  certs/                Certifications
  journey/              Journey, JourneyPath, MilestoneCard
  achievements/         Achievements, AchievementCard
  contact/              Contact
public/images/          portrait-cutout.webp, id-photo.webp
public/                 legacy files (section 10)
```

Rules: sections are server components; interactivity lives in small client islands. No component file over ~250 lines; logic that can be pure is pure and lives in `lib/`. Content reaches components only through `src/content/`.

## 10. Legacy migration

- Every file currently served from the repo root **except `index.html`** moves into `public/` unchanged: `resume.html`, `work/`, `assets/`, the root CSS files (`style.css`, `work.css`, `motion.css`, `bevel.css`, `home-profile.css`, `resume-screen.css`), `script.js` and the root images. Every existing URL keeps working; the old homepage is retired (it remains in git history).
- `scripts/build-work.cjs` reads `public/work/projects.json`, writes into `public/work/`, and drops the step that rewrote the homepage's `SELECTED_WORK` block.
- `scripts/check-site.cjs` validates the static export in `out/` — the new homepage plus the legacy pages — for broken local links, assets and anchors.
- `scripts/vendor.cjs` writes into `public/assets/vendor/`.
- `npm run dev` becomes `next dev`. Legacy pages are verified against `out/` with a static server, because `next dev` does not serve directory `index.html` files from `public/`.
- `DESIGN.md` is rewritten for this design system; `README.md` documents the new commands and the content files.

## 11. Build and deployment

- Scripts: `dev` (next dev), `build` (next build → `out/`), `start` (static server on `out/`), `test` (vitest run), `lint`, `check`, `build:work`, `vendor`, `cutout` (documented one-off).
- `.github/workflows/deploy.yml`: on push to `main` → checkout → setup Node 24 with npm cache → `npm ci` → `npm test` → `npm run build` → `npm run check` → upload `out/` as the Pages artifact → deploy with `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`.
- **Before the first push to `main`, Baltej switches Settings → Pages → Source to "GitHub Actions".** Otherwise the branch deploy serves a root without `index.html`. Nothing is pushed without his go-ahead.
- Metadata: title "Baltej Goud — Data Analyst & AI Engineer", description, canonical, Open Graph and Twitter cards using the existing `/assets/social-cover.jpg`, JSON-LD `Person`, favicon `/assets/favicon.svg`.

## 12. Assets

- **Cutout:** `rembg` with a human-segmentation model on `assets/portrait.webp` (720×1432) → trim → lossless-alpha WebP at `public/images/portrait-cutout.webp`. If `rembg` cannot install on Python 3.14, run it with `uv` on Python 3.12, or use `@imgly/background-removal-node`. The edges are inspected by eye; if the hair or hands look poor, fall back to the framed-portrait treatment and tell Baltej.
- **ID photo:** a square head-and-shoulders crop of the same portrait, 320×320 WebP.
- **Logos:** individual icon imports from `simple-icons` (tree-shaken; no CDN).
- **Icons:** `lucide-react` for UI and achievement badges.

## 13. Testing and verification

**Unit tests (Vitest, `src/**/*.test.ts`):**

- `sections`: numbering with certifications empty (About 01 … Achievements 05) and non-empty (… Achievements 06).
- `physics/rope`: segment lengths stay within 2% after settling; the chain comes to rest from a displaced start; positions stay finite and bounded across 10,000 steps with random pins and releases; an impulse produces motion.
- `barcode`: deterministic for a seed; bar widths within the allowed range; fills the requested width.
- `skills`: unique symbols and ids; every category non-empty; the filter returns exactly the category's ids.
- Content validation: each project has 4–6 features, a widget and at least one link; each journey milestone has a role and an organisation; each achievement has a metric.
- Widget logic: forecast series are deterministic and the decision rule matches its thresholds; custody verification flags the tampered step and every later one; reconcile yields one transfer with Tandem and two with naive retry; fair-price status flips exactly at face value.

**Build:** `npm run lint`, `npm test`, `npm run build` and `npm run check` all pass.

**Browser (built-in browser pane), at 1440×900 and 375×812:**

- No console errors on load or during interaction.
- The nav pill follows the section in view; anchor links land below the sticky nav.
- Hero: watermark spans the full width; the cutout sits on cream with clean edges.
- Lanyard: a simulated drag moves the card and it swings back; arrow keys nudge it.
- Skills: a filter highlights the right tiles; hover and focus update the preview; 4 columns on mobile.
- Work: clicking a spine opens it and collapses the others; every widget works; vertical accordion on mobile.
- Journey: the dot moves along the path while scrolling.
- Achievements: buttons, drag and progress bar work.
- Contact: copy shows the toast.
- No horizontal page scroll at 375px.
- The legacy pages served from `out/` load with their styles, and their links back to `index.html#about`, `#experience` and `#contact` land on the right sections.

## 14. Risks

| Risk | Mitigation |
|---|---|
| `rembg` / `onnxruntime` wheels missing for Python 3.14 | `uv` with Python 3.12, or `@imgly/background-removal-node`. |
| Brand logos removed from `simple-icons` | Symbol-glyph fallback; checked against the installed version. |
| Next 16 / latest TypeScript / ESLint compatibility | Scaffold with `create-next-app` defaults and keep its pinned versions. |
| Cutout edge quality | Inspect by eye; fall back to the framed portrait and say so. |
| Pages source not switched before the push | Deployment checklist in the README; push only on Baltej's go-ahead. |
| Physics jank on low-end phones | Fixed substeps, sleep at rest, pause off screen; static card under reduced motion. |
