"use strict";

// Core navigation and disclosures remain native; enhancement stays small.
const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu(returnFocus = false) {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  mobileNav.hidden = true;
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "Open navigation" : "Close navigation",
  );
  mobileNav.hidden = expanded;
});
mobileNav?.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  closeMenu();
  if (link.hash && link.pathname === location.pathname) {
    const destination = document.getElementById(link.hash.slice(1));
    if (destination) {
      destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
    }
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileNav && !mobileNav.hidden) closeMenu(true);
});
document.addEventListener("click", (event) => {
  if (mobileNav && !mobileNav.hidden && !event.target.closest(".site-header"))
    closeMenu();
});
matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

function updateClock() {
  const now = new Date();
  document.querySelectorAll(".local-time").forEach(
    (clock) =>
      (clock.textContent =
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now) + " IST"),
  );
  document.querySelectorAll("#year").forEach(
    (year) =>
      (year.textContent = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
      }).format(now)),
  );
}
updateClock();
setInterval(updateClock, 60000);

// The layout preference is an enhancement; the static grid works without JavaScript.
const viewButtons = [...document.querySelectorAll("[data-view]")];
viewButtons.forEach((button) =>
  button.addEventListener("click", () => {
    viewButtons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    document
      .querySelector(".work-gallery")
      ?.classList.toggle("is-list", button.dataset.view === "list");
  }),
);

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const projectCards = [...document.querySelectorAll(".project-card")];
filterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    let visible = 0;
    projectCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
      if (!card.hidden) visible++;
    });
    document.querySelector("#filter-status").textContent =
      String(visible).padStart(2, "0") + " selected projects";
  }),
);

document.querySelector(".copy-email")?.addEventListener("click", async () => {
  const status = document.querySelector(".copy-status");
  try {
    await navigator.clipboard.writeText("baltej.panagatla@gmail.com");
    status.textContent = "Email copied.";
  } catch {
    status.textContent = "Select the email address above to copy it.";
  }
  setTimeout(() => {
    status.textContent = "";
  }, 5000);
});

if ("IntersectionObserver" in window) {
  const navigationLinks = [...document.querySelectorAll(".desktop-nav a")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navigationLinks.forEach((link) => {
          if (link.hash === "#" + entry.target.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
  );
  document
    .querySelectorAll("main section[id]")
    .forEach((section) => observer.observe(section));
}
