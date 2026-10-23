import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import {
  CAREER_MAP_BOUNDS,
  careerMapPercent,
  fitCareerMap,
  placeCareerPopup,
} from "./careerMapLayout";

const road = route.points.map(([x, y]) => ({ x, y }));
// A 1524×696 laptop viewport: dock centred at the bottom, masthead and HUD across the top.
const laptop = { width: 1524, height: 696 };
const dock = { left: 472, top: 614, right: 1052, bottom: 676 };
const furniture = [
  dock,
  { left: 38, top: 32, right: 420, bottom: 64 },
  { left: 1200, top: 25, right: 1489, bottom: 69 },
  { left: 21, top: 98, right: 65, bottom: 598 },
];
const onScreen = (fit: NonNullable<ReturnType<typeof fitCareerMap>>) =>
  road.map((p) => ({
    x: fit.x + (p.x - CAREER_MAP_BOUNDS.x) * fit.scale,
    y: fit.y + (p.y - CAREER_MAP_BOUNDS.y) * fit.scale,
  }));

describe("full-screen circuit layout", () => {
  it("keeps every track point within the map and aligns the pins to the same coordinates", () => {
    for (const [x, y] of [...route.points, ...route.positions]) {
      const p = careerMapPercent({ x, y });
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(100);
    }
  });
  it("grows the circuit down beside the dock on a wide screen without touching it", () => {
    const fit = fitCareerMap(laptop, furniture, road, [])!;
    expect(fit.scale).toBeGreaterThan(0.7);
    const points = onScreen(fit);
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(laptop.width);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(laptop.height);
      const half = 28 * fit.scale;
      const clearOfDock =
        p.x + half < dock.left ||
        p.x - half > dock.right ||
        p.y + half < dock.top;
      expect(clearOfDock).toBe(true);
    }
    // Beside the dock rather than above it: the road reaches lower than the dock's top edge.
    expect(Math.max(...points.map((p) => p.y))).toBeGreaterThan(dock.top);
  });
  it("keeps each checkpoint label inside the screen", () => {
    const [x, y] = route.positions[4];
    const tectoro = { x, y, box: { left: -40, top: -17, right: 40, bottom: 62 } };
    const fit = fitCareerMap(laptop, furniture, road, [tectoro])!;
    const below =
      fit.y + (y - CAREER_MAP_BOUNDS.y) * fit.scale + tectoro.box.bottom;
    expect(below).toBeLessThanOrEqual(laptop.height);
  });
  it("places a career popup on-screen, clear of its car and a nearby road", () => {
    const road = Array.from({ length: 80 }, (_, i) => ({ x: 800 + i, y: 420 }));
    const p = placeCareerPopup(
      { x: 820, y: 420 },
      { width: 380, height: 350 },
      { width: 1440, height: 1000 },
      road,
    );
    expect(p.x).toBeGreaterThanOrEqual(96);
    expect(p.x + 380).toBeLessThanOrEqual(1410);
    expect(p.y).toBeGreaterThanOrEqual(88);
    expect(p.y + 350).toBeLessThanOrEqual(892);
    expect(p.x + 380).toBeLessThan(800);
  });
});
