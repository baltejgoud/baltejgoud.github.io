// Pointer effects for mouse and trackpad: magnetic buttons, directional fills,
// arrow swaps, the hero sculpture tilt, the quick-view bubble and hover previews.
import { finePointer, EASE } from "./gate.js";

const MAGNETIC = ".button, .header-contact, .contact-arrow, .circle-arrow";
const FILL = ".button, .header-contact";

export function init() {
  if (!finePointer()) return;
  const { gsap } = window;
  wrapArrows();
  document.querySelectorAll(MAGNETIC).forEach((el) => magnetic(gsap, el));
  document.querySelectorAll(FILL).forEach(directionalFill);
  tilt(gsap);
  quickViewBubble(gsap);
  hoverPreviews(gsap);
}

function magnetic(gsap, el) {
  el.classList.add("is-magnetic");
  el.addEventListener("pointermove", (event) => {
    const box = el.getBoundingClientRect();
    gsap.to(el, {
      "--mx": (event.clientX - box.left - box.width / 2) * 0.3,
      "--my": (event.clientY - box.top - box.height / 2) * 0.3,
      duration: 0.6,
      ease: EASE.soft,
      overwrite: "auto",
    });
  });
  el.addEventListener("pointerleave", () =>
    gsap.to(el, {
      "--mx": 0,
      "--my": 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    }),
  );
}

function directionalFill(el) {
  el.classList.add("has-fill");
  const place = (event) => {
    const box = el.getBoundingClientRect();
    el.style.setProperty("--fx", `${event.clientX - box.left}px`);
    el.style.setProperty("--fy", `${event.clientY - box.top}px`);
  };
  el.addEventListener("pointerenter", place);
  el.addEventListener("pointerleave", place);
}

function wrapArrows() {
  document
    .querySelectorAll(
      'a > span[aria-hidden="true"], button > span[aria-hidden="true"]',
    )
    .forEach((span) => {
      if (
        span.textContent.trim() !== "↗" ||
        span.closest(".capture-cta, .contact-arrow, .brand-symbol, .next-arrow")
      )
        return;
      span.classList.add("arrow-swap");
      span.innerHTML = "<span>↗</span><span>↗</span>";
    });
}

function tilt(gsap) {
  const hero = document.querySelector(".hero");
  const art = hero?.querySelector(".hero-art");
  if (!art) return;
  gsap.set(art, { transformPerspective: 900 });
  const rotateX = gsap.quickTo(art, "rotationX", {
    duration: 0.8,
    ease: EASE.soft,
  });
  const rotateY = gsap.quickTo(art, "rotationY", {
    duration: 0.8,
    ease: EASE.soft,
  });
  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    rotateY(((event.clientX - box.left) / box.width - 0.5) * 12);
    rotateX(-((event.clientY - box.top) / box.height - 0.5) * 12);
  });
  hero.addEventListener("pointerleave", () => {
    rotateX(0);
    rotateY(0);
  });
}

// Eased pointer follower shared by the bubble and the preview card (lerp 0.15).
function follower(gsap, el, { tilt = 0 } = {}) {
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let rotation = 0;
  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    },
    { passive: true },
  );
  gsap.ticker.add(() => {
    const dx = targetX - x;
    const dy = targetY - y;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(rotation) < 0.01)
      return;
    x += dx * 0.15;
    y += dy * 0.15;
    if (tilt)
      rotation += (gsap.utils.clamp(-tilt, tilt, dx * 0.1) - rotation) * 0.15;
    gsap.set(el, { x, y, rotation });
  });
  return {
    jump(event) {
      targetX = x = event.clientX;
      targetY = y = event.clientY;
      gsap.set(el, { x, y });
    },
  };
}

function quickViewBubble(gsap) {
  const captures = document.querySelectorAll("[data-quickview] .project-capture");
  if (!captures.length) return;
  const bubble = document.createElement("div");
  bubble.className = "qv-bubble";
  bubble.setAttribute("aria-hidden", "true");
  bubble.textContent = "Quick view";
  document.body.append(bubble);
  gsap.set(bubble, { scale: 0, opacity: 0 });
  const follow = follower(gsap, bubble);
  captures.forEach((capture) => {
    capture.addEventListener("pointerenter", (event) => {
      follow.jump(event);
      gsap.to(bubble, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: EASE.soft,
        overwrite: "auto",
      });
    });
    capture.addEventListener("pointerleave", () =>
      gsap.to(bubble, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      }),
    );
  });
}

const TONES = ["tone-orange", "tone-ivory", "tone-charcoal"];

function hoverPreviews(gsap) {
  const rows = document.querySelectorAll("[data-preview]");
  if (!rows.length) return;
  const card = document.createElement("div");
  card.className = "hover-preview";
  card.setAttribute("aria-hidden", "true");
  document.body.append(card);
  gsap.set(card, { scale: 0.6, opacity: 0 });
  const follow = follower(gsap, card, { tilt: 8 });
  let visible = false;
  rows.forEach((row, index) => {
    row.addEventListener("pointerenter", (event) => {
      renderPreview(card, row, index);
      if (!visible) follow.jump(event);
      visible = true;
      gsap.to(card, {
        scale: 1,
        opacity: 1,
        duration: 0.45,
        ease: EASE.soft,
        overwrite: "auto",
      });
    });
    row.addEventListener("pointerleave", () => {
      visible = false;
      gsap.to(card, {
        scale: 0.6,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      });
    });
  });
}

// Rows with a real image show it; the rest get a typographic card built from the row's
// own text, so no imagery is invented.
function renderPreview(card, row, index) {
  const image = row.dataset.previewImage;
  card.className = `hover-preview ${image ? "has-image" : TONES[index % TONES.length]}`;
  if (image) {
    const img = new Image();
    img.src = image;
    img.alt = "";
    card.replaceChildren(img);
    return;
  }
  const text = (selector) =>
    row.querySelector(selector)?.textContent.trim() ?? "";
  const number = document.createElement("span");
  number.className = "hover-preview-number";
  number.textContent = text(".archive-number, .experience-index");
  const title = document.createElement("strong");
  title.textContent = text(":scope > span:nth-child(2), h3");
  const meta = document.createElement("span");
  meta.className = "hover-preview-meta";
  meta.textContent = text(".archive-category, .experience-role");
  card.replaceChildren(number, title, meta);
}
