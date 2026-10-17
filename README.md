# Baltej Goud — Portfolio

Illustrated, interactive portfolio for Baltej Goud: data analyst, AI engineer and co-founder & CEO of Sanket. Features a painted valley you fly into, live project models, a Spa career circuit, a forecast-chart process, a periodic-table toolkit, a personal corkboard and a note composer. Built with Next.js (static export), Tailwind CSS v4, Motion and Lenis, and deployed to GitHub Pages by GitHub Actions.

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
| `src/content/profile.ts` | Name, email and links |
| `src/content/hero.ts` | Hero layers, the standing portrait and the place pins |
| `src/content/projects.ts` | Selected work, features, technology and project links |
| `src/content/workMedia.ts` | Card covers and screenshots for each project |
| `src/content/skills.ts` | The 32 toolkit elements and where each is used |
| `src/content/journey.ts` | Education and experience timeline |
| `src/content/journey-stories.ts` | Journey narratives, companies, logos and galleries |
| `src/content/journey-route.json` | Spa circuit geometry and career checkpoint positions |
| `src/content/life.ts` | Personal photos pinned to the board |
| `src/content/notes.ts` | Notes people sent that you chose to show |

After changing hero art, run `node scripts/lqip.cjs` to refresh the blurred placeholders.
`DESIGN.md` documents the design and motion rules; `docs/signal-valley-art.md` has the prompts for
the remaining artwork and where each file goes.

Each homepage section is one component and one stylesheet in `src/components/portfolio/sections/`,
sharing `base.css` and the motion primitives in `src/components/portfolio/motion/`. Notes are
composed on the page and sent from the visitor's own mail app; nothing is stored. Music uses
Spotify's embedded Anirudh artist player.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: lint, test, build, check, then deploy `out/` to GitHub Pages.

One-time setup: in GitHub, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. Do this before the first push of this version to `main`. The previous branch deploy serves the repository root, which no longer has an `index.html`.

The journey is a full-viewport 3D drive around Spa-Francorchamps at true scale, implemented in `src/components/portfolio/CareerJourney.tsx`, `career-journey.css`, `trackside/` and `src/lib/trackside.ts`. The car starts on pole, the five start lights go out as you scroll, and a broadcast-style camera follows it round the lap past grandstands, the pit building and trackside screens; floating career panels appear at checkpoints. Reduced motion uses manual chapter selection. The plan is in `docs/spa-journey-plan.md`; geometry, modelling and reproduction details are in `docs/journey-assets.md`.
