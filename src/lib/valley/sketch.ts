import { mulberry32 } from "@/lib/random";

/** Hand-drawn SVG paths for annotations. Coordinates live in the viewBox each helper documents. */

const f = (n: number) => n.toFixed(1);

/** A loose loop around a phrase, overshooting its start like a pen would. viewBox 0 0 200 100. */
export function sketchLoop(seed: number): string {
  const rand = mulberry32(seed);
  const cx = 100;
  const cy = 50;
  const turns = 1.14;
  const steps = 48;
  const start = -Math.PI * (0.62 + rand() * 0.1);
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + t * turns * Math.PI * 2;
    const wobble = 1 + (rand() - 0.5) * 0.035;
    const drift = t * 5;
    const rx = (94 - drift) * wobble;
    const ry = (40 + drift * 0.6) * wobble;
    points.push(`${i ? "L" : "M"}${f(cx + Math.cos(angle) * rx)} ${f(cy + Math.sin(angle) * ry)}`);
  }
  return points.join(" ");
}

/** A wavy underline. viewBox 0 0 200 20. */
export function sketchWave(seed: number, waves = 7): string {
  const rand = mulberry32(seed);
  const steps = waves * 8;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = 2 + (i / steps) * 196;
    const y = 10 + Math.sin((i / steps) * waves * Math.PI * 2) * (4 + rand() * 0.8) + (rand() - 0.5);
    points.push(`${i ? "L" : "M"}${f(x)} ${f(y)}`);
  }
  return points.join(" ");
}

/** A rising trend underline with a small arrowhead at the end. viewBox 0 0 200 40. */
export function sketchTrend(seed: number): string {
  const rand = mulberry32(seed);
  const knots = [
    [2, 34],
    [40, 28 + rand() * 4],
    [70, 31 + rand() * 3],
    [104, 20 + rand() * 4],
    [132, 23 + rand() * 3],
    [168, 10 + rand() * 3],
    [194, 6],
  ];
  const line = knots.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ");
  return `${line} M182 4 L194 6 L188 17`;
}

/** A marker swipe, drawn with a wide stroke behind text. viewBox 0 0 200 20. */
export function sketchMarker(seed: number): string {
  const rand = mulberry32(seed);
  const y0 = 11 + (rand() - 0.5) * 3;
  const y1 = 10 + (rand() - 0.5) * 3;
  return `M3 ${f(y0)} C60 ${f(y0 - 2)}, 140 ${f(y1 + 2)}, 197 ${f(y1)}`;
}

/** A curved pointer arrow from the bottom-left to the top-right. viewBox 0 0 100 60. */
export function sketchArrow(seed: number): string {
  const rand = mulberry32(seed);
  const bend = 20 + rand() * 10;
  return `M4 54 C${f(bend)} ${f(18 + rand() * 6)}, 58 8, 94 10 M84 3 L94 10 L85 18`;
}
