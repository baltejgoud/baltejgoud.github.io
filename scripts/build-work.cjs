/* Regenerate the static work pages in public/work with: npm run build:work. No browser runtime dependency. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "public");
const projects = JSON.parse(
  fs.readFileSync(path.join(root, "work/projects.json"), "utf8"),
);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const arrow = '<span aria-hidden="true">↗</span>';
const gate = String.raw`<script data-motion-gate>(function(d,w){var h=d.documentElement,c=h.classList;c.add("js");if(w.matchMedia("(prefers-reduced-motion: reduce)").matches||/[?&]nomotion\b/.test(w.location.search))return;c.add("motion");try{if(h.hasAttribute("data-intro")&&!w.location.hash&&!w.sessionStorage.getItem("bg-intro"))c.add("intro")}catch(e){}w.setTimeout(function(){if(!c.contains("motion-ready"))c.remove("motion","intro")},3000)})(document,window);</script>`;
const motionScripts = (prefix) =>
  ["gsap", "ScrollTrigger", "SplitText", "lenis"]
    .map(
      (name) =>
        `<script src="${prefix}assets/vendor/${name}.min.js" defer></script>`,
    )
    .join("") +
  `<script type="module" src="${prefix}assets/js/motion/index.js"></script>`;
// Quick view content, with paths relative to the page that embeds it.
const dataIsland = (prefix) =>
  `<script type="application/json" id="project-data">${JSON.stringify(
    projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      number: p.number,
      theme: p.theme,
      discipline: p.discipline,
      status: p.status,
      tagline: p.tagline,
      role: p.role,
      stack: p.stack,
      problem: p.problem,
      decisions: p.decisions,
      caption: p.coverCaption,
      url: `${prefix}work/${p.slug}/`,
      image: {
        src: `${prefix}assets/work/${p.cover}.webp`,
        width: p.coverWidth,
        height: p.coverHeight,
        alt: p.coverAlt,
      },
      secondary: p.secondary
        ? {
            src: `${prefix}assets/work/${p.secondary}.webp`,
            width: p.secondaryWidth,
            height: p.secondaryHeight,
            alt: p.secondaryAlt,
            title: p.secondaryTitle,
          }
        : null,
    })),
  ).replace(/</g, "\\u003c")}</script>`;
const head = (
  title,
  description,
  prefix,
  url,
  image = "social-cover.jpg",
) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Baltej Goud</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#fafbf9">
<link rel="canonical" href="https://baltejgoud.github.io/${url}"><link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}style.css"><link rel="stylesheet" href="${prefix}work.css"><link rel="stylesheet" href="${prefix}motion.css"><link rel="stylesheet" href="${prefix}bevel.css">${gate}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} — Baltej Goud"><meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="https://baltejgoud.github.io/${url}"><meta property="og:image" content="https://baltejgoud.github.io/assets/${image}"><meta name="twitter:card" content="summary_large_image">
</head>`;
const header = (
  prefix,
) => `<a class="skip-link" href="#main">Skip to content</a><header class="site-header" id="top"><div class="wrap header-inner">
<a class="brand" href="${prefix}index.html" aria-label="Baltej Goud — home"><span class="brand-symbol" aria-hidden="true">bg<span>↗</span></span><span>Baltej Goud<span class="brand-caption">AI Engineer · Data Analyst</span></span></a>
<nav class="desktop-nav" aria-label="Main navigation"><a href="${prefix}work/sanket/">Sanket</a><a href="${prefix}work/" aria-current="page">Work</a><a href="${prefix}index.html#experience">Experience</a><a href="${prefix}index.html#about">About</a></nav>
<a class="header-contact" href="${prefix}index.html#contact">Let’s talk ${arrow}</a>
<button class="menu-toggle" type="button" aria-label="Open navigation" aria-controls="mobile-nav" aria-expanded="false"><span>Menu</span><span class="menu-icon" aria-hidden="true"><i></i><i></i></span></button></div>
<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden><a href="${prefix}work/">Work <span>01</span></a><a href="${prefix}work/sanket/">Sanket <span>02</span></a><a href="${prefix}index.html#experience">Experience <span>03</span></a><a href="${prefix}index.html#about">About <span>04</span></a><a href="${prefix}index.html#contact">Let’s talk <span>↗</span></a></nav></header>`;
const footer = (prefix) =>
  `<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="footer-name" href="${prefix}index.html">Baltej Goud ${arrow}</a><div><a href="https://www.linkedin.com/in/baltejgoud" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://github.com/baltejgoud" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${prefix}resume.html">Résumé ↗</a></div></div><div class="footer-bottom"><span>© <span id="year">2026</span> Baltej Goud</span><span>Hyderabad, India <span class="local-time"></span></span><a href="#top">Back to top ↑</a></div></div></footer><script src="${prefix}script.js" defer></script>${motionScripts(prefix)}</body></html>`;
const nojs =
  "<noscript><style>.menu-toggle,.project-filters,.gallery-view{display:none!important}@media(max-width:800px){.mobile-nav[hidden]{display:flex!important;flex-wrap:wrap;gap:6px 20px}.mobile-nav a{font-size:16px;border:0}.mobile-nav a span{display:none}}</style></noscript>";
const card = (
  p,
  prefix = "",
  featured = false,
) => `<article class="project-card real-project ${featured ? "project-featured" : ""}" data-category="${esc(p.category)}">
<a class="project-story-link" data-quickview="${p.slug}" href="${prefix}work/${p.slug}/" aria-labelledby="project-${p.slug}-title">
<div class="project-capture capture-${p.theme}" data-reveal="image"><div class="capture-label"><span>${p.number} / ${esc(p.status)}</span><span class="capture-cta">Read story ${arrow}</span></div>
<div class="capture-window"><img src="${prefix}assets/work/${p.cover}.webp" width="${p.coverWidth}" height="${p.coverHeight}" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async"></div></div>
<div class="project-heading" data-reveal="fade"><h3 id="project-${p.slug}-title">${esc(p.name)}</h3><span>${esc(p.discipline)}</span></div><p class="project-description" data-reveal="fade">${esc(p.summary)}</p></a><div class="project-proof"><p class="project-role">${esc(p.role)}</p><p class="project-tech">${esc(p.stack.split(" · ").slice(0, 4).join(" · "))}</p><a class="project-case-link" href="${prefix}work/${p.slug}/" aria-label="Read the ${esc(p.name)} case study">Full case study ${arrow}</a></div></article>`;
const gallery = `${head("Selected work", "Products, experiments and a business in progress. Explore the work of Baltej Goud, co-founder of Sanket.", "../", "work/")}
<body class="work-page">${nojs}${header("../")}<main id="main"><section class="gallery-intro wrap"><div class="section-kicker" data-reveal="fade"><span>Ideas made tangible</span><span>Selected work / 01–04</span></div><h1 data-reveal="lines">Work, with<br><em>something to say.</em></h1><div class="gallery-lede" data-reveal="fade"><p>Business problems. Technical depth. Interfaces people can use. A closer look at the products I’m building.</p><a class="text-link" href="../index.html#about">The person behind the work ${arrow}</a></div></section>
<section class="gallery-section light-section" aria-label="Project gallery"><div class="wrap"><div class="work-toolbar" data-reveal="fade"><div class="project-filters" role="group" aria-label="Filter selected projects"><button type="button" data-filter="all" aria-pressed="true">All work <span>04</span></button><button type="button" data-filter="ai" aria-pressed="false">AI & data</button><button type="button" data-filter="product" aria-pressed="false">Digital products</button></div><div class="gallery-view" role="group" aria-label="Gallery layout"><button data-view="grid" aria-pressed="true" aria-label="Grid view">Grid</button><button data-view="list" aria-pressed="false" aria-label="List view">List</button></div><span id="filter-status" role="status">04 selected projects</span></div>
<div class="project-grid work-gallery">${projects.map((p) => card(p, "../")).join("\n")}</div>${dataIsland("../")}<p class="gallery-note" data-reveal="fade">Explore the problem, my contribution and the engineering decisions behind each project.</p></div></section>
<section class="work-contact wrap"><span class="eyebrow" data-reveal="fade">Have a problem worth solving?</span><h2 data-reveal="lines">Let’s make<br><em>the next thing.</em></h2><a class="button button-orange" href="mailto:baltej.panagatla@gmail.com">Start a conversation ${arrow}</a></section></main>${footer("../")}`;
fs.writeFileSync(path.join(root, "work/index.html"), gallery);
projects.forEach((p, index) => {
  const prefix = "../../";
  const next = projects[(index + 1) % projects.length];
  const imageLink = (image) => `${prefix}assets/work/${image}.webp`;
  const page = `${head(p.name, p.summary, prefix, `work/${p.slug}/`, `work/${p.cover}.webp`)}<body class="case-page case-${p.theme}">${nojs}${header(prefix)}
<main id="main"><section class="case-intro wrap"><a class="case-back" href="../">← All work</a><div class="case-title-row"><h1 data-reveal="lines">${esc(p.name)}</h1><span class="case-index" aria-hidden="true">${p.number}</span></div><p class="case-tagline" data-reveal="fade">${esc(p.tagline)}</p>
<dl class="case-meta" data-reveal="fade"><div><dt>Contribution</dt><dd>${esc(p.role)}</dd></div><div><dt>Focus</dt><dd>${esc(p.discipline)}</dd></div><div><dt>Stage</dt><dd>${esc(p.status)}</dd></div></dl></section>
<figure class="case-hero wrap"><a class="case-capture capture-${p.theme}" data-reveal="image" href="${imageLink(p.cover)}" target="_blank" rel="noopener" aria-label="View full ${esc(p.name)} concept"><img src="${imageLink(p.cover)}" width="${p.coverWidth}" height="${p.coverHeight}" alt="${esc(p.coverAlt)}" fetchpriority="high"><span class="image-open">View full concept ${arrow}</span></a></figure>
<details class="case-original wrap"><summary>Explore the actual development interface</summary><figure><a href="${imageLink(p.image)}" target="_blank" rel="noopener"><img src="${imageLink(p.image)}" width="${p.imageWidth}" height="${p.imageHeight}" alt="${esc(p.alt)}" loading="lazy"></a><figcaption>${esc(p.caption)}</figcaption></figure></details>
<section class="case-story light-section"><div class="wrap case-editorial"><div class="case-side"><span class="section-number">01 / The challenge</span><h2 data-reveal="lines">${esc(p.tagline)}</h2></div><div class="case-prose" data-reveal="fade"><p class="case-lead">${esc(p.problem)}</p><h3>My contribution</h3><p>${esc(p.contribution)}</p><div class="case-stack"><span class="tiny-label">Built with</span><p>${esc(p.stack)}</p></div></div></div></section>
<section class="case-decisions wrap"><div class="section-kicker" data-reveal="fade"><span>02 / Decisions behind the interface</span><span>Product meets engineering</span></div><h2 data-reveal="lines">The details<br><em>do the work.</em></h2><div class="decision-grid">${p.decisions.map((d, i) => `<article data-reveal="fade"><span class="decision-number">0${i + 1}</span><h3>${esc(d[0])}</h3><p>${esc(d[1])}</p></article>`).join("")}</div></section>
${p.secondary ? `<section class="case-detail-section light-section"><div class="wrap"><div class="case-detail-heading"><span class="section-number">03 / In the product</span><div><h2 data-reveal="lines">${esc(p.secondaryTitle)}</h2><p>${esc(p.secondaryText)}</p></div></div><figure class="case-secondary"><a data-reveal="image" href="${imageLink(p.secondary)}" target="_blank" rel="noopener" aria-label="View full ${esc(p.name)} detail capture"><img src="${imageLink(p.secondary)}" width="${p.secondaryWidth}" height="${p.secondaryHeight}" alt="${esc(p.secondaryAlt)}" loading="lazy" decoding="async"><span class="image-open">View full capture ${arrow}</span></a><figcaption>${esc(p.caption)}</figcaption></figure></div></section>` : ""}
<section class="case-evidence wrap"><span class="eyebrow">${p.secondary ? "04" : "03"} / Where it stands</span><h2 data-reveal="lines">${esc(p.evidenceTitle)}</h2><p data-reveal="fade">${esc(p.evidence)}</p><a class="button button-orange" href="${esc(p.link)}" ${p.link.startsWith("https:") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(p.linkLabel)} ${arrow}</a></section>
<section class="next-project"><a class="wrap" href="../${next.slug}/"><span class="eyebrow">Next project / ${next.number}</span><div><h2 data-reveal="lines">${esc(next.name)}</h2><span class="next-arrow" aria-hidden="true">↗</span></div><p>${esc(next.tagline)}</p></a></section></main>${footer(prefix)}`;
  const directory = path.join(root, "work", p.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), page);
});
console.log("Generated the work gallery and four case studies.");
