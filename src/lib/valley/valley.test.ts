import { describe, expect, it } from "vitest";
import { depths, fadeOut, layerPose } from "./camera";
import { splitWords } from "./ink";
import { sketchArrow, sketchLoop, sketchMarker, sketchTrend, sketchWave } from "./sketch";
import { bandPath, pointAt, processSeries, reachedStep, smoothPath } from "./processChart";
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

describe("process chart", () => {
  const series = processSeries(6);

  it("spans the x axis with a rising trend and keeps the actual line inside its band", () => {
    expect(series[0].x).toBe(0);
    expect(series[5].x).toBe(1);
    expect(series[5].y).toBeGreaterThan(series[0].y);
    expect(series[5].trend).toBeGreaterThan(series[0].trend);
    for (const p of series) {
      expect(p.lo).toBeLessThan(p.y);
      expect(p.hi).toBeGreaterThan(p.y);
      expect(p.lo).toBeGreaterThanOrEqual(0);
      expect(p.hi).toBeLessThanOrEqual(1);
    }
  });

  it("widens uncertainty towards the horizon", () => {
    const width = (i: number) => series[i].hi - series[i].lo;
    expect(width(5)).toBeGreaterThan(width(0));
  });

  it("draws paths and places points inside the chart", () => {
    expect(smoothPath(series, "y", 1000, 400).startsWith("M")).toBe(true);
    expect(bandPath(series, 1000, 400).endsWith("Z")).toBe(true);
    for (const p of series) {
      const { x, y } = pointAt(p, 1000, 400);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1000);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(400);
    }
  });

  it("reports the step the traced line has reached", () => {
    expect(reachedStep(0, 6)).toBe(-1);
    expect(reachedStep(0.01, 6)).toBe(0);
    expect(reachedStep(0.2, 6)).toBe(1);
    expect(reachedStep(1, 6)).toBe(5);
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
