import { describe, expect, it } from "vitest";
import { pointerToOffset } from "@/lib/parallax";

const rect = { left: 0, top: 0, width: 200, height: 100 };

describe("pointerToOffset", () => {
  it("is zero at the centre", () => {
    expect(pointerToOffset(100, 50, rect)).toEqual({ x: 0, y: 0 });
  });

  it("is -1 at the top-left corner and 1 at the bottom-right", () => {
    expect(pointerToOffset(0, 0, rect)).toEqual({ x: -1, y: -1 });
    expect(pointerToOffset(200, 100, rect)).toEqual({ x: 1, y: 1 });
  });

  it("clamps outside the element", () => {
    expect(pointerToOffset(-50, 400, rect)).toEqual({ x: -1, y: 1 });
  });
});
