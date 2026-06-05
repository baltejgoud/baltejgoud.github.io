// ══════════════════════════════════════════════════════════
//  Portfolio Script — Fun & Interactive Edition
// ══════════════════════════════════════════════════════════

// ── 1. Custom cursor glow ────────────────────────────────
const cursorGlow = document.getElementById("cursor-glow");
document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
});
document
  .querySelectorAll("a, button, .project-card, .skill-card, .social-icon")
  .forEach((el) => {
    el.addEventListener("mouseenter", () =>
      cursorGlow.classList.add("hovering"),
    );
    el.addEventListener("mouseleave", () =>
      cursorGlow.classList.remove("hovering"),
    );
  });
// Hide on mobile
if ("ontouchstart" in window) {
  cursorGlow.style.display = "none";
  document.documentElement.style.cursor = "auto";
}

// ── 2. Scroll progress bar ───────────────────────────────
const progressBar = document.getElementById("scroll-progress");
window.addEventListener("scroll", () => {
  const scrolled =
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  progressBar.style.width = scrolled + "%";
});

// ── 3. Sticky nav ────────────────────────────────────────
const header = document.querySelector("header");
const backToTop = document.getElementById("back-to-top");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 60);
  backToTop.classList.toggle("visible", window.scrollY > 400);
});
backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

// ── 4. Dark / Light mode toggle ──────────────────────────
const themeToggle = document.getElementById("theme-toggle");
const htmlEl = document.documentElement;
const savedTheme = localStorage.getItem("portfolio-theme") || "light";
htmlEl.setAttribute("data-theme", savedTheme);
themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

themeToggle.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  htmlEl.setAttribute("data-theme", next);
  localStorage.setItem("portfolio-theme", next);
  themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
  // Fun wiggle
  themeToggle.style.transform = "rotate(360deg) scale(1.25)";
  setTimeout(() => (themeToggle.style.transform = ""), 400);
});

// ── 5. Typewriter effect ─────────────────────────────────
const roles = [
  "SaaS Platform Creator 🚀",
  "App Developer 📱",
  "UI/UX Designer 🎨",
  "React Native Dev ⚛️",
  "Firebase Expert 🔥",
  "Problem Solver 🧩",
];
const typeEl = document.getElementById("typewriter");
let roleIndex = 0,
  charIndex = 0,
  deleting = false;

function typeWrite() {
  const current = roles[roleIndex];
  if (!deleting) {
    typeEl.textContent = current.slice(0, ++charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeWrite, 1800);
      return;
    }
  } else {
    typeEl.textContent = current.slice(0, --charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }
  setTimeout(typeWrite, deleting ? 60 : 100);
}
setTimeout(typeWrite, 800);

// ── 6. Confetti burst ────────────────────────────────────
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f97316",
];
function launchConfetti(originEl) {
  const rect = originEl.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const angle = Math.random() * 360;
    const dist = 80 + Math.random() * 200;
    const tx = Math.cos((angle * Math.PI) / 180) * dist;
    const ty = Math.sin((angle * Math.PI) / 180) * dist + 150;
    const rot = (Math.random() - 0.5) * 720;
    const dur = 0.8 + Math.random() * 0.8;
    piece.style.cssText = `
            left:${ox}px; top:${oy}px;
            background:${COLORS[Math.floor(Math.random() * COLORS.length)]};
            --tx:${tx}px; --ty:${ty}px; --rot:${rot}deg; --dur:${dur}s;
            border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
        `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), dur * 1000 + 100);
  }
}
document.getElementById("confetti-btn").addEventListener("click", function (e) {
  e.preventDefault();
  launchConfetti(this);
  setTimeout(() => (window.location.href = "#projects"), 400);
});

// ── 7. Scroll-reveal with stagger ───────────────────────
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter(
        (el) =>
          el.classList.contains("fade-in") ||
          el.classList.contains("fade-in-right"),
      );
      let delay = 0;
      siblings.forEach((el) => {
        if (!el.classList.contains("visible")) {
          el.style.transitionDelay = delay + "ms";
          delay += 110;
        }
      });
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);
document
  .querySelectorAll(".fade-in, .fade-in-right")
  .forEach((el) => observer.observe(el));

// ── 8. Skill bar animation on scroll ────────────────────
const skillObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const fill = entry.target.querySelector(".skill-fill");
      if (fill) {
        setTimeout(() => {
          fill.style.width = fill.dataset.width + "%";
        }, 200);
      }
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.3 },
);
document
  .querySelectorAll(".skill-card")
  .forEach((card) => skillObserver.observe(card));

// ── 9. Animated counters ─────────────────────────────────
function animateCounter(el, target, duration = 1400) {
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + "+";
  }
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target, parseInt(entry.target.dataset.target));
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.5 },
);
document
  .querySelectorAll(".counter")
  .forEach((el) => counterObserver.observe(el));

// ── 10. Deep Fake & PRISMA Modals ─────────────────────────
const deepfakeCard = document.getElementById("deepfake-card");
const dfModal = document.getElementById("deepfake-modal");
const dfClose = document.getElementById("modal-close-btn");

const prismaBtn = document.getElementById("prisma-modal-btn");
const prismaModal = document.getElementById("prisma-modal");
const prismaClose = document.getElementById("prisma-modal-close-btn");

function openModal(modalEl, triggerEl) {
  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";
  if (triggerEl) launchConfetti(triggerEl);
}
function closeModal(modalEl) {
  modalEl.classList.remove("open");
  document.body.style.overflow = "";
}

if (deepfakeCard && dfModal) {
  deepfakeCard.addEventListener("click", () => openModal(dfModal, deepfakeCard));
  deepfakeCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(dfModal, deepfakeCard);
    }
  });
}
if (dfClose && dfModal) dfClose.addEventListener("click", () => closeModal(dfModal));

if (prismaBtn && prismaModal) {
  prismaBtn.addEventListener("click", () => openModal(prismaModal, prismaBtn));
}
if (prismaClose && prismaModal) prismaClose.addEventListener("click", () => closeModal(prismaModal));

// Close modals on overlay click
[dfModal, prismaModal].forEach(modalEl => {
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeModal(modalEl);
    });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (dfModal) closeModal(dfModal);
    if (prismaModal) closeModal(prismaModal);
  }
});

// ── 11. 3D tilt on project cards ────────────────────────
if (window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

// ── 12. Hamburger menu ───────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
if (hamburger) {
  hamburger.addEventListener("click", () => {
    const open = navLinks.style.display === "flex";
    navLinks.style.cssText = open
      ? ""
      : "display:flex;flex-direction:column;position:absolute;top:70px;right:5%;background:var(--bg-card);border:1px solid var(--indigo-bdr);border-radius:16px;padding:1rem 1.5rem;gap:1rem;box-shadow:0 12px 40px rgba(0,0,0,.15);z-index:999";
  });
}

// ── 13. Easter egg — Konami code 🎮 ─────────────────────
const konami = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
let konamiIdx = 0;
document.addEventListener("keydown", (e) => {
  if (e.key === konami[konamiIdx]) {
    konamiIdx++;
  } else {
    konamiIdx = 0;
  }
  if (konamiIdx === konami.length) {
    konamiIdx = 0;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const btn = document.getElementById("confetti-btn");
        if (btn) launchConfetti(btn);
      }, i * 300);
    }
    alert("🎉 You found the secret! Konami Code activated!");
  }
});

// ── 14. Particle Network Background ──────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            // Color based on theme
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)';
            ctx.fill();
        }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    // Mouse interaction for particles
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', e => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function animateParticles() {
        ctx.clearRect(0, 0, w, h);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    ctx.beginPath();
                    // Line color based on theme and distance
                    const alpha = (1 - dist / 120) * (isDark ? 0.2 : 0.1);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            // Mouse interaction
            if (mouse.x != null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    const alpha = (1 - dist / 150) * (isDark ? 0.3 : 0.15);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

// ── 15. PRISMA Interactive Mini-Dashboard ─────────────────
const verticalData = {
    fashion: {
        color: "#ec4899",
        sellThrough: "94.2%",
        mape: "5.8%",
        status: "Optimizing NYC, LA, and Miami regional hubs.",
        chartLine: "M0 65 C20 55 40 65 60 50 C80 35 100 42 120 25 C140 10 160 20 180 15 C200 10 220 22 240 18 C260 14 280 24 300 20",
        chartArea: "M0 65 C20 55 40 65 60 50 C80 35 100 42 120 25 C140 10 160 20 180 15 C200 10 220 22 240 18 C260 14 280 24 300 20 L300 80 L0 80Z",
        dotX: 300,
        dotY: 20
    },
    electronics: {
        color: "#06b6d4",
        sellThrough: "87.6%",
        mape: "7.2%",
        status: "Component constraints flagged in Q3 BOM list.",
        chartLine: "M0 72 C30 68 60 48 90 40 C120 32 150 48 180 44 C210 40 240 28 270 24 C280 22 290 28 300 30",
        chartArea: "M0 72 C30 68 60 48 90 40 C120 32 150 48 180 44 C210 40 240 28 270 24 C280 22 290 28 300 30 L300 80 L0 80Z",
        dotX: 300,
        dotY: 30
    },
    pharma: {
        color: "#10b981",
        sellThrough: "99.1%",
        mape: "3.1%",
        status: "Batch 884A successfully signed and audited.",
        chartLine: "M0 50 C20 54 40 42 60 38 C80 34 100 22 120 18 C140 14 160 28 180 22 C200 16 220 12 240 10 C260 8 280 14 300 12",
        chartArea: "M0 50 C20 54 40 42 60 38 C80 34 100 22 120 18 C140 14 160 28 180 22 C200 16 220 12 240 10 C260 8 280 14 300 12 L300 80 L0 80Z",
        dotX: 300,
        dotY: 12
    }
};

const miniTabs = document.querySelectorAll(".mini-ind-tab");
const kpiSellThrough = document.getElementById("kpi-sellthrough");
const kpiMape = document.getElementById("kpi-mape");
const statusMsg = document.getElementById("vertical-status-msg");
const chartLine = document.getElementById("mini-chart-line");
const chartArea = document.getElementById("mini-chart-area");
const chartDot = document.getElementById("mini-chart-dot");
const rootEl = document.documentElement;

// Setup default css variable color
rootEl.style.setProperty("--vertical-color", verticalData.fashion.color);

miniTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        // Set active tab styling
        miniTabs.forEach(t => {
            t.classList.remove("active");
            t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        const industry = tab.dataset.ind;
        const data = verticalData[industry];

        if (data) {
            // Update theme color variable for the widget
            rootEl.style.setProperty("--vertical-color", data.color);

            // Animate and update KPIs
            if (kpiSellThrough) {
                kpiSellThrough.style.color = data.color;
                kpiSellThrough.textContent = data.sellThrough;
            }
            if (kpiMape) {
                kpiMape.textContent = data.mape;
            }
            
            // Update status message
            if (statusMsg) {
                statusMsg.textContent = data.status;
            }

            // Animate SVG graph paths
            if (chartLine) chartLine.setAttribute("d", data.chartLine);
            if (chartArea) chartArea.setAttribute("d", data.chartArea);
            if (chartDot) {
                chartDot.setAttribute("cx", data.dotX);
                chartDot.setAttribute("cy", data.dotY);
                chartDot.setAttribute("fill", data.color);
            }
        }
    });
});
