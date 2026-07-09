/* ═══════════════════════════════════════════════════════════════
   BALTEJ GOUD — 日食 (Nisshoku / Totality)
   Motion system: title card, kinetic type, scroll choreography,
   parallax atmosphere, PRISMA HUD, dossier modal.
   ═══════════════════════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

/* ── 1. Title card loader ───────────────────────────────────── */
const loader = document.getElementById("loader");
const seen = sessionStorage.getItem("bg-seen");
const loaderDelay = prefersReducedMotion || seen ? 150 : 1700;
window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("done");
    sessionStorage.setItem("bg-seen", "1");
    revealHeroType();
  }, loaderDelay);
});
// Safety: never trap the visitor behind the title card
setTimeout(() => {
  if (!loader.classList.contains("done")) {
    loader.classList.add("done");
    revealHeroType();
  }
}, 4000);

/* ── 2. Kinetic typography — split display lines into chars ─── */
document.querySelectorAll("[data-split]").forEach((line) => {
  const text = line.textContent;
  line.textContent = "";
  line.setAttribute("aria-hidden", "true");
  let i = 0;
  text.split(/\s+/).forEach((wordText, w, words) => {
    const word = document.createElement('span');
    word.className = 'word';
    [...wordText].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      span.style.transitionDelay = `${i++ * 0.035}s`;
      word.appendChild(span);
    });
    line.appendChild(word);
    if (w < words.length - 1) line.appendChild(document.createTextNode(' '));
  });
});

function revealHeroType() {
  const name = document.querySelector(".hero-name");
  if (name) name.classList.add("chars-in");
}

/* ── 2.1. Canvas Star/Constellation Engine ────────────────────── */
(function() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || prefersReducedMotion) return;
  
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  const particles = [];
  const particleCount = Math.min(80, Math.floor((width * height) / 15000));
  const connectionDist = 110;
  let mouse = { x: -1000, y: -1000 };

  class Star {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height * 0.75; // Keep in upper 75% of sky
      this.vx = (Math.random() - 0.5) * 0.08;
      this.vy = (Math.random() - 0.5) * 0.08;
      this.radius = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.3;
      this.phase = Math.random() * Math.PI * 2;
      this.phaseSpeed = Math.random() * 0.02 + 0.005;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.phase += this.phaseSpeed;
      
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height * 0.75;
      if (this.y > height * 0.75) this.y = 0;
    }
    draw() {
      const currentAlpha = Math.max(0.1, this.alpha + Math.sin(this.phase) * 0.2);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      // Alternate between gold and silver-white stars
      const isGold = (this.phase > Math.PI);
      ctx.fillStyle = isGold
        ? `rgba(255, 215, 0, ${currentAlpha * 0.6})`
        : `rgba(255, 246, 223, ${currentAlpha})`;
      ctx.fill();
    }
  }

  function init() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Star());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDist) {
          let mouseFactor = 1;
          if (mouse.x > -100 && mouse.y > -100) {
            const mdx1 = p1.x - mouse.x;
            const mdy1 = p1.y - mouse.y;
            const mdist1 = Math.sqrt(mdx1 * mdx1 + mdy1 * mdy1);
            const mdx2 = p2.x - mouse.x;
            const mdy2 = p2.y - mouse.y;
            const mdist2 = Math.sqrt(mdx2 * mdx2 + mdy2 * mdy2);
            
            if (mdist1 < 160 && mdist2 < 160) {
              mouseFactor = 2.2;
            }
          }

          const alpha = (1 - dist / connectionDist) * 0.10 * mouseFactor;
          if (alpha > 0) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(189, 244, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (mouse.x > -100 && mouse.y > -100) {
        const dx = p1.x - mouse.x;
        const dy = p1.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const alpha = (1 - dist / 150) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          const grad = ctx.createLinearGradient(p1.x, p1.y, mouse.x, mouse.y);
          grad.addColorStop(0, `rgba(189, 244, 255, ${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(255, 215, 0, ${alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      p1.update();
      p1.draw();
    }
    requestAnimationFrame(animate);
  }

  const heroSection = document.getElementById("hero");
  if (heroSection) {
    heroSection.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener("mouseleave", () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });
  }

  window.addEventListener("resize", () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    init();
  });

  init();
  animate();
})();

/* ── 3. Card Spotlights Coordinate Tracking ─────────────────── */
document.querySelectorAll(".panel").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  });
});

/* ── 4. Scroll: progress bar, header state, parallax ────────── */
const progress = document.getElementById("scroll-progress");
const header = document.getElementById("site-header");
const skyFar = document.querySelector(".skyline-far");
const skyNear = document.querySelector(".skyline-near");
const stars = document.querySelector(".stars");
const heroEl = document.getElementById("hero");
const prismRefraction = document.querySelector(".prisma-refraction-container");
const prismGlass = document.querySelector(".prism-glass-group");
const prismRays = document.querySelectorAll(".prisma-refraction-container .ray");

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    header.classList.toggle("scrolled", y > 60);

    // Parallax atmosphere while the hero is on screen
    if (!prefersReducedMotion && heroEl && y < window.innerHeight * 1.2) {
      if (skyFar)  skyFar.style.transform  = `translateY(${y * 0.12}px)`;
      if (skyNear) skyNear.style.transform = `translateY(${y * 0.05}px)`;
      if (stars)   stars.style.transform   = `translateY(${y * 0.28}px)`;
    }

    // Refraction scroll animation
    if (!prefersReducedMotion && prismRefraction) {
      const rect = prismRefraction.getBoundingClientRect();
      const winH = window.innerHeight;
      if (rect.top < winH && rect.bottom > 0) {
        const centerOffset = (rect.top + rect.height / 2 - winH / 2) / (winH / 2);
        const clampOffset = Math.max(-1, Math.min(1, centerOffset));
        if (prismGlass) {
          prismGlass.style.transform = `rotate(${clampOffset * 6}deg)`;
        }
        if (prismRays.length >= 4) {
          prismRays[0].style.transform = `rotate(${-4 + clampOffset * 5}deg) scaleX(${1 + Math.abs(clampOffset) * 0.04})`;
          prismRays[1].style.transform = `rotate(${-2 + clampOffset * 3}deg) scaleX(${1 + Math.abs(clampOffset) * 0.02})`;
          prismRays[2].style.transform = `rotate(${2 + clampOffset * -3}deg) scaleX(${1 + Math.abs(clampOffset) * 0.02})`;
          prismRays[3].style.transform = `rotate(${4 + clampOffset * -5}deg) scaleX(${1 + Math.abs(clampOffset) * 0.04})`;
        }
      }
    }
    ticking = false;
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ── 5. Full-screen menu ────────────────────────────────────── */
const menuBtn = document.getElementById("menu-btn");
menuBtn.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
  document.getElementById("menu-overlay").setAttribute("aria-hidden", String(!open));
});
document.querySelectorAll(".menu-link").forEach((link) =>
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);
// IST clock in the menu footer
function tickClock() {
  const el = document.getElementById("menu-clock");
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  }).format(new Date());
}
tickClock();
setInterval(tickClock, 30000);

/* ── 6. Scroll choreography — reveal system ─────────────────── */
const revealables = document.querySelectorAll(".reveal, .reveal-wipe, .reveal-panel, .finale-title");
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        if (el.classList.contains("finale-title")) el.classList.add("chars-in");
        if (el.classList.contains("reveal-panel") && el.closest(".hud-wrap")) drawHudLine();
        if (el.querySelector?.(".fact-v")) startCounters(el);
        io.unobserve(el);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("in", "chars-in"));
}

/* Stagger siblings inside grids for a cascading entrance */
document.querySelectorAll(".panel-grid, .prisma-framing, .hud-kpis, .prisma-facts, .craft-cols").forEach((grid) => {
  [...grid.children].forEach((child, i) => {
    if (child.classList.contains("reveal") || child.classList.contains("reveal-panel")) {
      child.style.transitionDelay = `${i * 0.09}s`;
    }
  });
});

/* ── 7. Counters (PRISMA facts) ─────────────────────────────── */
let countersDone = false;
function startCounters(scope) {
  if (countersDone) return;
  countersDone = true;
  scope.closest(".cs-body")?.querySelectorAll(".fact-v").forEach(run);
  function run(el) {
    if (el.classList.contains("fact-inf")) {
      setTimeout(() => (el.textContent = "∞"), 500);
      return;
    }
    const target = +el.dataset.count;
    const dur = 900;
    const t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
}
// Fallback if the section renders without the observer path
document.querySelectorAll(".fact-v").forEach((el) => {
  if (prefersReducedMotion) {
    el.textContent = el.classList.contains("fact-inf") ? "∞" : el.dataset.count;
    countersDone = true;
  }
});

/* ── 8. PRISMA HUD — vertical switching ─────────────────────── */
const VERTICALS = {
  fashion: {
    color: "#ffd700",
    sellthrough: "94.2%", mape: "5.8%", model: "XGBoost",
    msg: "Optimizing NYC, LA and Miami regional hubs.",
    line: "M0 65 C20 55 40 65 60 50 C80 35 100 42 120 25 C140 10 160 20 180 15 C200 10 220 22 240 18 C260 14 280 24 300 20",
  },
  electronics: {
    color: "#00e3fd",
    sellthrough: "91.7%", mape: "4.3%", model: "Prophet",
    msg: "Lifecycle-aware forecast: 3 SKUs entering end-of-life.",
    line: "M0 60 C20 62 40 48 60 52 C80 56 100 30 120 34 C140 38 160 18 180 24 C200 30 220 12 240 16 C260 20 280 10 300 14",
  },
  pharma: {
    color: "#e7d1ff",
    sellthrough: "97.1%", mape: "3.2%", model: "Ensemble",
    msg: "GxP audit trail verified — batch 8842 signed and sealed.",
    line: "M0 55 C20 50 40 52 60 46 C80 40 100 44 120 38 C140 32 160 34 180 28 C200 24 220 26 240 20 C260 16 280 18 300 15",
  },
  agro: {
    color: "#bdf4ff",
    sellthrough: "89.4%", mape: "6.9%", model: "Chronos",
    msg: "Zero-shot forecast active: 12 new SKUs with thin history.",
    line: "M0 70 C20 60 40 66 60 54 C80 44 100 52 120 40 C140 30 160 38 180 26 C200 18 220 28 240 22 C260 16 280 26 300 18",
  },
};

const hud = document.getElementById("hud");
if (hud) {
  const tabs = hud.querySelectorAll(".hud-tab");
  const lineEl = document.getElementById("hud-line");
  const areaEl = document.getElementById("hud-area");
  const dotEl = document.getElementById("hud-dot");

  function setVertical(key) {
    const v = VERTICALS[key];
    hud.style.setProperty("--vc", v.color);
    document.getElementById("kpi-sellthrough").textContent = v.sellthrough;
    document.getElementById("kpi-mape").textContent = v.mape;
    document.getElementById("kpi-model").textContent = v.model;
    document.getElementById("hud-msg").textContent = v.msg;
    // Morph the chart (style.d animates in Chromium; attribute is the fallback)
    const area = v.line + " L300 80 L0 80Z";
    lineEl.setAttribute("d", v.line);
    areaEl.setAttribute("d", area);
    try {
      lineEl.style.d = `path('${v.line}')`;
      areaEl.style.d = `path('${area}')`;
    } catch (_) { /* older engines: attribute swap already applied */ }
    const endY = v.line.trim().split(" ").pop();
    dotEl.setAttribute("cy", endY);
    tabs.forEach((t) => {
      const active = t.dataset.ind === key;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
    });
  }

  // Binary search helper for SVG path height at X coordinate
  function getPathYAtX(pathEl, targetX) {
    if (!pathEl) return 0;
    try {
      const length = pathEl.getTotalLength();
      let start = 0;
      let end = length;
      const precision = 8;
      for (let i = 0; i < precision; i++) {
        const middle = (start + end) / 2;
        const point = pathEl.getPointAtLength(middle);
        if (point.x < targetX) {
          start = middle;
        } else {
          end = middle;
        }
      }
      return pathEl.getPointAtLength((start + end) / 2).y;
    } catch (e) {
      return 40; // Fallback
    }
  }

  // Interactive chart tooltip tracking
  const svg = document.getElementById("hud-chart-svg");
  const trackerLine = document.getElementById("hud-tracker-line");
  const trackerDot = document.getElementById("hud-tracker-dot");
  const tooltip = document.getElementById("hud-tooltip");
  const tooltipTime = tooltip ? tooltip.querySelector(".tooltip-time") : null;
  const tooltipVal = tooltip ? tooltip.querySelector(".tooltip-val") : null;

  if (svg && trackerLine && trackerDot && tooltip) {
    svg.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 300;
      
      if (mouseX >= 0 && mouseX <= 300) {
        const pathY = getPathYAtX(lineEl, mouseX);
        
        trackerLine.setAttribute("x1", mouseX);
        trackerLine.setAttribute("x2", mouseX);
        trackerLine.setAttribute("opacity", "1");
        
        trackerDot.setAttribute("cx", mouseX);
        trackerDot.setAttribute("cy", pathY);
        trackerDot.setAttribute("opacity", "1");
        
        tooltip.style.opacity = "1";
        tooltip.style.left = `${(mouseX / 300) * rect.width}px`;
        
        const timeIndex = Math.min(12, Math.max(1, Math.round((mouseX / 300) * 11) + 1));
        const timeStr = `MONTH INDEX: 0${timeIndex}`.replace("010", "10").replace("011", "11").replace("012", "12");
        const demandVal = Math.round((1 - pathY / 80) * 100);
        
        if (tooltipTime) tooltipTime.textContent = timeStr;
        if (tooltipVal) tooltipVal.textContent = `DEMAND INDEX: ${demandVal}%`;
      }
    });

    svg.addEventListener("mouseleave", () => {
      trackerLine.setAttribute("opacity", "0");
      trackerDot.setAttribute("opacity", "0");
      tooltip.style.opacity = "0";
    });

    function handleChartTouch(e) {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        const rect = svg.getBoundingClientRect();
        const mouseX = ((touch.clientX - rect.left) / rect.width) * 300;
        
        if (mouseX >= 0 && mouseX <= 300) {
          const pathY = getPathYAtX(lineEl, mouseX);
          
          trackerLine.setAttribute("x1", mouseX);
          trackerLine.setAttribute("x2", mouseX);
          trackerLine.setAttribute("opacity", "1");
          
          trackerDot.setAttribute("cx", mouseX);
          trackerDot.setAttribute("cy", pathY);
          trackerDot.setAttribute("opacity", "1");
          
          tooltip.style.opacity = "1";
          tooltip.style.left = `${(mouseX / 300) * rect.width}px`;
          
          const timeIndex = Math.min(12, Math.max(1, Math.round((mouseX / 300) * 11) + 1));
          const timeStr = `MONTH INDEX: 0${timeIndex}`.replace("010", "10").replace("011", "11").replace("012", "12");
          const demandVal = Math.round((1 - pathY / 80) * 100);
          
          if (tooltipTime) tooltipTime.textContent = timeStr;
          if (tooltipVal) tooltipVal.textContent = `DEMAND INDEX: ${demandVal}%`;
          
          e.preventDefault();
        }
      }
    }
    svg.addEventListener("touchstart", handleChartTouch, { passive: false });
    svg.addEventListener("touchmove", handleChartTouch, { passive: false });
    svg.addEventListener("touchend", () => {
      trackerLine.setAttribute("opacity", "0");
      trackerDot.setAttribute("opacity", "0");
      tooltip.style.opacity = "0";
    });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => setVertical(tab.dataset.ind)));
  setVertical("fashion");
}

/* Draw the HUD line in when the frame first appears */
let hudDrawn = false;
function drawHudLine() {
  if (hudDrawn || prefersReducedMotion) return;
  hudDrawn = true;
  const lineEl = document.getElementById("hud-line");
  if (!lineEl) return;
  const len = lineEl.getTotalLength();
  lineEl.style.strokeDasharray = len;
  lineEl.style.strokeDashoffset = len;
  lineEl.getBoundingClientRect(); // flush
  lineEl.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.65,0,0.35,1)";
  lineEl.style.strokeDashoffset = "0";
  setTimeout(() => {
    lineEl.style.strokeDasharray = "";
    lineEl.style.strokeDashoffset = "";
    lineEl.style.transition = "";
  }, 1600);
}

/* ── 9. Dossier modal (deepfake case) ───────────────────────── */
const dossier = document.getElementById("dossier");
const dfPanel = document.getElementById("deepfake-panel");
let lastFocus = null;

function openDossier() {
  lastFocus = document.activeElement;
  dossier.hidden = false;
  requestAnimationFrame(() => dossier.classList.add("open"));
  document.body.classList.add("modal-lock");
  document.getElementById("dossier-close").focus();
}
function closeDossier() {
  dossier.classList.remove("open");
  document.body.classList.remove("modal-lock");
  setTimeout(() => { dossier.hidden = true; }, 400);
  lastFocus?.focus();
}
dfPanel.addEventListener("click", openDossier);
dfPanel.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDossier(); }
});
document.getElementById("dossier-close").addEventListener("click", closeDossier);
dossier.addEventListener("click", (e) => { if (e.target === dossier) closeDossier(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!dossier.hidden) closeDossier();
    if (document.body.classList.contains("menu-open")) {
      document.body.classList.remove("menu-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  }
});

/* ── 10. Magnetic buttons (subtle, desktop only) ────────────── */
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll(".btn-solid, .btn-ghost").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.12;
      const y = (e.clientY - r.top - r.height / 2) * 0.22;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
  });
}

/* ── 11. Footer year ────────────────────────────────────────── */
document.getElementById("year").textContent = new Date().getFullYear();
