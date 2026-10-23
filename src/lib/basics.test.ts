import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";
import { magneticOffset } from "@/lib/magnet";
import { vars } from "@/lib/style";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("vars", () => {
  it("passes custom properties through", () => {
    expect(vars({ "--delay": "120ms", "--i": 2 })).toEqual({ "--delay": "120ms", "--i": 2 });
  });
});

describe("magneticOffset", () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };

  it("is zero at the centre", () => {
    expect(magneticOffset(200, 150, rect)).toEqual({ x: 0, y: 0 });
  });

  it("reaches the cap at the edges", () => {
    expect(magneticOffset(300, 150, rect)).toEqual({ x: 8, y: 0 });
    expect(magneticOffset(100, 100, rect)).toEqual({ x: -8, y: -8 });
  });

  it("never exceeds the cap outside the element", () => {
    expect(magneticOffset(900, 900, rect, 10)).toEqual({ x: 10, y: 10 });
  });
});
