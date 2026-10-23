/* Copy pinned animation libraries into public/assets/vendor for the legacy pages. Run after npm install: npm run vendor */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const files = {
  "gsap.min.js": "gsap/dist/gsap.min.js",
  "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js",
  "SplitText.min.js": "gsap/dist/SplitText.min.js",
  "lenis.min.js": "lenis/dist/lenis.min.js",
};
const out = path.join(root, "public/assets/vendor");
fs.mkdirSync(out, { recursive: true });
for (const [name, source] of Object.entries(files)) {
  const code = fs
    .readFileSync(path.join(root, "node_modules", source), "utf8")
    .replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n");
  fs.writeFileSync(path.join(out, name), code);
}
console.log(`Copied ${Object.keys(files).length} files to public/assets/vendor.`);
