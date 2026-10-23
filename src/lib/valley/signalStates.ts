import { hashString, mulberry32 } from "@/lib/random";

/**
 * "Noise to signal" — one illustrative dataset re-plotted for each How I Work step. Every dot has
 * a stage position per step, so CSS can move it between steps with no per-frame script.
 */
export const SIGNAL_STAGE = { width: 600, height: 440 };
export const SIGNAL_GAPS = 12;
export const SIGNAL_EDGES = 10;
/** Dots per dashboard bar: the trend, made legible. Sums to the regular (non-outlier) dots. */
export const SIGNAL_BARS = [8, 12, 16, 20, 24, 30];
const REGULAR = SIGNAL_BARS.reduce((sum, n) => sum + n, 0);
const CENTRE = { x: 300, y: 220 };
const RING = 150;
/** Scatter area: stops short of the set-aside column at x 505. */
export const SIGNAL_PLOT = { left: 50, right: 480, top: 40, bottom: 380 };
const plot = SIGNAL_PLOT;

export type SignalKind = "regular" | "gap" | "edge";
export type SignalDot = {
  kind: SignalKind;
  /** Stage position at each of the six steps. */
  at: { x: number; y: number }[];
  /** Transition delay in seconds, so dots sweep left to right. */
  delay: number;
};

export const signalTrend = (x: number) => 0.18 + 0.6 * x;
const bandHalf = (x: number) => 0.1 + 0.04 * x;
const toStage = (x: number, y: number) => ({
  x: plot.left + x * (plot.right - plot.left),
  y: plot.bottom - y * (plot.bottom - plot.top),
});
const round = (p: { x: number; y: number }) => ({
  x: Math.round(p.x * 10) / 10,
  y: Math.round(p.y * 10) / 10,
});

export function signalDots(): SignalDot[] {
  const random = mulberry32(hashString("noise-to-signal"));
  const normal = () =>
    Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const raw = Array.from({ length: REGULAR + SIGNAL_EDGES }, (_, i) => {
    const edge = i >= REGULAR;
    const x = 0.03 + 0.94 * random();
    const trend = signalTrend(x);
    // Regular points stay inside the uncertainty band; outliers sit well outside it.
    const y = edge
      ? trend + (trend > 0.5 ? -1 : 1) * (0.24 + 0.12 * random())
      : trend + Math.max(-0.085, Math.min(0.085, normal() * 0.05));
    // The raw cloud has no structure yet, and keeps clear of the question in the middle.
    const angle = random() * Math.PI * 2;
    const reach = 0.36 + 0.64 * Math.sqrt(random());
    const cloud = {
      x: CENTRE.x + Math.cos(angle) * reach * 255,
      y: CENTRE.y + Math.sin(angle) * reach * 180,
    };
    const kind: SignalKind = edge ? "edge" : i % 9 === 4 ? "gap" : "regular";
    return { kind, x, y, angle, cloud, delay: edge ? 0.45 : x * 0.4 };
  });

  const regular = raw.filter((d) => d.kind !== "edge");
  const byX = [...regular].sort((a, b) => a.x - b.x);
  const byY = [...regular].sort((a, b) => a.y - b.y);
  const byAngle = [...raw].sort((a, b) => a.angle - b.angle);
  const edges = raw.filter((d) => d.kind === "edge");
  const starts = SIGNAL_BARS.map((_, b) =>
    SIGNAL_BARS.slice(0, b).reduce((sum, n) => sum + n, 0),
  );

  return raw.map((d) => {
    const tray = { x: 548, y: 80 + edges.indexOf(d) * 28 };
    const scatter = toStage(d.x, d.y);
    let table = tray;
    let bars = tray;
    if (d.kind !== "edge") {
      const rank = byX.indexOf(d);
      table = { x: 78 + (rank % 11) * 38, y: 80 + Math.floor(rank / 11) * 28 };
      const order = byY.indexOf(d);
      const bar = starts.findLastIndex((start) => order >= start);
      const slot = order - starts[bar];
      bars = {
        x: 110 + bar * 76 + (slot % 2 ? 6 : -6),
        y: 366 - Math.floor(slot / 2) * 12,
      };
    }
    // The loop leaves a gap at the top for its arrowhead; alternate dots sit on an inner and an
    // outer track so they stay distinct rather than merging into one line.
    const place = byAngle.indexOf(d);
    const turn =
      -Math.PI / 2 + 0.25 + (2 * Math.PI - 0.5) * (place / (raw.length - 1));
    const radius = RING + (place % 2 ? 10 : -10);
    const ring = {
      x: CENTRE.x + Math.cos(turn) * radius,
      y: CENTRE.y + Math.sin(turn) * radius,
    };
    // The baseline is fitted without the outliers; they rejoin the plot only to be checked.
    const baseline = d.kind === "edge" ? tray : scatter;
    return {
      kind: d.kind,
      at: [d.cloud, table, baseline, bars, scatter, ring].map(round),
      delay: Math.round(d.delay * 100) / 100,
    };
  });
}

const line = (points: { x: number; y: number }[]) =>
  points
    .map(round)
    .map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
    .join("");

export function signalTrendPath() {
  return line([toStage(0, signalTrend(0)), toStage(1, signalTrend(1))]);
}

export function signalBandPath() {
  const xs = Array.from({ length: 11 }, (_, i) => i / 10);
  const upper = xs.map((x) => toStage(x, signalTrend(x) + bandHalf(x)));
  const lower = xs.map((x) => toStage(x, signalTrend(x) - bandHalf(x))).reverse();
  return `${line([...upper, ...lower])}Z`;
}

/** The "keep learning" loop: an arc round the ring and an arrowhead closing it. */
export function signalLoop() {
  const start = -Math.PI / 2 + 0.25;
  const end = start + 2 * Math.PI - 0.5;
  const at = (a: number, r = RING) => ({
    x: CENTRE.x + Math.cos(a) * r,
    y: CENTRE.y + Math.sin(a) * r,
  });
  const from = round(at(start));
  const to = round(at(end));
  const tip = round(at(end + 0.13));
  const outer = round(at(end - 0.02, RING + 9));
  const inner = round(at(end - 0.02, RING - 9));
  return {
    arc: `M${from.x} ${from.y}A${RING} ${RING} 0 1 1 ${to.x} ${to.y}`,
    arrow: `M${tip.x} ${tip.y}L${outer.x} ${outer.y}L${inner.x} ${inner.y}Z`,
  };
}
