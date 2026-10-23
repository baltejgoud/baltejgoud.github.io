import { describe, expect, it } from "vitest";
import { depths, fadeOut, layerPose } from "./camera";
import { splitWords } from "./ink";
import { sketchArrow, sketchLoop, sketchMarker, sketchTrend, sketchWave } from "./sketch";
import {
  SIGNAL_BARS,
  SIGNAL_EDGES,
  SIGNAL_GAPS,
  SIGNAL_PLOT,
  SIGNAL_STAGE,
  signalBandPath,
  signalDots,
  signalLoop,
  signalTrend,
  signalTrendPath,
} from "./signalStates";
import { cleanNote, NOTE_LIMITS, noteMailto, noteText } from "./note";

const numbersIn = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("hero camera", () => {
  it("starts at rest and clamps outside 0..1", () => {
    expect(layerPose(0, depths.front)).toEqual({ y: 0, scale: 1 });
    expect(layerPose(-1, depths.front)).toEqual(layerPose(0, depths.front));
    expect(layerPose(2, depths.front)).toEqual(layerPose(1, depths.front));
  });

  it("zooms nearer layers more and lets them scroll away faster", () => {
    const sky = layerPose(1, depths.sky);
    const ground = layerPose(1, depths.ground);
    const front = layerPose(1, depths.front);
    expect(sky.scale).toBeLessThan(ground.scale);
    expect(ground.scale).toBeLessThan(front.scale);
    expect(sky.y).toBeGreaterThan(ground.y);
    expect(ground.y).toBeGreaterThan(front.y);
  });

  it("moves monotonically with progress", () => {
    let last = layerPose(0, depths.ground);
    for (let p = 0.1; p <= 1; p += 0.1) {
      const pose = layerPose(p, depths.ground);
      expect(pose.scale).toBeGreaterThanOrEqual(last.scale);
      expect(pose.y).toBeGreaterThanOrEqual(last.y);
      last = pose;
    }
  });

  it("fades between two points", () => {
    expect(fadeOut(0, 0.2, 0.6)).toBe(1);
    expect(fadeOut(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(fadeOut(0.9, 0.2, 0.6)).toBe(0);
  });
});

describe("ink", () => {
  it("keeps every space when splitting words", () => {
    for (const text of ["I started with  data.", " learning how", " and ", " "]) {
      expect(splitWords(text).join("")).toBe(text);
    }
    expect(splitWords(" learning how")).toEqual([" learning ", "how"]);
    expect(splitWords("")).toEqual([]);
  });
});

describe("sketches", () => {
  const all = [sketchLoop, sketchWave, sketchTrend, sketchMarker, sketchArrow];

  it("are deterministic per seed and differ between seeds", () => {
    for (const draw of all) {
      expect(draw(3)).toBe(draw(3));
      expect(draw(3)).not.toBe(draw(4));
    }
  });

  it("produce finite path data", () => {
    for (const draw of all) {
      const d = draw(11);
      expect(d.startsWith("M")).toBe(true);
      for (const n of numbersIn(d)) expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("keep the loop inside its viewBox", () => {
    const xs = numbersIn(sketchLoop(5)).filter((_, i) => i % 2 === 0);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(200);
  });
});

describe("noise to signal", () => {
  const dots = signalDots();
  const count = (kind: string) => dots.filter((d) => d.kind === kind).length;

  it("is the same illustrative dataset on every render", () => {
    expect(signalDots()).toEqual(dots);
  });

  it("has one dashboard slot per regular dot, plus the gaps and outliers it names", () => {
    expect(dots).toHaveLength(SIGNAL_BARS.reduce((a, b) => a + b, 0) + SIGNAL_EDGES);
    expect(count("edge")).toBe(SIGNAL_EDGES);
    expect(count("gap")).toBe(SIGNAL_GAPS);
  });

  it("keeps every dot on the stage at every step", () => {
    for (const dot of dots) {
      expect(dot.at).toHaveLength(6);
      for (const p of dot.at) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(SIGNAL_STAGE.width);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(SIGNAL_STAGE.height);
      }
    }
  });

  it("never stacks two dots on the same spot in the table or the dashboard", () => {
    for (const step of [1, 3]) {
      const spots = new Set(dots.filter((d) => d.kind !== "edge").map((d) => `${d.at[step].x},${d.at[step].y}`));
      expect(spots.size).toBe(dots.length - SIGNAL_EDGES);
    }
  });

  it("fits the baseline without the outliers, then shows them further out than any regular point", () => {
    const plot = SIGNAL_PLOT;
    for (const edge of dots.filter((d) => d.kind === "edge"))
      expect(edge.at[2].x).toBeGreaterThan(plot.right);
    const off = (d: (typeof dots)[number]) => {
      const p = d.at[4];
      const x = (p.x - plot.left) / (plot.right - plot.left);
      const y = (plot.bottom - p.y) / (plot.bottom - plot.top);
      return Math.abs(y - signalTrend(x));
    };
    const regular = Math.max(...dots.filter((d) => d.kind !== "edge").map(off));
    const edges = Math.min(...dots.filter((d) => d.kind === "edge").map(off));
    expect(edges).toBeGreaterThan(regular);
  });

  it("draws the trend, band and loop as closed, valid paths", () => {
    expect(signalTrendPath()).toMatch(/^M[\d.]+ [\d.]+L/);
    expect(signalBandPath().endsWith("Z")).toBe(true);
    const loop = signalLoop();
    expect(loop.arc).toMatch(/^M.+A150 150 0 1 1 /);
    expect(loop.arrow.endsWith("Z")).toBe(true);
  });
});

describe("notes", () => {
  it("builds an encoded mailto link", () => {
    const link = noteMailto("me@example.com", { name: "Asha & co", message: "Hi there?" });
    expect(link.startsWith("mailto:me@example.com?subject=")).toBe(true);
    expect(link).toContain(encodeURIComponent("Asha & co"));
    expect(link).not.toContain(" ");
  });

  it("clamps long drafts and falls back to 'a visitor'", () => {
    const long = cleanNote({ name: "x".repeat(200), message: "y".repeat(5000) });
    expect(long.name).toHaveLength(NOTE_LIMITS.name);
    expect(long.message).toHaveLength(NOTE_LIMITS.message);
    expect(noteText({ name: "  ", message: "hello" })).toContain("— a visitor");
  });
});
