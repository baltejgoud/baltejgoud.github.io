import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import { journey } from "@/content/journey";
import { journeyStories } from "@/content/journey-stories";
import {
  clampJourney,
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
  it("provides a finite camera position and heading along the whole route", () => {
    for (let progress = 0; progress <= 1; progress += 0.01) {
      const point = pointOnJourney(progress);
      expect(Number.isFinite(point.x + point.y + point.angle)).toBe(true);
    }
    expect(pointOnJourney(-5)).toEqual(pointOnJourney(0));
    expect(pointOnJourney(5)).toEqual(pointOnJourney(1));
  });
});
