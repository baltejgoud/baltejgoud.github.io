"use client";

import { animate, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { vars } from "@/lib/style";
import { ATLAS_TILES, drawCalls, tileOffset } from "@/lib/widgets/atlas";

const PALETTE = ["#181818", "#4a7fb0", "#7a756d", "#5b8c5a", "#b8962e"];
const TILES = Array.from({ length: ATLAS_TILES }, (_, i) => ({ ...tileOffset(i), color: PALETTE[(i * 7) % PALETTE.length] }));

export function AtlasWidget() {
  const [batched, setBatched] = useState(false);
  const [calls, setCalls] = useState(ATLAS_TILES);
  const animation = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => () => animation.current?.stop(), []);

  const toggle = () => {
    const next = !batched;
    setBatched(next);
    animation.current?.stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCalls(next ? 1 : ATLAS_TILES);
      return;
    }
    const from = (ATLAS_TILES - calls) / (ATLAS_TILES - 1);
    animation.current = animate(from, next ? 1 : 0, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (p) => setCalls(drawCalls(p)),
    });
  };

  return (
    <WidgetFrame
      title="Axon · Draw calls per frame"
      caption="208 monitor screens in the 3D campus, rendered from one texture atlas."
      illustrative={false}
    >
      <div className="flex items-end justify-between" aria-live="polite">
        <p className="text-5xl font-extrabold tabular-nums tracking-tight">{calls}</p>
        <p className="font-mono text-[11px] text-stone">draw {calls === 1 ? "call" : "calls"}</p>
      </div>
      <div aria-hidden className={cn("atlas relative mt-4 grid grid-cols-16 gap-[3px] rounded-xl bg-cream p-3", batched && "is-batched")}>
        {TILES.map((tile, i) => (
          <span
            key={i}
            className="atlas-tile aspect-[4/3] rounded-[2px]"
            style={{ ...vars({ "--dx": tile.dx, "--dy": tile.dy, "--i": i % 9 }), background: tile.color }}
          />
        ))}
        <span className="atlas-sheet absolute inset-[16%] rounded-md" />
      </div>
      <div className="mt-4">
        <Pill onClick={toggle} aria-pressed={batched}>
          {batched ? "Unbatch" : "Batch into atlas"}
        </Pill>
      </div>
    </WidgetFrame>
  );
}
