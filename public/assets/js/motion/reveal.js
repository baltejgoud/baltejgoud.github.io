// Entrance and scroll reveals: split lines, fades, image unmasking, rules, parallax, count-up.
import { EASE } from "./gate.js";

const START = "top 85%";
const fontsReady = () =>
  Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);

export async function init({ heroReady = Promise.resolve() } = {}) {
  const { gsap, ScrollTrigger } = window;
  revealFades(gsap, ScrollTrigger);
  revealImages(gsap, ScrollTrigger);
  revealRules(gsap, ScrollTrigger);
  parallax(gsap);
  countUp(gsap);
  sanketScrub(gsap);
  refreshOnLayoutChange(ScrollTrigger);
  await fontsReady();
  revealLines(gsap);
  await hero(gsap, heroReady);
}

function revealFades(gsap, ScrollTrigger) {
  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: START,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: EASE.soft,
        onComplete: () =>
          batch.forEach((el) => el.classList.add("is-revealed")),
      }),
  });
}

// The timeline is played by a separate trigger: a timeline-attached ScrollTrigger waits a
// tick to measure itself, and creating later `once` triggers on a page loaded mid-scroll
// then makes ScrollTrigger refresh it mid-loop and crash.
function revealImages(gsap, ScrollTrigger) {
  gsap.utils.toArray('[data-reveal="image"]').forEach((frame) => {
    const img = frame.querySelector("img");
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        frame.classList.add("is-revealed");
        gsap.set(frame, { clearProps: "clipPath" });
        if (img)
          gsap.set(img, {
            clearProps: img.hasAttribute("data-parallax")
              ? "transition"
              : "transform,transition",
          });
      },
    });
    timeline.fromTo(
      frame,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: EASE.inOut },
    );
    if (img)
      timeline.fromTo(
        img,
        { scale: 1.15, transition: "none" },
        { scale: 1, duration: 1.4, ease: EASE.out },
        0,
      );
    ScrollTrigger.create({
      trigger: frame,
      start: START,
      once: true,
      onEnter: () => timeline.play(),
    });
  });
}

function revealRules(gsap, ScrollTrigger) {
  const rules = gsap.utils.toArray('[data-reveal="rule"]');
  if (!rules.length) return;
  gsap.set(rules, { "--rule": 0 });
  ScrollTrigger.batch(rules, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        "--rule": 1,
        duration: 1.1,
        stagger: 0.06,
        ease: EASE.inOut,
        onComplete: () =>
          batch.forEach((el) => el.classList.add("is-revealed")),
      }),
  });
}

function revealLines(gsap) {
  const { SplitText } = window;
  if (!SplitText) return;
  gsap.utils.toArray('[data-reveal="lines"]').forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "reveal-line",
      autoSplit: true,
      onSplit(self) {
        el.classList.add("is-split");
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.08,
          ease: EASE.out,
          scrollTrigger: { trigger: el, start: START, once: true },
          onComplete: () => {
            self.kill();
            self.revert();
            el.classList.add("is-revealed");
          },
        });
      },
    });
  });
}

async function hero(gsap, heroReady) {
  const items = gsap.utils.toArray("[data-hero]");
  if (!items.length) return;
  const { SplitText } = window;
  const title = items.find((el) => el.dataset.hero === "lines");
  const fades = items.filter((el) => el.dataset.hero === "fade");
  const art = items.find((el) => el.dataset.hero === "art");
  const split =
    title && SplitText
      ? SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "reveal-line",
        })
      : null;
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: EASE.out },
    onComplete: () => {
      split?.revert();
      items.forEach((el) => el.classList.add("is-revealed"));
    },
  });
  if (split) {
    title.classList.add("is-split");
    timeline.from(
      split.lines,
      { yPercent: 110, duration: 1.1, stagger: 0.1 },
      0.1,
    );
  } else if (title) title.classList.add("is-split");
  timeline.to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.3);
  if (art)
    timeline.to(
      art,
      { opacity: 1, scale: 1, duration: 1.6, ease: "expo.out" },
      0.2,
    );
  await heroReady;
  timeline.play();
}

function parallax(gsap) {
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax) || 8;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
  const sculpture = document.querySelector(".hero-art img");
  if (sculpture)
    gsap.to(sculpture, {
      yPercent: -12,
      rotation: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
}

function countUp(gsap) {
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const node = [...el.childNodes].find(
      (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
    );
    const target = Number(el.dataset.count);
    if (!node || !Number.isFinite(target)) return;
    const value = { n: 0 };
    node.textContent = "0";
    gsap.to(value, {
      n: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: START, once: true },
      onUpdate: () => (node.textContent = String(Math.round(value.n))),
    });
  });
}

function sanketScrub(gsap) {
  const frame = document.querySelector(".sanket-product > a");
  if (!frame) return;
  gsap.fromTo(
    frame,
    { scale: 0.9, borderRadius: 24 },
    {
      scale: 1,
      borderRadius: 3,
      ease: "none",
      scrollTrigger: {
        trigger: frame,
        start: "top bottom",
        end: "top 30%",
        scrub: true,
      },
    },
  );
}

function refreshOnLayoutChange(ScrollTrigger) {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-filter], [data-view], summary"))
      setTimeout(() => ScrollTrigger.refresh(), 600);
  });
}
