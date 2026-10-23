import { describe, expect, it } from "vitest";
import { gridMove } from "@/lib/grid";

describe("gridMove", () => {
  it("moves horizontally within bounds", () => {
    expect(gridMove(0, "ArrowRight", 8, 32)).toBe(1);
    expect(gridMove(0, "ArrowLeft", 8, 32)).toBe(0);
    expect(gridMove(31, "ArrowRight", 8, 32)).toBe(31);
  });

  it("moves a whole row vertically", () => {
    expect(gridMove(2, "ArrowDown", 8, 32)).toBe(10);
    expect(gridMove(10, "ArrowUp", 8, 32)).toBe(2);
    expect(gridMove(2, "ArrowDown", 4, 32)).toBe(6);
  });

  it("stays put at the top and bottom rows", () => {
    expect(gridMove(3, "ArrowUp", 8, 32)).toBe(3);
    expect(gridMove(29, "ArrowDown", 8, 32)).toBe(29);
  });

  it("jumps to the ends with Home and End", () => {
    expect(gridMove(17, "Home", 8, 32)).toBe(0);
    expect(gridMove(17, "End", 8, 32)).toBe(31);
  });

  it("ignores other keys", () => {
    expect(gridMove(5, "Enter", 8, 32)).toBeNull();
  });
});
