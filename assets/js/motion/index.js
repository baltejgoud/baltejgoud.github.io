// Entry point for the motion layer. Dialogs work everywhere; animation runs only behind the gate.
import { motionOn } from "./gate.js";
import * as scroll from "./scroll.js";
import * as reveal from "./reveal.js";

const root = document.documentElement;
const lite = root.dataset.motion === "lite";
const disable = (error) => {
  root.classList.remove("motion", "intro");
  if (error) console.error("Motion disabled:", error);
};
const safely = (start) => {
  try {
    start();
  } catch (error) {
    console.error(error);
  }
};

if (motionOn()) {
  try {
    const { gsap, ScrollTrigger, SplitText } = window;
    gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
    if (!lite) {
      scroll.init();
    }
    reveal.init().catch(disable);
    root.classList.add("motion-ready");
  } catch (error) {
    disable(error);
  }
} else {
  disable();
}
