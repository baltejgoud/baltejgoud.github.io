"use client";

import { useMemo, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import {
  buildSeries,
  decide,
  FORECAST_WEEKS,
  HISTORY_WEEKS,
  verticals,
  type Decision,
  type ForecastPoint,
  type Vertical,
} from "@/lib/widgets/forecast";

const W = 320;
const H = 170;
const PAD = 6;
const chip: Record<Decision, string> = {
  Replenish: "bg-ink text-cream",
  Investigate: "border border-cat-lang text-[#8a5a22]",
  Hold: "border border-line text-stone",
};

export function ForecastWidget() {
  const [vertical, setVertical] = useState<Vertical>("fashion");
  const [week, setWeek] = useState(HISTORY_WEEKS + 1);
  const { points, stock } = useMemo(() => buildSeries(vertical), [vertical]);

  const values = points.flatMap((p) => [p.value, p.lower ?? p.value, p.upper ?? p.value, stock]);
  const lo = Math.min(...values) * 0.9;
  const hi = Math.max(...values) * 1.05;
  const x = (w: number) => PAD + (w / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const line = (list: ForecastPoint[]) =>
    list.map((p, i) => `${i ? "L" : "M"} ${x(p.week).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const history = points.filter((p) => !p.forecast);
  const future = points.filter((p) => p.forecast);
  const band = [
    ...future.map((p) => `${x(p.week)},${y(p.upper ?? p.value)}`),
    ...[...future].reverse().map((p) => `${x(p.week)},${y(p.lower ?? p.value)}`),
  ].join(" ");
  const point = points[week];
  const decision = decide(point, stock);

  return (
    <WidgetFrame title="Sanket · SKU demand outlook" caption="Illustrative data. Drag across the chart to see the suggested action.">
      <div role="group" aria-label="Industry" className="flex flex-wrap gap-1.5">
        {verticals.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={v.id === vertical}
            onClick={() => setVertical(v.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              v.id === vertical ? "bg-ink text-cream" : "bg-cream text-stone hover:text-ink",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="relative mt-4 rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ink">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
          <line x1={PAD} x2={W - PAD} y1={y(stock)} y2={y(stock)} stroke="var(--color-stone)" strokeDasharray="3 4" />
          <polygon points={band} fill="var(--color-ink)" fillOpacity={0.08} />
          <path d={line(history)} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
          <path
            d={line([history[history.length - 1], ...future])}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <line x1={x(week)} x2={x(week)} y1={PAD} y2={H - PAD} stroke="var(--color-ink)" strokeOpacity={0.25} />
          <circle cx={x(week)} cy={y(point.value)} r={4.5} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2} />
        </svg>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          aria-label="Week"
          aria-valuetext={`Week ${week + 1}: ${point.value} units, ${decision}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] leading-relaxed text-stone">
          W{week + 1} · {point.value} units{point.forecast ? ` · range ${point.lower}–${point.upper}` : ""}
          <br />
          Stock on hand · {stock}
        </p>
        <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", chip[decision])}>{decision}</span>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
        {HISTORY_WEEKS} weeks history · {FORECAST_WEEKS}-week forecast
      </p>
    </WidgetFrame>
  );
}
