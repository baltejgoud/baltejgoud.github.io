import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import { journey } from "@/content/journey";
import { journeyStories } from "@/content/journey-stories";
import {
  clampJourney,
  journeyLegProgress,
  journeyLegs,
  journeyScrollState,
  journeyStopProgress,
  pointOnJourney,
} from "./careerJourney";

describe("career journey navigation", () => {
  it("gives every career milestone a story and a reachable map stop", () => {
    expect(journeyStories.length).toBe(journey.length);
    expect(route.stops.length).toBe(journey.length);
    for (let i = 0; i < journey.length; i++) {
      const state = journeyScrollState(journeyStopProgress(i));
      expect(state.index).toBe(i);
      expect(state.overview).toBe(false);
      expect(state.distance).toBeCloseTo(route.stops[i], 5);
      const point = pointOnJourney(state.distance);
      expect(
        Math.hypot(
          point.x - route.positions[i][0],
          point.y - route.positions[i][1],
        ),
      ).toBeLessThan(20);
    }
  });
  it("keeps the route ordered while Haritha and the internship overlap in time", () => {
    expect(
      route.stops.every(
        (distance, i) => i === 0 || distance > route.stops[i - 1],
      ),
    ).toBe(true);
    expect(journey[3].dates).toBe("Mar 2024 – Present");
    expect(journey[4].dates).toBe("Oct – Dec 2025");
  });
  it("keeps scrolling before and after the track within valid stops", () => {
    expect(journeyScrollState(-1).overview).toBe(true);
    expect(journeyScrollState(2).index).toBe(journey.length - 1);
    expect(journeyScrollState(2).distance).toBeCloseTo(route.stops.at(-1)!);
  });
  it("handles invalid measurements and bounded destination indexes", () => {
    expect(clampJourney(Number.NaN)).toBe(0);
    expect(journeyStopProgress(-20)).toBe(journeyStopProgress(0));
    expect(journeyStopProgress(100)).toBe(
      journeyStopProgress(journey.length - 1),
    );
  });
  it("splits the drawn route into one leg per stop that joins up end to end", () => {
    expect(journeyLegs.length).toBe(route.stops.length);
    expect(journeyLegs[0].from).toBe(0);
    const ends = (path: string) => {
      const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
      return [numbers.slice(0, 2), numbers.slice(-2)];
    };
    journeyLegs.forEach((leg, i) => {
      expect(leg.to).toBe(route.stops[i]);
      if (i > 0) expect(leg.from).toBe(journeyLegs[i - 1].to);
      const [start, end] = ends(leg.path);
      const a = pointOnJourney(leg.from);
      const b = pointOnJourney(leg.to);
      expect(Math.hypot(start[0] - a.x, start[1] - a.y)).toBeLessThan(0.5);
      expect(Math.hypot(end[0] - b.x, end[1] - b.y)).toBeLessThan(0.5);
    });
  });
  it("draws the legs behind the traveller in full and nothing ahead of it", () => {
    const at = route.stops[2];
    expect(journeyLegs.map((leg) => journeyLegProgress(at, leg))).toEqual([
      1, 1, 1, 0, 0, 0, 0,
    ]);
    const third = journeyLegs[3];
    expect(
      journeyLegProgress((third.from + third.to) / 2, third),
    ).toBeCloseTo(0.5);
    expect(journeyLegs.every((leg) => journeyLegProgress(0, leg) === 0)).toBe(
      true,
    );
  });
  it("provides a finite camera position and heading along the whole route", () => {
    for (let progress = 0; progress <= 1; progress += 0.01) {
      const point = pointOnJourney(progress);
      expect(Number.isFinite(point.x + point.y + point.angle)).toBe(true);
    }
    expect(pointOnJourney(-5)).toEqual(pointOnJourney(0));
    expect(pointOnJourney(5)).toEqual(pointOnJourney(1));
  });
});
