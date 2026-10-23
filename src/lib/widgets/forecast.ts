import { hashString, mulberry32 } from "@/lib/random";

export type Vertical = "fashion" | "electronics" | "pharma" | "agro";
export type Decision = "Replenish" | "Investigate" | "Hold";

export interface ForecastPoint {
  week: number;
  value: number;
  lower?: number;
  upper?: number;
  forecast: boolean;
}

export interface ForecastSeries {
  points: ForecastPoint[];
  stock: number;
}

export const HISTORY_WEEKS = 26;
export const FORECAST_WEEKS = 8;

export const verticals: { id: Vertical; label: string }[] = [
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
  { id: "pharma", label: "Pharma" },
  { id: "agro", label: "Agro" },
];

/** Illustrative demand shapes — not customer data. */
const profiles: Record<Vertical, { base: number; trend: number; season: number; noise: number; spread: number }> = {
  fashion: { base: 120, trend: 0.6, season: 38, noise: 10, spread: 0.32 },
  electronics: { base: 80, trend: 1.2, season: 14, noise: 8, spread: 0.22 },
  pharma: { base: 150, trend: 0.3, season: 8, noise: 5, spread: 0.12 },
  agro: { base: 95, trend: 0.2, season: 42, noise: 12, spread: 0.48 },
};

/** Seeded synthetic series: 26 weeks of history, then an 8-week forecast with a widening band. */
export function buildSeries(vertical: Vertical): ForecastSeries {
  const p = profiles[vertical];
  const rand = mulberry32(hashString(vertical));
  const points: ForecastPoint[] = [];
  for (let week = 0; week < HISTORY_WEEKS + FORECAST_WEEKS; week++) {
    const level = p.base + p.trend * week + p.season * Math.sin((week / 13) * Math.PI);
    if (week < HISTORY_WEEKS) {
      points.push({ week, value: Math.round(level + (rand() - 0.5) * 2 * p.noise), forecast: false });
    } else {
      const horizon = week - HISTORY_WEEKS + 1;
      const width = level * p.spread * Math.sqrt(horizon / FORECAST_WEEKS);
      points.push({
        week,
        value: Math.round(level),
        lower: Math.round(level - width),
        upper: Math.round(level + width),
        forecast: true,
      });
    }
  }
  const history = points.slice(0, HISTORY_WEEKS);
  const mean = history.reduce((sum, pt) => sum + pt.value, 0) / history.length;
  return { points, stock: Math.round(mean * 1.1) };
}

/**
 * Investigate when the band is wider than 40% of the forecast (too uncertain to act on);
 * otherwise Replenish when the upper band exceeds stock on hand; otherwise Hold.
 */
export function decide(point: ForecastPoint, stock: number): Decision {
  if (!point.forecast || point.lower === undefined || point.upper === undefined) return "Hold";
  if (point.upper - point.lower > 0.4 * point.value) return "Investigate";
  if (point.upper > stock) return "Replenish";
  return "Hold";
}
