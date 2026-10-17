// Smooth scrolling, header visibility, the progress line and the discipline marquee.
import { finePointer } from "./gate.js";

const root = document.documentElement;
let lenis = null;

export function stopScroll() {
  lenis?.stop();
  root.classList.add("scroll-locked");
}

export function startScroll() {
  lenis?.start();
  root.classList.remove("scroll-locked");
}

export function init() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (finePointer() && Lenis) {
    // Anchor offsets come from scroll-padding-top in style.css.
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  initHeader();
  initProgress(gsap);
  initMarquee(gsap, ScrollTrigger);
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const menu = document.querySelector("#mobile-nav");
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 4) return;
    const menuOpen = menu && !menu.hidden;
    const keyboardFocus = header.querySelector(":focus-visible");
    header.classList.toggle(
      "is-hidden",
      y > 120 && y > lastY && !menuOpen && !keyboardFocus,
    );
    lastY = y;
  };
  window.addEventListener("scroll", update, { passive: true });
  header.addEventListener("focusin", () => {
    if (header.querySelector(":focus-visible"))
      header.classList.remove("is-hidden");
  });
}

function initProgress(gsap) {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);
  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });
}

function initMarquee(gsap, ScrollTrigger) {
  const strip = document.querySelector(".discipline-strip");
  const track = strip?.querySelector(".marquee-track");
  const group = track?.querySelector(".marquee-group");
  if (!group) return;
  strip.classList.add("is-marquee");
  let width = 0;
  const fill = () => {
    track.querySelectorAll("[data-clone]").forEach((clone) => clone.remove());
    width = group.offsetWidth;
    const copies = Math.ceil(strip.offsetWidth / width) + 1;
    for (let i = 0; i < copies; i++) {
      const clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.clone = "";
      track.append(clone);
    }
  };
  fill();
  new ResizeObserver(fill).observe(strip);

  let x = 0;
  let direction = 1;
  let boost = 0;
  const trigger = ScrollTrigger.create({
    trigger: strip,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      direction = self.direction;
      boost = Math.min(Math.abs(self.getVelocity()) / 300, 6);
    },
  });
  gsap.ticker.add((time, deltaTime) => {
    if (!trigger.isActive || !width) return;
    boost *= 0.94;
    x -= direction * 40 * (1 + boost) * (deltaTime / 1000);
    x = gsap.utils.wrap(-width, 0, x);
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}
