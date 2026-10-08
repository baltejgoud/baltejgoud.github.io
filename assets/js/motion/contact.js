// The "Let's talk" panel, built once for every page, and the shared toast.
import { motionOn, EASE, EMAIL } from "./gate.js";
import { stopScroll, startScroll } from "./scroll.js";

const LINKS = [
  ["LinkedIn", "https://www.linkedin.com/in/baltejgoud"],
  ["GitHub", "https://github.com/baltejgoud"],
];
let toastTimer;

export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg><span></span>';
    document.body.append(el);
  }
  el.querySelector("span").textContent = message;
  el.classList.remove("is-visible");
  void el.offsetWidth;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast("Email copied.");
  } catch {
    toast("Select the email address to copy it.");
  }
}

export function init() {
  window.bgToast = toast;
  const triggers = document.querySelectorAll(
    '.header-contact, #mobile-nav a[href$="#contact"]',
  );
  if (!triggers.length) return;
  const panel = build();
  const inner = panel.querySelector(".panel-inner");
  let opener = null;
  let closing = false;

  const open = (trigger) => {
    opener = trigger;
    panel.querySelector(".panel-clock").textContent =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()) + " IST";
    panel.showModal();
    stopScroll();
    if (!motionOn()) return;
    const { gsap } = window;
    gsap.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.7, ease: EASE.inOut },
    );
    gsap.from(inner.children, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
      delay: 0.25,
      ease: EASE.out,
    });
  };

  const close = () => {
    if (!panel.open || closing) return;
    const finish = () => {
      panel.close();
      closing = false;
      startScroll();
      window.gsap?.set(panel, { clearProps: "transform" });
      (opener?.offsetParent
        ? opener
        : document.querySelector(".menu-toggle")
      )?.focus();
    };
    if (!motionOn()) return finish();
    closing = true;
    window.gsap.to(panel, {
      xPercent: 100,
      duration: 0.5,
      ease: "power3.in",
      onComplete: finish,
    });
  };

  triggers.forEach((trigger) =>
    trigger.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      open(trigger);
    }),
  );
  panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  panel.querySelector(".panel-close").addEventListener("click", close);
  panel.querySelector(".panel-copy").addEventListener("click", copyEmail);
}

function build() {
  const resume = new URL(
    "resume.html",
    document.querySelector(".brand")?.href ?? location.href,
  ).href;
  const dialog = document.createElement("dialog");
  dialog.className = "contact-panel";
  dialog.setAttribute("aria-labelledby", "contact-panel-title");
  dialog.setAttribute("data-lenis-prevent", "");
  dialog.innerHTML = `<div class="panel-inner">
    <div class="panel-top"><span class="eyebrow">Good things start with a conversation</span><button class="panel-close" type="button">Close <span aria-hidden="true">✕</span></button></div>
    <h2 id="contact-panel-title">Let’s <em>talk.</em></h2>
    <p class="panel-lede">A business idea, a technical challenge, or an interesting conversation. I’m listening.</p>
    <a class="panel-email" href="mailto:${EMAIL}">${EMAIL} <span aria-hidden="true">↗</span></a>
    <button class="panel-copy" type="button">Copy email <span aria-hidden="true">+</span></button>
    <ul class="panel-links">${LINKS.map(([label, href]) => `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a></li>`).join("")}<li><a href="${resume}">Résumé <span aria-hidden="true">↗</span></a></li></ul>
    <p class="panel-time">Hyderabad, India · <span class="panel-clock"></span></p>
  </div>`;
  document.body.append(dialog);
  return dialog;
}
