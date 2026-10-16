import { describe, expect, it } from "vitest";
import { barcode } from "@/lib/barcode";

describe("barcode", () => {
  it("is deterministic for a seed", () => {
    expect(barcode("BALTEJGOUD", 120)).toEqual(barcode("BALTEJGOUD", 120));
  });

  it("differs between seeds", () => {
    expect(barcode("A", 120)).not.toEqual(barcode("B", 120));
  });

  it("starts at 0 and ends exactly at the width", () => {
    const bars = barcode("BALTEJGOUD", 120);
    expect(bars[0].x).toBe(0);
    const last = bars[bars.length - 1];
    expect(last.x + last.w).toBeCloseTo(120, 9);
  });

  it("keeps bars apart and between one and three units wide", () => {
    const bars = barcode("BALTEJGOUD", 120);
    const unit = Math.min(...bars.map((b) => b.w));
    for (let i = 0; i < bars.length; i++) {
      expect(bars[i].w).toBeLessThanOrEqual(unit * 3 + 1e-9);
      if (i > 0) expect(bars[i].x).toBeGreaterThan(bars[i - 1].x + bars[i - 1].w - 1e-9);
    }
  });
});
