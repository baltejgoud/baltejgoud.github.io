import { describe, expect, it } from "vitest";
import { fnvHex, sha256Hex } from "@/lib/hash";
import { ATLAS_TILES, drawCalls, tileOffset } from "@/lib/widgets/atlas";
import { chainHashes, defaultChain, tamperedPayloads, verify } from "@/lib/widgets/custody";
import { evaluateListing, FACE_VALUE, formatInr } from "@/lib/widgets/fairPrice";
import { buildSeries, decide, FORECAST_WEEKS, HISTORY_WEEKS, verticals, type Decision } from "@/lib/widgets/forecast";
import { importReducer, initialImport } from "@/lib/widgets/importer";
import { runTransfer } from "@/lib/widgets/reconcile";

describe("forecast", () => {
  it("is deterministic", () => {
    expect(buildSeries("fashion")).toEqual(buildSeries("fashion"));
  });

  it("has history followed by a banded forecast", () => {
    const { points } = buildSeries("agro");
    expect(points).toHaveLength(HISTORY_WEEKS + FORECAST_WEEKS);
    for (const p of points.slice(HISTORY_WEEKS)) {
      expect(p.forecast).toBe(true);
      expect(p.lower!).toBeLessThan(p.value);
      expect(p.upper!).toBeGreaterThan(p.value);
    }
  });

  it("decides by uncertainty first, then stock", () => {
    const base = { week: 30, forecast: true };
    expect(decide({ ...base, value: 100, lower: 70, upper: 130 }, 200)).toBe("Investigate");
    expect(decide({ ...base, value: 100, lower: 90, upper: 110 }, 105)).toBe("Replenish");
    expect(decide({ ...base, value: 100, lower: 90, upper: 110 }, 120)).toBe("Hold");
    expect(decide({ week: 3, value: 100, forecast: false }, 50)).toBe("Hold");
  });

  it("shows every decision somewhere in the demo", () => {
    const seen = new Set<Decision>();
    for (const v of verticals) {
      const { points, stock } = buildSeries(v.id);
      for (const p of points.slice(HISTORY_WEEKS)) seen.add(decide(p, stock));
    }
    expect([...seen].sort()).toEqual(["Hold", "Investigate", "Replenish"]);
  });
});

describe("custody", () => {
  it("hashes with SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(fnvHex("a")).toBe("e40c292c");
  });

  it("breaks the tampered step and every later one", async () => {
    const signed = await chainHashes(defaultChain);
    const tampered = defaultChain.map((s) => (s.id === "carrier" ? { ...s, payload: tamperedPayloads.carrier } : s));
    expect(verify(signed, await chainHashes(tampered))).toEqual([true, true, false, false]);
  });

  it("verifies an untouched chain", async () => {
    const signed = await chainHashes(defaultChain);
    expect(verify(signed, await chainHashes(defaultChain))).toEqual([true, true, true, true]);
  });
});

describe("reconcile", () => {
  it("posts the transfer twice with a naive retry", () => {
    const result = runTransfer("naive");
    expect(result.transfers).toBe(2);
    expect(result.lines.at(-1)?.tone).toBe("error");
  });

  it("posts it once when Tandem reconciles", () => {
    const result = runTransfer("tandem");
    expect(result.transfers).toBe(1);
    expect(result.lines.at(-1)?.text).toContain("retry skipped");
  });
});

describe("fair price", () => {
  it("lists at face value and blocks one step above it", () => {
    expect(evaluateListing(FACE_VALUE)).toEqual({ status: "listed", saving: 0 });
    expect(evaluateListing(FACE_VALUE + 50)).toEqual({ status: "blocked", over: 50 });
    expect(evaluateListing(1000)).toEqual({ status: "listed", saving: 1500 });
  });

  it("formats rupees with Indian grouping", () => {
    expect(formatInr(12000)).toBe("₹12,000");
    expect(formatInr(100000)).toBe("₹1,00,000");
  });
});

describe("importer", () => {
  it("parses to review, saves, and can be cancelled", () => {
    let s = importReducer(initialImport, { type: "start" });
    expect(s.phase).toBe("parsing");
    s = importReducer(s, { type: "tick", amount: 60 });
    s = importReducer(s, { type: "tick", amount: 60 });
    expect(s).toEqual({ phase: "review", progress: 100 });
    s = importReducer(s, { type: "save" });
    expect(s).toEqual({ phase: "saving", progress: 0 });
    expect(importReducer(s, { type: "cancel" }).phase).toBe("cancelled");
    s = importReducer(s, { type: "tick", amount: 100 });
    expect(s.phase).toBe("saved");
  });

  it("ignores events that do not apply", () => {
    expect(importReducer(initialImport, { type: "tick", amount: 50 })).toBe(initialImport);
    const review = { phase: "review" as const, progress: 100 };
    expect(importReducer(review, { type: "cancel" })).toBe(review);
  });
});

describe("atlas", () => {
  it("counts draw calls from 208 down to 1", () => {
    expect(drawCalls(0)).toBe(ATLAS_TILES);
    expect(drawCalls(1)).toBe(1);
    expect(drawCalls(0.5)).toBe(105);
    expect(drawCalls(2)).toBe(1);
  });

  it("measures tile offsets from the centre", () => {
    expect(tileOffset(0)).toEqual({ col: 0, row: 0, dx: 7.5, dy: 6 });
    expect(tileOffset(207)).toEqual({ col: 15, row: 12, dx: -7.5, dy: -6 });
  });
});
