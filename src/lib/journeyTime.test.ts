import { describe, expect, it } from "vitest";
import { journeyPath } from "@/lib/journey";
import { hyderabadTime } from "@/lib/time";

describe("journeyPath", () => {
  it("starts at the top centre and ends at the bottom", () => {
    const d = journeyPath(1000, 1200, 6, true);
    expect(d.startsWith("M 500 0")).toBe(true);
    expect(d.endsWith("500 1200")).toBe(true);
    expect(d.match(/ C /g)).toHaveLength(6);
  });

  it("swings between 42% and 58% of the width", () => {
    const d = journeyPath(1000, 600, 2, true);
    expect(d).toContain("C 580 ");
    expect(d).toContain("C 420 ");
  });

  it("uses a left rail on mobile", () => {
    expect(journeyPath(360, 900, 3, false).startsWith("M 20 0")).toBe(true);
  });
});

describe("hyderabadTime", () => {
  it("formats India Standard Time", () => {
    expect(hyderabadTime(new Date("2026-10-16T06:30:00Z"))).toBe("12:00 IST");
    expect(hyderabadTime(new Date("2026-10-16T18:45:00Z"))).toBe("00:15 IST");
  });
});
