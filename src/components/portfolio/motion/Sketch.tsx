import { sketchArrow, sketchLoop, sketchMarker, sketchTrend, sketchWave } from "@/lib/valley/sketch";

export type SketchKind = "loop" | "wave" | "trend" | "marker" | "arrow";

const shapes: Record<SketchKind, { draw: (seed: number) => string; viewBox: string }> = {
  loop: { draw: sketchLoop, viewBox: "0 0 200 100" },
  wave: { draw: sketchWave, viewBox: "0 0 200 20" },
  trend: { draw: sketchTrend, viewBox: "0 0 200 40" },
  marker: { draw: sketchMarker, viewBox: "0 0 200 20" },
  arrow: { draw: sketchArrow, viewBox: "0 0 100 60" },
};

/**
 * A hand-drawn stroke. It draws itself as the CSS variable `--draw` (0..1) rises on any ancestor,
 * so a single variable written on scroll can drive every annotation in a block.
 */
export function Sketch({ kind, seed = 1, className = "" }: { kind: SketchKind; seed?: number; className?: string }) {
  const { draw, viewBox } = shapes[kind];
  return (
    <svg className={`p-sketch p-sketch-${kind} ${className}`} viewBox={viewBox} preserveAspectRatio="none" aria-hidden>
      <path d={draw(seed)} pathLength={1} />
    </svg>
  );
}
