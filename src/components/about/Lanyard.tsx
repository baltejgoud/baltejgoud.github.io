"use client";

import { useEffect, useRef } from "react";
import { IdCard } from "./IdCard";
import { profile } from "@/content/profile";
import {
  createRope,
  endAngle,
  energy,
  nudge,
  pinEnd,
  ropePath,
  setAnchor,
  simulate,
  stepSpin,
  type Spin,
  type Vec,
} from "@/lib/physics/rope";

const SEGMENTS = 9;
const SEGMENT_LENGTH = 18;
const CARD_W = 260;
const STRAP_TEXT = `${profile.name.toUpperCase()} · DATA ANALYST · `.repeat(4);
const KEY_IMPULSES: Record<string, Vec> = {
  ArrowLeft: { x: -650, y: 0 },
  ArrowRight: { x: 650, y: 0 },
  ArrowUp: { x: 0, y: -700 },
  ArrowDown: { x: 0, y: 400 },
};

/** Hanging ID badge on a Verlet strap: drag it, fling it, or nudge it with the arrow keys. */
export function Lanyard() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const strap = strapRef.current;
    const card = cardRef.current;
    if (!wrap || !strap || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rope = createRope({
      anchor: { x: wrap.clientWidth / 2, y: 0 },
      segments: SEGMENTS,
      segmentLength: SEGMENT_LENGTH,
      gravity: 2400,
      damping: 0.985,
      iterations: 12,
      endMass: 6,
      maxStretch: 1.35,
    });
    const spin: Spin = { angle: 0, velocity: 0 };
    let raf = 0;
    let last = 0;
    let carry = 0;
    let still = 0;
    let visible = false;
    let greeted = false;
    let drag: { id: number; offset: Vec; samples: { x: number; y: number; t: number }[] } | null = null;
    const endOf = () => rope.pos[rope.pos.length - 1];

    card.style.left = "0px";
    card.style.top = "0px";
    card.style.marginLeft = "0px";

    const render = () => {
      const end = endOf();
      strap.setAttribute("d", ropePath(rope.pos));
      const twist = Math.max(-25, Math.min(25, spin.velocity * 6));
      card.style.transform = `translate3d(${end.x - CARD_W / 2}px, ${end.y}px, 0) rotate(${spin.angle}rad) rotateY(${twist}deg)`;
    };
    const tick = (time: number) => {
      const dt = last ? (time - last) / 1000 : 1 / 60;
      last = time;
      carry = simulate(rope, dt, carry);
      stepSpin(spin, endAngle(rope), Math.min(dt, 0.05));
      render();
      const resting =
        !drag &&
        energy(rope) < 1e-4 &&
        Math.abs(spin.velocity) < 1e-3 &&
        Math.abs(spin.angle - endAngle(rope)) < 1e-3;
      still = resting ? still + 1 : 0;
      if (still > 60 || !visible) {
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      still = 0;
      if (!raf && visible && !reduced) raf = requestAnimationFrame(tick);
    };
    const local = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      card.setPointerCapture(e.pointerId);
      const p = local(e);
      const end = endOf();
      drag = { id: e.pointerId, offset: { x: p.x - end.x, y: p.y - end.y }, samples: [{ ...p, t: e.timeStamp }] };
      pinEnd(rope, end);
      card.dataset.dragging = "true";
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = local(e);
      drag.samples = [...drag.samples.slice(-4), { ...p, t: e.timeStamp }];
      pinEnd(rope, { x: p.x - drag.offset.x, y: p.y - drag.offset.y });
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const first = drag.samples[0];
      const latest = drag.samples[drag.samples.length - 1];
      const seconds = Math.max((latest.t - first.t) / 1000, 1 / 120);
      const clamp = (v: number) => Math.max(-2500, Math.min(2500, v));
      drag = null;
      delete card.dataset.dragging;
      pinEnd(rope, null);
      nudge(rope, { x: clamp((latest.x - first.x) / seconds), y: clamp((latest.y - first.y) / seconds) });
      wake();
    };
    const onKey = (e: KeyboardEvent) => {
      let impulse = KEY_IMPULSES[e.key];
      if (!impulse && (e.key === "Enter" || e.key === " ")) {
        impulse = { x: endOf().x < rope.config.anchor.x ? 650 : -650, y: 0 };
      }
      if (!impulse || reduced) return;
      e.preventDefault();
      nudge(rope, impulse);
      wake();
    };

    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
    card.addEventListener("keydown", onKey);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !greeted && !reduced) {
          greeted = true;
          nudge(rope, { x: 420, y: 0 });
        }
        wake();
      },
      { threshold: 0.2 },
    );
    io.observe(wrap);
    const ro = new ResizeObserver(() => {
      setAnchor(rope, { x: wrap.clientWidth / 2, y: 0 });
      render();
      wake();
    });
    ro.observe(wrap);
    render();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      card.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div ref={wrapRef} className="relative mx-auto h-[560px] w-full max-w-[360px] [perspective:1200px] lg:h-[600px]">
        <span aria-hidden className="lanyard-static absolute left-1/2 top-0 h-[162px] w-4 -translate-x-1/2 rounded-full bg-ink" />
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path id="lanyard-strap" ref={strapRef} fill="none" stroke="var(--color-ink)" strokeWidth={16} strokeLinecap="round" />
          <text dy={3} className="fill-cream font-mono text-[8px] tracking-[0.2em]">
            <textPath href="#lanyard-strap" startOffset={2}>
              {STRAP_TEXT}
            </textPath>
          </text>
        </svg>
        <div
          ref={cardRef}
          role="button"
          tabIndex={0}
          data-cursor="Drag"
          aria-label="Developer ID card. Drag it, or press the arrow keys, to swing it."
          className="absolute left-1/2 top-[162px] -ml-[130px] h-[392px] w-[260px] origin-top cursor-grab touch-none select-none [transform-style:preserve-3d] data-[dragging=true]:cursor-grabbing"
        >
          <span
            aria-hidden
            className="absolute -top-5 left-1/2 h-7 w-9 -translate-x-1/2 rounded-md bg-gradient-to-b from-[#dedad2] to-[#a9a59c] shadow-sm ring-1 ring-black/10"
          />
          <IdCard />
        </div>
      </div>
      <p className="mt-2 font-serif text-lg italic text-stone">Pull the ID card — it swings!</p>
    </div>
  );
}
