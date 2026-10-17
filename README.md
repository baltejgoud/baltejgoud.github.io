# Baltej Goud — Portfolio

Illustrated, interactive portfolio for Baltej Goud: data analyst, AI engineer and co-founder & CEO of Sanket. Features a career map, project deck, founder story, toolkit reveal, personal pinboard, Anirudh player and contact keys. Built with Next.js (static export), Tailwind CSS v4, Motion and Lenis, and deployed to GitHub Pages by GitHub Actions.

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
| `src/content/skills.ts` | The 32 toolkit skills and their usage descriptions |
| `src/content/projects.ts` | Selected work, features, technology and project links |
| `src/content/certifications.ts` | Certifications; hidden while empty |
| `src/content/journey.ts` | Education and experience timeline |
| `src/content/journey-stories.ts` | Journey narratives, companies, logos and galleries |
| `src/content/journey-route.json` | City-map route geometry and milestone positions |
| `src/content/achievements.ts` | Achievement cards |

`DESIGN.md` documents the design system, interactions and motion rules.

The current homepage lives in `src/components/portfolio/Portfolio.tsx` with its scoped `portfolio.css`. The notes wall stores visitor drafts only in that visitor’s browser; “Send by email” opens their email client. It does not publish shared notes. Music uses Spotify’s embedded Anirudh artist player and depends on Spotify availability. Artwork prompts and provenance are in `docs/portfolio-artwork.md`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: lint, test, build, check, then deploy `out/` to GitHub Pages.

One-time setup: in GitHub, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. Do this before the first push of this version to `main`. The previous branch deploy serves the repository root, which no longer has an `index.html`.

The journey is implemented in `src/components/portfolio/CareerJourney.tsx` and `career-journey.css`. Desktop scrolling follows the route; mobile uses swipe and previous/next controls. Asset sources are documented in `docs/journey-assets.md`.
