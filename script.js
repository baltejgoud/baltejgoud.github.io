/* ==========================================================================
   Baltej Goud — founder site
   Minimal behaviour: nav state, reveals, chart draw, product view tabs.
   Every animation here is gated on prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- 1. Nav state */

  var nav = document.getElementById("nav");
  var onScroll = function () {
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------- 2. Mobile menu */

  var toggle = document.getElementById("navToggle");
  var panel = document.getElementById("navPanel");

  var closeMenu = function () {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    panel.classList.toggle("is-open", !open);
    toggle.setAttribute("aria-expanded", String(!open));
  });

  panel.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ----------------------------------------------------------- 3. Reveals */

  var reveals = document.querySelectorAll(".reveal");

  if (reduced || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 12% 0px", threshold: 0 });

    Array.prototype.forEach.call(reveals, function (el) {
      // Anything already on screen is shown immediately, so the first viewport
      // never depends on the observer firing (it is suspended in background tabs).
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add("is-in");
        return;
      }
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------- 4. Hero chart draw-in */

  var chart = document.getElementById("heroChart");

  if (chart && !reduced && "IntersectionObserver" in window) {
    Array.prototype.forEach.call(chart.querySelectorAll(".draw"), function (path) {
      var len = Math.ceil(path.getTotalLength());
      path.style.setProperty("--len", len);
    });

    var chartObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-drawn");
        chartObserver.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    chartObserver.observe(chart);
  } else if (chart) {
    chart.classList.add("is-drawn");
  }

  /* ------------------------------------------------- 5. Product view tabs */

  var rail = document.getElementById("rail");

  if (rail) {
    var tabs = Array.prototype.slice.call(rail.querySelectorAll('[role="tab"]'));

    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var view = document.getElementById(t.getAttribute("aria-controls"));
        if (!view) return;
        view.classList.toggle("is-active", on);
        if (on) { view.removeAttribute("hidden"); } else { view.setAttribute("hidden", ""); }
      });
      if (focus) tab.focus();
    };

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { select(tab, false); });

      tab.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(tab);
        var next = null;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];

        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  }

  /* ------------------------------------------------------ 6. Horizon chips */

  Array.prototype.forEach.call(document.querySelectorAll(".chips"), function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      Array.prototype.forEach.call(group.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
  });

  /* ------------------------------------------------- 7. Active nav section */

  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          if (on) { a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
        });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* -------------------------------------------------------------- 8. Year */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
