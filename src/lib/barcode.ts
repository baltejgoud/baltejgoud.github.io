import { hashString, mulberry32 } from "./random";

export interface Bar {
  x: number;
  w: number;
}

/**
 * Decorative barcode: alternating bars and gaps of 1–3 units, starting and
 * ending with a bar, scaled to fill `width`. Deterministic for a seed.
 */
export function barcode(seed: string, width: number, units = 60): Bar[] {
  const rand = mulberry32(hashString(seed));
  const runs: number[] = [];
  let total = 0;
  while (total < units) {
    const run = 1 + Math.floor(rand() * 3);
    runs.push(run);
    total += run;
  }
  if (runs.length % 2 === 0) {
    runs.push(1);
    total += 1;
  }
  const unit = width / total;
  const bars: Bar[] = [];
  let cursor = 0;
  runs.forEach((run, i) => {
    if (i % 2 === 0) bars.push({ x: cursor * unit, w: run * unit });
    cursor += run;
  });
  return bars;
}
