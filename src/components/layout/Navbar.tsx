"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { MobileMenu } from "./MobileMenu";
import { navIds, navItems } from "@/content/sections";
import { profile } from "@/content/profile";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { cn } from "@/lib/cn";

export function Navbar() {
  const active = useActiveSection(navIds);
  const scrolled = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButton.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-line bg-cream/75 backdrop-blur-md" : "border-transparent",
      )}
    >
      <nav aria-label="Main" className="container-page flex h-[var(--nav-h)] items-center justify-between">
        <a href="#top" className="flex items-center gap-3" aria-label={`${profile.name} — back to top`}>
          <span className="grid size-10 place-items-center rounded-[10px] bg-ink font-mono text-sm font-medium text-cream">
            {profile.monogram}
          </span>
          <span className="font-semibold tracking-tight">{profile.name}</span>
        </a>
        <ul className="hidden items-center gap-1 min-[900px]:flex">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive ? "text-cream" : "text-stone hover:text-ink",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
        <button
          ref={menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
          className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold min-[900px]:hidden"
        >
          Menu
        </button>
      </nav>
      <MobileMenu open={menuOpen} onClose={closeMenu} active={active} />
    </header>
  );
}
