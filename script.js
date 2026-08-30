/* ==========================================================================
   Baltej Goud — founder site
   Minimal behaviour: nav state, progress bar, scroll-to-top, reveals,
   chart draw, product view tabs, interactive horizon projections.
   Every animation here is gated on prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------- 1. Nav state & Reading Progress Bar */

  var nav = document.getElementById("nav");
  var navProgress = document.getElementById("navProgress");
  var scrollTopBtn = document.getElementById("scrollTop");

  var ticking = false;
  var onScroll = function () {
    var scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    
    // Nav border toggle
    if (nav) {
      nav.classList.toggle("is-stuck", scrollY > 8);
    }

    // Scroll progress bar
    if (navProgress) {
      var totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      var progressPct = totalScroll > 0 ? Math.min(100, Math.max(0, (scrollY / totalScroll) * 100)) : 0;
      navProgress.style.width = progressPct + "%";
    }

    // Back to top button visibility
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("is-visible", scrollY > 600);
    }

    ticking = false;
  };

  var requestTick = function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  };

  onScroll();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });

  // Scroll to top button handler
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ------------------------------------------------------- 2. Mobile menu */

  var toggle = document.getElementById("navToggle");
  var panel = document.getElementById("navPanel");

  var closeMenu = function () {
    if (panel) panel.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  };

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      panel.classList.toggle("is-open", !open);
      toggle.setAttribute("aria-expanded", String(!open));
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
  }

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
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add("is-in");
        return;
      }
      revealObserver.observe(el);
    });
  }

  /* ------------------------------- 4. Hero Interactive Demand Dashboard */

  var heroDash = document.getElementById("heroDash");
  if (heroDash) {
    var skuSelect = document.getElementById("heroSkuSelect");
    var horizonChips = document.getElementById("heroHorizonChips");
    var shockBtn = document.getElementById("heroShockBtn");
    var dashStage = document.getElementById("heroDashStage");
    var svg = document.getElementById("heroSvg");

    var band = document.getElementById("heroBand");
    var pastArea = document.getElementById("heroPastArea");
    var futArea = document.getElementById("heroFutArea");
    var pastPath = document.getElementById("heroPastPath");
    var futPath = document.getElementById("heroFutPath");
    var cursorGroup = document.getElementById("heroCursorGroup");
    var cursorLine = document.getElementById("heroCursorLine");
    var cursorDot = document.getElementById("heroCursorDot");
    var tooltip = document.getElementById("heroTooltip");
    var ttTag = document.getElementById("heroTtTag");
    var ttVal = document.getElementById("heroTtVal");
    var ttSub = document.getElementById("heroTtSub");
    var axisMax = document.getElementById("heroAxisMax");

    var modelVal = document.getElementById("heroModelVal");
    var confVal = document.getElementById("heroConfVal");
    var mapeVal = document.getElementById("heroMapeVal");
    var actionVal = document.getElementById("heroActionVal");

    var datasets = {
      "sku-2481": {
        past: [45, 62, 58, 88, 76, 112, 105, 142, 130, 168, 155, 192, 180, 215],
        future: {
          "4w":  [230, 248, 270, 295],
          "12w": [230, 248, 270, 295, 320, 350, 380, 410, 440, 470, 500, 530],
          "26w": [230, 245, 265, 290, 315, 345, 375, 400, 430, 455, 480, 505, 530, 550, 570, 590, 605, 620, 630, 640, 645, 650, 648, 640, 630, 615]
        },
        model: "XGBoost v2.4",
        conf: "96.4%",
        mape: "4.2%",
        action: "Review Wk 22 Buy",
        isWarn: true,
        unit: "units"
      },
      "sku-8920": {
        past: [110, 130, 155, 185, 220, 255, 280, 295, 305, 310, 305, 298, 285, 270],
        future: {
          "4w":  [255, 238, 220, 202],
          "12w": [255, 238, 220, 202, 185, 168, 150, 135, 120, 105, 92, 80],
          "26w": [255, 240, 225, 210, 195, 180, 165, 150, 138, 125, 115, 105, 95, 85, 78, 70, 65, 60, 55, 50, 45, 42, 40, 38, 35, 32]
        },
        model: "Prophet Ensemble",
        conf: "94.8%",
        mape: "5.1%",
        action: "Phase-out Ramp",
        isWarn: false,
        unit: "units"
      },
      "sku-1045": {
        past: [310, 308, 315, 312, 320, 318, 325, 322, 330, 328, 335, 332, 340, 338],
        future: {
          "4w":  [342, 346, 350, 353],
          "12w": [342, 346, 350, 353, 357, 361, 365, 368, 372, 376, 380, 384],
          "26w": [342, 345, 348, 352, 355, 358, 362, 365, 368, 372, 375, 378, 382, 385, 388, 392, 395, 398, 402, 405, 408, 412, 415, 418, 422, 425]
        },
        model: "Chronos Zero-Shot",
        conf: "98.1%",
        mape: "2.9%",
        action: "Part 11 Compliant",
        isWarn: false,
        unit: "vials"
      }
    };

    var currentSku = "sku-2481";
    var currentHorizon = "12w";
    var isShock = false;
    var renderedPoints = [];

    var render = function () {
      var ds = datasets[currentSku];
      if (!ds) return;

      var past = ds.past;
      var rawFut = ds.future[currentHorizon] || ds.future["12w"];
      var fut = isShock ? rawFut.map(function (v) { return Math.round(v * 1.25); }) : rawFut;

      // Update telemetry
      if (modelVal) modelVal.textContent = ds.model;
      if (confVal) confVal.textContent = isShock ? (parseFloat(ds.conf) - 1.8).toFixed(1) + "%" : ds.conf;
      if (mapeVal) mapeVal.textContent = isShock ? (parseFloat(ds.mape) + 1.2).toFixed(1) + "%" : ds.mape;
      if (actionVal) {
        actionVal.textContent = isShock ? "Reorder Triggered" : ds.action;
        actionVal.className = "dash-stat-v dash-status" + (isShock || ds.isWarn ? " is-warn" : "");
      }
      if (axisMax) axisMax.textContent = "W+" + fut.length;

      // Calculate SVG Coordinates
      var width = 600;
      var height = 220;
      var padLeft = 30;
      var padRight = 30;
      var padTop = 35;
      var padBottom = 35;

      var splitX = 320;
      var pastCount = past.length;
      var futCount = fut.length;

      var allVals = past.concat(fut);
      var maxVal = Math.max.apply(null, allVals) * 1.15;
      var minVal = Math.min.apply(null, allVals) * 0.85;

      var getY = function (val) {
        var ratio = (val - minVal) / (maxVal - minVal);
        return (height - padBottom) - ratio * (height - padTop - padBottom);
      };

      renderedPoints = [];

      // Past points
      var pastPts = [];
      for (var i = 0; i < pastCount; i++) {
        var x = padLeft + (i / (pastCount - 1)) * (splitX - padLeft);
        var y = getY(past[i]);
        var pt = { x: x, y: y, val: past[i], week: "W−" + (pastCount - i), isPast: true };
        pastPts.push(pt);
        renderedPoints.push(pt);
      }

      // Future points (starts from last past point)
      var futPts = [{ x: splitX, y: pastPts[pastPts.length - 1].y, val: past[past.length - 1], week: "NOW", isPast: true }];
      for (var j = 0; j < futCount; j++) {
        var fx = splitX + ((j + 1) / futCount) * (width - padRight - splitX);
        var fy = getY(fut[j]);
        var fpt = { x: fx, y: fy, val: fut[j], week: "W+" + (j + 1), isPast: false };
        futPts.push(fpt);
        renderedPoints.push(fpt);
      }

      // Build smooth Bezier path strings
      var buildPath = function (pts) {
        if (!pts.length) return "";
        var d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
        for (var k = 0; k < pts.length - 1; k++) {
          var p0 = pts[k === 0 ? 0 : k - 1];
          var p1 = pts[k];
          var p2 = pts[k + 1];
          var p3 = pts[k + 2 < pts.length ? k + 2 : pts.length - 1];
          var cp1x = p1.x + (p2.x - p0.x) / 6;
          var cp1y = p1.y + (p2.y - p0.y) / 6;
          var cp2x = p2.x - (p3.x - p1.x) / 6;
          var cp2y = p2.y - (p3.y - p1.y) / 6;
          d += " C " + cp1x.toFixed(1) + " " + cp1y.toFixed(1) + ", " + cp2x.toFixed(1) + " " + cp2y.toFixed(1) + ", " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
        }
        return d;
      };

      var pastD = buildPath(pastPts);
      var futD = buildPath(futPts);

      if (pastPath) pastPath.setAttribute("d", pastD);
      if (futPath) futPath.setAttribute("d", futD);

      // Area paths
      if (pastArea) {
        var pAreaD = pastD + " L " + splitX + " " + (height - padBottom) + " L " + padLeft + " " + (height - padBottom) + " Z";
        pastArea.setAttribute("d", pAreaD);
      }
      if (futArea) {
        var lastFut = futPts[futPts.length - 1];
        var fAreaD = futD + " L " + lastFut.x.toFixed(1) + " " + (height - padBottom) + " L " + splitX + " " + (height - padBottom) + " Z";
        futArea.setAttribute("d", fAreaD);
      }

      // Confidence Envelope Polygon
      if (band) {
        var upperPts = [];
        var lowerPts = [];
        for (var b = 0; b < futPts.length; b++) {
          var spread = b === 0 ? 0 : (b / futPts.length) * (isShock ? 26 : 18);
          upperPts.push(futPts[b].x.toFixed(1) + "," + (futPts[b].y - spread).toFixed(1));
          lowerPts.unshift(futPts[b].x.toFixed(1) + "," + (futPts[b].y + spread).toFixed(1));
        }
        band.setAttribute("points", upperPts.concat(lowerPts).join(" "));
      }
    };

    // Hover scrubber
    if (dashStage && svg) {
      dashStage.addEventListener("mousemove", function (e) {
        var rect = svg.getBoundingClientRect();
        var clientX = e.clientX - rect.left;
        var svgX = (clientX / rect.width) * 600;

        if (svgX < 25 || svgX > 575 || !renderedPoints.length) {
          if (cursorGroup) cursorGroup.style.opacity = "0";
          if (tooltip) tooltip.style.opacity = "0";
          return;
        }

        // Find closest point
        var closest = renderedPoints[0];
        var minDiff = Math.abs(svgX - closest.x);
        for (var p = 1; p < renderedPoints.length; p++) {
          var diff = Math.abs(svgX - renderedPoints[p].x);
          if (diff < minDiff) {
            minDiff = diff;
            closest = renderedPoints[p];
          }
        }

        if (cursorGroup && cursorLine && cursorDot) {
          cursorGroup.style.opacity = "1";
          cursorLine.setAttribute("x1", closest.x);
          cursorLine.setAttribute("x2", closest.x);
          cursorDot.setAttribute("cx", closest.x);
          cursorDot.setAttribute("cy", closest.y);
        }

        if (tooltip && ttTag && ttVal && ttSub) {
          tooltip.style.opacity = "1";
          var ttX = (closest.x / 600) * rect.width;
          var leftOffset = Math.min(Math.max(10, ttX - 60), rect.width - 130);
          tooltip.style.transform = "translate(" + leftOffset + "px, 0px)";

          ttTag.textContent = closest.isPast ? "HISTORICAL" : "FORECAST";
          ttVal.textContent = closest.val;
          ttSub.textContent = closest.week + (closest.isPast ? " · Recorded" : " · CI ±" + (isShock ? "9%" : "5%"));
        }
      });

      dashStage.addEventListener("mouseleave", function () {
        if (cursorGroup) cursorGroup.style.opacity = "0";
        if (tooltip) tooltip.style.opacity = "0";
      });
    }

    // SKU Select
    if (skuSelect) {
      skuSelect.addEventListener("change", function () {
        currentSku = skuSelect.value;
        render();
      });
    }

    // Horizon Chips
    if (horizonChips) {
      horizonChips.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        currentHorizon = btn.getAttribute("data-horizon") || "12w";
        Array.prototype.forEach.call(horizonChips.querySelectorAll(".dash-chip"), function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    }

    // Shock Button
    if (shockBtn) {
      shockBtn.addEventListener("click", function () {
        isShock = !isShock;
        shockBtn.setAttribute("aria-pressed", String(isShock));
        render();
      });
    }

    render();
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

  /* ------------------------------- 6. Interactive Horizon Forecast Switcher */

  var horizonGroup = document.getElementById("horizonChips");
  var horizonBand = document.getElementById("horizonBand");
  var horizonFut = document.getElementById("horizonFut");
  var horizonMarker = document.getElementById("horizonMarker");
  var horizonNote = document.getElementById("horizonNote");
  var horizonAxisLabel = document.getElementById("horizonAxisLabel");

  var horizonConfigs = {
    "4": {
      band: "300,104 330,101 360,98 380,95 380,107 360,109 330,107 300,104",
      fut: "M300 104 C325 102 350 100 380 96",
      cx: "380",
      cy: "96",
      axis: "Projected · 95% interval",
      note: "Short 4-week window: high precision, immediate replenishment guidance with minimal variance."
    },
    "13": {
      band: "300,104 350,98 400,90 460,78 460,98 400,104 350,110 300,104",
      fut: "M300 104 C340 100 390 92 460 84",
      cx: "460",
      cy: "84",
      axis: "Projected · 90% interval",
      note: "Quarterly 13-week window: balances seasonal ramp with standard supplier lead times."
    },
    "26": {
      band: "300,104 360,96 420,84 480,68 540,54 620,38 620,80 540,86 480,94 420,106 360,112 300,104",
      fut: "M300 104 C350 100 380 94 420 90 C470 85 520 72 560 64 C590 58 606 56 620 54",
      cx: "620",
      cy: "54",
      axis: "Projected · 80% interval",
      note: "Interval widens with horizon. Beyond week 20 the recommendation shifts from ordering quantity to reorder timing."
    },
    "52": {
      band: "300,104 360,94 420,78 480,60 540,42 630,22 630,94 540,88 480,98 420,108 360,114 300,104",
      fut: "M300 104 C350 98 420 86 480 72 C540 60 580 48 630 40",
      cx: "630",
      cy: "40",
      axis: "Projected · 70% interval",
      note: "Annual 52-week window: macro seasonality, capacity planning and bulk contract negotiations."
    }
  };

  if (horizonGroup) {
    horizonGroup.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;

      var horizonKey = btn.getAttribute("data-horizon") || btn.textContent.replace("W", "").trim();
      var config = horizonConfigs[horizonKey];

      Array.prototype.forEach.call(horizonGroup.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });

      if (config) {
        if (horizonBand) horizonBand.setAttribute("points", config.band);
        if (horizonFut) horizonFut.setAttribute("d", config.fut);
        if (horizonMarker) {
          horizonMarker.setAttribute("cx", config.cx);
          horizonMarker.setAttribute("cy", config.cy);
        }
        if (horizonAxisLabel) horizonAxisLabel.textContent = config.axis;
        if (horizonNote) {
          horizonNote.innerHTML = '<i class="dot" aria-hidden="true"></i>' + config.note;
        }
      }
    });
  }

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

