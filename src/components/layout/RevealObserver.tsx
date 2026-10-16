"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not(.is-in)";

/** Adds .is-in to [data-reveal] elements as they enter the viewport, including ones mounted later. */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("app-ready");
    if (root.classList.contains("reduced") || !("IntersectionObserver" in window)) {
      root.classList.add("reveal-all");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    const observeWithin = (scope: ParentNode) => scope.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    observeWithin(document);
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
