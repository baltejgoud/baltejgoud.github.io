// First-visit intro: "Hello" in several languages, then a curved curtain lifts.
import { EASE } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

const WORDS = [
  "Hello",
  "నమస్కారం",
  "नमस्ते",
  "Hola",
  "Bonjour",
  "Ciao",
  "こんにちは",
  "Hallo",
  "Hello",
];
const FLAT = "M0 0 L1000 0 L1000 0 Q500 0 0 0 Z";

export function init() {
  const root = document.documentElement;
  const intro = document.querySelector(".intro");
  if (!root.classList.contains("intro") || !intro) return Promise.resolve();
  try {
    sessionStorage.setItem("bg-intro", "1");
  } catch {}
  const { gsap } = window;
  const text = intro.querySelector(".intro-text");
  const curve = intro.querySelector(".intro-curve path");
  stopScroll();
  return new Promise((resolve) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      resolve();
    };
    const skip = () => timeline.progress(1);
    const finish = () => {
      root.classList.remove("intro");
      ["pointerdown", "keydown", "wheel"].forEach((type) =>
        window.removeEventListener(type, skip),
      );
      startScroll();
      release();
    };
    const timeline = gsap.timeline({ onComplete: finish });
    timeline.from(intro.querySelector(".intro-word"), {
      opacity: 0,
      y: 14,
      duration: 0.35,
      ease: EASE.soft,
    });
    WORDS.slice(1).forEach((word, index) =>
      timeline.call(() => (text.textContent = word), null, 0.35 + index * 0.12),
    );
    timeline
      .to(intro, { yPercent: -100, duration: 0.8, ease: EASE.inOut }, "+=0.12")
      .to(curve, { attr: { d: FLAT }, duration: 0.8, ease: EASE.inOut }, "<")
      .call(release, null, "-=0.45");
    ["pointerdown", "keydown", "wheel"].forEach((type) =>
      window.addEventListener(type, skip, { passive: true }),
    );
  });
}
