"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type MouseEvent } from "react";
import { useSmoothScroll } from "./SmoothScroll";
import { navItems } from "@/content/sections";
import { profile } from "@/content/profile";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/sections";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active: string | null;
}

/** Full-screen sheet for narrow screens: traps focus, closes on Escape, pauses page scroll. */
export function MobileMenu({ open, onClose, active }: MobileMenuProps) {
  const { scrollTo, stop, start } = useSmoothScroll();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      start();
    };
  }, [open, onClose, stop, start]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    onClose();
    requestAnimationFrame(() => scrollTo(`#${id}`));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-cream px-[var(--gutter)] pb-8"
        >
          <div className="flex h-[var(--nav-h)] items-center justify-between">
            <span className="font-semibold tracking-tight">{profile.name}</span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-cream"
            >
              Close
            </button>
          </div>
          <ul className="mt-8 flex flex-1 flex-col gap-2">
            {navItems.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => go(e, item.id)}
                  aria-current={active === item.id ? "location" : undefined}
                  className={cn(
                    "flex items-baseline gap-4 border-b border-line py-3 text-4xl font-extrabold tracking-tight",
                    active === item.id ? "text-ink" : "text-ink/70",
                  )}
                >
                  <span className="font-mono text-xs font-normal text-stone">{pad2(i + 1)}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 font-mono text-xs text-stone">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.links.resume}>Résumé ↗</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
