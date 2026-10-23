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
