// Check authored static pages and local links; does not operate a browser.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const pages = [
  "index.html",
  "resume.html",
  "work/index.html",
  ...["sanket", "axon", "vigor", "extraticket"].map(
    (p) => `work/${p}/index.html`,
  ),
];
let failures = [];
let references = 0;
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) failures.push(`${file}: duplicate ID`);
  if ([...html.matchAll(/<h1\b/g)].length !== 1)
    failures.push(`${file}: expected one h1`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].replaceAll("&amp;", "&");
    if (/^[a-z][\w+.-]*:/i.test(ref)) continue;
    references++;
    const [route, anchor] = ref.split("#");
    let target = route
      ? path.resolve(path.dirname(path.join(root, file)), route.split("?")[0])
      : path.join(root, file);
    if (!fs.existsSync(target)) {
      failures.push(`${file}: missing ${ref}`);
      continue;
    }
    if (fs.statSync(target).isDirectory())
      target = path.join(target, "index.html");
    if (!fs.existsSync(target)) {
      failures.push(`${file}: missing index for ${ref}`);
      continue;
    }
    if (anchor && target.endsWith(".html")) {
      const text = fs.readFileSync(target, "utf8");
      if (!text.includes(`id="${anchor}"`))
        failures.push(`${file}: missing anchor ${ref}`);
    }
  }
}
console.log(`${pages.length} pages, ${references} local references checked.`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("No missing local links, duplicate IDs or h1 errors.");
