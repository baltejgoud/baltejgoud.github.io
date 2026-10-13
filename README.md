# Baltej Goud — Signal

Personal portfolio for Baltej Goud: AI engineer and data analyst and Co-founder & CEO of Sanket. Serves AI engineering and data analyst job applications alongside founder collaborations.

## Preview

Run `npm run dev`, then open `http://localhost:8000`.

Alternatively, run `python -m http.server 8000 --bind 127.0.0.1`.

The site is static HTML, CSS and JavaScript and runs directly on GitHub Pages. No build step is required.

Run `npm run check` to validate local page links, assets, anchors and document IDs.

## Edit

- `index.html`: professional introduction, hiring and collaboration paths, selected projects, experience and contact.
- `work/index.html`: separate project gallery with filters and grid/list views.
- `work/<project>/index.html`: static case studies for Sanket, Axon, VIGOR and ExtraTicket.
- `work/projects.json`: the case-study content and project metadata.
- `scripts/build-work.cjs`: generates the work pages and homepage cards. Run `npm run build:work` after editing project content.
- `style.css`: base responsive layout, typography, colors and interaction states.
- `bevel.css`: light portfolio theme, audience paths and project-card details.
- `home-profile.css`: portrait-led AI Engineer / Data Analyst hero and the Sanket planning workflow.
- `resume-screen.css`: matching screen appearance for the printable professional profile.
- `work.css`: actual project captures, gallery layouts, editorial case studies and motion preferences.
- `script.js`: navigation, project filters, gallery layout, local clock and clipboard.
- `motion.css`: every motion-only style (loader, reveals, marquee, dialogs, cursor effects, page transitions).
- `assets/js/motion/`: the motion layer, one module per behaviour; `index.js` is the entry point. Add `?nomotion` to any URL to see the static version.
- `assets/vendor/`: committed GSAP and Lenis builds. After changing their versions in `package.json`, run `npm install` then `npm run vendor`.
- `resume.html`: professional profile with Print / Save as PDF.
- `assets/`: optimized artwork, portrait, favicon and social preview.
- `DESIGN.md`: visual direction, source references, generated artwork prompt and verification.

Project covers use product illustrations; the asset provenance is recorded in `assets/work/README.md`. Actual development captures remain accessible within the case studies. Sanket uses sandbox records; VIGOR uses synthetic test fixtures; ExtraTicket shows sample listings. See `assets/work/README.md` for imagery and provenance.

The previous working files are backed up at `C:/Users/admin/.codex/backups/baltej-portfolio-before-redesign-20261008`.

The first redesigned version is also backed up at `C:/Users/admin/.codex/backups/baltej-portfolio-before-case-studies-20261008`.
