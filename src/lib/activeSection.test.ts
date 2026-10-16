import { describe, expect, it } from "vitest";
import { resolveActive } from "@/lib/activeSection";

const order = ["about", "skills", "work", "contact"];

describe("resolveActive", () => {
  it("returns null when nothing is in the band", () => {
    expect(resolveActive(order, new Set())).toBeNull();
  });

  it("returns the intersecting section", () => {
    expect(resolveActive(order, new Set(["work"]))).toBe("work");
  });

  it("prefers the earlier section when two touch the band", () => {
    expect(resolveActive(order, new Set(["contact", "skills"]))).toBe("skills");
  });

  it("ignores ids that are not in the nav", () => {
    expect(resolveActive(order, new Set(["top"]))).toBeNull();
  });
});
