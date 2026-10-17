import { mulberry32 } from "@/lib/random";

/**
 * One step of the process drawn as a point on a forecast chart. Values are normalised to 0..1,
 * y up: `trend` is the forecast, `lo`..`hi` its uncertainty band, `y` what actually happened.
 */
export interface ProcessPoint {
  x: number;
  y: number;
  trend: number;
  lo: number;
  hi: number;
}

/**
 * A straight rising forecast with a band that widens towards the horizon, the way real forecast
 * uncertainty grows, and an "actual" line that wanders inside it. Deterministic per seed.
 */
export function processSeries(steps: number, seed = 7): ProcessPoint[] {
  const rand = mulberry32(seed);
  return Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const trend = 0.2 + t * 0.58;
    const spread = 0.09 + t * 0.1;
    const wiggle = (i % 2 === 0 ? -1 : 1) * spread * (0.35 + rand() * 0.4);
    return { x: t, trend, y: trend + wiggle, lo: trend - spread, hi: trend + spread };
  });
}

type Key = "y" | "trend" | "lo" | "hi";

const toXY = (p: ProcessPoint, key: Key, w: number, h: number, pad: number) =>
  [pad + p.x * (w - pad * 2), h - pad - p[key] * (h - pad * 2)] as const;

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(points: readonly ProcessPoint[], key: Key, w: number, h: number, pad = 24): string {
  const xy = points.map((p) => toXY(p, key, w, h, pad));
  if (xy.length === 0) return "";
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(0, i - 1)];
    const p1 = xy[i];
    const p2 = xy[i + 1];
    const p3 = xy[Math.min(xy.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Closed polygon of the confidence band. */
export function bandPath(points: readonly ProcessPoint[], w: number, h: number, pad = 24): string {
  const upper = points.map((p) => toXY(p, "hi", w, h, pad));
  const lower = [...points].reverse().map((p) => toXY(p, "lo", w, h, pad));
  return [...upper, ...lower].map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";
}

/** Pixel position of a point in a w×h chart. */
export function pointAt(p: ProcessPoint, w: number, h: number, pad = 24): { x: number; y: number } {
  const [x, y] = toXY(p, "y", w, h, pad);
  return { x, y };
}

/** Index of the last step the traced line has reached at progress `t` (−1 before the first). */
export function reachedStep(t: number, steps: number): number {
  if (steps <= 0) return -1;
  if (t <= 0) return -1;
  return Math.min(steps - 1, Math.floor(t * (steps - 1) + 1e-6));
}
