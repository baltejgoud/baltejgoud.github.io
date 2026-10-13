# Signal — Baltej Goud

## Latest refinements — AI engineering and data analysis

The primary identity is now AI Engineer / Data Analyst in the hero, site header, metadata and résumé. Sanket remains Co-founder & CEO. The homepage preserves its soft-blue theme, with a split introduction and authentic portrait on desktop and a stacked mobile layout. The portrait is preloaded instead of the removed hero project rail.

Sanket’s introduction is retained. The large product image is replaced by a three-step planning workflow: read the signals, see expected demand with uncertainty, and connect it to inventory decisions. Its chart is a code-native illustration without invented numerical results. Styles live in `home-profile.css`.

Generated-image captions have been removed from cards, covers, quick views and archive entries as requested. Source provenance remains in `assets/work/README.md`; original development captures remain accessible in the case studies. The generator preserves those choices on rebuild.

Validation: seven pages at 320, 390, 768 and 1440 pixels showed no horizontal overflow, broken loaded images, old Product Builder identity or generated-concept labels. VIGOR quick view was checked on mobile with no empty caption element. Static page/link checks and JavaScript syntax checks pass.

## Earlier direction — October 13, 2026

The portfolio now takes visual inspiration from [Bevel](https://www.bevel.health/): a spacious centered introduction, soft blue atmosphere, restrained dark pill buttons, rounded product presentations, pale section backgrounds and a consistent sans-serif hierarchy. No Bevel code, images or copy were reused. The static HTML/CSS/JS architecture and existing accessible interactions remain.

`bevel.css` is the final theme layer after the base, work and motion styles. Homepage hero art now introduces the actual project subjects through a three-card product rail. Eight distinct images generated with built-in ImageGen illustrate Sanket, Axon, VIGOR, ExtraTicket, AgriTrust, Tandem, Deepfake Detection and Let’s Get Cooking. Each is visibly labeled as concept artwork. Original development captures and factual project descriptions remain in the case studies. See `assets/work/README.md` for assets, provenance and generation prompt directions.

`work/projects.json` keeps original captures in `image` / `secondary` and concept presentation assets in `cover`. `scripts/build-work.cjs` generates the gallery, all four case studies, homepage cards and quick-view data from that source. Rebuilding preserves the theme and concept labels.

Validation: `npm run check` passes on seven pages and 232 local references. Browser checks on homepage, gallery and four case studies at 320, 768 and 1440 pixels found no horizontal overflow or broken loaded images. The 390-pixel mobile homepage, navigation, archive disclosure, category filters, grid/list switching, quick view and original-capture disclosure were verified. Existing default-motion rendering was visually checked; reduced-motion/static access is preserved.

## Professional and founder positioning

The hero now leads with AI engineering and product building, with Co-founder & CEO of Sanket in the introduction. The résumé is the primary hero action; two audience cards connect hiring teams to the professional profile and collaborators to Sanket. Project cards expose contribution and key technologies, plus direct case-study links independent of quick view. Contact copy covers engineering roles and collaborations consistently in both the page and dialog.

The freelance UI/UX experience entry is removed from the homepage and résumé. Design remains a product capability. The résumé uses a matching light screen theme while retaining its dedicated print styles; professional-profile text stays visible immediately. Titles, metadata, structured data and generated project content carry the updated Sanket role.

Validation after this pass: seven pages checked at 320, 768 and 1440 pixels without horizontal overflow or broken loaded images. Verified experience roles, missing hero caption, category filters, direct case-study navigation and the résumé print control. The static link checker passes.

## Historical direction — October 2026

October 2026 redesign. Founder and working professional, presented with equal clarity.

## Direction

An editorial portfolio with architectural imagery, generous space, oversized typography and strong shifts between charcoal, warm ivory and orange. The hero reads “Intelligence, put to work.” Sanket is the flagship business; real product captures and detailed case studies demonstrate the founder’s practical range.

Reference research: [Dennis Snellenberg](https://dennissnellenberg.com/work) for project curation, [Brittany Chiang](https://brittanychiang.com/) for professional clarity, and [Bruno Simon](https://bruno-simon.com/html/) for personal creative identity. No reference code or artwork was copied.

UI/UX Pro Max informed the spacious, asymmetric portfolio grid. Custom palette and typography refine its editorial recommendation: Manrope for display, DM Sans for body, Instrument Serif for expressive emphasis. Charcoal `#141414`, ivory `#f1f0e9`, orange `#ff693f`. Hairline structure.

On 2026-10-08 the original restraint (subtle hover feedback, native scrolling, no loader) was reversed at Baltej's request: the site read as static next to contemporary portfolios. It now carries a premium editorial motion layer modelled on the feel of [Dennis Snellenberg](https://dennissnellenberg.com/) — see Motion below and `docs/superpowers/specs/2026-10-08-motion-system-design.md`.

## Content

Home: Hero → Sanket product → selected work and archive → capabilities → professional experience → personal story → contact. Separate work gallery and four dedicated project pages let visitors move from a visual preview to the build decisions.

The second pass replaces project concepts with actual development captures. Sanket captures use sandbox data; VIGOR captures use explicitly synthetic health fixtures and a test account; ExtraTicket shows sample event listings. Axon captures are also present in its public repository. See `assets/work/README.md` for provenance. No invented clients, launch dates or business outcomes.

Content was checked against project source: Axon currently uses versioned local JSON persistence, AgriTrust is a Next.js/NestJS/TypeScript system, and Tandem is an effect-aware browser automation prototype. These descriptions and the Tandem repository URL were corrected in the portfolio and résumé.

## Behavior and accessibility

- Native anchors, semantic sections, one h1, visible keyboard focus and a skip link.
- Mobile menu has explicit state, Escape dismissal and breakpoint reset.
- Project filters use pressed buttons and announce the visible count.
- Native archive and capability disclosures. Dedicated static case studies work without JavaScript.
- Gallery has pressed-state filters, live result counts and grid/list selection.
- Project captures have visible story links, hover/focus feedback and full-image links on project pages.
- Clipboard action has success and fallback feedback; email links work independently.
- Static HTML/CSS/JS on GitHub Pages; the only runtime libraries are the vendored GSAP and Lenis builds. Optimized WebP hero and portrait.

## Motion

Code: `motion.css` and one ES module per behaviour in `assets/js/motion/` (entry `index.js`). Libraries: GSAP 3.15.0 (core, ScrollTrigger, SplitText; GSAP Standard "no charge" License) and Lenis 1.3.26 (MIT), copied into `assets/vendor/` by `npm run vendor`.

- **Gate.** An inline head script adds `js`, then `motion` unless the visitor prefers reduced motion or the URL has `?nomotion`. Hidden initial states exist only under `.motion` inside `@media screen`. If `motion-ready` is not set within 3s, or any motion module throws, the page falls back to static: classes removed, scroll triggers killed, inline animation styles cleared, scrolling unlocked.
- **First visit.** A "Hello" loader (English, Telugu, Hindi and five more) runs once per browser session on the homepage, about 2s, and is skipped by any click, key or wheel and on deep links (`/#contact`). The hero headline then rises line by line and the sculpture scales in.
- **Scrolling.** Lenis smooth scroll on mouse and trackpad (touch keeps native scrolling); auto-hiding header that returns on scroll up or keyboard focus; a 2px orange progress line; the skills strip is a marquee whose speed and direction follow scroll velocity.
- **Reveals** (`data-reveal`): headings rise line by line behind masks (split only after fonts load, restored afterwards so screen readers read one sentence); copy fades up; images unmask from the bottom; hairlines draw from the left. `data-parallax` on the portrait only, plus a slow drift and rotation of the hero sculpture; real product screenshots are never cropped or shifted. `data-count` counts the 500+ up once. The Sanket dashboard grows from 90% to full size as it scrolls in.
- **Pointer** (mouse and trackpad only): magnetic buttons, fills that grow from the side the pointer entered, ↗ arrows that slide out and back, underline sweeps, a gentle tilt on the hero sculpture.
- **Quick view.** Project cards open a dialog built from the `#project-data` island the generator writes from `work/projects.json`. The card image flies into the dialog (a fixed-position copy, so the scrolling body never clips it); previous/next and ←/→ cycle the visible cards; Escape, Close or the backdrop return the image to its card and focus to the link. Modifier clicks still open the case study. Phones get a full-screen sheet. An orange "Quick view" bubble follows the pointer over card images.
- **Hover previews.** Archive and experience rows show a floating card that trails the pointer: the real image where one exists (Deepfake Detection, Let's Get Cooking), otherwise a typographic card made from the row's own text. Decorative and `aria-hidden`.
- **"Let's talk" panel.** The header button (and mobile-menu link) slides in an orange contact panel with email, copy, LinkedIn, GitHub, résumé and Hyderabad time. Without JavaScript the links still go to `#contact`.
- **Toast.** Copying the email shows a pill with an animated check; it is the `role="status"` announcement whenever the motion layer is loaded.
- **Page transitions.** Cross-document View Transitions (Chromium, Safari 18.2+): the new page wipes up while the old one lifts and fades. Firefox navigates normally.
- **Accordions** open and close smoothly with `interpolate-size` where supported.
- **Reduced motion and `?nomotion`:** no loader, smooth scroll, reveals, pointer effects or page transitions; dialogs and the toast still work, instantly. **Print:** every reveal state is forced visible and overlays are hidden.

## Generated artwork

Built-in image-generation tool. Final source: `assets/signal-sculpture.png`; optimized website asset: `assets/signal-sculpture.webp`.

Prompt: “Use case: stylized-concept. Asset type: abstract editorial hero artwork for a premium founder and software engineer portfolio. Subject: an extraordinary sculptural signal form, an open circular loop made of many very fine parallel brushed chrome ribs, slightly twisted like a toroidal helix, with one vivid electric vermilion-orange segment interrupting the silver loop. Visually like a luxurious engineered physical object, intricate silver fin detailing, strong dimensionality. Composition: square 1536x1536 frame, single central large sculptural object filling 85% of the frame, three-quarter view diagonally inclined, black empty centre, completely uncluttered. Backdrop: flat near-black charcoal #141414 that blends seamlessly into a dark website, no horizon, no floor. Lighting: dramatic hard studio side light with realistic silver highlights and subtle orange bounce, premium cinema 4d octane render. Colors only silver, graphite and orange #ff6038. No text, no logo, no watermark, no extra objects, no stars, no UI, no background gradients. Render very high detail, sophisticated architectural sculpture.”

Pre-redesign working files were copied to `C:/Users/admin/.codex/backups/baltej-portfolio-before-redesign-20261008` before implementation.

## Verification

Initial redesign: browser checks passed at 320–1920 pixels, including the original illustrative chart, disclosures, clipboard, navigation, résumé and print output. The desktop homepage had no automated axe WCAG A/AA findings.

Work-led refinement: the homepage, work gallery and all four case-study pages were checked at 320, 390, 768, 1024 and 1440 pixels without horizontal page overflow. Verified AI/digital filters and result announcements, grid/list switching, case-study navigation, mobile menu dismissal and Escape focus restoration. `npm run check` validates all seven authored pages for local references, unique IDs and one h1. Case studies and project navigation remain static HTML; JavaScript only enhances the controls. The initial axe result is historical and does not certify the new pages.
