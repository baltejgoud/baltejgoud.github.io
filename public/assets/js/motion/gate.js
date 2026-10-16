// Shared capability checks and constants for the motion modules.
const root = document.documentElement;
const finePointerQuery = matchMedia("(hover: hover) and (pointer: fine)");
const compactQuery = matchMedia("(max-width: 800px)");

/** Motion allowed by the head gate and GSAP with ScrollTrigger loaded. */
export const motionOn = () =>
  root.classList.contains("motion") &&
  Boolean(window.gsap && window.ScrollTrigger);
/** A mouse or trackpad: cursor effects and smooth scrolling. */
export const finePointer = () => finePointerQuery.matches;
/** Below the 800px breakpoint used by style.css. */
export const compact = () => compactQuery.matches;

export const EASE = {
  out: "power4.out",
  inOut: "power4.inOut",
  soft: "power3.out",
};
export const EMAIL = "baltej.panagatla@gmail.com";
