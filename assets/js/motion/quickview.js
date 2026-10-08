// Project quick view: a dialog rendered from the #project-data island, opened from project cards.
import { motionOn, compact, EASE } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

let projects = new Map();
let dialog;
let shell;
let content;
let counter;
let current = null;
let closing = false;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const picture = (image) =>
  Object.assign(el("img"), {
    src: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt,
    decoding: "async",
  });
const visibleCards = () =>
  [...document.querySelectorAll("[data-quickview]")].filter(
    (link) => link.offsetParent !== null,
  );
const onScreen = (box) =>
  box.bottom > 0 &&
  box.top < innerHeight &&
  box.right > 0 &&
  box.left < innerWidth;

export function init() {
  const island = document.getElementById("project-data");
  if (!island || !document.querySelector("[data-quickview]")) return;
  projects = new Map(JSON.parse(island.textContent).map((p) => [p.slug, p]));
  build();
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-quickview]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !projects.has(link.dataset.quickview)
    )
      return;
    event.preventDefault();
    open(link);
  });
}

function build() {
  dialog = el("dialog", "quickview");
  dialog.setAttribute("aria-labelledby", "qv-title");
  dialog.setAttribute("data-lenis-prevent", "");
  dialog.innerHTML = `<div class="qv-shell">
    <div class="qv-bar"><span class="qv-count"></span><div class="qv-controls">
      <button class="qv-prev" type="button" aria-label="Previous project">←</button>
      <button class="qv-next" type="button" aria-label="Next project">→</button>
      <button class="qv-close" type="button">Close <span aria-hidden="true">✕</span></button>
    </div></div>
    <div class="qv-body"><article class="qv-content"></article></div>
  </div>`;
  document.body.append(dialog);
  shell = dialog.querySelector(".qv-shell");
  content = dialog.querySelector(".qv-content");
  counter = dialog.querySelector(".qv-count");
  dialog.querySelector(".qv-prev").addEventListener("click", () => step(-1));
  dialog.querySelector(".qv-next").addEventListener("click", () => step(1));
  dialog.querySelector(".qv-close").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}

function render(link) {
  const project = projects.get(link.dataset.quickview);
  const cardImg = link.querySelector("img");
  const images = [project.image, project.secondary].filter(Boolean);
  const isCardImage = (image) =>
    cardImg && new URL(image.src, location.href).href === cardImg.src;
  const lead = images.find(isCardImage) ?? images[0];
  const other = images.find((image) => image !== lead);

  const hero = el("div", `qv-hero capture-${project.theme}`);
  const heroImg = picture(lead);
  hero.append(heroImg);

  const head = el("header", "qv-head");
  const title = el("h2", null, project.name);
  title.id = "qv-title";
  head.append(
    el("span", "qv-kicker", `${project.number} / ${project.status}`),
    title,
    el("p", "qv-tagline", project.tagline),
  );

  const meta = el("dl", "qv-meta");
  [
    ["Role", project.role],
    ["Focus", project.discipline],
    ["Built with", project.stack],
  ].forEach(([term, detail]) => {
    const row = el("div");
    row.append(el("dt", null, term), el("dd", null, detail));
    meta.append(row);
  });

  const problem = el("section", "qv-problem");
  problem.append(
    el("span", "tiny-label", "The challenge"),
    el("p", null, project.problem),
  );

  const decisions = el("ol", "qv-decisions");
  project.decisions.forEach(([heading, text], index) => {
    const item = el("li");
    item.append(
      el("span", "qv-decision-number", String(index + 1).padStart(2, "0")),
      el("h3", null, heading),
      el("p", null, text),
    );
    decisions.append(item);
  });

  content.replaceChildren(hero, head, meta, problem, decisions);
  if (other) {
    const figure = el("figure", `qv-secondary capture-${project.theme}`);
    figure.append(picture(other));
    if (other.title) figure.append(el("figcaption", null, other.title));
    content.append(figure);
  }
  const foot = el("footer", "qv-foot");
  const cta = el("a", "button button-orange qv-cta", "Read the full story ");
  cta.href = project.url;
  const arrow = el("span", null, "↗");
  arrow.setAttribute("aria-hidden", "true");
  cta.append(arrow);
  foot.append(el("p", "qv-caption", project.caption), cta);
  content.append(foot);

  const cards = visibleCards();
  const pad = (n) => String(n).padStart(2, "0");
  counter.textContent = `${pad(cards.indexOf(link) + 1)} / ${pad(cards.length)}`;
  current = { link, cardImg, heroImg };
}

// FLIP by hand: a fixed copy of the image travels between the card and the dialog,
// outside the dialog's scroll container so it is never clipped.
function fly(from, to, src, onLand) {
  const flyer = el("img", "qv-flyer");
  flyer.src = src;
  flyer.alt = "";
  Object.assign(flyer.style, {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  });
  dialog.append(flyer);
  return window.gsap.fromTo(
    flyer,
    {
      x: from.left - to.left,
      y: from.top - to.top,
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
    },
    {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.8,
      ease: EASE.inOut,
      onComplete: () => {
        onLand?.();
        flyer.remove();
      },
    },
  );
}

function open(link) {
  render(link);
  dialog.classList.remove("is-closing");
  dialog.showModal();
  stopScroll();
  dialog.querySelector(".qv-body").scrollTop = 0;
  dialog.querySelector(".qv-close").focus();
  if (!motionOn()) return;
  const { gsap } = window;
  const parts = [
    dialog.querySelector(".qv-bar"),
    ...content.querySelectorAll(":scope > :not(.qv-hero)"),
  ];
  const cardBox = current.cardImg?.getBoundingClientRect();
  if (compact() || !cardBox || !onScreen(cardBox)) {
    gsap.fromTo(
      shell,
      { yPercent: compact() ? 100 : 6, opacity: compact() ? 1 : 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        ease: EASE.inOut,
        clearProps: "transform,opacity",
      },
    );
    return;
  }
  const { heroImg, cardImg } = current;
  const heroBox = heroImg.getBoundingClientRect();
  heroImg.style.visibility = "hidden";
  cardImg.style.visibility = "hidden";
  gsap
    .timeline()
    .fromTo(
      shell,
      { backgroundColor: "rgba(20, 20, 20, 0)" },
      {
        backgroundColor: "rgba(20, 20, 20, 1)",
        duration: 0.5,
        clearProps: "backgroundColor",
      },
      0,
    )
    .from(
      heroImg.parentElement,
      {
        backgroundColor: "rgba(0, 0, 0, 0)",
        duration: 0.6,
        clearProps: "backgroundColor",
      },
      0.2,
    )
    .add(
      fly(
        cardBox,
        heroBox,
        cardImg.currentSrc || cardImg.src,
        () => (heroImg.style.visibility = ""),
      ),
      0,
    )
    .from(
      parts,
      { opacity: 0, y: 30, duration: 0.6, stagger: 0.05, ease: EASE.out },
      0.45,
    );
}

function step(direction) {
  if (!current || closing) return;
  const cards = visibleCards();
  const next =
    cards[(cards.indexOf(current.link) + direction + cards.length) % cards.length];
  if (!next || next === current.link) return;
  const apply = () => {
    if (current.cardImg) current.cardImg.style.visibility = "";
    render(next);
    dialog.querySelector(".qv-body").scrollTop = 0;
  };
  if (!motionOn()) return apply();
  const { gsap } = window;
  gsap.to(content, {
    opacity: 0,
    y: -16,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      apply();
      gsap.fromTo(
        content,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: EASE.out,
          clearProps: "transform,opacity",
        },
      );
    },
  });
}

function close() {
  if (!dialog.open || closing) return;
  const { link, cardImg, heroImg } = current;
  const finish = () => {
    dialog.close();
    dialog.classList.remove("is-closing");
    closing = false;
    startScroll();
    if (cardImg) cardImg.style.visibility = "";
    window.gsap?.set(shell, { clearProps: "all" });
    link.focus({ preventScroll: true });
  };
  if (!motionOn()) return finish();
  const { gsap } = window;
  closing = true;
  dialog.classList.add("is-closing");
  const cardBox = cardImg?.getBoundingClientRect();
  const heroBox = heroImg.getBoundingClientRect();
  if (!compact() && cardBox && onScreen(cardBox) && onScreen(heroBox)) {
    cardImg.style.visibility = "hidden";
    heroImg.style.visibility = "hidden";
    gsap
      .timeline({ onComplete: finish })
      .to(shell, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0)
      .add(fly(heroBox, cardBox, heroImg.currentSrc || heroImg.src), 0);
  } else {
    gsap.to(
      shell,
      compact()
        ? { yPercent: 100, duration: 0.5, ease: "power3.in", onComplete: finish }
        : { opacity: 0, y: 40, duration: 0.35, ease: "power2.in", onComplete: finish },
    );
  }
}
