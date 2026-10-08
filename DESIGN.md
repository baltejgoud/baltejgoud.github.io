# Signal — Baltej Goud

October 2026 redesign. Founder and working professional, presented with equal clarity.

## Direction

An editorial portfolio with architectural imagery, generous space, oversized typography and strong shifts between charcoal, warm ivory and orange. The hero reads “Intelligence, put to work.” Sanket is the flagship business; real product captures and detailed case studies demonstrate the founder’s practical range.

Reference research: [Dennis Snellenberg](https://dennissnellenberg.com/work) for project curation, [Brittany Chiang](https://brittanychiang.com/) for professional clarity, and [Bruno Simon](https://bruno-simon.com/html/) for personal creative identity. No reference code or artwork was copied.

UI/UX Pro Max informed the spacious, asymmetric portfolio grid. Custom palette and typography refine its editorial recommendation: Manrope for display, DM Sans for body, Instrument Serif for expressive emphasis. Charcoal `#141414`, ivory `#f1f0e9`, orange `#ff693f`. Hairline structure, subtle hover feedback, native scrolling.

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
- Brief page-introduction entrances and project hover feedback; reduced motion disables animation and transforms. Native page navigation remains dependable across browsers.
- Clipboard action has success and fallback feedback; email links work independently.
- No loading overlay, custom cursor or hidden-on-load content. Motion preferences disable hover transitions and smooth scroll.
- Static HTML/CSS/JS, no new runtime dependency. Optimized WebP hero and portrait.

## Generated artwork

Built-in image-generation tool. Final source: `assets/signal-sculpture.png`; optimized website asset: `assets/signal-sculpture.webp`.

Prompt: “Use case: stylized-concept. Asset type: abstract editorial hero artwork for a premium founder and software engineer portfolio. Subject: an extraordinary sculptural signal form, an open circular loop made of many very fine parallel brushed chrome ribs, slightly twisted like a toroidal helix, with one vivid electric vermilion-orange segment interrupting the silver loop. Visually like a luxurious engineered physical object, intricate silver fin detailing, strong dimensionality. Composition: square 1536x1536 frame, single central large sculptural object filling 85% of the frame, three-quarter view diagonally inclined, black empty centre, completely uncluttered. Backdrop: flat near-black charcoal #141414 that blends seamlessly into a dark website, no horizon, no floor. Lighting: dramatic hard studio side light with realistic silver highlights and subtle orange bounce, premium cinema 4d octane render. Colors only silver, graphite and orange #ff6038. No text, no logo, no watermark, no extra objects, no stars, no UI, no background gradients. Render very high detail, sophisticated architectural sculpture.”

Pre-redesign working files were copied to `C:/Users/admin/.codex/backups/baltej-portfolio-before-redesign-20261008` before implementation.

## Verification

Initial redesign: browser checks passed at 320–1920 pixels, including the original illustrative chart, disclosures, clipboard, navigation, résumé and print output. The desktop homepage had no automated axe WCAG A/AA findings.

Work-led refinement: the homepage, work gallery and all four case-study pages were checked at 320, 390, 768, 1024 and 1440 pixels without horizontal page overflow. Verified AI/digital filters and result announcements, grid/list switching, case-study navigation, mobile menu dismissal and Escape focus restoration. `npm run check` validates all seven authored pages for local references, unique IDs and one h1. Case studies and project navigation remain static HTML; JavaScript only enhances the controls. The initial axe result is historical and does not certify the new pages.
