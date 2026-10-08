// Pointer effects for mouse and trackpad: magnetic buttons, directional fills,
// arrow swaps and the hero sculpture tilt.
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
