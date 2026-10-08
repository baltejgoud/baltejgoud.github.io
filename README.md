# Baltej Goud — Signal

Personal portfolio for the founder and CEO of Sanket, with professional experience in data, AI/ML and product design.

## Preview

Run `npm run dev`, then open `http://localhost:8000`.

Alternatively, run `python -m http.server 8000 --bind 127.0.0.1`.

The site is static HTML, CSS and JavaScript and runs directly on GitHub Pages. No build step is required.

Run `npm run check` to validate local page links, assets, anchors and document IDs.

## Edit

- `index.html`: founder introduction, selected projects, experience and contact.
- `work/index.html`: separate project gallery with filters and grid/list views.
- `work/<project>/index.html`: static case studies for Sanket, Axon, VIGOR and ExtraTicket.
- `work/projects.json`: the case-study content and project metadata.
- `scripts/build-work.cjs`: generates the work pages and homepage cards. Run `npm run build:work` after editing project content.
- `style.css`: responsive layout, typography, colors and interaction states.
- `work.css`: actual project captures, gallery layouts, editorial case studies and motion preferences.
- `script.js`: navigation, project filters, gallery layout, local clock and clipboard.
- `resume.html`: professional profile with Print / Save as PDF.
- `assets/`: optimized artwork, portrait, favicon and social preview.
- `DESIGN.md`: visual direction, source references, generated artwork prompt and verification.

Project pages use actual development captures. Sanket uses sandbox records; VIGOR uses synthetic test fixtures; ExtraTicket shows sample listings. See `assets/work/README.md` for provenance. The hero sculpture is generated editorial artwork.

The previous working files are backed up at `C:/Users/admin/.codex/backups/baltej-portfolio-before-redesign-20261008`.

The first redesigned version is also backed up at `C:/Users/admin/.codex/backups/baltej-portfolio-before-case-studies-20261008`.
