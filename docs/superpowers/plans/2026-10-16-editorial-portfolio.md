# Editorial Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static "Signal" homepage of baltejgoud.github.io with a warm, light, editorial single-page portfolio (hero, about with a physics lanyard, periodic-table skills, a project accordion with live widgets, journey timeline, achievements carousel, contact), built with Next.js and deployed to GitHub Pages, while keeping the résumé and case-study pages at their current URLs.

**Architecture:** A Next.js 16 App Router app at the repository root with `output: "export"`. Sections are server components; interactivity lives in small client islands. All personal content is typed data in `src/content/`, and all logic that can be pure (physics, barcode, widget models, numbering) lives in `src/lib/` with Vitest tests. Legacy pages move unchanged into `public/`. A GitHub Actions workflow builds `out/` and deploys it to Pages.

**Tech Stack:** Next.js 16.4.2 · React 19.3.0 · TypeScript 5 · Tailwind CSS v4 (via `@tailwindcss/turbopack`) · motion 14.3.0 · Lenis 1.3.27 · simple-icons 16.35.0 · lucide-react 1.58.0 · Vitest 5.0.5 · sharp 0.35.5 · rembg (one-off, via `uvx`)

**Spec:** `docs/superpowers/specs/2026-10-16-editorial-portfolio-design.md` — read it before starting; this plan implements it.

## Global Constraints

- Work on branch `feat/editorial-portfolio`. Never push, and never touch the GitHub Pages settings: Baltej flips Pages to "GitHub Actions" himself before anything reaches `main`.
- Commands are written for Git Bash on Windows, run from the repository root `C:\Users\admin\Desktop\baltejgoud.github.io`. Node 24.
- Exact versions: `next 16.4.2`, `react`/`react-dom 19.3.0`, `motion 14.3.0`, `lenis 1.3.27`, `simple-icons 16.35.0`, `lucide-react 1.58.0`, `vitest 5.0.5`, `sharp 0.35.5`, `eslint-config-next 16.4.2`, `@types/node ^24` (Vitest 5 rejects `@types/node` 20).
- Static export only: no server features, no API routes, no `next start`.
- ESLint runs `eslint-config-next` 16, which includes the React Compiler hook rules as **errors**: never read `ref.current` during render, never call `setState` synchronously in an effect body (callbacks from observers, timers, promises and events are fine), never call `Math.random()`/`Date.now()`/`new Date()` during render.
- Motion server-renders `initial` states (e.g. `style="opacity:0"`). Never use a Motion `initial` that hides content which must be visible without JavaScript; use the CSS reveal system (`data-reveal`) instead, or `initial={false}` on first render.
- Colours, fonts and section ids exactly as in the spec: `cream #F6F4EE`, `ink #181818`, `stone #7A756D`, `line #E5E0D8`; Plus Jakarta Sans / Instrument Serif italic / JetBrains Mono; ids `top`, `about`, `skills`, `work`, `certifications`, `experience`, `achievements`, `contact`, `main`.
- Never invent facts: no metrics, dates, certifications, quotes or links beyond `src/content/`. Synthetic widget data is labelled "Illustrative".
- Every interactive feature works with a keyboard and under `prefers-reduced-motion: reduce`.
- Commit messages end with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## How this plan was verified

Every file in this plan was written into a throwaway Next 16.4.2 app and checked before the plan was finalised: 76 unit tests pass, `tsc --noEmit` and ESLint are clean, `next build` exports, `scripts/check-site.cjs` passes 7 pages and 220 local references with the real legacy pages in `public/`, `build-work.cjs` regenerates the case studies byte-for-byte, and the page was smoke-tested in a browser at 1440×900 and 375×812 with no console errors and no horizontal scroll. **Copy code exactly.** If something has to change, note why in the commit message.

## File map

| Path | Responsibility |
| --- | --- |
| `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `AGENTS.md` | Toolchain (Task 1) |
| `public/**` | Legacy site moved verbatim, plus `public/images/` for new imagery (Tasks 2, 6) |
| `scripts/check-site.cjs`, `scripts/build-work.cjs`, `scripts/vendor.cjs`, `scripts/prepare-images.cjs` | Static-export checks, legacy generators, image preparation (Tasks 2, 6) |
| `src/content/*` | Typed personal content, section registry (Task 3) |
| `src/lib/*` | Pure logic with tests: numbering, skills, magnet, parallax, random, barcode, physics, grid, hash, widget models, journey path, time (Tasks 3–14) |
| `src/hooks/*` | `useMediaQuery`, `useActiveSection`, `useScrolledPast` (Tasks 4–5) |
| `src/app/{layout,page}.tsx`, `src/app/globals.css` | Shell, fonts, metadata, tokens, reveal and keyframe CSS, page composition |
| `src/components/layout/*` | Providers, SmoothScroll, RevealObserver, Cursor, Navbar, MobileMenu, Footer |
| `src/components/ui/*` | Pill, SectionHeading, Toast |
| `src/components/{hero,about,skills,work,certs,journey,achievements,contact}/*` | One folder per section |
| `.github/workflows/deploy.yml`, `DESIGN.md`, `README.md` | Deployment and docs (Task 15) |

---

### Task 1: Next.js toolchain at the repository root

**Files:**
- Modify: `package.json` (full replacement), `.gitignore`
- Create: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `AGENTS.md`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: scripts `dev`, `build`, `start`, `lint`, `test`, `check`, `build:work`, `vendor`, `images`; path alias `@/*` → `src/*`; Vitest picks up `src/**/*.test.ts`.

- [ ] **Step 1: Confirm the starting point**

Run: `git status --short && git branch --show-current`
Expected: no output from `git status`, branch `feat/editorial-portfolio`. If the branch is different, stop and ask.

- [ ] **Step 2: Replace `package.json`**

```json
{
  "name": "baltej-goud-site",
  "version": "4.0.0",
  "private": true,
  "description": "Editorial portfolio of Baltej Goud — data analyst, AI engineer and co-founder & CEO of Sanket.",
  "author": "Baltej Goud",
  "license": "ISC",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "npx --yes serve out -l 8000",
    "lint": "eslint",
    "test": "vitest run",
    "check": "node scripts/check-site.cjs",
    "build:work": "node scripts/build-work.cjs",
    "vendor": "node scripts/vendor.cjs",
    "images": "node scripts/prepare-images.cjs"
  },
  "dependencies": {
    "lenis": "1.3.27",
    "lucide-react": "1.58.0",
    "motion": "14.3.0",
    "next": "16.4.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "simple-icons": "16.35.0"
  },
  "devDependencies": {
    "@tailwindcss/turbopack": "^4",
    "@types/node": "^24",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.4.2",
    "gsap": "3.15.0",
    "sharp": "0.35.5",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "5.0.5"
  }
}
```

- [ ] **Step 3: Install**

Run: `rm -rf node_modules package-lock.json && npm install`
Expected: completes without `ERESOLVE`. (`npm audit` warnings are fine.)

- [ ] **Step 4: Add the config files**

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules", "out", "public", ".cursor", "temp_design", "prompts_chat"]
}
```

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The legacy static pages, Node build scripts and folders unrelated to the app
    "public/**",
    "scripts/**",
    "docs/**",
    ".cursor/**",
    "temp_design/**",
    "prompts_chat/**",
  ]),
]);

export default eslintConfig;
```

`vitest.config.mts` (the `.mts` extension avoids Vite's "ESM syntax in a file loaded as CommonJS" warning):

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
```

`AGENTS.md` (Next.js writes this block on `next dev`; committing it keeps the tree clean):

```markdown
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
```

- [ ] **Step 5: Append to `.gitignore`**

```gitignore

# Next.js
.next/
out/
next-env.d.ts
*.tsbuildinfo

# Intermediate image files (scripts/prepare-images.cjs input)
.cache/
```

- [ ] **Step 6: Add a minimal app**

`src/app/globals.css`:

```css
@import "tailwindcss";
```

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Baltej Goud" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main id="main">
      <h1>Baltej Goud</h1>
    </main>
  );
}
```

- [ ] **Step 7: Verify the toolchain**

Run: `npm run lint && npm test && npm run build && ls out/index.html`
Expected: lint prints nothing; Vitest reports "No test files found, exiting with code 0"; the build lists `○ /`; `out/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .gitignore next.config.ts tsconfig.json eslint.config.mjs vitest.config.mts AGENTS.md src/app
git commit -m "build: add Next.js 16 static-export toolchain

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Move the legacy site into `public/` and check the static export

**Files:**
- Move: `resume.html`, `resume-screen.css`, `style.css`, `work.css`, `motion.css`, `bevel.css`, `home-profile.css`, `script.js`, `assets/`, `work/`, and the root images → `public/`
- Delete: `index.html` (the old homepage; it stays in git history)
- Modify: `scripts/build-work.cjs`, `scripts/vendor.cjs`
- Replace: `scripts/check-site.cjs`

**Interfaces:**
- Consumes: Task 1's `npm run build` (writes `out/`).
- Produces: `npm run check` validates `out/index.html` plus `out/resume.html` and `out/work/**`; `npm run build:work` writes into `public/work/`.

- [ ] **Step 1: Move the files with git**

```bash
mkdir -p public
git mv resume.html resume-screen.css style.css work.css motion.css bevel.css home-profile.css script.js public/
git mv assets work public/
git mv cnn_features.png cooking_vision_ui.jpg deepfake_pipeline.png extraticket_ui.jpg hero_demand_chart.jpg og_image.jpg profile.jpg sanket_architecture.jpg vert_agro.jpg vert_electronics.jpg vert_fashion.jpg vert_pharma.jpg public/
git rm -q index.html
touch public/.nojekyll
```

Run: `ls public && git status --short | head`
Expected: `public/` lists `assets work resume.html …`; `git status` shows renames (`R`) and `D index.html`.

- [ ] **Step 2: Point `scripts/build-work.cjs` at `public/` and drop the homepage step**

Make exactly these three edits:

1. Line 1 — replace
   `/* Regenerate static work pages with: npm run build:work. No browser runtime dependency. */`
   with
   `/* Regenerate the static work pages in public/work with: npm run build:work. No browser runtime dependency. */`
2. Replace `const root = path.resolve(__dirname, "..");` with `const root = path.resolve(__dirname, "..", "public");`
3. Delete the homepage block at the end of the file — everything from `const homePath = path.join(root, "index.html");` through `console.log("Generated work gallery, four case studies and homepage cards.");` — and put this line in its place:

```js
console.log("Generated the work gallery and four case studies.");
```

- [ ] **Step 3: Point `scripts/vendor.cjs` at `public/assets/vendor`**

Make exactly these three edits:

1. Line 1 — replace `/* Copy pinned animation libraries into assets/vendor. Run after npm install: npm run vendor */` with `/* Copy pinned animation libraries into public/assets/vendor for the legacy pages. Run after npm install: npm run vendor */`
2. Replace `const out = path.join(root, "assets/vendor");` with `const out = path.join(root, "public/assets/vendor");`
3. Replace ``console.log(`Copied ${Object.keys(files).length} files to assets/vendor.`);`` with ``console.log(`Copied ${Object.keys(files).length} files to public/assets/vendor.`);``

- [ ] **Step 4: Replace `scripts/check-site.cjs`**

It now checks the static export, resolves root-relative URLs (`/_next/…`, `/resume.html`) against `out/`, and only applies the motion-asset check to the legacy pages.

```js
// Check the static export in out/: local links, assets, anchors, duplicate IDs and h1s. Run after npm run build.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "out");
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("out/index.html not found. Run npm run build first.");
  process.exit(1);
}
const legacy = [
  "resume.html",
  "work/index.html",
  ...["sanket", "axon", "vigor", "extraticket"].map((p) => `work/${p}/index.html`),
];
const pages = ["index.html", ...legacy];
const failures = [];
let references = 0;

const resolve = (file, route) => {
  const clean = route.split("?")[0];
  if (!clean) return path.join(root, file);
  if (clean.startsWith("/")) return path.join(root, clean);
  return path.resolve(path.dirname(path.join(root, file)), clean);
};

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) failures.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(", ")}`);
  if ([...html.matchAll(/<h1\b/g)].length !== 1) failures.push(`${file}: expected one h1`);
  if (legacy.includes(file)) {
    for (const needle of ["data-motion-gate", "motion.css", "assets/vendor/gsap.min.js", "assets/js/motion/index.js"])
      if (!html.includes(needle)) failures.push(`${file}: missing motion asset ${needle}`);
  }
  const quickSlugs = [...html.matchAll(/data-quickview="([^"]+)"/g)].map((m) => m[1]);
  if (quickSlugs.length) {
    const island = html.match(/<script type="application\/json" id="project-data">([\s\S]*?)<\/script>/);
    let data = [];
    try {
      data = island ? JSON.parse(island[1]) : [];
    } catch {
      failures.push(`${file}: #project-data is not valid JSON`);
    }
    if (!island) failures.push(`${file}: quick view cards without #project-data`);
    const known = new Set(data.map((p) => p.slug));
    for (const slug of quickSlugs) if (!known.has(slug)) failures.push(`${file}: no quick view data for ${slug}`);
    for (const p of data)
      for (const image of [p.image, p.secondary].filter(Boolean))
        if (!fs.existsSync(resolve(file, image.src))) failures.push(`${file}: missing quick view image ${image.src}`);
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].replaceAll("&amp;", "&");
    if (/^[a-z][\w+.-]*:/i.test(ref)) continue;
    references++;
    const [route, anchor] = ref.split("#");
    let target = resolve(file, route);
    if (!fs.existsSync(target)) {
      failures.push(`${file}: missing ${ref}`);
      continue;
    }
    if (fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) {
      failures.push(`${file}: missing index for ${ref}`);
      continue;
    }
    if (anchor && target.endsWith(".html")) {
      const text = fs.readFileSync(target, "utf8");
      if (!text.includes(`id="${anchor}"`)) failures.push(`${file}: missing anchor ${ref}`);
    }
  }
}
console.log(`${pages.length} pages, ${references} local references checked.`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("No missing local links, duplicate IDs or h1 errors.");
```

- [ ] **Step 5: Confirm the generator is unchanged in output**

Run: `npm run build:work && git status --short public/work`
Expected: prints `Generated the work gallery and four case studies.`; `git status` shows no modified files under `public/work` (only the renames from Step 1).

- [ ] **Step 6: Build and check**

Run: `npm run build && npm run check`
Expected: the build succeeds and `out/` contains `resume.html`, `work/`, `assets/`, `style.css`. `npm run check` exits 1, and **every** failure line is a `missing anchor` for `index.html#about`, `index.html#experience` or `index.html#contact` (from the legacy pages). Those anchors arrive with Tasks 8, 13 and 14. Any other failure is a real problem — fix it before committing.

- [ ] **Step 7: Commit**

```bash
git add -A public scripts index.html
git commit -m "chore: move legacy pages into public/ and check the static export

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Content model and section numbering

**Files:**
- Create: `src/content/types.ts`, `profile.ts`, `skills.ts`, `projects.ts`, `certifications.ts`, `journey.ts`, `achievements.ts`, `sections.ts`
- Create: `src/lib/sections.ts`, `src/lib/skills.ts`
- Test: `src/content/content.test.ts`, `src/lib/sections.test.ts`, `src/lib/skills.test.ts`

**Interfaces:**
- Produces (types): `SkillCategory`, `Skill`, `WidgetKind`, `Project`, `Certification`, `Milestone`, `AchievementIcon`, `Achievement`, `Fact`, `HeroMediaContent`.
- Produces (data): `profile`, `hero` (profile.ts); `skills`; `projects`; `certifications`; `journey`; `achievements`; `sections`, `navItems`, `navIds`, `SectionId` (sections.ts).
- Produces (lib): `sectionIndices(list: readonly {id: string; visible: boolean}[]): Record<string, string>`, `pad2(n: number): string`; `categoryOrder: SkillCategory[]`, `categoryMeta: Record<SkillCategory, {label; color}>`, `idsInCategory(list, category | null): Set<string>`, `filterAnnouncement(list, category | null): string`.

- [ ] **Step 1: Write the failing tests**

`src/lib/sections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pad2, sectionIndices } from "@/lib/sections";

const base = [
  { id: "about", visible: true },
  { id: "skills", visible: true },
  { id: "work", visible: true },
  { id: "certifications", visible: false },
  { id: "experience", visible: true },
  { id: "achievements", visible: true },
];

describe("sectionIndices", () => {
  it("numbers visible sections only, with two digits", () => {
    expect(sectionIndices(base)).toEqual({
      about: "01",
      skills: "02",
      work: "03",
      experience: "04",
      achievements: "05",
    });
  });

  it("gives certifications 04 and shifts later sections when it is visible", () => {
    const withCerts = base.map((s) => (s.id === "certifications" ? { ...s, visible: true } : s));
    expect(sectionIndices(withCerts)).toEqual({
      about: "01",
      skills: "02",
      work: "03",
      certifications: "04",
      experience: "05",
      achievements: "06",
    });
  });
});

describe("pad2", () => {
  it("pads single digits", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
  });
});
```

`src/lib/skills.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { skills } from "@/content/skills";
import { categoryOrder, filterAnnouncement, idsInCategory } from "@/lib/skills";

describe("idsInCategory", () => {
  it("returns every id when no category is selected", () => {
    expect(idsInCategory(skills, null).size).toBe(skills.length);
  });

  it("returns exactly the ids of the selected category", () => {
    expect([...idsInCategory(skills, "frontend")]).toEqual([
      "react",
      "nextjs",
      "threejs",
      "electron",
      "tailwind",
    ]);
  });
});

describe("filterAnnouncement", () => {
  it("describes the unfiltered state", () => {
    expect(filterAnnouncement(skills, null)).toBe("All elements shown");
  });

  it("counts the highlighted elements", () => {
    expect(filterAnnouncement(skills, "core")).toBe("6 Core elements highlighted");
  });
});

describe("categoryOrder", () => {
  it("lists all six categories once", () => {
    expect(new Set(categoryOrder).size).toBe(6);
  });
});
```

`src/content/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { achievements } from "@/content/achievements";
import { certifications } from "@/content/certifications";
import { journey } from "@/content/journey";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";
import { categoryOrder } from "@/lib/skills";

describe("skills", () => {
  it("has 32 elements with unique ids and symbols", () => {
    expect(skills).toHaveLength(32);
    expect(new Set(skills.map((s) => s.id)).size).toBe(32);
    expect(new Set(skills.map((s) => s.symbol)).size).toBe(32);
  });

  it("uses periodic-table style symbols", () => {
    for (const s of skills) expect(s.symbol).toMatch(/^[A-Z][a-z]?$/);
  });

  it("fills every category", () => {
    for (const c of categoryOrder) {
      expect(skills.filter((s) => s.category === c).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("explains how each skill is used", () => {
    for (const s of skills) expect(s.usage.length).toBeGreaterThan(10);
  });
});

describe("projects", () => {
  it("has six projects with sequential indexes and unique widgets", () => {
    expect(projects.map((p) => p.index)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(new Set(projects.map((p) => p.widget)).size).toBe(6);
  });

  it("lists 4–6 features, a stack and at least one link", () => {
    for (const p of projects) {
      expect(p.features.length).toBeGreaterThanOrEqual(4);
      expect(p.features.length).toBeLessThanOrEqual(6);
      expect(p.stack.length).toBeGreaterThan(0);
      expect(p.links.github ?? p.links.caseStudy).toBeTruthy();
    }
  });

  it("only links to Baltej's GitHub and local case studies", () => {
    for (const p of projects) {
      if (p.links.github) expect(p.links.github).toMatch(/^https:\/\/github\.com\/baltejgoud\//);
      if (p.links.caseStudy) expect(p.links.caseStudy).toMatch(/^\/work\/[a-z]+\/$/);
    }
  });
});

describe("journey", () => {
  it("runs from education to an open next step", () => {
    expect(journey[0].kind).toBe("education");
    expect(journey.at(-1)?.kind).toBe("next");
  });

  it("gives every milestone a role and an organisation", () => {
    for (const m of journey) {
      expect(m.role).toBeTruthy();
      expect(m.org).toBeTruthy();
    }
  });
});

describe("achievements", () => {
  it("has eight cards, each with a metric", () => {
    expect(achievements).toHaveLength(8);
    for (const a of achievements) expect(a.metric).toBeTruthy();
  });
});

describe("certifications", () => {
  it("has a title and issuer for every entry", () => {
    for (const c of certifications) {
      expect(c.title).toBeTruthy();
      expect(c.issuer).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/sections"` (and the same for skills and content).

- [ ] **Step 3: Write the content types**

`src/content/types.ts`:

```ts
export type SkillCategory =
  | "languages"
  | "frontend"
  | "backend"
  | "databases"
  | "tools"
  | "core";

export interface Skill {
  id: string;
  /** One or two letters, periodic-table style */
  symbol: string;
  name: string;
  category: SkillCategory;
  /** simple-icons slug; omitted when the technology has no logo */
  icon?: string;
  usage: string;
}

export type WidgetKind =
  | "forecast"
  | "atlas"
  | "import"
  | "fairPrice"
  | "custody"
  | "reconcile";

export interface Project {
  id: string;
  index: string;
  title: string;
  category: string;
  role: string;
  summary: string;
  features: string[];
  stack: string[];
  links: { github?: string; caseStudy?: string };
  widget: WidgetKind;
}

export interface Certification {
  title: string;
  issuer: string;
  year?: string;
  href?: string;
}

export interface Milestone {
  kind: "education" | "experience" | "next";
  dates?: string;
  role: string;
  org: string;
  bullets: string[];
  tags: string[];
  /** Giant background year shown beside this milestone */
  watermark?: string;
}

export type AchievementIcon =
  | "trophy"
  | "award"
  | "graduation"
  | "layers"
  | "bot"
  | "plug"
  | "apple"
  | "chart";

export interface Achievement {
  icon: AchievementIcon;
  title: string;
  description: string;
  metric: string;
  size?: "wide";
}

export interface Fact {
  label: string;
  value: string;
  /** Shows the pulsing availability dot */
  live?: boolean;
}

export interface HeroMediaContent {
  image: { src: string; alt: string };
  /** Optional talking-avatar clip; the sound toggle appears only when set */
  video?: { src: string; poster: string };
}
```

- [ ] **Step 4: Write the content**

`src/content/profile.ts`:

```ts
import type { Fact, HeroMediaContent } from "./types";

export const profile = {
  name: "Baltej Goud",
  fullName: "Panagatla Baltej Goud",
  firstName: "Baltej",
  monogram: "BG",
  title: { lead: "Data", accent: "Analyst." },
  tagline: "Data analyst · AI engineer · Co-founder of Sanket",
  email: "baltej.panagatla@gmail.com",
  location: "Hyderabad, India",
  copyrightYear: 2026,
  links: {
    linkedin: "https://www.linkedin.com/in/baltejgoud",
    github: "https://github.com/baltejgoud",
    resume: "/resume.html",
  },
  bio: [
    "I’m a data analyst and AI engineer who makes complex data useful — through clear analysis, machine learning and software that solves real problems. I’ve worked on data analysis at Haritha Industries and machine-learning delivery at Tectoro Consulting.",
    "As co-founder & CEO of Sanket, I connect product direction with demand forecasting and inventory intelligence. Outside of that, I keep building — from a 3D AI workspace to privacy-first health tools.",
  ],
  whatIDo: [
    "Data analysis & business reporting",
    "Forecasting & machine learning",
    "Agentic AI & MCP integrations",
    "Full-stack product engineering",
    "Dashboards & data visualisation",
    "Product strategy at Sanket",
  ],
  facts: [
    { label: "Location", value: "Hyderabad, India" },
    { label: "Education", value: "B.Tech CSE, BVRIT Narsapur" },
    { label: "CGPA", value: "6.1 / 10" },
    { label: "Graduation", value: "2023" },
    { label: "Focus", value: "Data analysis · AI/ML" },
    { label: "Status", value: "Open to data & AI roles", live: true },
  ] satisfies Fact[],
  quote: "Make complex data useful.",
  idCard: {
    heading: "Developer ID",
    roles: ["Data Analyst", "AI Engineer", "Founder"],
    number: "BG-2023-HYD",
    barcodeSeed: "BALTEJGOUD",
  },
  contact: {
    lead: "Let’s build something",
    accent: "useful.",
    line: "Hiring for data or AI roles, or building something that runs on data? I’d love to hear about it.",
  },
};

export const hero: HeroMediaContent = {
  image: {
    src: "/images/portrait-cutout.webp",
    alt: "Baltej Goud smiling, in a white shirt and tie",
  },
};
```

`src/content/skills.ts`:

```ts
import type { Skill } from "./types";

export const skills: Skill[] = [
  { id: "python", symbol: "Py", name: "Python", category: "languages", icon: "python", usage: "Sanket’s forecasting services, Tandem’s automation backend and the deepfake-detection models." },
  { id: "sql", symbol: "Sq", name: "SQL", category: "languages", usage: "Everyday querying, joins and aggregation for analysis; the relational schemas behind Sanket and AgriTrust." },
  { id: "typescript", symbol: "Ts", name: "TypeScript", category: "languages", icon: "typescript", usage: "Axon’s Electron + React desktop app, Sanket’s dashboard and AgriTrust’s Next.js / NestJS stack." },
  { id: "javascript", symbol: "Js", name: "JavaScript", category: "languages", icon: "javascript", usage: "ExtraTicket’s Node / Express API and the browser layer of everything web." },
  { id: "c", symbol: "C", name: "C", category: "languages", icon: "c", usage: "Computer-science foundations from my B.Tech, and a topic I tutored." },
  { id: "react", symbol: "Re", name: "React", category: "frontend", icon: "react", usage: "Interfaces for Sanket, Axon, VIGOR and ExtraTicket." },
  { id: "nextjs", symbol: "Nx", name: "Next.js", category: "frontend", icon: "nextdotjs", usage: "AgriTrust’s web app — and this portfolio." },
  { id: "threejs", symbol: "Th", name: "Three.js", category: "frontend", icon: "threedotjs", usage: "Axon’s procedural 3D campus, with 208 monitor screens batched into one texture atlas." },
  { id: "electron", symbol: "El", name: "Electron", category: "frontend", icon: "electron", usage: "Axon’s sandboxed desktop shell with an explicit preload API." },
  { id: "tailwind", symbol: "Tw", name: "Tailwind CSS", category: "frontend", icon: "tailwindcss", usage: "ExtraTicket’s interface and this site’s design tokens." },
  { id: "nodejs", symbol: "No", name: "Node.js", category: "backend", icon: "nodedotjs", usage: "VIGOR’s API and cancellable import worker; ExtraTicket’s server." },
  { id: "fastapi", symbol: "Fa", name: "FastAPI", category: "backend", icon: "fastapi", usage: "Sanket’s API gateway and Tandem’s automation service." },
  { id: "express", symbol: "Ex", name: "Express", category: "backend", icon: "express", usage: "ExtraTicket’s REST API." },
  { id: "nestjs", symbol: "Ns", name: "NestJS", category: "backend", icon: "nestjs", usage: "AgriTrust’s provenance and verification backend." },
  { id: "rest", symbol: "Ap", name: "REST APIs", category: "backend", icon: "openapiinitiative", usage: "VIGOR’s OpenAPI 3.1 contract and the service boundaries across my projects." },
  { id: "postgresql", symbol: "Pg", name: "PostgreSQL", category: "databases", icon: "postgresql", usage: "Sanket’s multi-tenant store with Row-Level Security; ExtraTicket and AgriTrust data layers." },
  { id: "sqlite", symbol: "Sl", name: "SQLite", category: "databases", icon: "sqlite", usage: "VIGOR’s local-first records and Tandem’s append-only execution ledger." },
  { id: "mongodb", symbol: "Mg", name: "MongoDB", category: "databases", icon: "mongodb", usage: "Document-shaped data for prototypes." },
  { id: "supabase", symbol: "Sb", name: "Supabase", category: "databases", icon: "supabase", usage: "ExtraTicket’s hosted data and auth." },
  { id: "firebase", symbol: "Fb", name: "Firebase", category: "databases", icon: "firebase", usage: "Realtime data and hosting for quick builds." },
  { id: "git", symbol: "Gt", name: "Git", category: "tools", icon: "git", usage: "Version control across every project." },
  { id: "docker", symbol: "Dk", name: "Docker", category: "tools", icon: "docker", usage: "Containerised Sanket services." },
  { id: "kubernetes", symbol: "Ku", name: "Kubernetes", category: "tools", icon: "kubernetes", usage: "Sanket’s deployment target." },
  { id: "playwright", symbol: "Pw", name: "Playwright", category: "tools", usage: "Tandem’s browser automation across simulated legacy banking interfaces." },
  { id: "figma", symbol: "Fg", name: "Figma", category: "tools", icon: "figma", usage: "Interface design and design systems before code." },
  { id: "gcp", symbol: "Gc", name: "Google Cloud", category: "tools", icon: "googlecloud", usage: "Cloud infrastructure for deployments and data." },
  { id: "data-analysis", symbol: "Da", name: "Data Analysis", category: "core", usage: "Cleaning, exploration and reporting at Haritha Industries; taught to 500+ students." },
  { id: "data-viz", symbol: "Dv", name: "Data Visualisation", category: "core", usage: "Dashboards that lead with decisions, like Sanket’s forecasts with uncertainty bands." },
  { id: "ml", symbol: "Ml", name: "Machine Learning", category: "core", usage: "AI/ML delivery at Tectoro; Sanket’s model routing across XGBoost, Prophet and ensembles." },
  { id: "forecasting", symbol: "Fc", name: "Forecasting", category: "core", usage: "Prophet, ensembles and zero-shot Amazon Chronos for cold-start SKUs." },
  { id: "pytorch", symbol: "Pt", name: "PyTorch", category: "core", icon: "pytorch", usage: "A ResNeXt + LSTM deepfake detector evaluated on FaceForensics++, DFDC and Celeb-DF." },
  { id: "agentic-ai", symbol: "Ag", name: "Agentic AI", category: "core", icon: "modelcontextprotocol", usage: "Agent orchestration, function calling and 39 MCP connectors in Axon; consent-scoped agent access in VIGOR." },
];
```

`src/content/projects.ts`:

```ts
import type { Project } from "./types";

export const projects: Project[] = [
  {
    id: "sanket",
    index: "01",
    title: "Sanket",
    category: "Predictive intelligence",
    role: "Co-founder & CEO",
    summary:
      "Multi-tenant platform forecasting SKU-level demand across fashion, electronics, pharma and agro — built around the decisions a planning team has to make.",
    features: [
      "PostgreSQL 16 with Row-Level Security tenant isolation",
      "ML routing across XGBoost, Prophet and ensembles",
      "Zero-shot Amazon Chronos fallback for cold-start SKUs",
      "Forecasts shown with uncertainty bands",
      "Decision-first dashboard: replenish, hold, investigate",
      "FastAPI gateway with a React + TypeScript dashboard",
    ],
    stack: ["React", "TypeScript", "FastAPI", "PostgreSQL", "XGBoost", "Chronos", "Docker", "Kubernetes"],
    links: { caseStudy: "/work/sanket/" },
    widget: "forecast",
  },
  {
    id: "axon",
    index: "02",
    title: "Axon AI Studio",
    category: "AI workspace · Desktop & 3D",
    role: "Desktop, 3D & AI engineering",
    summary:
      "A local-first desktop workspace where 200+ specialist AI coworkers collaborate in a procedural 3D campus — with approval required for every file change.",
    features: [
      "208 monitor screens batched into one texture atlas",
      "Streaming adapters across AI providers",
      "39 MCP connectors",
      "Diff approval for every proposed edit",
      "500-version undo",
      "Sandboxed Electron renderer with an explicit preload API",
    ],
    stack: ["TypeScript", "Electron", "React", "Three.js", "Zustand", "MCP"],
    links: { github: "https://github.com/baltejgoud/Axon-AI-Office-", caseStudy: "/work/axon/" },
    widget: "atlas",
  },
  {
    id: "vigor",
    index: "03",
    title: "VIGOR",
    category: "Personal data · Health & nutrition",
    role: "Full-stack product engineering",
    summary:
      "Turns Apple Health exports and food diaries into goals, trends and answers — with consent-based, read-only access for AI assistants.",
    features: [
      "Cancellable XML / ZIP importer with review-before-save",
      "8,159-food USDA catalogue",
      "Missing measurements stay unknown, never zero",
      "Opt-in, read-only AI coach with visible record access",
      "Scoped agent connectors with owner checks",
      "OpenAPI 3.1 contract",
    ],
    stack: ["React", "Vite", "Node.js", "SQLite", "MCP", "OAuth"],
    links: { caseStudy: "/work/vigor/" },
    widget: "import",
  },
  {
    id: "extraticket",
    index: "04",
    title: "ExtraTicket",
    category: "Marketplace · Digital experience",
    role: "Product design & full-stack engineering",
    summary: "A peer-to-peer marketplace for spare event tickets across India, sold at or below face value.",
    features: [
      "Listings capped at face value",
      "City and category discovery",
      "Event cards with time, place and price in one scan",
      "React interface with a Node / Express API",
      "PostgreSQL data layer",
    ],
    stack: ["React", "Node.js", "Express", "PostgreSQL", "Tailwind CSS"],
    links: { caseStudy: "/work/extraticket/" },
    widget: "fairPrice",
  },
  {
    id: "agritrust",
    index: "05",
    title: "AgriTrust",
    category: "Supply-chain evidence",
    role: "Backend & verification engineering",
    summary: "Helps farmers, labs, carriers and distributors prove where food came from and how it was handled.",
    features: [
      "Provenance ledger with cryptographically signed proofs",
      "Automated custody-chain verification",
      "Evidence anchoring",
      "Batch provenance",
    ],
    stack: ["TypeScript", "Next.js", "NestJS", "PostgreSQL", "Solidity"],
    links: { github: "https://github.com/baltejgoud/AgriTrust" },
    widget: "custody",
  },
  {
    id: "tandem",
    index: "06",
    title: "Tandem",
    category: "Browser automation",
    role: "Full-stack engineering & architecture",
    summary: "A prototype for effect-aware browser automation across simulated legacy banking interfaces.",
    features: [
      "Append-only execution ledger",
      "Entity prechecks before every action",
      "Post-action reconciliation",
      "Operator console for ambiguous outcomes",
    ],
    stack: ["Python", "FastAPI", "Playwright", "SQLite"],
    links: { github: "https://github.com/baltejgoud/Tandem-" },
    widget: "reconcile",
  },
];
```

`src/content/certifications.ts`:

```ts
import type { Certification } from "./types";

/** Add entries to show section 04. While this is empty the section is hidden and later sections renumber. */
export const certifications: Certification[] = [];
```

`src/content/journey.ts`:

```ts
import type { Milestone } from "./types";

/** Chronological, top to bottom. Jobs carry no dates because none are on record. */
export const journey: Milestone[] = [
  {
    kind: "education",
    dates: "2019 – 2023",
    role: "B.Tech, Computer Science & Engineering",
    org: "B V Raju Institute of Technology, Narsapur",
    bullets: ["Graduated in 2023", "CGPA 6.1 / 10"],
    tags: ["CSE", "B.Tech"],
    watermark: "2019",
  },
  {
    kind: "experience",
    role: "Lead Computer Science Tutor",
    org: "B V Raju Institute of Technology",
    bullets: [
      "Tutored 500+ students",
      "Data cleaning, visualisation, statistical analysis and core computer-science topics",
    ],
    tags: ["Teaching", "Statistics", "Data analysis"],
    watermark: "2023",
  },
  {
    kind: "experience",
    role: "AI/ML Engineer",
    org: "Tectoro Consulting Private Limited",
    bullets: [
      "Developed and deployed AI/ML solutions",
      "Real-world machine-learning pipelines and intelligent application development",
    ],
    tags: ["Machine learning", "Python", "Pipelines"],
  },
  {
    kind: "experience",
    role: "Data Analyst",
    org: "Haritha Industries",
    bullets: [
      "Data cleaning, exploratory analysis and visual reporting",
      "Business insights from operational data",
    ],
    tags: ["Data cleaning", "EDA", "Reporting"],
  },
  {
    kind: "experience",
    dates: "Now",
    role: "Co-founder & CEO",
    org: "Sanket",
    bullets: [
      "Building a predictive intelligence business that connects operational data, machine learning and product design",
      "Demand forecasting and inventory intelligence across four verticals",
    ],
    tags: ["Forecasting", "Product", "Leadership"],
    watermark: "Now",
  },
  {
    kind: "next",
    role: "Your team?",
    org: "Open to data & AI roles",
    bullets: [],
    tags: [],
    watermark: "Next?",
  },
];
```

`src/content/achievements.ts`:

```ts
import type { Achievement } from "./types";

export const achievements: Achievement[] = [
  { icon: "trophy", metric: "Top 2", title: "Code for Good Hackathon", description: "Finished in the top two at Code for Good, 2024." },
  { icon: "award", metric: "1st", title: "Model United Nations", description: "First place in a Model United Nations competition." },
  { icon: "graduation", metric: "500+", title: "Students tutored", description: "Lead computer-science tutor at BVRIT: data cleaning, visualisation and statistics." },
  { icon: "layers", metric: "208→1", title: "Draw calls in Axon", description: "Batched 208 monitor screens into a single texture atlas.", size: "wide" },
  { icon: "bot", metric: "200+", title: "AI coworkers", description: "Specialist agents collaborating in Axon’s procedural 3D campus." },
  { icon: "plug", metric: "39", title: "MCP connectors", description: "Built for Axon’s agent tool access." },
  { icon: "apple", metric: "8,159", title: "Foods catalogued", description: "The USDA catalogue behind VIGOR’s food diary.", size: "wide" },
  { icon: "chart", metric: "4", title: "Industry verticals", description: "Sanket forecasts fashion, electronics, pharma and agro demand." },
];
```

`src/content/sections.ts`:

```ts
import { certifications } from "./certifications";

export type SectionId =
  | "about"
  | "skills"
  | "work"
  | "certifications"
  | "experience"
  | "achievements";

/** Numbered sections in page order. Index numbers come from lib/sections.ts, never hard-coded. */
export const sections: { id: SectionId; label: string; visible: boolean }[] = [
  { id: "about", label: "About", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "work", label: "Selected work", visible: true },
  { id: "certifications", label: "Certifications", visible: certifications.length > 0 },
  { id: "experience", label: "Journey", visible: true },
  { id: "achievements", label: "Achievements", visible: true },
];

export const navItems = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
] as const;

export const navIds: readonly string[] = navItems.map((item) => item.id);
```

- [ ] **Step 5: Write the helpers**

`src/lib/sections.ts`:

```ts
export interface SectionEntry {
  id: string;
  visible: boolean;
}

/** Two-digit index for each visible section, in order: { about: "01", … }. Hidden sections get none. */
export function sectionIndices(list: readonly SectionEntry[]): Record<string, string> {
  const indices: Record<string, string> = {};
  let n = 0;
  for (const section of list) if (section.visible) indices[section.id] = pad2(++n);
  return indices;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
```

`src/lib/skills.ts`:

```ts
import type { Skill, SkillCategory } from "@/content/types";

export const categoryOrder: SkillCategory[] = [
  "languages",
  "frontend",
  "backend",
  "databases",
  "tools",
  "core",
];

export const categoryMeta: Record<SkillCategory, { label: string; color: string }> = {
  languages: { label: "Languages", color: "var(--color-cat-lang)" },
  frontend: { label: "Frontend", color: "var(--color-cat-front)" },
  backend: { label: "Backend", color: "var(--color-cat-back)" },
  databases: { label: "Databases", color: "var(--color-cat-data)" },
  tools: { label: "Tools", color: "var(--color-cat-tools)" },
  core: { label: "Core", color: "var(--color-cat-core)" },
};

/** Ids of the skills a filter highlights; `null` means no filter (every skill). */
export function idsInCategory(list: readonly Skill[], category: SkillCategory | null): Set<string> {
  return new Set(list.filter((s) => category === null || s.category === category).map((s) => s.id));
}

/** Text for the polite live region under the filter pills. */
export function filterAnnouncement(list: readonly Skill[], category: SkillCategory | null): string {
  if (category === null) return "All elements shown";
  const count = list.filter((s) => s.category === category).length;
  return `${count} ${categoryMeta[category].label} elements highlighted`;
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS — 3 files, 19 tests.

- [ ] **Step 7: Commit**

```bash
git add src/content src/lib
git commit -m "feat(content): typed portfolio content and section numbering

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Design system and app shell

**Files:**
- Create: `src/lib/cn.ts`, `src/lib/style.ts`, `src/lib/magnet.ts`, `src/hooks/useMediaQuery.ts`
- Create: `src/components/layout/SmoothScroll.tsx`, `Providers.tsx`, `RevealObserver.tsx`, `Cursor.tsx`
- Create: `src/components/ui/Toast.tsx`, `Pill.tsx`, `SectionHeading.tsx`
- Replace: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `src/lib/basics.test.ts`

**Interfaces:**
- Consumes: `profile` (Task 3).
- Produces: `cn(...classes)`, `vars(values: Record<\`--${string}\`, string | number>): CSSProperties`, `magneticOffset(x, y, rect, max = 8): {x; y}`; `useMediaQuery(query, serverValue = false)`, `usePrefersReducedMotion()`, `useFinePointer()`; `<SmoothScroll>` + `useSmoothScroll(): { scrollTo(target: string | HTMLElement | number), stop(), start() }`; `<ToastProvider>` + `useToast(): (message: string) => void`; `<Providers>`; `<RevealObserver />`; `<Cursor />`; `<Pill href?|onClick variant="solid"|"outline" magnetic external aria-label aria-pressed disabled>`; `<SectionHeading headingId index? label lead accent className?>`.
- CSS contract used by later tasks: `.container-page`, `.section`, `.label`, `.section-title`, `.accent`, `.mask`, `.no-scrollbar`, `.live-dot`, `.parallax` (reads `--px`, `--py`, `--depth`), `.hero-rise`, `.hero-fade` (read `--delay`), `.eq-bar`, `.lanyard-static`, `.atlas`, `.atlas-tile`, `.atlas-sheet`, `[data-reveal]`, `[data-reveal="mask"]`; Tailwind colours `cream ink stone line paper glass watermark live alert cat-lang cat-front cat-back cat-data cat-tools cat-core`, ease `ease-out-expo`, shadow `shadow-card`.

- [ ] **Step 1: Write the failing test**

`src/lib/basics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";
import { magneticOffset } from "@/lib/magnet";
import { vars } from "@/lib/style";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("vars", () => {
  it("passes custom properties through", () => {
    expect(vars({ "--delay": "120ms", "--i": 2 })).toEqual({ "--delay": "120ms", "--i": 2 });
  });
});

describe("magneticOffset", () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };

  it("is zero at the centre", () => {
    expect(magneticOffset(200, 150, rect)).toEqual({ x: 0, y: 0 });
  });

  it("reaches the cap at the edges", () => {
    expect(magneticOffset(300, 150, rect)).toEqual({ x: 8, y: 0 });
    expect(magneticOffset(100, 100, rect)).toEqual({ x: -8, y: -8 });
  });

  it("never exceeds the cap outside the element", () => {
    expect(magneticOffset(900, 900, rect, 10)).toEqual({ x: 10, y: 10 });
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- src/lib/basics.test.ts`
Expected: FAIL — cannot resolve `@/lib/cn`.

- [ ] **Step 3: Write the helpers**

`src/lib/cn.ts`:

```ts
/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
```

`src/lib/style.ts`:

```ts
import type { CSSProperties } from "react";

/** Typed helper for inline CSS custom properties: style={vars({ "--delay": "120ms" })} */
export function vars(values: Record<`--${string}`, string | number>): CSSProperties {
  return values as CSSProperties;
}
```

`src/lib/magnet.ts`:

```ts
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Offset that pulls an element toward the pointer, capped at `max` pixels on each axis. */
export function magneticOffset(
  pointerX: number,
  pointerY: number,
  rect: Rect,
  max = 8,
): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const dx = (pointerX - (rect.left + rect.width / 2)) / (rect.width / 2);
  const dy = (pointerY - (rect.top + rect.height / 2)) / (rect.height / 2);
  return { x: clamp(dx) * max, y: clamp(dy) * max };
}
```

- [ ] **Step 4: Run the test**

Run: `npm test -- src/lib/basics.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Replace `src/app/globals.css` with the design tokens and motion CSS**

```css
@import "tailwindcss";

@theme {
  --color-cream: #f6f4ee;
  --color-ink: #181818;
  --color-stone: #7a756d;
  --color-line: #e5e0d8;
  --color-paper: #ffffff;
  --color-glass: rgb(255 255 255 / 0.62);
  --color-watermark: rgb(122 117 109 / 0.1);
  --color-live: #22c55e;
  --color-alert: #b4483a;
  --color-cat-lang: #d08a3c;
  --color-cat-front: #4a7fb0;
  --color-cat-back: #5b8c5a;
  --color-cat-data: #8b6bb1;
  --color-cat-tools: #b85c45;
  --color-cat-core: #b8962e;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --shadow-card: 0 1px 0 rgb(0 0 0 / 0.04), 0 18px 40px -24px rgb(24 24 24 / 0.18);
}

@theme inline {
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-instrument), ui-serif, Georgia, serif;
  --font-mono: var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  :root {
    --gutter: clamp(16px, 4vw, 40px);
    --nav-h: 72px;
    color-scheme: light;
  }
  html {
    background: var(--color-cream);
    -webkit-text-size-adjust: 100%;
  }
  body {
    background: var(--color-cream);
    color: var(--color-ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  ::selection {
    background: var(--color-ink);
    color: var(--color-cream);
  }
  section[id] {
    scroll-margin-top: calc(var(--nav-h) + 16px);
  }
  :focus-visible {
    outline: 2px solid var(--color-ink);
    outline-offset: 3px;
  }
}

@layer components {
  .container-page {
    width: 100%;
    max-width: 1320px;
    margin-inline: auto;
    padding-inline: var(--gutter);
  }
  .section {
    padding-block: clamp(88px, 12vw, 160px);
  }
  .label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .section-title {
    font-size: clamp(2.4rem, 5.5vw, 4.75rem);
    line-height: 1.02;
    letter-spacing: -0.035em;
    font-weight: 800;
  }
  .accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .mask {
    display: inline-block;
    overflow: hidden;
    vertical-align: bottom;
    padding-bottom: 0.12em;
    margin-bottom: -0.12em;
  }
  .mask > span {
    display: inline-block;
  }
  .no-scrollbar {
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .live-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 0.5rem;
    border-radius: 9999px;
    background: var(--color-live);
    vertical-align: 0.05em;
  }
  .parallax {
    translate: calc(var(--px, 0) * var(--depth, 0) * 1px) calc(var(--py, 0) * var(--depth, 0) * 1px);
    transition: translate 0.9s var(--ease-out-expo);
  }
}

/* Scroll reveals: hidden only while JS runs, motion is allowed and the 3s safety net has not fired. */
html.js:not(.reduced):not(.reveal-all) [data-reveal]:not([data-reveal="mask"]):not(.is-in) {
  opacity: 0;
  transform: translateY(24px);
}
html.js:not(.reduced):not(.reveal-all) [data-reveal="mask"]:not(.is-in) .mask > span {
  transform: translateY(105%);
}
[data-reveal] {
  transition:
    opacity 0.8s var(--ease-out-expo),
    transform 0.8s var(--ease-out-expo);
  transition-delay: var(--delay, 0ms);
}
[data-reveal="mask"] .mask > span {
  transition: transform 0.9s var(--ease-out-expo);
  transition-delay: var(--delay, 0ms);
}
[data-reveal="mask"] .mask + .mask > span {
  transition-delay: calc(var(--delay, 0ms) + 90ms);
}

/* Hero entrance */
html.js:not(.reduced) .hero-rise {
  animation: rise 1.1s var(--ease-out-expo) both;
  animation-delay: var(--delay, 0ms);
}
html.js:not(.reduced) .hero-fade {
  animation: fade-up 1s var(--ease-out-expo) both;
  animation-delay: var(--delay, 0ms);
}
html.js:not(.reduced) .live-dot {
  animation: live-pulse 2s ease-out infinite;
}
.js .lanyard-static {
  display: none;
}

/* Sound pill equaliser */
.eq-bar {
  height: 100%;
  animation: eq 0.9s ease-in-out infinite;
  animation-delay: var(--delay, 0ms);
}

/* Axon atlas widget */
.atlas-tile {
  transition:
    transform 0.7s var(--ease-out-expo),
    opacity 0.5s ease;
  transition-delay: calc(var(--i, 0) * 25ms);
}
html.js:not(.reduced) .atlas-tile {
  animation: flicker 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 170ms);
}
.atlas.is-batched .atlas-tile {
  transform: translate(calc(var(--dx) * 100%), calc(var(--dy) * 100%)) scale(0.2);
  opacity: 0;
  animation: none;
}
.atlas-sheet {
  background-color: var(--color-ink);
  background-image:
    linear-gradient(90deg, rgb(255 255 255 / 0.1) 1px, transparent 1px),
    linear-gradient(rgb(255 255 255 / 0.1) 1px, transparent 1px);
  background-size: 6.25% 7.69%;
  transform: scale(0.2);
  opacity: 0;
  transition:
    transform 0.7s var(--ease-out-expo) 0.25s,
    opacity 0.4s ease 0.25s;
}
.atlas.is-batched .atlas-sheet {
  transform: scale(1);
  opacity: 1;
}

@keyframes rise {
  from {
    transform: translateY(105%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(34 197 94 / 0.55);
  }
  70% {
    box-shadow: 0 0 0 8px rgb(34 197 94 / 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgb(34 197 94 / 0);
  }
}
@keyframes eq {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}
@keyframes flicker {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Add the hook and shell components**

`src/hooks/useMediaQuery.ts`:

```ts
import { useCallback, useSyncExternalStore } from "react";

/** Live media-query match. Returns `serverValue` during prerender and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
```

`src/components/layout/SmoothScroll.tsx`:

```tsx
"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

const NAV_OFFSET = -88;
type Target = string | HTMLElement | number;

interface ScrollApi {
  scrollTo: (target: Target) => void;
  stop: () => void;
  start: () => void;
}

const ScrollContext = createContext<ScrollApi | null>(null);

/** One Lenis instance for the page; skipped entirely under reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: true,
      anchors: { offset: NAV_OFFSET },
      // Let inner panels that can actually scroll (data-scroll-area) handle their own wheel events.
      prevent: (node) => node.hasAttribute("data-scroll-area") && node.scrollHeight > node.clientHeight + 1,
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: Target) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: NAV_OFFSET, force: true });
      return;
    }
    if (typeof target === "number") window.scrollTo({ top: target });
    else (typeof target === "string" ? document.querySelector<HTMLElement>(target) : target)?.scrollIntoView();
  }, []);
  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);
  const api = useMemo(() => ({ scrollTo, stop, start }), [scrollTo, stop, start]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollApi {
  const api = useContext(ScrollContext);
  if (!api) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return api;
}
```

`src/components/ui/Toast.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const show = useCallback((message: string) => {
    window.clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, message });
    timer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
      >
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-card"
            >
              {toast.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}
```

`src/components/layout/Providers.tsx`:

```tsx
"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { SmoothScroll } from "./SmoothScroll";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <ToastProvider>{children}</ToastProvider>
      </SmoothScroll>
    </MotionConfig>
  );
}
```

`src/components/layout/RevealObserver.tsx`:

```tsx
"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not(.is-in)";

/** Adds .is-in to [data-reveal] elements as they enter the viewport, including ones mounted later. */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("app-ready");
    if (root.classList.contains("reduced") || !("IntersectionObserver" in window)) {
      root.classList.add("reveal-all");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    const observeWithin = (scope: ParentNode) => scope.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    observeWithin(document);
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
```

`src/components/layout/Cursor.tsx`:

```tsx
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

type Mode = { kind: "idle" } | { kind: "link" } | { kind: "label"; text: string };

const sameMode = (a: Mode, b: Mode) =>
  a.kind === b.kind && (a.kind !== "label" || (b.kind === "label" && a.text === b.text));

/** Follower ring that grows over links and shows a label over [data-cursor] elements. The native cursor stays. */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  if (!fine || reduced) return null;
  return <CursorRing />;
}

function CursorRing() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 45, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 600, damping: 45, mass: 0.35 });
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      const next: Mode = labelled?.dataset.cursor
        ? { kind: "label", text: labelled.dataset.cursor }
        : target?.closest("a, button, [role='button'], input, label")
          ? { kind: "link" }
          : { kind: "idle" };
      setMode((prev) => (sameMode(prev, next) ? prev : next));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  const size = mode.kind === "label" ? 84 : mode.kind === "link" ? 52 : 26;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ x: sx, y: sy }}>
      <div
        className={cn(
          "grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[width,height,background-color,border-color,opacity] duration-300 ease-out-expo",
          mode.kind === "label" && "bg-ink text-cream",
          mode.kind === "link" && "bg-ink/10",
          mode.kind === "idle" && "border border-ink/35",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ width: size, height: size }}
      >
        {mode.kind === "label" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{mode.text}</span>
        )}
      </div>
    </motion.div>
  );
}
```

`src/components/ui/Pill.tsx`:

```tsx
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { magneticOffset } from "@/lib/magnet";

type Variant = "solid" | "outline";

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  magnetic?: boolean;
  className?: string;
  "aria-label"?: string;
}

interface LinkPill extends CommonProps {
  href: string;
  external?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

interface ButtonPill extends CommonProps {
  href?: undefined;
  onClick: () => void;
  "aria-pressed"?: boolean;
  disabled?: boolean;
}

const base =
  "relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";
const variants: Record<Variant, string> = {
  solid: "bg-ink text-cream hover:bg-[#2b2b2b]",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream",
};

/** Pill link or button. `magnetic` drifts it toward a fine pointer by up to 8px. */
export function Pill(props: LinkPill | ButtonPill) {
  const { children, variant = "solid", magnetic = false, className } = props;
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const active = magnetic && fine && !reduced;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18 });
  const y = useSpring(my, { stiffness: 260, damping: 18 });

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!active) return;
    const offset = magneticOffset(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    mx.set(offset.x);
    my.set(offset.y);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };
  const cls = cn(base, variants[variant], className);

  if (props.href !== undefined) {
    return (
      <motion.a
        href={props.href}
        className={cls}
        style={{ x, y }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={props.onClick}
        aria-label={props["aria-label"]}
        {...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      className={cls}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={props.onClick}
      aria-label={props["aria-label"]}
      aria-pressed={props["aria-pressed"]}
      disabled={props.disabled}
    >
      {children}
    </motion.button>
  );
}
```

`src/components/ui/SectionHeading.tsx`:

```tsx
interface SectionHeadingProps {
  headingId: string;
  /** Two-digit section number; omitted for unnumbered sections */
  index?: string;
  label: string;
  lead: string;
  accent: string;
  className?: string;
}

/** "01 — ABOUT" label over a bold sans lead and an italic serif accent. */
export function SectionHeading({ headingId, index, label, lead, accent, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="label" data-reveal>
        {index ? `${index} — ${label}` : label}
      </p>
      <h2 id={headingId} className="section-title mt-5" data-reveal="mask">
        <span className="mask">
          <span>{lead}</span>
        </span>{" "}
        <span className="mask">
          <span className="accent">{accent}</span>
        </span>
      </h2>
    </div>
  );
}
```

- [ ] **Step 7: Replace the layout**

The inline gate script must be a raw `<script>` in `<head>`: `next/script` with `beforeInteractive` is deferred until the Next.js runtime loads, which would flash content.

`src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Cursor } from "@/components/layout/Cursor";
import { Providers } from "@/components/layout/Providers";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { profile } from "@/content/profile";

const sans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE = "https://baltejgoud.github.io";
const title = "Baltej Goud — Data Analyst & AI Engineer";
const description =
  "Baltej Goud is a data analyst, AI engineer and co-founder & CEO of Sanket. Selected work, skills, experience and résumé.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    type: "website",
    url: "/",
    title,
    description,
    images: [
      {
        url: "/assets/social-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Baltej Goud — data analyst, AI engineer and co-founder",
      },
    ],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/assets/social-cover.jpg"] },
};

export const viewport: Viewport = { themeColor: "#f6f4ee", colorScheme: "light" };

/** Runs before first paint: enables motion styles, honours reduced motion, and reveals everything if the app never boots. */
const gate = `(function(d,w){var c=d.documentElement.classList;c.add("js");if(w.matchMedia("(prefers-reduced-motion: reduce)").matches)c.add("reduced");w.setTimeout(function(){if(!c.contains("app-ready"))c.add("reveal-all")},3000)})(document,window);`;

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.fullName,
  jobTitle: ["Data Analyst", "AI Engineer", "Co-founder & CEO of Sanket"],
  url: `${SITE}/`,
  image: `${SITE}/profile.jpg`,
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressCountry: "IN" },
  worksFor: { "@type": "Organization", name: "Sanket" },
  sameAs: [profile.links.linkedin, profile.links.github],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gate }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <RevealObserver />
        <Cursor />
      </body>
    </html>
  );
}
```

`src/app/page.tsx` (temporary until the hero arrives):

```tsx
export default function Home() {
  return (
    <main id="main">
      <h1 className="container-page section section-title">Baltej Goud</h1>
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm run lint && npm test && npm run build`
Then: `node -e "const h=require('fs').readFileSync('out/index.html','utf8');console.log(h.split('</head>')[0].includes('app-ready'))" && grep -l -- "--font-jakarta" out/_next/static/chunks/*.css`
Expected: lint clean, 24 tests pass, build succeeds, the script prints `true` (gate script in `<head>`), and the grep lists one CSS file (font variables compiled).

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat(shell): design tokens, fonts, reveal system, smooth scroll, cursor and pills

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sticky navbar with the active-section pill

**Files:**
- Create: `src/lib/activeSection.ts`, `src/hooks/useActiveSection.ts`, `src/hooks/useScrolledPast.ts`, `src/components/layout/Navbar.tsx`, `src/components/layout/MobileMenu.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/lib/activeSection.test.ts`

**Interfaces:**
- Consumes: `navItems`, `navIds`, `profile` (Task 3); `useSmoothScroll`, `cn`, `pad2` (Tasks 3–4).
- Produces: `resolveActive(order, intersecting): string | null`; `useActiveSection(ids): string | null`; `useScrolledPast(threshold): boolean`; `<Navbar />`; `<MobileMenu open onClose active />`.

- [ ] **Step 1: Write the failing test**

`src/lib/activeSection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveActive } from "@/lib/activeSection";

const order = ["about", "skills", "work", "contact"];

describe("resolveActive", () => {
  it("returns null when nothing is in the band", () => {
    expect(resolveActive(order, new Set())).toBeNull();
  });

  it("returns the intersecting section", () => {
    expect(resolveActive(order, new Set(["work"]))).toBe("work");
  });

  it("prefers the earlier section when two touch the band", () => {
    expect(resolveActive(order, new Set(["contact", "skills"]))).toBe("skills");
  });

  it("ignores ids that are not in the nav", () => {
    expect(resolveActive(order, new Set(["top"]))).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- src/lib/activeSection.test.ts`
Expected: FAIL — cannot resolve `@/lib/activeSection`.

- [ ] **Step 3: Implement**

`src/lib/activeSection.ts`:

```ts
/** First id, in page order, whose section is currently inside the observer band. */
export function resolveActive(
  order: readonly string[],
  intersecting: ReadonlySet<string>,
): string | null {
  return order.find((id) => intersecting.has(id)) ?? null;
}
```

- [ ] **Step 4: Run the test**

Run: `npm test -- src/lib/activeSection.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Add the hooks and components**

`src/hooks/useActiveSection.ts`:

```ts
import { useEffect, useState } from "react";
import { resolveActive } from "@/lib/activeSection";

/** Id of the nav section crossing the middle band of the viewport, or null (e.g. in the hero). */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const intersecting = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }
        setActive(resolveActive(ids, intersecting));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids]);
  return active;
}
```

`src/hooks/useScrolledPast.ts`:

```ts
import { useCallback, useSyncExternalStore } from "react";

/** True once the page has scrolled more than `threshold` pixels. */
export function useScrolledPast(threshold: number): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("scroll", onChange, { passive: true });
    return () => window.removeEventListener("scroll", onChange);
  }, []);
  return useSyncExternalStore(subscribe, () => window.scrollY > threshold, () => false);
}
```

`src/components/layout/Navbar.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { MobileMenu } from "./MobileMenu";
import { navIds, navItems } from "@/content/sections";
import { profile } from "@/content/profile";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { cn } from "@/lib/cn";

export function Navbar() {
  const active = useActiveSection(navIds);
  const scrolled = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButton.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-line bg-cream/75 backdrop-blur-md" : "border-transparent",
      )}
    >
      <nav aria-label="Main" className="container-page flex h-[var(--nav-h)] items-center justify-between">
        <a href="#top" className="flex items-center gap-3" aria-label={`${profile.name} — back to top`}>
          <span className="grid size-10 place-items-center rounded-[10px] bg-ink font-mono text-sm font-medium text-cream">
            {profile.monogram}
          </span>
          <span className="font-semibold tracking-tight">{profile.name}</span>
        </a>
        <ul className="hidden items-center gap-1 min-[900px]:flex">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive ? "text-cream" : "text-stone hover:text-ink",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
        <button
          ref={menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
          className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold min-[900px]:hidden"
        >
          Menu
        </button>
      </nav>
      <MobileMenu open={menuOpen} onClose={closeMenu} active={active} />
    </header>
  );
}
```

`src/components/layout/MobileMenu.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type MouseEvent } from "react";
import { useSmoothScroll } from "./SmoothScroll";
import { navItems } from "@/content/sections";
import { profile } from "@/content/profile";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/sections";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active: string | null;
}

/** Full-screen sheet for narrow screens: traps focus, closes on Escape, pauses page scroll. */
export function MobileMenu({ open, onClose, active }: MobileMenuProps) {
  const { scrollTo, stop, start } = useSmoothScroll();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      start();
    };
  }, [open, onClose, stop, start]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    onClose();
    requestAnimationFrame(() => scrollTo(`#${id}`));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-cream px-[var(--gutter)] pb-8"
        >
          <div className="flex h-[var(--nav-h)] items-center justify-between">
            <span className="font-semibold tracking-tight">{profile.name}</span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-cream"
            >
              Close
            </button>
          </div>
          <ul className="mt-8 flex flex-1 flex-col gap-2">
            {navItems.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => go(e, item.id)}
                  aria-current={active === item.id ? "location" : undefined}
                  className={cn(
                    "flex items-baseline gap-4 border-b border-line py-3 text-4xl font-extrabold tracking-tight",
                    active === item.id ? "text-ink" : "text-ink/70",
                  )}
                >
                  <span className="font-mono text-xs font-normal text-stone">{pad2(i + 1)}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 font-mono text-xs text-stone">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.links.resume}>Résumé ↗</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

`src/app/page.tsx`:

```tsx
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <h1 className="container-page section section-title">Baltej Goud</h1>
      </main>
    </>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run lint && npm test && npm run build`
Expected: clean, 28 tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat(nav): sticky navbar with sliding active pill and mobile menu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Hero — watermark, cutout portrait and entrance

**Files:**
- Create: `scripts/prepare-images.cjs`, `public/images/portrait-cutout.webp`, `public/images/id-photo.webp` (generated)
- Create: `src/lib/parallax.ts`, `src/components/hero/Watermark.tsx`, `HeroMedia.tsx`, `HeroVideo.tsx`, `HeroPointer.tsx`, `Hero.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/lib/parallax.test.ts`

**Interfaces:**
- Consumes: `profile`, `hero`, `HeroMediaContent` (Task 3); `Pill`, `vars`, `cn`, `usePrefersReducedMotion` (Task 4).
- Produces: `pointerToOffset(clientX, clientY, rect): {x; y}` in −1…1; `<Hero />` rendering `section#top` with the only `h1` on the page; `/images/id-photo.webp` used by Task 8.

- [ ] **Step 1: Write the failing test**

`src/lib/parallax.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pointerToOffset } from "@/lib/parallax";

const rect = { left: 0, top: 0, width: 200, height: 100 };

describe("pointerToOffset", () => {
  it("is zero at the centre", () => {
    expect(pointerToOffset(100, 50, rect)).toEqual({ x: 0, y: 0 });
  });

  it("is -1 at the top-left corner and 1 at the bottom-right", () => {
    expect(pointerToOffset(0, 0, rect)).toEqual({ x: -1, y: -1 });
    expect(pointerToOffset(200, 100, rect)).toEqual({ x: 1, y: 1 });
  });

  it("clamps outside the element", () => {
    expect(pointerToOffset(-50, 400, rect)).toEqual({ x: -1, y: 1 });
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- src/lib/parallax.test.ts`
Expected: FAIL — cannot resolve `@/lib/parallax`.

- [ ] **Step 3: Implement**

`src/lib/parallax.ts`:

```ts
/** Pointer position inside `rect` mapped to -1…1 on each axis (0 at the centre), clamped. */
export function pointerToOffset(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 2 - 1),
    y: clamp(((clientY - rect.top) / rect.height) * 2 - 1),
  };
}
```

Run: `npm test -- src/lib/parallax.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 4: Cut the portrait out of its background**

This downloads rembg and its `u2net_human_seg` model (about 170 MB) once; Baltej approved this.

```bash
mkdir -p .cache
uvx --python 3.12 --from "rembg[cpu,cli]" rembg i -m u2net_human_seg -a public/assets/portrait.webp .cache/portrait-cutout.png
```

Expected: `.cache/portrait-cutout.png` exists. If `uvx` fails, use the library directly:

```bash
py -3.12 -m pip install "rembg[cpu]"
py -3.12 -c "from rembg import remove, new_session; from PIL import Image; remove(Image.open('public/assets/portrait.webp'), session=new_session('u2net_human_seg'), alpha_matting=True).save('.cache/portrait-cutout.png')"
```

- [ ] **Step 5: Add the image script and generate the web images**

`scripts/prepare-images.cjs`:

```js
/* Prepare hero imagery: node scripts/prepare-images.cjs <cutout.png>
   Writes public/images/portrait-cutout.webp (trimmed, transparent) and
   public/images/id-photo.webp (square head-and-shoulders crop of the original portrait). */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const cutout = process.argv[2];
if (!cutout || !fs.existsSync(cutout)) {
  console.error("Usage: node scripts/prepare-images.cjs <cutout.png>");
  process.exit(1);
}
const out = path.join(root, "public/images");
fs.mkdirSync(out, { recursive: true });

(async () => {
  const hero = await sharp(cutout)
    .trim({ threshold: 1 })
    .resize({ width: 720, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(path.join(out, "portrait-cutout.webp"));
  console.log(`portrait-cutout.webp ${hero.width}×${hero.height}, ${(hero.size / 1024).toFixed(0)} KB`);

  const id = await sharp(path.join(root, "public/assets/portrait.webp"))
    .extract({ left: 182, top: 262, width: 360, height: 360 })
    .resize(320, 320)
    .webp({ quality: 85 })
    .toFile(path.join(out, "id-photo.webp"));
  console.log(`id-photo.webp ${id.width}×${id.height}, ${(id.size / 1024).toFixed(0)} KB`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run: `npm run images -- .cache/portrait-cutout.png`
Expected: prints `portrait-cutout.webp 720×…` and `id-photo.webp 320×320`.

- [ ] **Step 6: Inspect both images**

Open `public/images/portrait-cutout.webp` and `public/images/id-photo.webp` with the Read tool and look at them. Accept the cutout only if no fence, building or ground remains and the hair, hands and shirt edges are clean. The ID photo must show head and shoulders, centred. If the cutout fails this check, **stop and report to Baltej** with the image; the spec's fallback (a framed portrait) is his call. If only the ID crop is off, adjust the `extract` box in `scripts/prepare-images.cjs` and re-run.

- [ ] **Step 7: Add the hero components**

`src/components/hero/Watermark.tsx`:

```tsx
import { vars } from "@/lib/style";

/** First name spread edge to edge as giant low-opacity letters that rise in on load. */
export function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="flex select-none justify-between overflow-hidden px-[1vw] text-[23vw] font-extrabold leading-[0.85] tracking-[-0.04em] text-watermark"
    >
      {text
        .toUpperCase()
        .split("")
        .map((letter, i) => (
          <span key={`${letter}-${i}`} className="hero-rise inline-block" style={vars({ "--delay": `${i * 40}ms` })}>
            {letter}
          </span>
        ))}
    </div>
  );
}
```

`src/components/hero/HeroVideo.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { vars } from "@/lib/style";

interface HeroVideoProps {
  video: { src: string; poster: string };
  alt: string;
  className?: string;
}

/** Muted looping avatar clip; autoplays unless reduced motion is set, with a sound pill. */
export function HeroVideo({ video, alt, className }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!reduced) ref.current?.play().catch(() => {});
  }, [reduced]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <video
        ref={ref}
        className="h-full w-full object-contain object-bottom"
        src={video.src}
        poster={video.poster}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="absolute bottom-[22%] left-1/2 flex -translate-x-1/2 gap-2">
        {!playing && (
          <button
            type="button"
            onClick={() => ref.current?.play()}
            className="h-10 rounded-full bg-paper px-4 text-xs font-semibold shadow-card"
          >
            Play
          </button>
        )}
        <button
          type="button"
          aria-pressed={!muted}
          onClick={() => setMuted((m) => !m)}
          className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-cream"
        >
          <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("w-[2px] origin-bottom rounded-full bg-cream", !muted && playing ? "eq-bar" : "h-1")}
                style={vars({ "--delay": `${i * 120}ms` })}
              />
            ))}
          </span>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
    </div>
  );
}
```

`src/components/hero/HeroMedia.tsx`:

```tsx
import Image from "next/image";
import { HeroVideo } from "./HeroVideo";
import type { HeroMediaContent } from "@/content/types";
import { vars } from "@/lib/style";

const fade = "[mask-image:linear-gradient(to_bottom,black_78%,transparent)]";

/** The cutout portrait, or a talking-avatar video with a sound toggle when one is configured. */
export function HeroMedia({ image, video }: HeroMediaContent) {
  if (video) return <HeroVideo video={video} alt={image.alt} className={fade} />;
  return (
    <div className={`hero-fade relative h-full w-full ${fade}`} style={vars({ "--delay": "150ms" })}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 768px) 45vw, 90vw"
        className="object-contain object-bottom"
      />
    </div>
  );
}
```

`src/components/hero/HeroPointer.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { pointerToOffset } from "@/lib/parallax";

/** Writes --px / --py on the hero so .parallax layers drift with a fine pointer. */
export function HeroPointer() {
  useEffect(() => {
    const hero = document.getElementById("top");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hero || !fine || reduced) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { x, y } = pointerToOffset(e.clientX, e.clientY, hero.getBoundingClientRect());
        hero.style.setProperty("--px", x.toFixed(3));
        hero.style.setProperty("--py", y.toFixed(3));
      });
    };
    const onLeave = () => {
      hero.style.setProperty("--px", "0");
      hero.style.setProperty("--py", "0");
    };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
```

`src/components/hero/Hero.tsx`:

```tsx
import { HeroMedia } from "./HeroMedia";
import { HeroPointer } from "./HeroPointer";
import { Watermark } from "./Watermark";
import { Pill } from "@/components/ui/Pill";
import { hero, profile } from "@/content/profile";
import { vars } from "@/lib/style";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[max(100svh,640px)] flex-col overflow-hidden pt-[var(--nav-h)]"
    >
      <HeroPointer />
      <div
        className="parallax pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+4svh)] -z-10 md:top-[16svh]"
        style={vars({ "--depth": -12 })}
      >
        <Watermark text={profile.firstName} />
      </div>
      <div
        className="parallax relative mx-auto mt-6 h-[56svh] w-full max-w-[420px] md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:h-[84svh] md:max-w-none"
        style={vars({ "--depth": 6 })}
      >
        <HeroMedia {...hero} />
      </div>
      <div className="container-page relative z-10 mt-auto flex flex-col gap-6 pb-8 pt-6 md:flex-row md:items-end md:justify-between md:pb-12">
        <div>
          <p className="label hero-fade" style={vars({ "--delay": "350ms" })}>
            {profile.fullName}
          </p>
          <h1
            id="hero-title"
            className="mt-3 text-[clamp(3rem,7vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            <span className="mask block">
              <span className="hero-rise" style={vars({ "--delay": "450ms" })}>
                {profile.title.lead}
              </span>
            </span>
            <span className="mask block">
              <span className="hero-rise accent" style={vars({ "--delay": "540ms" })}>
                {profile.title.accent}
              </span>
            </span>
          </h1>
          <p className="hero-fade mt-4 max-w-sm text-stone" style={vars({ "--delay": "700ms" })}>
            {profile.tagline}
          </p>
        </div>
        <div className="hero-fade" style={vars({ "--delay": "800ms" })}>
          <Pill href="#work" magnetic>
            Explore work <span aria-hidden>↓</span>
          </Pill>
        </div>
      </div>
    </section>
  );
}
```

`src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero/Hero";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
      </main>
    </>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm run lint && npm test && npm run build`
Expected: clean, 31 tests pass, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add scripts/prepare-images.cjs public/images src
git commit -m "feat(hero): full-width watermark, cutout portrait, parallax and entrance

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Rope physics, PRNG and barcode

**Files:**
- Create: `src/lib/random.ts`, `src/lib/barcode.ts`, `src/lib/physics/rope.ts`
- Test: `src/lib/random.test.ts`, `src/lib/barcode.test.ts`, `src/lib/physics/rope.test.ts`

**Interfaces:**
- Produces: `hashString(input): number` (FNV-1a), `mulberry32(seed): () => number`; `barcode(seed, width, units = 60): {x; w}[]`; rope API — types `Vec`, `RopeConfig`, `Rope`, `Spin`; `SUBSTEP = 1/120`; `createRope(config)`, `setAnchor(rope, anchor)`, `pinEnd(rope, point | null)`, `nudge(rope, velocity)`, `stepRope(rope, dt?)`, `simulate(rope, elapsed, carry = 0): number`, `energy(rope)`, `endAngle(rope)` (radians; negative when the end swings right), `stepSpin(spin, target, dt, stiffness = 120, damping = 14)`, `ropePath(points): string`.

- [ ] **Step 1: Write the failing tests**

`src/lib/random.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashString, mulberry32 } from "@/lib/random";

describe("hashString", () => {
  it("matches FNV-1a reference values", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });
});

describe("mulberry32", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it("returns floats in [0, 1)", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

`src/lib/barcode.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { barcode } from "@/lib/barcode";

describe("barcode", () => {
  it("is deterministic for a seed", () => {
    expect(barcode("BALTEJGOUD", 120)).toEqual(barcode("BALTEJGOUD", 120));
  });

  it("differs between seeds", () => {
    expect(barcode("A", 120)).not.toEqual(barcode("B", 120));
  });

  it("starts at 0 and ends exactly at the width", () => {
    const bars = barcode("BALTEJGOUD", 120);
    expect(bars[0].x).toBe(0);
    const last = bars[bars.length - 1];
    expect(last.x + last.w).toBeCloseTo(120, 9);
  });

  it("keeps bars apart and between one and three units wide", () => {
    const bars = barcode("BALTEJGOUD", 120);
    const unit = Math.min(...bars.map((b) => b.w));
    for (let i = 0; i < bars.length; i++) {
      expect(bars[i].w).toBeLessThanOrEqual(unit * 3 + 1e-9);
      if (i > 0) expect(bars[i].x).toBeGreaterThan(bars[i - 1].x + bars[i - 1].w - 1e-9);
    }
  });
});
```

`src/lib/physics/rope.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createRope,
  endAngle,
  energy,
  nudge,
  pinEnd,
  ropePath,
  setAnchor,
  simulate,
  stepRope,
  stepSpin,
  SUBSTEP,
  type Rope,
  type RopeConfig,
} from "@/lib/physics/rope";
import { mulberry32 } from "@/lib/random";

const config: RopeConfig = {
  anchor: { x: 100, y: 0 },
  segments: 9,
  segmentLength: 18,
  gravity: 2400,
  damping: 0.985,
  iterations: 12,
  endMass: 6,
  maxStretch: 1.35,
};

const run = (rope: Rope, seconds: number) => {
  for (let t = 0; t < seconds; t += SUBSTEP) stepRope(rope);
};
const end = (rope: Rope) => rope.pos[rope.pos.length - 1];

describe("rope", () => {
  it("hangs straight down from the anchor", () => {
    const rope = createRope(config);
    run(rope, 2);
    expect(Math.abs(end(rope).x - 100)).toBeLessThan(0.01);
    expect(end(rope).y).toBeGreaterThan(150);
  });

  it("keeps segment lengths within 2% once settled", () => {
    const rope = createRope(config);
    nudge(rope, { x: 800, y: 0 });
    run(rope, 12);
    for (let i = 0; i < rope.pos.length - 1; i++) {
      const d = Math.hypot(rope.pos[i + 1].x - rope.pos[i].x, rope.pos[i + 1].y - rope.pos[i].y);
      expect(Math.abs(d - 18) / 18).toBeLessThan(0.02);
    }
  });

  it("comes to rest after a swing", () => {
    const rope = createRope(config);
    nudge(rope, { x: 800, y: 0 });
    run(rope, 20);
    expect(energy(rope)).toBeLessThan(1e-6);
    expect(Math.abs(end(rope).x - 100)).toBeLessThan(0.5);
  });

  it("moves when nudged", () => {
    const rope = createRope(config);
    nudge(rope, { x: 600, y: 0 });
    stepRope(rope);
    expect(end(rope).x).toBeGreaterThan(100);
  });

  it("stays finite and within reach through random drags and releases", () => {
    const rope = createRope(config);
    const rand = mulberry32(1);
    const reach = config.segments * config.segmentLength * config.maxStretch;
    for (let step = 0; step < 10_000; step++) {
      if (step % 50 === 0) {
        if (rand() < 0.5) pinEnd(rope, { x: 100 + (rand() - 0.5) * 800, y: (rand() - 0.2) * 800 });
        else {
          pinEnd(rope, null);
          nudge(rope, { x: (rand() - 0.5) * 5000, y: (rand() - 0.5) * 5000 });
        }
      }
      stepRope(rope);
      for (const p of rope.pos) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        expect(Math.hypot(p.x - 100, p.y)).toBeLessThan(reach * 1.25);
      }
    }
  });

  it("clamps a pin to the maximum reach", () => {
    const rope = createRope(config);
    pinEnd(rope, { x: 100, y: 10_000 });
    expect(rope.pin?.y).toBeCloseTo(config.segments * config.segmentLength * config.maxStretch, 6);
  });

  it("carries the rope with its anchor", () => {
    const rope = createRope(config);
    setAnchor(rope, { x: 160, y: 0 });
    expect(end(rope).x).toBe(160);
    expect(rope.config.anchor.x).toBe(160);
  });

  it("runs whole substeps and returns the remainder", () => {
    const rope = createRope(config);
    const carry = simulate(rope, 0.02);
    expect(carry).toBeGreaterThanOrEqual(0);
    expect(carry).toBeLessThan(SUBSTEP);
  });
});

describe("endAngle", () => {
  it("is zero when hanging straight", () => {
    expect(endAngle(createRope(config))).toBeCloseTo(0, 9);
  });

  it("is negative when the end swings to the right", () => {
    const rope = createRope(config);
    rope.pos[rope.pos.length - 1].x += 10;
    expect(endAngle(rope)).toBeLessThan(0);
  });
});

describe("stepSpin", () => {
  it("settles on the target", () => {
    const spin = { angle: 0, velocity: 0 };
    for (let t = 0; t < 5; t += SUBSTEP) stepSpin(spin, 0.4, SUBSTEP);
    expect(spin.angle).toBeCloseTo(0.4, 3);
  });
});

describe("ropePath", () => {
  it("starts at the anchor and ends at the last point", () => {
    const d = ropePath(createRope(config).pos);
    expect(d.startsWith("M 100.0 0.0")).toBe(true);
    expect(d.endsWith("L 100.0 162.0")).toBe(true);
    expect(d.match(/ Q /g)).toHaveLength(config.segments - 1);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm test -- src/lib/random.test.ts src/lib/barcode.test.ts src/lib/physics`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/random.ts`:

```ts
/** FNV-1a 32-bit hash of a string. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`src/lib/barcode.ts`:

```ts
import { hashString, mulberry32 } from "./random";

export interface Bar {
  x: number;
  w: number;
}

/**
 * Decorative barcode: alternating bars and gaps of 1–3 units, starting and
 * ending with a bar, scaled to fill `width`. Deterministic for a seed.
 */
export function barcode(seed: string, width: number, units = 60): Bar[] {
  const rand = mulberry32(hashString(seed));
  const runs: number[] = [];
  let total = 0;
  while (total < units) {
    const run = 1 + Math.floor(rand() * 3);
    runs.push(run);
    total += run;
  }
  if (runs.length % 2 === 0) {
    runs.push(1);
    total += 1;
  }
  const unit = width / total;
  const bars: Bar[] = [];
  let cursor = 0;
  runs.forEach((run, i) => {
    if (i % 2 === 0) bars.push({ x: cursor * unit, w: run * unit });
    cursor += run;
  });
  return bars;
}
```

`src/lib/physics/rope.ts`:

```ts
export interface Vec {
  x: number;
  y: number;
}

export interface RopeConfig {
  anchor: Vec;
  segments: number;
  segmentLength: number;
  /** px/s² */
  gravity: number;
  /** Velocity kept per substep, e.g. 0.985 */
  damping: number;
  /** Constraint passes per substep */
  iterations: number;
  /** Weight of the end particle (the card) relative to the strap particles */
  endMass: number;
  /** How far the end may be pulled, as a multiple of the rope's rest length */
  maxStretch: number;
}

export interface Rope {
  config: RopeConfig;
  pos: Vec[];
  prev: Vec[];
  /** When set, the end particle is held at this point (the user is dragging) */
  pin: Vec | null;
}

export interface Spin {
  angle: number;
  velocity: number;
}

export const SUBSTEP = 1 / 120;

/** A rope hanging straight down from its anchor, at rest. */
export function createRope(config: RopeConfig): Rope {
  const pos = Array.from({ length: config.segments + 1 }, (_, i) => ({
    x: config.anchor.x,
    y: config.anchor.y + i * config.segmentLength,
  }));
  return { config, pos, prev: pos.map((p) => ({ ...p })), pin: null };
}

/** Move the anchor and carry every particle with it (used on resize). */
export function setAnchor(rope: Rope, anchor: Vec): void {
  const dx = anchor.x - rope.config.anchor.x;
  const dy = anchor.y - rope.config.anchor.y;
  rope.config = { ...rope.config, anchor };
  for (const list of [rope.pos, rope.prev]) {
    for (const p of list) {
      p.x += dx;
      p.y += dy;
    }
  }
}

/** Hold the end at `point` (clamped to the maximum reach), or release it with `null`. */
export function pinEnd(rope: Rope, point: Vec | null): void {
  if (!point) {
    rope.pin = null;
    return;
  }
  const { anchor, segments, segmentLength, maxStretch } = rope.config;
  const reach = segments * segmentLength * maxStretch;
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const d = Math.hypot(dx, dy);
  rope.pin = d > reach ? { x: anchor.x + (dx / d) * reach, y: anchor.y + (dy / d) * reach } : { ...point };
}

/** Give the end particle a velocity (px/s), e.g. on release or a key press. */
export function nudge(rope: Rope, velocity: Vec): void {
  const i = rope.pos.length - 1;
  rope.prev[i].x -= velocity.x * SUBSTEP;
  rope.prev[i].y -= velocity.y * SUBSTEP;
}

/** One Verlet substep followed by distance-constraint relaxation. Mutates the rope. */
export function stepRope(rope: Rope, dt: number = SUBSTEP): void {
  const { pos, prev, config } = rope;
  const last = pos.length - 1;
  pos[0].x = config.anchor.x;
  pos[0].y = config.anchor.y;
  prev[0].x = config.anchor.x;
  prev[0].y = config.anchor.y;

  for (let i = 1; i <= last; i++) {
    const p = pos[i];
    const q = prev[i];
    if (i === last && rope.pin) {
      p.x = q.x = rope.pin.x;
      p.y = q.y = rope.pin.y;
      continue;
    }
    const vx = (p.x - q.x) * config.damping;
    const vy = (p.y - q.y) * config.damping;
    q.x = p.x;
    q.y = p.y;
    p.x += vx;
    p.y += vy + config.gravity * dt * dt;
  }

  for (let k = 0; k < config.iterations; k++) {
    for (let i = 0; i < last; i++) {
      const a = pos[i];
      const b = pos[i + 1];
      const wa = i === 0 ? 0 : 1;
      const wb = i + 1 === last ? (rope.pin ? 0 : 1 / config.endMass) : 1;
      const sum = wa + wb;
      if (sum === 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const diff = (d - config.segmentLength) / d;
      a.x += dx * diff * (wa / sum);
      a.y += dy * diff * (wa / sum);
      b.x -= dx * diff * (wb / sum);
      b.y -= dy * diff * (wb / sum);
    }
  }
}

/** Advance by `elapsed` seconds in fixed substeps; returns the leftover time to carry into the next frame. */
export function simulate(rope: Rope, elapsed: number, carry = 0): number {
  let t = carry + Math.min(Math.max(elapsed, 0), 0.1);
  while (t >= SUBSTEP) {
    stepRope(rope, SUBSTEP);
    t -= SUBSTEP;
  }
  return t;
}

/** Sum of squared per-substep displacements — near zero when the rope is at rest. */
export function energy(rope: Rope): number {
  let e = 0;
  for (let i = 1; i < rope.pos.length; i++) {
    const dx = rope.pos[i].x - rope.prev[i].x;
    const dy = rope.pos[i].y - rope.prev[i].y;
    e += dx * dx + dy * dy;
  }
  return e;
}

/**
 * CSS rotation (radians, clockwise positive) that aligns a card hanging from
 * the end with the last segment. Negative when the end swings right.
 */
export function endAngle(rope: Rope): number {
  const n = rope.pos.length;
  const a = rope.pos[n - 2];
  const b = rope.pos[n - 1];
  return Math.atan2(a.x - b.x, b.y - a.y);
}

/** Damped angular spring toward `target` (semi-implicit Euler). Mutates `spin`. */
export function stepSpin(spin: Spin, target: number, dt: number, stiffness = 120, damping = 14): void {
  const accel = stiffness * (target - spin.angle) - damping * spin.velocity;
  spin.velocity += accel * dt;
  spin.angle += spin.velocity * dt;
}

/** Smooth SVG path through the rope's particles. */
export function ropePath(points: readonly Vec[]): string {
  if (points.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const n = points[i + 1];
    d += ` Q ${f(p.x)} ${f(p.y)} ${f((p.x + n.x) / 2)} ${f((p.y + n.y) / 2)}`;
  }
  const end = points[points.length - 1];
  return `${d} L ${f(end.x)} ${f(end.y)}`;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/lib/random.test.ts src/lib/barcode.test.ts src/lib/physics`
Expected: PASS — 19 tests (3 + 4 + 12).

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat(physics): Verlet rope, angular spring, PRNG and decorative barcode

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: About — bio, physics lanyard, what I do, quick facts

**Files:**
- Create: `src/components/about/Barcode.tsx`, `IdCard.tsx`, `Lanyard.tsx`, `QuickFacts.tsx`, `About.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: rope API and `barcode` (Task 7); `profile`, `sections`, `sectionIndices`, `pad2` (Task 3); `Pill`, `SectionHeading` (Task 4); `/images/id-photo.webp` (Task 6).
- Produces: `<About index: string />` rendering `section#about`.

- [ ] **Step 1: Add the components**

`src/components/about/Barcode.tsx`:

```tsx
import { barcode } from "@/lib/barcode";

interface BarcodeProps {
  seed: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Barcode({ seed, width = 120, height = 32, className }: BarcodeProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden className={className}>
      {barcode(seed, width).map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}
```

`src/components/about/IdCard.tsx`:

```tsx
import Image from "next/image";
import { Barcode } from "./Barcode";
import { profile } from "@/content/profile";

/** Face of the lanyard badge. 260 × 392. */
export function IdCard() {
  const { idCard } = profile;
  return (
    <div className="flex h-full w-full flex-col rounded-[20px] bg-paper p-5 shadow-card ring-1 ring-line">
      <div aria-hidden className="mx-auto h-2 w-12 rounded-full bg-cream ring-1 ring-line" />
      <div className="mt-3 flex items-center justify-between">
        <span className="label text-ink">{idCard.heading}</span>
        <span className="font-mono text-[10px] text-stone">{profile.monogram}</span>
      </div>
      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl bg-cream">
        <Image src="/images/id-photo.webp" alt="" fill sizes="220px" className="object-cover" draggable={false} />
      </div>
      <p className="mt-4 text-[15px] font-bold leading-tight tracking-tight">{profile.fullName}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {idCard.roles.map((role) => (
          <span
            key={role}
            className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-stone"
          >
            {role}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-ink">
        <Barcode seed={idCard.barcodeSeed} width={118} height={30} />
        <span className="font-mono text-[10px] text-stone">{idCard.number}</span>
      </div>
    </div>
  );
}
```

`src/components/about/Lanyard.tsx` — physics runs in one effect that writes straight to the DOM (no React state per frame):

```tsx
"use client";

import { useEffect, useRef } from "react";
import { IdCard } from "./IdCard";
import { profile } from "@/content/profile";
import {
  createRope,
  endAngle,
  energy,
  nudge,
  pinEnd,
  ropePath,
  setAnchor,
  simulate,
  stepSpin,
  type Spin,
  type Vec,
} from "@/lib/physics/rope";

const SEGMENTS = 9;
const SEGMENT_LENGTH = 18;
const CARD_W = 260;
const STRAP_TEXT = `${profile.name.toUpperCase()} · DATA ANALYST · `.repeat(4);
const KEY_IMPULSES: Record<string, Vec> = {
  ArrowLeft: { x: -650, y: 0 },
  ArrowRight: { x: 650, y: 0 },
  ArrowUp: { x: 0, y: -700 },
  ArrowDown: { x: 0, y: 400 },
};

/** Hanging ID badge on a Verlet strap: drag it, fling it, or nudge it with the arrow keys. */
export function Lanyard() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const strap = strapRef.current;
    const card = cardRef.current;
    if (!wrap || !strap || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rope = createRope({
      anchor: { x: wrap.clientWidth / 2, y: 0 },
      segments: SEGMENTS,
      segmentLength: SEGMENT_LENGTH,
      gravity: 2400,
      damping: 0.985,
      iterations: 12,
      endMass: 6,
      maxStretch: 1.35,
    });
    const spin: Spin = { angle: 0, velocity: 0 };
    let raf = 0;
    let last = 0;
    let carry = 0;
    let still = 0;
    let visible = false;
    let greeted = false;
    let drag: { id: number; offset: Vec; samples: { x: number; y: number; t: number }[] } | null = null;
    const endOf = () => rope.pos[rope.pos.length - 1];

    card.style.left = "0px";
    card.style.top = "0px";
    card.style.marginLeft = "0px";

    const render = () => {
      const end = endOf();
      strap.setAttribute("d", ropePath(rope.pos));
      const twist = Math.max(-25, Math.min(25, spin.velocity * 6));
      card.style.transform = `translate3d(${end.x - CARD_W / 2}px, ${end.y}px, 0) rotate(${spin.angle}rad) rotateY(${twist}deg)`;
    };
    const tick = (time: number) => {
      const dt = last ? (time - last) / 1000 : 1 / 60;
      last = time;
      carry = simulate(rope, dt, carry);
      stepSpin(spin, endAngle(rope), Math.min(dt, 0.05));
      render();
      const resting =
        !drag &&
        energy(rope) < 1e-4 &&
        Math.abs(spin.velocity) < 1e-3 &&
        Math.abs(spin.angle - endAngle(rope)) < 1e-3;
      still = resting ? still + 1 : 0;
      if (still > 60 || !visible) {
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      still = 0;
      if (!raf && visible && !reduced) raf = requestAnimationFrame(tick);
    };
    const local = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      card.setPointerCapture(e.pointerId);
      const p = local(e);
      const end = endOf();
      drag = { id: e.pointerId, offset: { x: p.x - end.x, y: p.y - end.y }, samples: [{ ...p, t: e.timeStamp }] };
      pinEnd(rope, end);
      card.dataset.dragging = "true";
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = local(e);
      drag.samples = [...drag.samples.slice(-4), { ...p, t: e.timeStamp }];
      pinEnd(rope, { x: p.x - drag.offset.x, y: p.y - drag.offset.y });
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const first = drag.samples[0];
      const latest = drag.samples[drag.samples.length - 1];
      const seconds = Math.max((latest.t - first.t) / 1000, 1 / 120);
      const clamp = (v: number) => Math.max(-2500, Math.min(2500, v));
      drag = null;
      delete card.dataset.dragging;
      pinEnd(rope, null);
      nudge(rope, { x: clamp((latest.x - first.x) / seconds), y: clamp((latest.y - first.y) / seconds) });
      wake();
    };
    const onKey = (e: KeyboardEvent) => {
      let impulse = KEY_IMPULSES[e.key];
      if (!impulse && (e.key === "Enter" || e.key === " ")) {
        impulse = { x: endOf().x < rope.config.anchor.x ? 650 : -650, y: 0 };
      }
      if (!impulse || reduced) return;
      e.preventDefault();
      nudge(rope, impulse);
      wake();
    };

    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
    card.addEventListener("keydown", onKey);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !greeted && !reduced) {
          greeted = true;
          nudge(rope, { x: 420, y: 0 });
        }
        wake();
      },
      { threshold: 0.2 },
    );
    io.observe(wrap);
    const ro = new ResizeObserver(() => {
      setAnchor(rope, { x: wrap.clientWidth / 2, y: 0 });
      render();
      wake();
    });
    ro.observe(wrap);
    render();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      card.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div ref={wrapRef} className="relative mx-auto h-[560px] w-full max-w-[360px] [perspective:1200px] lg:h-[600px]">
        <span aria-hidden className="lanyard-static absolute left-1/2 top-0 h-[162px] w-4 -translate-x-1/2 rounded-full bg-ink" />
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path id="lanyard-strap" ref={strapRef} fill="none" stroke="var(--color-ink)" strokeWidth={16} strokeLinecap="round" />
          <text dy={3} className="fill-cream font-mono text-[8px] tracking-[0.2em]">
            <textPath href="#lanyard-strap" startOffset={2}>
              {STRAP_TEXT}
            </textPath>
          </text>
        </svg>
        <div
          ref={cardRef}
          role="button"
          tabIndex={0}
          data-cursor="Drag"
          aria-label="Developer ID card. Drag it, or press the arrow keys, to swing it."
          className="absolute left-1/2 top-[162px] -ml-[130px] h-[392px] w-[260px] origin-top cursor-grab touch-none select-none [transform-style:preserve-3d] data-[dragging=true]:cursor-grabbing"
        >
          <span
            aria-hidden
            className="absolute -top-5 left-1/2 h-7 w-9 -translate-x-1/2 rounded-md bg-gradient-to-b from-[#dedad2] to-[#a9a59c] shadow-sm ring-1 ring-black/10"
          />
          <IdCard />
        </div>
      </div>
      <p className="mt-2 font-serif text-lg italic text-stone">Pull the ID card — it swings!</p>
    </div>
  );
}
```

`src/components/about/QuickFacts.tsx`:

```tsx
import { profile } from "@/content/profile";

export function QuickFacts() {
  return (
    <dl className="mt-4 divide-y divide-line border-y border-line">
      {profile.facts.map((fact) => (
        <div key={fact.label} className="grid grid-cols-[104px_1fr] gap-4 py-3 text-sm">
          <dt className="label pt-0.5">{fact.label}</dt>
          <dd className="font-medium">
            {fact.live && <span aria-hidden className="live-dot" />}
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

`src/components/about/About.tsx`:

```tsx
import { Lanyard } from "./Lanyard";
import { QuickFacts } from "./QuickFacts";
import { Pill } from "@/components/ui/Pill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { profile } from "@/content/profile";
import { pad2 } from "@/lib/sections";

export function About({ index }: { index: string }) {
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-page grid items-start gap-14 lg:grid-cols-[1.05fr_0.9fr_1.05fr] lg:gap-10">
        <div>
          <SectionHeading headingId="about-title" index={index} label="About" lead="Hi, I’m" accent={`${profile.firstName}.`} />
          <div className="mt-8 space-y-4 text-[1.02rem] leading-relaxed text-ink/80" data-reveal>
            {profile.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3" data-reveal>
            <Pill href={profile.links.resume} magnetic>
              Resume <span aria-hidden>↓</span>
            </Pill>
            <Pill href={profile.links.github} variant="outline" external>
              GitHub <span aria-hidden>↗</span>
            </Pill>
            <Pill href={profile.links.linkedin} variant="outline" external>
              LinkedIn <span aria-hidden>↗</span>
            </Pill>
          </div>
        </div>
        <Lanyard />
        <div className="space-y-10">
          <div data-reveal>
            <h3 className="label text-ink">What I do</h3>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {profile.whatIDo.map((item, i) => (
                <li key={item} className="flex items-baseline gap-4 py-3">
                  <span className="font-mono text-xs text-stone">{pad2(i + 1)}</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal>
            <h3 className="label text-ink">Quick facts</h3>
            <QuickFacts />
          </div>
          <blockquote className="border-t border-line pt-6 font-serif text-2xl italic leading-snug" data-reveal>
            “{profile.quote}”
          </blockquote>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add About to the page**

`src/app/page.tsx`:

```tsx
import { About } from "@/components/about/About";
import { Hero } from "@/components/hero/Hero";
import { Navbar } from "@/components/layout/Navbar";
import { sections } from "@/content/sections";
import { sectionIndices } from "@/lib/sections";

export default function Home() {
  const index = sectionIndices(sections);
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <About index={index.about} />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npm test && npm run build && npm run check`
Expected: lint clean, 50 tests pass, build succeeds. `npm run check` still fails, but only on `#experience` and `#contact` anchors (`#about` now resolves).

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "feat(about): bio, swinging ID-card lanyard, what I do and quick facts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Skills — the periodic table

**Files:**
- Create: `src/lib/grid.ts`, `src/components/skills/icons.ts`, `SkillIcon.tsx`, `SkillTile.tsx`, `SkillPreview.tsx`, `PeriodicTable.tsx`, `Skills.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/lib/grid.test.ts`, `src/components/skills/icons.test.ts`

**Interfaces:**
- Consumes: `skills`, `Skill`, `SkillCategory` (Task 3); `categoryMeta`, `categoryOrder`, `filterAnnouncement` (Task 3); `cn`, `SectionHeading` (Task 4).
- Produces: `gridMove(index, key, cols, count): number | null`; `skillIcons: Record<string, BrandIcon>`; `<Skills index />` rendering `section#skills`.

- [ ] **Step 1: Write the failing tests**

`src/lib/grid.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { gridMove } from "@/lib/grid";

describe("gridMove", () => {
  it("moves horizontally within bounds", () => {
    expect(gridMove(0, "ArrowRight", 8, 32)).toBe(1);
    expect(gridMove(0, "ArrowLeft", 8, 32)).toBe(0);
    expect(gridMove(31, "ArrowRight", 8, 32)).toBe(31);
  });

  it("moves a whole row vertically", () => {
    expect(gridMove(2, "ArrowDown", 8, 32)).toBe(10);
    expect(gridMove(10, "ArrowUp", 8, 32)).toBe(2);
    expect(gridMove(2, "ArrowDown", 4, 32)).toBe(6);
  });

  it("stays put at the top and bottom rows", () => {
    expect(gridMove(3, "ArrowUp", 8, 32)).toBe(3);
    expect(gridMove(29, "ArrowDown", 8, 32)).toBe(29);
  });

  it("jumps to the ends with Home and End", () => {
    expect(gridMove(17, "Home", 8, 32)).toBe(0);
    expect(gridMove(17, "End", 8, 32)).toBe(31);
  });

  it("ignores other keys", () => {
    expect(gridMove(5, "Enter", 8, 32)).toBeNull();
  });
});
```

`src/components/skills/icons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { skillIcons } from "./icons";
import { skills } from "@/content/skills";

describe("skillIcons", () => {
  it("has a logo for every skill that names one", () => {
    for (const s of skills) if (s.icon) expect(skillIcons[s.icon], s.icon).toBeDefined();
  });

  it("imports no unused logos", () => {
    const used = new Set(skills.map((s) => s.icon).filter(Boolean));
    for (const slug of Object.keys(skillIcons)) expect(used.has(slug), slug).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm test -- src/lib/grid.test.ts src/components/skills`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the grid helper and icon map**

`src/lib/grid.ts`:

```ts
/** Roving-focus target for an arrow key in a grid of `count` items in `cols` columns; null for other keys. */
export function gridMove(index: number, key: string, cols: number, count: number): number | null {
  switch (key) {
    case "ArrowRight":
      return Math.min(count - 1, index + 1);
    case "ArrowLeft":
      return Math.max(0, index - 1);
    case "ArrowDown":
      return index + cols < count ? index + cols : index;
    case "ArrowUp":
      return index - cols >= 0 ? index - cols : index;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
```

`src/components/skills/icons.ts` (named imports keep only these 26 logos in the bundle; Playwright has no simple-icons entry and falls back to its symbol):

```ts
import {
  siC,
  siDocker,
  siElectron,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siGit,
  siGooglecloud,
  siJavascript,
  siKubernetes,
  siModelcontextprotocol,
  siMongodb,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siOpenapiinitiative,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siSqlite,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
} from "simple-icons";

export interface BrandIcon {
  title: string;
  hex: string;
  path: string;
}

/** Logos by simple-icons slug. Only the icons imported here end up in the bundle. */
export const skillIcons: Record<string, BrandIcon> = {
  python: siPython,
  typescript: siTypescript,
  javascript: siJavascript,
  c: siC,
  react: siReact,
  nextdotjs: siNextdotjs,
  threedotjs: siThreedotjs,
  electron: siElectron,
  tailwindcss: siTailwindcss,
  nodedotjs: siNodedotjs,
  fastapi: siFastapi,
  express: siExpress,
  nestjs: siNestjs,
  openapiinitiative: siOpenapiinitiative,
  postgresql: siPostgresql,
  sqlite: siSqlite,
  mongodb: siMongodb,
  supabase: siSupabase,
  firebase: siFirebase,
  git: siGit,
  docker: siDocker,
  kubernetes: siKubernetes,
  figma: siFigma,
  googlecloud: siGooglecloud,
  pytorch: siPytorch,
  modelcontextprotocol: siModelcontextprotocol,
};
```

Run: `npm test -- src/lib/grid.test.ts src/components/skills`
Expected: PASS — 7 tests.

- [ ] **Step 4: Add the components**

`src/components/skills/SkillIcon.tsx`:

```tsx
import { skillIcons } from "./icons";
import type { Skill } from "@/content/types";

/** Brand logo in its own colour, or the element symbol when the skill has no logo. */
export function SkillIcon({ skill, className }: { skill: Skill; className?: string }) {
  const icon = skill.icon ? skillIcons[skill.icon] : undefined;
  if (!icon) {
    return (
      <span aria-hidden className="text-2xl font-extrabold tracking-tight lg:text-4xl">
        {skill.symbol}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={`${icon.title} logo`}>
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
```

`src/components/skills/SkillTile.tsx`:

```tsx
import type { Skill } from "@/content/types";
import { cn } from "@/lib/cn";
import { categoryMeta } from "@/lib/skills";

interface SkillTileProps {
  skill: Skill;
  number: number;
  state: "idle" | "match" | "dim";
  selected: boolean;
  tabIndex: number;
  onPreview: () => void;
  onFocus: () => void;
}

export function SkillTile({ skill, number, state, selected, tabIndex, onPreview, onFocus }: SkillTileProps) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onMouseEnter={onPreview}
      onClick={onPreview}
      onFocus={onFocus}
      aria-label={`${skill.name}, ${categoryMeta[skill.category].label}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative aspect-square rounded-[14px] border text-left transition-[background-color,color,opacity,border-color,transform,box-shadow] duration-300 ease-out-expo",
        state === "match"
          ? "border-ink bg-ink text-cream"
          : "border-line bg-paper/70 text-ink hover:-translate-y-0.5 hover:border-ink/40",
        state === "dim" && "opacity-35",
        selected && state !== "match" && "border-ink shadow-card",
      )}
    >
      <span className="absolute left-2 top-1.5 font-mono text-[10px] opacity-60">{number}</span>
      <span
        aria-hidden
        className="absolute right-2 top-2 size-1.5 rounded-full"
        style={{ background: categoryMeta[skill.category].color }}
      />
      <span className="absolute inset-0 grid place-items-center text-[1.4rem] font-extrabold tracking-tight sm:text-2xl md:text-[1.7rem] xl:text-[2rem]">
        {skill.symbol}
      </span>
      <span className="absolute inset-x-2 bottom-1.5 truncate text-[9.5px] font-medium opacity-70 md:text-[10.5px]">
        {skill.name}
      </span>
    </button>
  );
}
```

`src/components/skills/SkillPreview.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { SkillIcon } from "./SkillIcon";
import type { Skill } from "@/content/types";
import { categoryMeta } from "@/lib/skills";

export function SkillPreview({ skill }: { skill: Skill }) {
  const meta = categoryMeta[skill.category];
  return (
    <div className="min-h-[136px] rounded-[20px] border border-line bg-paper p-5 shadow-card lg:min-h-[420px] lg:p-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-4 lg:flex-col lg:gap-6"
        >
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cream lg:size-24">
            <SkillIcon skill={skill} className="size-7 lg:size-12" />
          </div>
          <div className="min-w-0">
            <p className="label flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight lg:text-3xl">{skill.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone lg:mt-4">
              <span className="font-medium text-ink">How I use it: </span>
              {skill.usage}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="label mt-6 hidden lg:block">Hover or tap any element</p>
    </div>
  );
}
```

`src/components/skills/PeriodicTable.tsx`:

```tsx
"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { SkillPreview } from "./SkillPreview";
import { SkillTile } from "./SkillTile";
import type { Skill, SkillCategory } from "@/content/types";
import { cn } from "@/lib/cn";
import { gridMove } from "@/lib/grid";
import { categoryMeta, categoryOrder, filterAnnouncement } from "@/lib/skills";

export function PeriodicTable({ skills }: { skills: Skill[] }) {
  const [category, setCategory] = useState<SkillCategory | null>(null);
  const [previewId, setPreviewId] = useState(skills[0].id);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const preview = skills.find((s) => s.id === previewId) ?? skills[0];

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const next = gridMove(focusIndex, e.key, cols, skills.length);
    if (next === null) return;
    e.preventDefault();
    setFocusIndex(next);
    grid.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <div className="mt-10">
      <div
        role="group"
        aria-label="Filter by category"
        className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {[null, ...categoryOrder].map((c) => {
          const active = category === c;
          return (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(c === null || active ? null : c)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                active ? "border-ink bg-ink text-cream" : "border-line bg-paper/60 text-ink hover:border-ink/40",
              )}
            >
              {c && <span aria-hidden className="size-2 rounded-full" style={{ background: categoryMeta[c].color }} />}
              {c ? categoryMeta[c].label : "All"}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {filterAnnouncement(skills, category)}
      </p>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          ref={gridRef}
          role="group"
          aria-label="Skills"
          onKeyDown={onGridKey}
          className="order-2 grid grid-cols-4 gap-2 sm:gap-2.5 md:order-1 md:grid-cols-8"
        >
          {skills.map((s, i) => (
            <SkillTile
              key={s.id}
              skill={s}
              number={i + 1}
              state={category === null ? "idle" : s.category === category ? "match" : "dim"}
              selected={s.id === previewId}
              tabIndex={i === focusIndex ? 0 : -1}
              onPreview={() => setPreviewId(s.id)}
              onFocus={() => {
                setPreviewId(s.id);
                setFocusIndex(i);
              }}
            />
          ))}
        </div>
        <div className="sticky top-[calc(var(--nav-h)+8px)] z-10 order-1 md:order-2 lg:top-28">
          <SkillPreview skill={preview} />
        </div>
      </div>
    </div>
  );
}
```

`src/components/skills/Skills.tsx`:

```tsx
import { PeriodicTable } from "./PeriodicTable";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { skills } from "@/content/skills";

export function Skills({ index }: { index: string }) {
  return (
    <section id="skills" aria-labelledby="skills-title" className="section border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="skills-title" index={index} label="Skills" lead="The periodic table" accent="of my stack." />
        <PeriodicTable skills={skills} />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add Skills to the page**

In `src/app/page.tsx`, add `import { Skills } from "@/components/skills/Skills";` with the other imports and render `<Skills index={index.skills} />` directly after `<About index={index.about} />`.

- [ ] **Step 6: Verify**

Run: `npm run lint && npm test && npm run build`
Expected: clean, 57 tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat(skills): periodic-table grid with category filters and live preview

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Project widget models

**Files:**
- Create: `src/lib/hash.ts`, `src/lib/widgets/forecast.ts`, `custody.ts`, `reconcile.ts`, `fairPrice.ts`, `importer.ts`, `atlas.ts`
- Test: `src/lib/widgets/widgets.test.ts`

**Interfaces:**
- Consumes: `hashString`, `mulberry32` (Task 7).
- Produces:
  - hash: `hasWebCrypto(): boolean`, `fnvHex(input): string`, `sha256Hex(input): Promise<string>`, `hashText(input): Promise<string>`.
  - forecast: types `Vertical`, `Decision`, `ForecastPoint`, `ForecastSeries`; `HISTORY_WEEKS = 26`, `FORECAST_WEEKS = 8`, `verticals`, `buildSeries(vertical): ForecastSeries`, `decide(point, stock): Decision`.
  - custody: `CustodyStep`, `defaultChain`, `tamperedPayloads`, `HashFn`, `chainHashes(steps, hash = hashText): Promise<string[]>`, `verify(signed, current): boolean[]`.
  - reconcile: `RunMode`, `Tone`, `LogLine`, `RunResult`, `runTransfer(mode): RunResult`.
  - fairPrice: `FACE_VALUE = 2500`, `PRICE_MIN = 1000`, `PRICE_MAX = 4000`, `PRICE_STEP = 50`, `Listing`, `evaluateListing(price, face?)`, `formatInr(amount)`.
  - importer: `ImportPhase`, `ImportState`, `ImportEvent`, `initialImport`, `reviewSummary`, `recordedDays`, `importReducer(state, event)`.
  - atlas: `ATLAS_TILES = 208`, `ATLAS_COLS = 16`, `drawCalls(progress)`, `tileOffset(index, cols?, total?)`.

- [ ] **Step 1: Write the failing tests**

`src/lib/widgets/widgets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fnvHex, sha256Hex } from "@/lib/hash";
import { ATLAS_TILES, drawCalls, tileOffset } from "@/lib/widgets/atlas";
import { chainHashes, defaultChain, tamperedPayloads, verify } from "@/lib/widgets/custody";
import { evaluateListing, FACE_VALUE, formatInr } from "@/lib/widgets/fairPrice";
import { buildSeries, decide, FORECAST_WEEKS, HISTORY_WEEKS, verticals, type Decision } from "@/lib/widgets/forecast";
import { importReducer, initialImport } from "@/lib/widgets/importer";
import { runTransfer } from "@/lib/widgets/reconcile";

describe("forecast", () => {
  it("is deterministic", () => {
    expect(buildSeries("fashion")).toEqual(buildSeries("fashion"));
  });

  it("has history followed by a banded forecast", () => {
    const { points } = buildSeries("agro");
    expect(points).toHaveLength(HISTORY_WEEKS + FORECAST_WEEKS);
    for (const p of points.slice(HISTORY_WEEKS)) {
      expect(p.forecast).toBe(true);
      expect(p.lower!).toBeLessThan(p.value);
      expect(p.upper!).toBeGreaterThan(p.value);
    }
  });

  it("decides by uncertainty first, then stock", () => {
    const base = { week: 30, forecast: true };
    expect(decide({ ...base, value: 100, lower: 70, upper: 130 }, 200)).toBe("Investigate");
    expect(decide({ ...base, value: 100, lower: 90, upper: 110 }, 105)).toBe("Replenish");
    expect(decide({ ...base, value: 100, lower: 90, upper: 110 }, 120)).toBe("Hold");
    expect(decide({ week: 3, value: 100, forecast: false }, 50)).toBe("Hold");
  });

  it("shows every decision somewhere in the demo", () => {
    const seen = new Set<Decision>();
    for (const v of verticals) {
      const { points, stock } = buildSeries(v.id);
      for (const p of points.slice(HISTORY_WEEKS)) seen.add(decide(p, stock));
    }
    expect([...seen].sort()).toEqual(["Hold", "Investigate", "Replenish"]);
  });
});

describe("custody", () => {
  it("hashes with SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(fnvHex("a")).toBe("e40c292c");
  });

  it("breaks the tampered step and every later one", async () => {
    const signed = await chainHashes(defaultChain);
    const tampered = defaultChain.map((s) => (s.id === "carrier" ? { ...s, payload: tamperedPayloads.carrier } : s));
    expect(verify(signed, await chainHashes(tampered))).toEqual([true, true, false, false]);
  });

  it("verifies an untouched chain", async () => {
    const signed = await chainHashes(defaultChain);
    expect(verify(signed, await chainHashes(defaultChain))).toEqual([true, true, true, true]);
  });
});

describe("reconcile", () => {
  it("posts the transfer twice with a naive retry", () => {
    const result = runTransfer("naive");
    expect(result.transfers).toBe(2);
    expect(result.lines.at(-1)?.tone).toBe("error");
  });

  it("posts it once when Tandem reconciles", () => {
    const result = runTransfer("tandem");
    expect(result.transfers).toBe(1);
    expect(result.lines.at(-1)?.text).toContain("retry skipped");
  });
});

describe("fair price", () => {
  it("lists at face value and blocks one step above it", () => {
    expect(evaluateListing(FACE_VALUE)).toEqual({ status: "listed", saving: 0 });
    expect(evaluateListing(FACE_VALUE + 50)).toEqual({ status: "blocked", over: 50 });
    expect(evaluateListing(1000)).toEqual({ status: "listed", saving: 1500 });
  });

  it("formats rupees with Indian grouping", () => {
    expect(formatInr(12000)).toBe("₹12,000");
    expect(formatInr(100000)).toBe("₹1,00,000");
  });
});

describe("importer", () => {
  it("parses to review, saves, and can be cancelled", () => {
    let s = importReducer(initialImport, { type: "start" });
    expect(s.phase).toBe("parsing");
    s = importReducer(s, { type: "tick", amount: 60 });
    s = importReducer(s, { type: "tick", amount: 60 });
    expect(s).toEqual({ phase: "review", progress: 100 });
    s = importReducer(s, { type: "save" });
    expect(s).toEqual({ phase: "saving", progress: 0 });
    expect(importReducer(s, { type: "cancel" }).phase).toBe("cancelled");
    s = importReducer(s, { type: "tick", amount: 100 });
    expect(s.phase).toBe("saved");
  });

  it("ignores events that do not apply", () => {
    expect(importReducer(initialImport, { type: "tick", amount: 50 })).toBe(initialImport);
    const review = { phase: "review" as const, progress: 100 };
    expect(importReducer(review, { type: "cancel" })).toBe(review);
  });
});

describe("atlas", () => {
  it("counts draw calls from 208 down to 1", () => {
    expect(drawCalls(0)).toBe(ATLAS_TILES);
    expect(drawCalls(1)).toBe(1);
    expect(drawCalls(0.5)).toBe(105);
    expect(drawCalls(2)).toBe(1);
  });

  it("measures tile offsets from the centre", () => {
    expect(tileOffset(0)).toEqual({ col: 0, row: 0, dx: 7.5, dy: 6 });
    expect(tileOffset(207)).toEqual({ col: 15, row: 12, dx: -7.5, dy: -6 });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm test -- src/lib/widgets`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/hash.ts`:

```ts
import { hashString } from "./random";

/** Whether Web Crypto's SHA-256 is available (secure contexts and Node). */
export function hasWebCrypto(): boolean {
  return typeof globalThis.crypto?.subtle?.digest === "function";
}

/** Labelled, non-cryptographic fallback: FNV-1a as 8 hex characters. */
export function fnvHex(input: string): string {
  return hashString(input).toString(16).padStart(8, "0");
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 when available, otherwise the FNV fallback. */
export async function hashText(input: string): Promise<string> {
  return hasWebCrypto() ? sha256Hex(input) : fnvHex(input);
}
```

`src/lib/widgets/forecast.ts`:

```ts
import { hashString, mulberry32 } from "@/lib/random";

export type Vertical = "fashion" | "electronics" | "pharma" | "agro";
export type Decision = "Replenish" | "Investigate" | "Hold";

export interface ForecastPoint {
  week: number;
  value: number;
  lower?: number;
  upper?: number;
  forecast: boolean;
}

export interface ForecastSeries {
  points: ForecastPoint[];
  stock: number;
}

export const HISTORY_WEEKS = 26;
export const FORECAST_WEEKS = 8;

export const verticals: { id: Vertical; label: string }[] = [
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
  { id: "pharma", label: "Pharma" },
  { id: "agro", label: "Agro" },
];

/** Illustrative demand shapes — not customer data. */
const profiles: Record<Vertical, { base: number; trend: number; season: number; noise: number; spread: number }> = {
  fashion: { base: 120, trend: 0.6, season: 38, noise: 10, spread: 0.32 },
  electronics: { base: 80, trend: 1.2, season: 14, noise: 8, spread: 0.22 },
  pharma: { base: 150, trend: 0.3, season: 8, noise: 5, spread: 0.12 },
  agro: { base: 95, trend: 0.2, season: 42, noise: 12, spread: 0.48 },
};

/** Seeded synthetic series: 26 weeks of history, then an 8-week forecast with a widening band. */
export function buildSeries(vertical: Vertical): ForecastSeries {
  const p = profiles[vertical];
  const rand = mulberry32(hashString(vertical));
  const points: ForecastPoint[] = [];
  for (let week = 0; week < HISTORY_WEEKS + FORECAST_WEEKS; week++) {
    const level = p.base + p.trend * week + p.season * Math.sin((week / 13) * Math.PI);
    if (week < HISTORY_WEEKS) {
      points.push({ week, value: Math.round(level + (rand() - 0.5) * 2 * p.noise), forecast: false });
    } else {
      const horizon = week - HISTORY_WEEKS + 1;
      const width = level * p.spread * Math.sqrt(horizon / FORECAST_WEEKS);
      points.push({
        week,
        value: Math.round(level),
        lower: Math.round(level - width),
        upper: Math.round(level + width),
        forecast: true,
      });
    }
  }
  const history = points.slice(0, HISTORY_WEEKS);
  const mean = history.reduce((sum, pt) => sum + pt.value, 0) / history.length;
  return { points, stock: Math.round(mean * 1.1) };
}

/**
 * Investigate when the band is wider than 40% of the forecast (too uncertain to act on);
 * otherwise Replenish when the upper band exceeds stock on hand; otherwise Hold.
 */
export function decide(point: ForecastPoint, stock: number): Decision {
  if (!point.forecast || point.lower === undefined || point.upper === undefined) return "Hold";
  if (point.upper - point.lower > 0.4 * point.value) return "Investigate";
  if (point.upper > stock) return "Replenish";
  return "Hold";
}
```

`src/lib/widgets/custody.ts`:

```ts
import { hashText } from "@/lib/hash";

export interface CustodyStep {
  id: string;
  label: string;
  payload: string;
}

export const defaultChain: CustodyStep[] = [
  { id: "farm", label: "Farm", payload: "Batch 0425 · Tomatoes · Harvested 06:10" },
  { id: "lab", label: "Lab", payload: "Residue test · Pass · 0.02 ppm" },
  { id: "carrier", label: "Carrier", payload: "Cold chain · 4 °C · 11 h" },
  { id: "distributor", label: "Distributor", payload: "Received · Seal intact" },
];

export const tamperedPayloads: Record<string, string> = {
  farm: "Batch 0425 · Tomatoes · Harvested 14:40",
  lab: "Residue test · Pass · 0.20 ppm",
  carrier: "Cold chain · 9 °C · 11 h",
  distributor: "Received · Seal broken",
};

export type HashFn = (input: string) => Promise<string>;

/** Each step's hash covers its own record and the previous hash, so a change breaks every later link. */
export async function chainHashes(steps: readonly CustodyStep[], hash: HashFn = hashText): Promise<string[]> {
  const hashes: string[] = [];
  let previous = "genesis";
  for (const step of steps) {
    previous = await hash(`${previous}|${step.id}|${step.payload}`);
    hashes.push(previous);
  }
  return hashes;
}

/** true where the current hash still matches the one signed at creation. */
export function verify(signed: readonly string[], current: readonly string[]): boolean[] {
  return signed.map((hash, i) => current[i] === hash);
}
```

`src/lib/widgets/reconcile.ts`:

```ts
export type RunMode = "naive" | "tandem";
export type Tone = "info" | "warn" | "ok" | "error";

export interface LogLine {
  text: string;
  tone: Tone;
}

export interface RunResult {
  lines: LogLine[];
  transfers: number;
}

/**
 * A transfer whose confirmation times out after the bank has already executed it.
 * A naive retry posts it twice; Tandem reconciles against the ledger and skips the retry.
 */
export function runTransfer(mode: RunMode): RunResult {
  const statement: string[] = [];
  const lines: LogLine[] = [];
  const submit = () => statement.push("TX-7731");

  if (mode === "tandem") lines.push({ text: "precheck · payee ACC-2048 exists", tone: "ok" });
  lines.push({ text: "submit · transfer ₹12,000 → ACC-2048", tone: "info" });
  submit();
  lines.push({ text: "response · timed out after 30 s", tone: "warn" });

  if (mode === "naive") {
    lines.push({ text: "retry · submitting the same transfer again", tone: "info" });
    submit();
    lines.push({ text: `result · ${statement.length} transfers posted — duplicate`, tone: "error" });
  } else {
    lines.push({ text: "ledger · outcome ambiguous, recorded as pending", tone: "warn" });
    const found = statement.includes("TX-7731");
    lines.push({
      text: found ? "reconcile · TX-7731 found on the statement" : "reconcile · not found, safe to retry",
      tone: "ok",
    });
    lines.push({ text: "result · executed once — retry skipped", tone: "ok" });
  }
  return { lines, transfers: statement.length };
}
```

`src/lib/widgets/fairPrice.ts`:

```ts
export const FACE_VALUE = 2500;
export const PRICE_MIN = 1000;
export const PRICE_MAX = 4000;
export const PRICE_STEP = 50;

export type Listing = { status: "listed"; saving: number } | { status: "blocked"; over: number };

/** Listings are allowed at or below face value and blocked above it. */
export function evaluateListing(price: number, face = FACE_VALUE): Listing {
  return price <= face ? { status: "listed", saving: face - price } : { status: "blocked", over: price - face };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
```

`src/lib/widgets/importer.ts`:

```ts
export type ImportPhase = "idle" | "parsing" | "review" | "saving" | "saved" | "cancelled";

export interface ImportState {
  phase: ImportPhase;
  progress: number;
}

export type ImportEvent =
  | { type: "start" }
  | { type: "tick"; amount: number }
  | { type: "cancel" }
  | { type: "save" }
  | { type: "reset" };

export const initialImport: ImportState = { phase: "idle", progress: 0 };

/** Illustrative counts shown at the review step. */
export const reviewSummary = { records: 12480, types: 9, missingTypes: 3 };

/** Illustrative 14-day step history: false means no measurement (unknown, never zero). */
export const recordedDays: boolean[] = [
  true, true, false, true, true, true, false, false, true, true, true, false, true, true,
];

export function importReducer(state: ImportState, event: ImportEvent): ImportState {
  switch (event.type) {
    case "start":
      return state.phase === "idle" || state.phase === "cancelled" || state.phase === "saved"
        ? { phase: "parsing", progress: 0 }
        : state;
    case "tick": {
      if (state.phase !== "parsing" && state.phase !== "saving") return state;
      const progress = Math.min(100, state.progress + event.amount);
      if (progress < 100) return { ...state, progress };
      return { phase: state.phase === "parsing" ? "review" : "saved", progress: 100 };
    }
    case "cancel":
      return state.phase === "parsing" || state.phase === "saving" ? { ...state, phase: "cancelled" } : state;
    case "save":
      return state.phase === "review" ? { phase: "saving", progress: 0 } : state;
    case "reset":
      return initialImport;
  }
}
```

`src/lib/widgets/atlas.ts`:

```ts
export const ATLAS_TILES = 208;
export const ATLAS_COLS = 16;

/** Draw calls shown while batching: 208 at progress 0, 1 at progress 1. */
export function drawCalls(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return Math.round(ATLAS_TILES - (ATLAS_TILES - 1) * p);
}

/** Grid position of a tile and its offset (in tiles) from the grid centre. */
export function tileOffset(index: number, cols = ATLAS_COLS, total = ATLAS_TILES) {
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { col, row, dx: (cols - 1) / 2 - col, dy: (rows - 1) / 2 - row };
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/lib/widgets`
Expected: PASS — 15 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat(widgets): pure models for the six project widgets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Project widget components

**Files:**
- Create: `src/components/work/widgets/WidgetFrame.tsx`, `ForecastWidget.tsx`, `AtlasWidget.tsx`, `ImportWidget.tsx`, `FairPriceWidget.tsx`, `CustodyWidget.tsx`, `ReconcileWidget.tsx`

**Interfaces:**
- Consumes: Task 10 models; `Pill`, `cn`, `vars` (Task 4).
- Produces: named exports `ForecastWidget`, `AtlasWidget`, `ImportWidget`, `FairPriceWidget`, `CustodyWidget`, `ReconcileWidget` (no props), loaded with `next/dynamic` in Task 12.

- [ ] **Step 1: Add the frame and the widgets**

`src/components/work/widgets/WidgetFrame.tsx`:

```tsx
import type { ReactNode } from "react";

interface WidgetFrameProps {
  title: string;
  caption: string;
  /** Marks synthetic data. Defaults to true. */
  illustrative?: boolean;
  children: ReactNode;
}

export function WidgetFrame({ title, caption, illustrative = true, children }: WidgetFrameProps) {
  return (
    <figure className="flex h-full min-h-[380px] flex-col rounded-[20px] border border-line bg-paper p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="label text-ink">{title}</span>
        {illustrative && (
          <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone">
            Illustrative
          </span>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
      <figcaption className="mt-4 font-mono text-[11px] leading-relaxed text-stone">{caption}</figcaption>
    </figure>
  );
}
```

`src/components/work/widgets/ForecastWidget.tsx` — the chart is scrubbed with a transparent native range input laid over the SVG, which gives pointer, touch and keyboard support for free:

```tsx
"use client";

import { useMemo, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import {
  buildSeries,
  decide,
  FORECAST_WEEKS,
  HISTORY_WEEKS,
  verticals,
  type Decision,
  type ForecastPoint,
  type Vertical,
} from "@/lib/widgets/forecast";

const W = 320;
const H = 170;
const PAD = 6;
const chip: Record<Decision, string> = {
  Replenish: "bg-ink text-cream",
  Investigate: "border border-cat-lang text-[#8a5a22]",
  Hold: "border border-line text-stone",
};

export function ForecastWidget() {
  const [vertical, setVertical] = useState<Vertical>("fashion");
  const [week, setWeek] = useState(HISTORY_WEEKS + 1);
  const { points, stock } = useMemo(() => buildSeries(vertical), [vertical]);

  const values = points.flatMap((p) => [p.value, p.lower ?? p.value, p.upper ?? p.value, stock]);
  const lo = Math.min(...values) * 0.9;
  const hi = Math.max(...values) * 1.05;
  const x = (w: number) => PAD + (w / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const line = (list: ForecastPoint[]) =>
    list.map((p, i) => `${i ? "L" : "M"} ${x(p.week).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const history = points.filter((p) => !p.forecast);
  const future = points.filter((p) => p.forecast);
  const band = [
    ...future.map((p) => `${x(p.week)},${y(p.upper ?? p.value)}`),
    ...[...future].reverse().map((p) => `${x(p.week)},${y(p.lower ?? p.value)}`),
  ].join(" ");
  const point = points[week];
  const decision = decide(point, stock);

  return (
    <WidgetFrame title="Sanket · SKU demand outlook" caption="Illustrative data. Drag across the chart to see the suggested action.">
      <div role="group" aria-label="Industry" className="flex flex-wrap gap-1.5">
        {verticals.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={v.id === vertical}
            onClick={() => setVertical(v.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              v.id === vertical ? "bg-ink text-cream" : "bg-cream text-stone hover:text-ink",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="relative mt-4 rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ink">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
          <line x1={PAD} x2={W - PAD} y1={y(stock)} y2={y(stock)} stroke="var(--color-stone)" strokeDasharray="3 4" />
          <polygon points={band} fill="var(--color-ink)" fillOpacity={0.08} />
          <path d={line(history)} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
          <path
            d={line([history[history.length - 1], ...future])}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <line x1={x(week)} x2={x(week)} y1={PAD} y2={H - PAD} stroke="var(--color-ink)" strokeOpacity={0.25} />
          <circle cx={x(week)} cy={y(point.value)} r={4.5} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2} />
        </svg>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          aria-label="Week"
          aria-valuetext={`Week ${week + 1}: ${point.value} units, ${decision}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] leading-relaxed text-stone">
          W{week + 1} · {point.value} units{point.forecast ? ` · range ${point.lower}–${point.upper}` : ""}
          <br />
          Stock on hand · {stock}
        </p>
        <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", chip[decision])}>{decision}</span>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
        {HISTORY_WEEKS} weeks history · {FORECAST_WEEKS}-week forecast
      </p>
    </WidgetFrame>
  );
}
```

`src/components/work/widgets/AtlasWidget.tsx`:

```tsx
"use client";

import { animate, type AnimationPlaybackControls } from "motion/react";
import { useRef, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { vars } from "@/lib/style";
import { ATLAS_TILES, drawCalls, tileOffset } from "@/lib/widgets/atlas";

const PALETTE = ["#181818", "#4a7fb0", "#7a756d", "#5b8c5a", "#b8962e"];
const TILES = Array.from({ length: ATLAS_TILES }, (_, i) => ({ ...tileOffset(i), color: PALETTE[(i * 7) % PALETTE.length] }));

export function AtlasWidget() {
  const [batched, setBatched] = useState(false);
  const [calls, setCalls] = useState(ATLAS_TILES);
  const animation = useRef<AnimationPlaybackControls | null>(null);

  const toggle = () => {
    const next = !batched;
    setBatched(next);
    animation.current?.stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCalls(next ? 1 : ATLAS_TILES);
      return;
    }
    const from = (ATLAS_TILES - calls) / (ATLAS_TILES - 1);
    animation.current = animate(from, next ? 1 : 0, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (p) => setCalls(drawCalls(p)),
    });
  };

  return (
    <WidgetFrame
      title="Axon · Draw calls per frame"
      caption="208 monitor screens in the 3D campus, rendered from one texture atlas."
      illustrative={false}
    >
      <div className="flex items-end justify-between" aria-live="polite">
        <p className="text-5xl font-extrabold tabular-nums tracking-tight">{calls}</p>
        <p className="font-mono text-[11px] text-stone">draw {calls === 1 ? "call" : "calls"}</p>
      </div>
      <div aria-hidden className={cn("atlas relative mt-4 grid grid-cols-16 gap-[3px] rounded-xl bg-cream p-3", batched && "is-batched")}>
        {TILES.map((tile, i) => (
          <span
            key={i}
            className="atlas-tile aspect-[4/3] rounded-[2px]"
            style={{ ...vars({ "--dx": tile.dx, "--dy": tile.dy, "--i": i % 9 }), background: tile.color }}
          />
        ))}
        <span className="atlas-sheet absolute inset-[16%] rounded-md" />
      </div>
      <div className="mt-4">
        <Pill onClick={toggle} aria-pressed={batched}>
          {batched ? "Unbatch" : "Batch into atlas"}
        </Pill>
      </div>
    </WidgetFrame>
  );
}
```

`src/components/work/widgets/ImportWidget.tsx`:

```tsx
"use client";

import { useEffect, useReducer } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { importReducer, initialImport, recordedDays, reviewSummary } from "@/lib/widgets/importer";

const STEPS = ["Parse", "Review", "Save"];
const STEP_INDEX = { idle: -1, parsing: 0, review: 1, saving: 2, saved: 3, cancelled: -1 } as const;

export function ImportWidget() {
  const [state, dispatch] = useReducer(importReducer, initialImport);
  const { phase, progress } = state;

  useEffect(() => {
    if (phase !== "parsing" && phase !== "saving") return;
    const id = window.setInterval(() => dispatch({ type: "tick", amount: phase === "parsing" ? 3 : 6 }), 50);
    return () => window.clearInterval(id);
  }, [phase]);

  const step = STEP_INDEX[phase];
  return (
    <WidgetFrame title="VIGOR · Apple Health import" caption="Illustrative export. Nothing is saved until the import has been reviewed.">
      <div className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
        <span className="font-mono text-xs">export.zip</span>
        <span className="font-mono text-[11px] text-stone">Apple Health · 412 MB</span>
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-center text-xs font-medium",
              i < step ? "border-ink bg-ink text-cream" : i === step ? "border-ink text-ink" : "border-line text-stone",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
      <div
        role="progressbar"
        aria-label="Import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream"
      >
        <div className="h-full rounded-full bg-ink" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 min-h-[128px]" aria-live="polite">
        {phase === "idle" && <Pill onClick={() => dispatch({ type: "start" })}>Start import</Pill>}
        {(phase === "parsing" || phase === "saving") && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone">{phase === "parsing" ? "Parsing records…" : "Saving reviewed records…"}</p>
            <Pill variant="outline" onClick={() => dispatch({ type: "cancel" })}>
              Cancel
            </Pill>
          </div>
        )}
        {phase === "review" && (
          <div>
            <p className="text-sm">
              <strong>{reviewSummary.records.toLocaleString("en-IN")}</strong> records · {reviewSummary.types} types ·{" "}
              <span className="text-stone">{reviewSummary.missingTypes} types missing</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill onClick={() => dispatch({ type: "save" })}>Save records</Pill>
              <Pill variant="outline" onClick={() => dispatch({ type: "reset" })}>
                Discard
              </Pill>
            </div>
          </div>
        )}
        {phase === "cancelled" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone">Import cancelled — nothing saved.</p>
            <Pill variant="outline" onClick={() => dispatch({ type: "start" })}>
              Start again
            </Pill>
          </div>
        )}
        {phase === "saved" && (
          <div>
            <p className="label">Last 14 days · steps</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {recordedDays.map((recorded, i) => (
                <li
                  key={i}
                  title={recorded ? "Recorded" : "Unknown"}
                  className={cn("size-4 rounded-full", recorded ? "bg-ink" : "border border-dashed border-stone")}
                >
                  <span className="sr-only">
                    Day {i + 1}: {recorded ? "recorded" : "unknown"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-[10px] text-stone">● recorded · ○ unknown, never counted as zero</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "reset" })}
              className="mt-2 text-xs font-medium underline underline-offset-4"
            >
              Run again
            </button>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
```

`src/components/work/widgets/FairPriceWidget.tsx`:

```tsx
"use client";

import { useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import { evaluateListing, FACE_VALUE, formatInr, PRICE_MAX, PRICE_MIN, PRICE_STEP } from "@/lib/widgets/fairPrice";

export function FairPriceWidget() {
  const [price, setPrice] = useState(2200);
  const listing = evaluateListing(price);
  const listed = listing.status === "listed";

  return (
    <WidgetFrame title="ExtraTicket · Fair-price listing" caption="Illustrative event. Listings above face value are blocked.">
      <div className="rounded-2xl border border-line p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Indie night · Hyderabad</p>
            <p className="mt-1 text-sm text-stone">Face value {formatInr(FACE_VALUE)}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              listed ? "bg-live/15 text-[#13753a]" : "bg-alert/10 text-alert",
            )}
          >
            {listed ? "Listed ✓" : "Blocked"}
          </span>
        </div>
        <p className="mt-5 text-4xl font-extrabold tabular-nums tracking-tight">{formatInr(price)}</p>
        <p className="mt-1 text-sm text-stone" aria-live="polite">
          {listing.status === "listed"
            ? listing.saving > 0
              ? `${formatInr(listing.saving)} below face value`
              : "At face value"
            : `${formatInr(listing.over)} above face value. Listings are capped.`}
        </p>
      </div>
      <label className="mt-5 block">
        <span className="label">Asking price</span>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          aria-valuetext={formatInr(price)}
          className="mt-3 w-full accent-ink"
        />
      </label>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-stone">
        <span>{formatInr(PRICE_MIN)}</span>
        <span>{formatInr(PRICE_MAX)}</span>
      </div>
    </WidgetFrame>
  );
}
```

`src/components/work/widgets/CustodyWidget.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import { hasWebCrypto } from "@/lib/hash";
import { chainHashes, defaultChain, tamperedPayloads, verify, type CustodyStep } from "@/lib/widgets/custody";

export function CustodyWidget() {
  const [chain, setChain] = useState<CustodyStep[]>(defaultChain);
  const [signed, setSigned] = useState<string[]>([]);
  const [current, setCurrent] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    chainHashes(defaultChain).then((hashes) => {
      if (!alive) return;
      setSigned(hashes);
      setCurrent(hashes);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ok = verify(signed, current);
  const firstBroken = ok.indexOf(false);
  const tamper = (id: string) => {
    const next = chain.map((s) => (s.id === id ? { ...s, payload: tamperedPayloads[id] } : s));
    setChain(next);
    chainHashes(next).then(setCurrent);
  };
  const reset = () => {
    setChain(defaultChain);
    setCurrent(signed);
  };

  return (
    <WidgetFrame
      title="AgriTrust · Custody chain"
      caption={
        hasWebCrypto()
          ? "Each step hashes its record with the one before it (SHA-256 via Web Crypto)."
          : "Each step hashes its record with the one before it (non-cryptographic fallback hash)."
      }
    >
      <ol className="space-y-2">
        {chain.map((step, i) => {
          const good = ok[i] ?? true;
          const tampered = step.payload !== defaultChain[i].payload;
          return (
            <li
              key={step.id}
              className={cn("rounded-xl border px-3 py-2.5 transition-colors", good ? "border-line bg-paper" : "border-alert/40 bg-alert/5")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{step.label}</span>
                <span className={cn("font-mono text-[10px]", good ? "text-stone" : "text-alert")}>
                  {current[i] ? current[i].slice(0, 8) : "········"} {good ? "✓" : "✕"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-stone">{step.payload}</span>
                <button
                  type="button"
                  disabled={tampered || signed.length === 0}
                  onClick={() => tamper(step.id)}
                  className="shrink-0 text-[11px] font-medium underline underline-offset-4 disabled:no-underline disabled:opacity-40"
                >
                  Tamper
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between" aria-live="polite">
        <p className={cn("text-sm font-semibold", firstBroken >= 0 ? "text-alert" : "text-ink")}>
          {firstBroken >= 0 ? `Chain broken from step ${firstBroken + 1}` : "Chain verified"}
        </p>
        <button type="button" onClick={reset} className="text-xs font-medium underline underline-offset-4">
          Reset
        </button>
      </div>
    </WidgetFrame>
  );
}
```

`src/components/work/widgets/ReconcileWidget.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { runTransfer, type RunMode, type Tone } from "@/lib/widgets/reconcile";

const toneClass: Record<Tone, string> = {
  info: "text-cream/80",
  warn: "text-[#e9c46a]",
  ok: "text-[#86d39b]",
  error: "text-[#f08a7c]",
};

export function ReconcileWidget() {
  const [mode, setMode] = useState<RunMode | null>(null);
  const [runId, setRunId] = useState(0);
  const [shown, setShown] = useState(0);
  const result = useMemo(() => (mode ? runTransfer(mode) : null), [mode]);
  const total = result?.lines.length ?? 0;

  useEffect(() => {
    if (shown >= total) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setShown((n) => n + 1), reduced ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [shown, total, runId]);

  const run = (next: RunMode) => {
    setMode(next);
    setShown(0);
    setRunId((n) => n + 1);
  };
  const done = result !== null && shown >= total;

  return (
    <WidgetFrame title="Tandem · Transfer after a timeout" caption="Simulated banking interface. Compare a blind retry with reconciliation.">
      <div className="flex flex-wrap gap-2">
        <Pill variant={mode === "naive" ? "solid" : "outline"} onClick={() => run("naive")}>
          Naive retry
        </Pill>
        <Pill variant={mode === "tandem" ? "solid" : "outline"} onClick={() => run("tandem")}>
          Tandem run
        </Pill>
      </div>
      <div className="mt-4 h-[176px] overflow-hidden rounded-xl bg-ink p-4 font-mono text-[11px] leading-relaxed" aria-live="polite">
        {!result && <p className="text-cream/50">$ choose a run to start</p>}
        {result?.lines.slice(0, shown).map((line, i) => (
          <p key={`${runId}-${i}`} className={toneClass[line.tone]}>
            {line.text}
          </p>
        ))}
      </div>
      <p className={cn("mt-3 text-sm font-semibold", !done && "invisible", result && result.transfers > 1 ? "text-alert" : "text-ink")}>
        {result && (result.transfers > 1 ? `✕ ${result.transfers} transfers posted` : "✓ 1 transfer posted")}
      </p>
    </WidgetFrame>
  );
}
```

- [ ] **Step 2: Verify they compile and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no output from either. (They are rendered and exercised in Task 12 and checked in the browser in Task 16.)

- [ ] **Step 3: Commit**

```bash
git add src/components/work/widgets
git commit -m "feat(widgets): forecast, atlas, import, fair-price, custody and reconcile widgets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Selected work — the project accordion

**Files:**
- Create: `src/components/work/ProjectWidget.tsx`, `ProjectPanel.tsx`, `ProjectAccordion.tsx`, `Work.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `projects`, `Project`, `WidgetKind` (Task 3); widgets (Task 11); `Pill`, `SectionHeading`, `cn` (Task 4).
- Produces: `<Work index />` rendering `section#work`. Buttons have ids `project-<id>-button`, panels `project-<id>-panel`. The panel is marked `data-scroll-area` (Lenis yields to it when it can scroll).

- [ ] **Step 1: Add the components**

`src/components/work/ProjectWidget.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import type { WidgetKind } from "@/content/types";

function WidgetLoading() {
  return <div className="h-full min-h-[380px] animate-pulse rounded-[20px] border border-line bg-cream" />;
}

const ForecastWidget = dynamic(() => import("./widgets/ForecastWidget").then((m) => m.ForecastWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const AtlasWidget = dynamic(() => import("./widgets/AtlasWidget").then((m) => m.AtlasWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const ImportWidget = dynamic(() => import("./widgets/ImportWidget").then((m) => m.ImportWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const FairPriceWidget = dynamic(() => import("./widgets/FairPriceWidget").then((m) => m.FairPriceWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const CustodyWidget = dynamic(() => import("./widgets/CustodyWidget").then((m) => m.CustodyWidget), {
  ssr: false,
  loading: WidgetLoading,
});
const ReconcileWidget = dynamic(() => import("./widgets/ReconcileWidget").then((m) => m.ReconcileWidget), {
  ssr: false,
  loading: WidgetLoading,
});

/** Loads a project's widget only when its panel first opens. */
export function ProjectWidget({ kind }: { kind: WidgetKind }) {
  switch (kind) {
    case "forecast":
      return <ForecastWidget />;
    case "atlas":
      return <AtlasWidget />;
    case "import":
      return <ImportWidget />;
    case "fairPrice":
      return <FairPriceWidget />;
    case "custody":
      return <CustodyWidget />;
    case "reconcile":
      return <ReconcileWidget />;
  }
}
```

`src/components/work/ProjectPanel.tsx` — `animate` is false for the first render, so the default-open project is never server-rendered with `opacity: 0`:

```tsx
"use client";

import { motion } from "motion/react";
import { ProjectWidget } from "./ProjectWidget";
import { Pill } from "@/components/ui/Pill";
import type { Project } from "@/content/types";

/** Expanded project: details on the left, live widget on the right (stacked below 1280px). */
export function ProjectPanel({ project, animate }: { project: Project; animate: boolean }) {
  const { github, caseStudy } = project.links;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      data-scroll-area
      className="grid gap-8 px-5 pb-6 sm:px-8 sm:pb-8 xl:h-[584px] xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:overflow-y-auto"
    >
      <div className="flex flex-col">
        <p className="hidden text-[clamp(2rem,3.4vw,3.25rem)] font-extrabold leading-none tracking-[-0.04em] xl:block">{project.title}</p>
        <p className="label xl:hidden">{project.category}</p>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/80">{project.summary}</p>
        <p className="mt-2 text-sm text-stone">{project.role}</p>
        <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {project.features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm leading-snug">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />
              {feature}
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.map((tech) => (
            <li key={tech} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-stone">
              {tech}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
          {github ? (
            <Pill href={github} external magnetic>
              View on GitHub <span aria-hidden>↗</span>
            </Pill>
          ) : (
            caseStudy && (
              <Pill href={caseStudy} magnetic>
                Read case study <span aria-hidden>↗</span>
              </Pill>
            )
          )}
          {github && caseStudy && (
            <a
              href={caseStudy}
              className="text-sm font-semibold underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Case study ↗
            </a>
          )}
        </div>
      </div>
      <div className="min-h-[380px]">
        <ProjectWidget kind={project.widget} />
      </div>
    </motion.div>
  );
}
```

`src/components/work/ProjectAccordion.tsx`:

```tsx
"use client";

import { useState, type KeyboardEvent } from "react";
import { ProjectPanel } from "./ProjectPanel";
import type { Project } from "@/content/types";
import { cn } from "@/lib/cn";

const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Horizontal accordion of spines on wide screens; a vertical accordion below 1280px. One open at a time. */
export function ProjectAccordion({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);

  const open = (i: number, button: HTMLButtonElement) => {
    setActive(i);
    setInteracted(true);
    if (!window.matchMedia("(min-width: 1280px)").matches) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => button.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = projects.length - 1;
    else if (e.key in MOVES) next = (i + MOVES[e.key] + projects.length) % projects.length;
    else return;
    e.preventDefault();
    document.getElementById(`project-${projects[next].id}-button`)?.focus();
  };

  return (
    <div className="mt-14 flex flex-col gap-3 xl:h-[640px] xl:flex-row">
      {projects.map((project, i) => {
        const isOpen = i === active;
        return (
          <article
            key={project.id}
            className={cn(
              "overflow-hidden rounded-[24px] border border-line transition-[flex-grow,flex-basis,background-color,border-color] duration-[600ms] ease-out-expo",
              isOpen ? "bg-paper shadow-card xl:flex-[1_1_0%]" : "bg-cream hover:border-ink/30 xl:flex-[0_0_76px]",
            )}
          >
            <h3>
              <button
                id={`project-${project.id}-button`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`project-${project.id}-panel`}
                data-cursor={isOpen ? undefined : "Open"}
                onClick={(e) => open(i, e.currentTarget)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="block w-full text-left"
              >
                <span className="sr-only">{project.title}</span>
                {!isOpen && (
                  <span aria-hidden className="hidden h-[640px] w-[76px] flex-col items-center justify-between py-6 xl:flex">
                    <span className="font-mono text-xs text-stone">{project.index}</span>
                    <span className="rotate-180 whitespace-nowrap text-lg font-bold tracking-tight [writing-mode:vertical-rl]">
                      {project.title}
                    </span>
                    <span className="text-lg text-stone">+</span>
                  </span>
                )}
                <span aria-hidden className={cn("flex items-center gap-4 px-5 py-4 sm:px-8", !isOpen && "xl:hidden")}>
                  <span className="font-mono text-xs text-stone">{project.index}</span>
                  <span className="flex-1 truncate text-xl font-extrabold tracking-tight xl:hidden">{project.title}</span>
                  <span className="label hidden xl:inline">{project.category}</span>
                  <span className={cn("text-xl text-stone transition-transform duration-300 xl:hidden", isOpen && "rotate-45")}>+</span>
                </span>
              </button>
            </h3>
            <div id={`project-${project.id}-panel`} role="region" aria-labelledby={`project-${project.id}-button`} hidden={!isOpen}>
              {isOpen && <ProjectPanel project={project} animate={interacted} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}
```

`src/components/work/Work.tsx`:

```tsx
import { ProjectAccordion } from "./ProjectAccordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/content/projects";

export function Work({ index }: { index: string }) {
  return (
    <section id="work" aria-labelledby="work-title" className="section border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="work-title" index={index} label="Selected work" lead="Things I’ve" accent="built." />
        <ProjectAccordion projects={projects} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add Work to the page**

In `src/app/page.tsx`, add `import { Work } from "@/components/work/Work";` and render `<Work index={index.work} />` directly after `<Skills index={index.skills} />`.

- [ ] **Step 3: Verify**

Run: `npm run lint && npm test && npm run build`
Then: `node -e "const h=require('fs').readFileSync('out/index.html','utf8');console.log((h.match(/opacity:0/g)||[]).length)"`
Expected: clean, 72 tests pass, build succeeds, and the script prints `0` (nothing server-rendered as hidden).

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "feat(work): horizontal project accordion with lazy-loaded widgets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Certifications and the journey timeline

**Files:**
- Create: `src/lib/journey.ts`, `src/lib/time.ts`, `src/components/certs/Certifications.tsx`, `src/components/journey/MilestoneCard.tsx`, `JourneyTimeline.tsx`, `Journey.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/lib/journeyTime.test.ts`

**Interfaces:**
- Consumes: `certifications`, `journey`, `Milestone`, `pad2` (Task 3); `SectionHeading`, `useMediaQuery`, `cn` (Task 4).
- Produces: `journeyPath(width, height, turns, centered): string`; `hyderabadTime(date): string` (used by Task 14); `<Certifications index? />` (renders nothing while the list is empty); `<Journey index />` rendering `section#experience`.

- [ ] **Step 1: Write the failing test**

`src/lib/journeyTime.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { journeyPath } from "@/lib/journey";
import { hyderabadTime } from "@/lib/time";

describe("journeyPath", () => {
  it("starts at the top centre and ends at the bottom", () => {
    const d = journeyPath(1000, 1200, 6, true);
    expect(d.startsWith("M 500 0")).toBe(true);
    expect(d.endsWith("500 1200")).toBe(true);
    expect(d.match(/ C /g)).toHaveLength(6);
  });

  it("swings between 42% and 58% of the width", () => {
    const d = journeyPath(1000, 600, 2, true);
    expect(d).toContain("C 580 ");
    expect(d).toContain("C 420 ");
  });

  it("uses a left rail on mobile", () => {
    expect(journeyPath(360, 900, 3, false).startsWith("M 20 0")).toBe(true);
  });
});

describe("hyderabadTime", () => {
  it("formats India Standard Time", () => {
    expect(hyderabadTime(new Date("2026-10-16T06:30:00Z"))).toBe("12:00 IST");
    expect(hyderabadTime(new Date("2026-10-16T18:45:00Z"))).toBe("00:15 IST");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- src/lib/journeyTime.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/lib/journey.ts`:

```ts
/**
 * Dashed S-curve down the timeline: one cubic segment per milestone, swinging
 * between 42% and 58% of the width (desktop) or a gentle 20px rail (mobile).
 */
export function journeyPath(width: number, height: number, turns: number, centered: boolean): string {
  const cx = centered ? width / 2 : 20;
  const amp = centered ? width * 0.08 : 10;
  const seg = height / Math.max(turns, 1);
  let d = `M ${cx} 0`;
  for (let i = 0; i < turns; i++) {
    const y0 = i * seg;
    const dir = i % 2 === 0 ? 1 : -1;
    const x = cx + amp * dir;
    d += ` C ${x} ${y0 + seg * 0.35}, ${x} ${y0 + seg * 0.65}, ${cx} ${y0 + seg}`;
  }
  return d;
}
```

`src/lib/time.ts`:

```ts
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Local time in Hyderabad, e.g. "12:00 IST". */
export function hyderabadTime(date: Date): string {
  return `${formatter.format(date)} IST`;
}
```

Run: `npm test -- src/lib/journeyTime.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 4: Add the components**

`src/components/certs/Certifications.tsx`:

```tsx
import { SectionHeading } from "@/components/ui/SectionHeading";
import { certifications } from "@/content/certifications";
import type { Certification } from "@/content/types";
import { pad2 } from "@/lib/sections";

const row =
  "group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-6 transition-colors duration-[250ms] hover:bg-ink hover:text-cream focus-visible:bg-ink focus-visible:text-cream";

function Row({ cert, n }: { cert: Certification; n: number }) {
  return (
    <>
      <span className="font-mono text-xs text-stone group-hover:text-cream/60">{pad2(n)}</span>
      <span>
        <span className="block font-semibold">{cert.title}</span>
        <span className="mt-1 block text-sm text-stone group-hover:text-cream/70">
          {cert.issuer}
          {cert.year ? ` · ${cert.year}` : ""}
        </span>
      </span>
      <span aria-hidden className="text-lg">
        ↗
      </span>
    </>
  );
}

/** Renders nothing until content/certifications.ts has entries. */
export function Certifications({ index }: { index?: string }) {
  if (certifications.length === 0 || !index) return null;
  return (
    <section id="certifications" aria-labelledby="certifications-title" className="section border-t border-line">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading headingId="certifications-title" index={index} label="Certifications" lead="Always" accent="learning." />
          <p className="mt-6 font-mono text-sm text-stone">{pad2(certifications.length)} certifications</p>
        </div>
        <ol className="border-t border-line">
          {certifications.map((cert, i) => (
            <li key={`${cert.issuer}-${cert.title}`} className="border-b border-line" data-reveal>
              {cert.href ? (
                <a href={cert.href} target="_blank" rel="noopener noreferrer" className={row}>
                  <Row cert={cert} n={i + 1} />
                </a>
              ) : (
                <div className={row}>
                  <Row cert={cert} n={i + 1} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

`src/components/journey/MilestoneCard.tsx`:

```tsx
import type { Milestone } from "@/content/types";

const kindLabel: Record<Milestone["kind"], string> = {
  education: "Education",
  experience: "Experience",
  next: "Next",
};

export function MilestoneCard({ milestone }: { milestone: Milestone }) {
  if (milestone.kind === "next") {
    return (
      <a
        href="#contact"
        className="group block rounded-[20px] border border-dashed border-ink/30 p-6 transition-colors duration-300 hover:border-ink hover:bg-paper"
      >
        <p className="label">{kindLabel.next}</p>
        <p className="mt-3 text-3xl font-extrabold tracking-tight">{milestone.role}</p>
        <p className="mt-2 text-stone">
          {milestone.org}{" "}
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </p>
      </a>
    );
  }
  return (
    <article className="rounded-[20px] border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="label text-ink">{kindLabel[milestone.kind]}</p>
        {milestone.dates && <p className="font-mono text-xs text-stone">{milestone.dates}</p>}
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-tight">{milestone.role}</h3>
      <p className="mt-1 text-sm font-medium text-stone">{milestone.org}</p>
      <ul className="mt-4 space-y-2">
        {milestone.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink" />
            {bullet}
          </li>
        ))}
      </ul>
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {milestone.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
            {tag}
          </li>
        ))}
      </ul>
    </article>
  );
}
```

`src/components/journey/JourneyTimeline.tsx`:

```tsx
"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MilestoneCard } from "./MilestoneCard";
import type { Milestone } from "@/content/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { journeyPath } from "@/lib/journey";

/** Milestones along a dashed S-curve; a dot travels the curve with scroll progress. */
export function JourneyTimeline({ milestones }: { milestones: Milestone[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start center", "end center"] });
  const d = size.h > 0 ? journeyPath(size.w, size.h, milestones.length, desktop) : "";

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = useCallback((value: number) => {
    const path = pathRef.current;
    const progress = progressRef.current;
    const dot = dotRef.current;
    if (!path || !progress || !dot || !path.getAttribute("d")) return;
    const reduced = document.documentElement.classList.contains("reduced");
    const v = reduced ? 1 : Math.max(0, Math.min(1, value));
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * v);
    dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
    progress.style.strokeDasharray = `${length}`;
    progress.style.strokeDashoffset = `${length * (1 - v)}`;
  }, []);

  useMotionValueEvent(scrollYProgress, "change", place);
  useEffect(() => {
    place(scrollYProgress.get());
  }, [d, place, scrollYProgress]);

  return (
    <ol ref={listRef} className="relative mt-16">
      <svg
        aria-hidden
        width={size.w}
        height={size.h}
        className={cn("pointer-events-none absolute inset-0 overflow-visible", !d && "invisible")}
      >
        <path ref={pathRef} d={d} fill="none" stroke="var(--color-stone)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="6 8" />
        <path ref={progressRef} d={d} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round" />
        <g ref={dotRef}>
          <circle r={13} fill="var(--color-ink)" fillOpacity={0.1} />
          <circle r={6} fill="var(--color-ink)" />
        </g>
      </svg>
      {milestones.map((milestone, i) => {
        const left = i % 2 === 0;
        return (
          <li key={`${milestone.org}-${milestone.role}`} className="relative grid py-8 lg:grid-cols-2 lg:gap-x-32 lg:py-12">
            {milestone.watermark && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[clamp(4.5rem,13vw,11rem)] font-extrabold leading-none tracking-[-0.05em] text-watermark",
                  !left && "lg:left-0 lg:right-auto",
                )}
              >
                {milestone.watermark}
              </span>
            )}
            <div className={cn("relative z-10 pl-12 lg:pl-0", left ? "lg:col-start-1" : "lg:col-start-2")} data-reveal>
              <MilestoneCard milestone={milestone} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

`src/components/journey/Journey.tsx`:

```tsx
import { JourneyTimeline } from "./JourneyTimeline";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { journey } from "@/content/journey";

export function Journey({ index }: { index: string }) {
  return (
    <section id="experience" aria-labelledby="experience-title" className="section overflow-hidden border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="experience-title" index={index} label="Journey" lead="Education &" accent="experience." />
        <JourneyTimeline milestones={journey} />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add both to the page**

In `src/app/page.tsx`, add `import { Certifications } from "@/components/certs/Certifications";` and `import { Journey } from "@/components/journey/Journey";`, and render these directly after `<Work index={index.work} />`:

```tsx
        <Certifications index={index.certifications} />
        <Journey index={index.experience} />
```

- [ ] **Step 6: Verify**

Run: `npm run lint && npm test && npm run build && npm run check`
Expected: clean, 76 tests pass, build succeeds; `npm run check` now fails only on `#contact` anchors.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat(journey): S-curve scroll timeline and hidden-until-filled certifications

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Achievements, contact and footer

**Files:**
- Create: `src/components/achievements/AchievementCard.tsx`, `AchievementsCarousel.tsx`, `Achievements.tsx`
- Create: `src/components/contact/CopyEmail.tsx`, `LocalTime.tsx`, `Contact.tsx`, `src/components/layout/Footer.tsx`
- Replace: `src/app/page.tsx` (final)

**Interfaces:**
- Consumes: `achievements`, `AchievementIcon`, `profile`, `pad2` (Task 3); `Pill`, `useToast`, `SectionHeading`, `cn` (Task 4); `hyderabadTime` (Task 13).
- Produces: `<Achievements index />` (`section#achievements`), `<Contact />` (`section#contact`), `<Footer />`.

- [ ] **Step 1: Add the components**

`src/components/achievements/AchievementCard.tsx`:

```tsx
import { Apple, Award, Bot, ChartLine, GraduationCap, Layers, Plug, Trophy, type LucideIcon } from "lucide-react";
import type { Achievement, AchievementIcon } from "@/content/types";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/sections";

const icons: Record<AchievementIcon, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  graduation: GraduationCap,
  layers: Layers,
  bot: Bot,
  plug: Plug,
  apple: Apple,
  chart: ChartLine,
};

export function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const Icon = icons[achievement.icon];
  return (
    <article
      className={cn(
        "flex h-[320px] shrink-0 snap-start flex-col justify-between rounded-[24px] border border-line bg-paper p-6 shadow-card",
        achievement.size === "wide" ? "w-[min(560px,86vw)]" : "w-[min(400px,82vw)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-ink text-cream">
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="font-mono text-xs text-stone">{pad2(index + 1)}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-[13rem]">
          <h3 className="font-bold leading-snug">{achievement.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-stone">{achievement.description}</p>
        </div>
        <p className="shrink-0 text-right text-[clamp(2.25rem,3.6vw,3.5rem)] font-extrabold leading-[0.85] tracking-[-0.05em]">
          {achievement.metric}
        </p>
      </div>
    </article>
  );
}
```

`src/components/achievements/AchievementsCarousel.tsx`:

```tsx
"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { AchievementCard } from "./AchievementCard";
import type { Achievement } from "@/content/types";

const navButton =
  "grid size-11 place-items-center rounded-full border border-ink/20 transition-colors duration-200 hover:bg-ink hover:text-cream disabled:pointer-events-none disabled:opacity-30";

/** Horizontally scrolling bento row: snap, mouse drag with momentum, buttons and a progress bar. */
export function AchievementsCarousel({ items }: { items: Achievement[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startLeft: number; lastX: number; lastT: number; v: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const scrollByCard = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (!el || !(card instanceof HTMLElement)) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: smooth() });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { id: e.pointerId, startX: e.clientX, startLeft: el.scrollLeft, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dt = Math.max(e.timeStamp - d.lastT, 1);
    d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    e.currentTarget.scrollLeft = d.startLeft - (e.clientX - d.startX);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const el = e.currentTarget;
    el.style.scrollSnapType = "";
    el.scrollBy({ left: -d.v * 220, behavior: smooth() });
  };

  return (
    <div className="mt-10">
      <div className="container-page flex justify-end gap-2">
        <button type="button" aria-label="Previous achievement" disabled={edges.start} onClick={() => scrollByCard(-1)} className={navButton}>
          <ArrowLeft aria-hidden className="size-4" />
        </button>
        <button type="button" aria-label="Next achievement" disabled={edges.end} onClick={() => scrollByCard(1)} className={navButton}>
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Achievements"
        tabIndex={0}
        data-cursor="Drag"
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="no-scrollbar mt-6 flex cursor-grab snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-4 active:cursor-grabbing min-[1400px]:scroll-px-[calc((100vw-1320px)/2+var(--gutter))] min-[1400px]:px-[calc((100vw-1320px)/2+var(--gutter))]"
      >
        {items.map((achievement, i) => (
          <AchievementCard key={achievement.title} achievement={achievement} index={i} />
        ))}
      </div>
      <div className="container-page mt-4">
        <div className="h-px w-full bg-line">
          <div
            className="h-px origin-left bg-ink transition-transform duration-200"
            style={{ transform: `scaleX(${Math.max(0.06, progress)})` }}
          />
        </div>
      </div>
    </div>
  );
}
```

`src/components/achievements/Achievements.tsx`:

```tsx
import { AchievementsCarousel } from "./AchievementsCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { achievements } from "@/content/achievements";

export function Achievements({ index }: { index: string }) {
  return (
    <section id="achievements" aria-labelledby="achievements-title" className="section overflow-hidden border-t border-line">
      <div className="container-page">
        <SectionHeading headingId="achievements-title" index={index} label="Achievements" lead="Proud" accent="moments." />
      </div>
      <AchievementsCarousel items={achievements} />
    </section>
  );
}
```

`src/components/contact/CopyEmail.tsx`:

```tsx
"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";

export function CopyEmail({ email }: { email: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!navigator.clipboard) {
      toast("Couldn’t copy. Select the address instead.");
      return;
    }
    navigator.clipboard.writeText(email).then(
      () => {
        setCopied(true);
        toast("Email copied");
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => toast("Couldn’t copy. Select the address instead."),
    );
  };

  return (
    <Pill variant="outline" onClick={copy} aria-label={`Copy ${email}`}>
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </Pill>
  );
}
```

`src/components/contact/LocalTime.tsx` — `useSyncExternalStore` keeps the clock out of render and renders an empty string during prerender:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { hyderabadTime } from "@/lib/time";

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
};
const getSnapshot = () => hyderabadTime(new Date());
const getServerSnapshot = () => "";

export function LocalTime() {
  return <span>{useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)}</span>;
}
```

`src/components/contact/Contact.tsx`:

```tsx
import { CopyEmail } from "./CopyEmail";
import { LocalTime } from "./LocalTime";
import { Pill } from "@/components/ui/Pill";
import { profile } from "@/content/profile";

export function Contact() {
  const { contact } = profile;
  return (
    <section id="contact" aria-labelledby="contact-title" className="section border-t border-line">
      <div className="container-page">
        <p className="label" data-reveal>
          Contact
        </p>
        <h2
          id="contact-title"
          className="mt-6 text-[clamp(2.75rem,8vw,7.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]"
          data-reveal="mask"
        >
          <span className="mask">
            <span>{contact.lead}</span>
          </span>{" "}
          <span className="mask">
            <span className="accent">{contact.accent}</span>
          </span>
        </h2>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-stone" data-reveal>
          {contact.line}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
          <a
            href={`mailto:${profile.email}`}
            className="break-all text-[clamp(1.25rem,3vw,2.25rem)] font-semibold tracking-tight underline decoration-line decoration-2 underline-offset-8 transition-colors hover:decoration-ink"
          >
            {profile.email}
          </a>
          <CopyEmail email={profile.email} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3" data-reveal>
          <Pill href={profile.links.linkedin} variant="outline" external>
            LinkedIn <span aria-hidden>↗</span>
          </Pill>
          <Pill href={profile.links.github} variant="outline" external>
            GitHub <span aria-hidden>↗</span>
          </Pill>
          <Pill href={profile.links.resume} variant="outline">
            Résumé <span aria-hidden>↗</span>
          </Pill>
        </div>
        <p className="mt-16 font-mono text-xs text-stone">
          {profile.location} · <LocalTime />
        </p>
      </div>
    </section>
  );
}
```

`src/components/layout/Footer.tsx`:

```tsx
import { profile } from "@/content/profile";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-3 py-8 font-mono text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {profile.copyrightYear} {profile.name}
        </span>
        <span>Designed &amp; built with Next.js</span>
        <a href="#top" className="text-ink hover:underline">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Write the final page**

`src/app/page.tsx`:

```tsx
import { About } from "@/components/about/About";
import { Achievements } from "@/components/achievements/Achievements";
import { Certifications } from "@/components/certs/Certifications";
import { Contact } from "@/components/contact/Contact";
import { Hero } from "@/components/hero/Hero";
import { Journey } from "@/components/journey/Journey";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Skills } from "@/components/skills/Skills";
import { Work } from "@/components/work/Work";
import { sections } from "@/content/sections";
import { sectionIndices } from "@/lib/sections";

export default function Home() {
  const index = sectionIndices(sections);
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <About index={index.about} />
        <Skills index={index.skills} />
        <Work index={index.work} />
        <Certifications index={index.certifications} />
        <Journey index={index.experience} />
        <Achievements index={index.achievements} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify — everything passes now**

Run: `npm run lint && npm test && npm run build && npm run check`
Expected: lint clean; 76 tests pass (13 files); build succeeds; `npm run check` prints `7 pages, … local references checked.` and `No missing local links, duplicate IDs or h1 errors.` with exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "feat: achievements carousel, contact with copy-to-clipboard, footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Deployment workflow and documentation

**Files:**
- Create: `.github/workflows/deploy.yml`
- Replace: `DESIGN.md`, `README.md`

**Interfaces:**
- Consumes: `npm run lint`, `npm test`, `npm run build`, `npm run check` (Tasks 1–14).

- [ ] **Step 1: Add the workflow**

`.github/workflows/deploy.yml` (action majors checked on 2026-10-16: checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npm run check
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Replace `DESIGN.md`**

```markdown
# Editorial — Baltej Goud

The homepage of baltejgoud.github.io, rebuilt on 2026-10-16 as a warm, light, editorial portfolio. The full design is in `docs/superpowers/specs/2026-10-16-editorial-portfolio-design.md`; this file is the working reference. The case studies (`public/work/`) and the résumé (`public/resume.html`) keep the earlier “Signal” styling until they are restyled.

## Principles

- Every fact comes from Baltej’s own résumé and site. No invented metrics, dates, certifications, coding-profile stats, quotes or repository links. Synthetic data inside project widgets is labelled “Illustrative”.
- Motion is rich but never required: everything reads without JavaScript and with reduced motion.
- Content lives in `src/content/`. Components only render it.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `cream` | `#F6F4EE` | Page background |
| `ink` | `#181818` | Text, active pills, inverted rows |
| `stone` | `#7A756D` | Secondary text, metadata |
| `line` | `#E5E0D8` | Hairlines and borders |
| `paper` | `#FFFFFF` | Cards |
| `watermark` | `rgb(122 117 109 / 0.10)` | Giant background words and years |
| `live` | `#22C55E` | Availability dot |
| `alert` | `#B4483A` | Broken chain, blocked listing |

Skill categories: Languages `#D08A3C`, Frontend `#4A7FB0`, Backend `#5B8C5A`, Databases `#8B6BB1`, Tools `#B85C45`, Core `#B8962E`.

## Typography

- **Plus Jakarta Sans** (400–800) for headings and body.
- **Instrument Serif italic** for one accent word or phrase in every section title.
- **JetBrains Mono** for index numbers, labels and tags: uppercase, 0.72rem, 0.14em tracking.
- Section titles: `clamp(2.4rem, 5.5vw, 4.75rem)`, weight 800, −0.035em tracking.

## Sections

Hero · 01 About · 02 Skills · 03 Selected work · (Certifications, hidden while empty) · Journey · Achievements · Contact. Numbers come from `src/lib/sections.ts`, so adding certifications renumbers the sections after it.

## Interactions

| Area | Behaviour |
| --- | --- |
| Navbar | Ink pill slides to the section in view; glass background after 24px; full-screen menu below 900px. |
| Hero | “BALTEJ” spans the full width; the cutout and watermark drift with a fine pointer; entrance on load. |
| Lanyard | Verlet strap and spring-twisted card (`src/lib/physics/rope.ts`). Drag, fling or use the arrow keys. Sleeps at rest and off screen. |
| Skills | Filter pills highlight a category; hover or focus updates the preview; arrow keys move across the grid. |
| Work | Horizontal accordion of spines at ≥1280px, vertical accordion below. Each project has a live widget, loaded when opened. |
| Journey | A dot travels a dashed S-curve with scroll progress. |
| Achievements | Snap carousel with mouse drag, buttons and a progress bar. |
| Contact | Copy-email pill with a toast; live Hyderabad time. |

## Motion rules

- An inline script in `<head>` adds `js` (and `reduced` under reduced motion) before first paint. Scroll reveals hide content only under `html.js:not(.reduced):not(.reveal-all)`. If the app has not booted after 3s, `reveal-all` shows everything.
- Scroll reveals are CSS (`[data-reveal]`, `[data-reveal="mask"]`) driven by one IntersectionObserver. Motion (`motion/react`) is used for interactive pieces only, and never for content that must be visible before hydration.
- Under reduced motion: no Lenis, parallax, entrance, physics, magnetism or cursor follower. Every feature still works.
- Lenis yields to inner panels marked `data-scroll-area` when they can scroll.

## Imagery

- `public/images/portrait-cutout.webp`: background removed from `public/assets/portrait.webp` with rembg (`u2net_human_seg`, alpha matting), then trimmed and encoded by `scripts/prepare-images.cjs`.
- `public/images/id-photo.webp`: a square head-and-shoulders crop of the same portrait.
- Brand logos: simple-icons. Playwright has no entry and shows its symbol.
- Case-study imagery provenance: `public/assets/work/README.md`.

## Adding content

- **Certification:** add `{ title, issuer, year?, href? }` to `src/content/certifications.ts`. Section 04 appears and later sections renumber.
- **Talking-avatar video:** set `hero.video = { src, poster }` in `src/content/profile.ts`, with the files in `public/`. The sound toggle appears.
- **Skill, project, journey milestone or achievement:** edit the matching file in `src/content/`. `npm test` checks its shape.

## Verification

`npm run lint`, `npm test`, `npm run build` and `npm run check` must pass. Check the page in a browser at 1440×900 and 375×812.
```

- [ ] **Step 3: Replace `README.md`**

````markdown
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
````

- [ ] **Step 4: Verify the workflow commands locally**

Run: `npm ci && npm run lint && npm test && npm run build && npm run check`
Expected: every step passes, as it will in CI.

- [ ] **Step 5: Commit**

```bash
git add .github DESIGN.md README.md
git commit -m "ci: deploy the static export to GitHub Pages; document the editorial design

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Browser verification at desktop and phone sizes

**Files:**
- Modify (local only, gitignored): `.claude/launch.json`
- Modify: whatever the checks below show is broken (each fix is its own commit)

- [ ] **Step 1: Add preview configurations**

Replace `.claude/launch.json` with:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "site-out",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["--yes", "serve", "-l", "5301", "out"],
      "port": 5301
    },
    {
      "name": "site-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--", "--port", "5300"],
      "port": 5300
    }
  ]
}
```

- [ ] **Step 2: Build and open the export**

Run `npm run build`, then start the `site-out` preview (preview_start with name `site-out`). All checks below run against `out/`, because only the export serves the legacy pages.

- [ ] **Step 3: Desktop pass at 1440×900**

Resize the preview to 1440×900. For each item, check it and fix anything that fails:

1. No console errors after load and after every interaction below (read_console_messages, errors only).
2. Hero: "BALTEJ" runs edge to edge; the cutout stands on cream with clean edges; "Data" / *Analyst.* bottom-left; "Explore work ↓" bottom-right scrolls to `#work` and lands below the navbar.
3. Navbar: scrolling through the page moves the ink pill to About, Skills, Work, Experience, Achievements and Contact in turn; it is not shown in the hero; the bar turns glassy after scrolling.
4. Lanyard: simulate a drag on the card (pointerdown, pointermove 200px right, pointerup) and confirm it swings and settles; focus the card and press ArrowLeft and confirm it moves.
5. Skills: click "Frontend" — exactly React, Next.js, Three.js, Electron and Tailwind CSS turn ink and the rest dim; click it again to clear. Hover a tile and the preview card changes; Tab into the grid and use the arrow keys.
6. Work: click each spine in turn — it opens, the others collapse, and its widget loads and works: forecast scrubbing and the vertical tabs; atlas batch and unbatch (counter 208 → 1); import Start → Save → timeline, and Cancel; fair-price slider flips to Blocked above ₹2,500; custody Tamper on Carrier breaks steps 3–4 and Reset restores; reconcile Naive (2 transfers) and Tandem (1 transfer).
7. Journey: the dot moves along the dashed curve while scrolling, and the solid line follows it.
8. Achievements: the next button scrolls one card, the progress bar grows, and a mouse drag scrolls the row.
9. Contact: Copy shows the "Email copied" toast; the Hyderabad time is shown.
10. Legacy: open `/resume.html` and `/work/sanket/` — styled, no console errors; their "Experience", "About" and "Let's talk" links land on `#experience`, `#about` and `#contact` of the new homepage.

- [ ] **Step 4: Phone pass at 375×812**

Resize to the mobile preset and reload. Check:

1. `document.documentElement.scrollWidth === document.documentElement.clientWidth` (no horizontal scroll).
2. The Menu button opens the full-screen menu; Tab stays inside it; Escape closes it and returns focus to Menu; tapping "Work" closes the menu and scrolls to Work.
3. Hero stacks: portrait, then title, tagline and CTA.
4. Skills: the pills scroll sideways, the grid has 4 columns, the preview card sticks above the grid and updates on tap.
5. Work is a vertical accordion; opening a project scrolls its header into view.
6. The journey rail is on the left with cards to its right.

- [ ] **Step 5: Reduced motion**

Run `document.documentElement.classList.add("reduced")` in the page, reload with the emulated preference if the tool supports it, or review in code: with `reduced`, every `[data-reveal]` element is visible, the lanyard card hangs still, and the journey dot sits at the end. Confirm by evaluating `getComputedStyle(document.querySelector('[data-reveal]')).opacity === "1"` after adding the class.

- [ ] **Step 6: Certifications rendering check (not committed)**

Temporarily add one entry to `src/content/certifications.ts`, for example `{ title: "Sample certification", issuer: "Sample issuer" }`, then `npm run build` and confirm: section 04 appears with the sticky left column, the row inverts to ink on hover, and Journey and Achievements renumber to 05 and 06. Then `git checkout src/content/certifications.ts` and rebuild. Do not commit the sample.

- [ ] **Step 7: Share proof and reset**

Take a desktop screenshot of the hero and a phone screenshot of the Skills section and share them. Reset the viewport to desktop and stop the preview server.

- [ ] **Step 8: Final gate**

Run: `npm run lint && npm test && npm run build && npm run check && git status --short`
Expected: everything passes and the working tree is clean (all fixes committed).

---

## After the plan

Hand back to Baltej with: the branch name, what was verified (with the screenshots), and the one manual step left for him — **Settings → Pages → Source: GitHub Actions** — before he merges to `main` and pushes. Do not push or open a PR without his go-ahead.
