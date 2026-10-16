# Baltej Goud — Portfolio

Editorial portfolio for Baltej Goud: data analyst, AI engineer and co-founder & CEO of Sanket. Built with Next.js (static export), Tailwind CSS v4, Motion and Lenis, and deployed to GitHub Pages by GitHub Actions.

## Develop

```bash
npm install
npm run dev
```

`npm run dev` serves the homepage at http://localhost:3000. The résumé and case studies in `public/` are served correctly only from the static export:

```bash
npm run build
npm start
```

That serves `out/` at http://localhost:8000.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Static export to `out/` |
| `npm start` | Serve `out/` on port 8000 |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run check` | Check `out/` for broken local links, anchors, duplicate IDs and h1s |
| `npm run build:work` | Regenerate `public/work/` from `public/work/projects.json` |
| `npm run vendor` | Copy GSAP and Lenis into `public/assets/vendor/` for the legacy pages |
| `npm run images -- <cutout.png>` | Rebuild the hero cutout and the ID-card photo |

## Edit content

| File | Content |
| --- | --- |
| `src/content/profile.ts` | Name, title, bio, quick facts, ID card, contact copy, hero image or video |
| `src/content/skills.ts` | The 32 periodic-table elements |
| `src/content/projects.ts` | Selected work and which widget each project shows |
| `src/content/certifications.ts` | Certifications; section 04 is hidden while this is empty |
| `src/content/journey.ts` | Education and experience timeline |
| `src/content/achievements.ts` | Achievement cards |

`DESIGN.md` documents the design system, interactions and motion rules.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: lint, test, build, check, then deploy `out/` to GitHub Pages.

One-time setup: in GitHub, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. Do this before the first push of this version to `main`. The previous branch deploy serves the repository root, which no longer has an `index.html`.
