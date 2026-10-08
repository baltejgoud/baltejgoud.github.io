// Entry point for the motion layer. Dialogs work everywhere; animation runs only behind the gate.
import { motionOn } from "./gate.js";
import * as scroll from "./scroll.js";
import * as reveal from "./reveal.js";
import * as loader from "./loader.js";
import * as cursor from "./cursor.js";
import * as contact from "./contact.js";
import * as quickview from "./quickview.js";

const root = document.documentElement;
const lite = root.dataset.motion === "lite";
// Falls back to the static page: content visible, scrolling unlocked.
const disable = (error) => {
  root.classList.remove("motion", "intro");
  if (error) {
    console.error("Motion disabled:", error);
    const { gsap, ScrollTrigger } = window;
    ScrollTrigger?.killAll();
    gsap?.set("[data-reveal], [data-reveal] img, [data-hero], .reveal-line", {
      clearProps: "all",
    });
  }
  scroll.startScroll();
};
const safely = (start) => {
  try {
    start();
  } catch (error) {
    console.error(error);
  }
};

safely(contact.init);
safely(quickview.init);

if (motionOn()) {
  try {
    const { gsap, ScrollTrigger, SplitText } = window;
    gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
    if (!lite) {
      scroll.init();
      cursor.init();
    }
    const heroReady = lite ? Promise.resolve() : loader.init();
    reveal.init({ heroReady }).catch(disable);
    root.classList.add("motion-ready");
  } catch (error) {
    disable(error);
  }
} else {
  disable();
}
