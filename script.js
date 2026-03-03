// ─────────────────────────────────────────────────────────
//  Portfolio Script — Scroll, Modal, 3D Tilt, Hamburger
// ─────────────────────────────────────────────────────────

// 1. Sticky nav on scroll
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// 2. Scroll-reveal animation
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Stagger siblings inside grids
            const siblings = entry.target.parentElement.querySelectorAll('.fade-in, .fade-in-right');
            let delay = 0;
            siblings.forEach(el => {
                if (!el.classList.contains('visible')) {
                    el.style.transitionDelay = `${delay}ms`;
                    delay += 100;
                }
            });
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in, .fade-in-right').forEach(el => observer.observe(el));

// 3. Deep Fake Modal
const deepfakeCard = document.getElementById('deepfake-card');
const modal        = document.getElementById('deepfake-modal');
const modalClose   = document.getElementById('modal-close-btn');

function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

if (deepfakeCard) {
    deepfakeCard.addEventListener('click', openModal);
    deepfakeCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });
}
if (modalClose)  modalClose.addEventListener('click', closeModal);
if (modal) {
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(); // close on backdrop click
    });
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// 4. 3D tilt on project cards (desktop only)
const cards = document.querySelectorAll('.project-card');
if (window.matchMedia('(pointer: fine)').matches) {
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// 5. Hamburger menu (mobile)
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open-menu');
    });
}
