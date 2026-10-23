import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import { careerMapState, careerMapStopProgress } from "./careerMapProgress";

describe("scroll-driven career map", () => {
  it("starts on the grid and finishes a complete lap", () => {
    expect(careerMapState(0)).toMatchObject({
      overview: true,
      arrived: false,
      distance: 0,
    });
    expect(careerMapState(1)).toMatchObject({
      index: 6,
      arrived: true,
      distance: 1,
    });
    expect(careerMapState(-10)).toEqual(careerMapState(0));
    expect(careerMapState(10)).toEqual(careerMapState(1));
    expect(careerMapState(NaN)).toEqual(careerMapState(0));
  });

  it("parks at every career checkpoint throughout its reading stretch", () => {
    route.stops.forEach((distance, index) => {
      const center = careerMapStopProgress(index);
      for (const offset of [-0.015, 0, 0.015]) {
        expect(careerMapState(center + offset)).toMatchObject({
          index,
          arrived: true,
          distance,
        });
      }
    });
  });

  it("moves continuously forward with scroll and exactly retraces it backwards", () => {
    const samples = Array.from({ length: 1001 }, (_, i) =>
      careerMapState(i / 1000),
    );
    samples.slice(1).forEach((state, i) => {
      expect(state.distance).toBeGreaterThanOrEqual(samples[i].distance);
      expect(state.distance - samples[i].distance).toBeLessThan(0.01);
    });
    for (let i = 1000; i >= 0; i--)
      expect(careerMapState(i / 1000)).toEqual(samples[i]);
  });

  it("bounds chapter navigation to the route", () => {
    expect(careerMapStopProgress(-1)).toBe(careerMapStopProgress(0));
    expect(careerMapStopProgress(99)).toBe(careerMapStopProgress(6));
    expect(careerMapStopProgress(NaN)).toBe(careerMapStopProgress(0));
  });
});
