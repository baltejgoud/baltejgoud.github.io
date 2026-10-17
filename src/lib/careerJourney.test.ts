import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import { journey } from "@/content/journey";
import { journeyStories } from "@/content/journey-stories";
import {
  clampJourney,
  journeyLegProgress,
  journeyLegs,
  JOURNEY_CHAPTERS,
  JOURNEY_INTRO,
  JOURNEY_END,
  JOURNEY_SCROLL_SCREENS,
  journeyProgressAt,
  journeyScrollState,
  journeyStopProgress,
  pointOnJourney,
} from "./careerJourney";

describe("career journey navigation", () => {
  it("uses a closed Spa lap with an exact start/finish arrival", () => {
    expect(route.sourceId).toBe("be-1925");
    expect(route.circuitLength).toBe(7004);
    expect(route.points.at(-1)).toEqual(route.points[0]);
    expect(route.stops.at(-1)).toBe(1);
    const start = pointOnJourney(0);
    const finish = pointOnJourney(1);
    expect(finish.x).toBeCloseTo(start.x, 3);
    expect(finish.y).toBeCloseTo(start.y, 3);
    expect(journeyLegs.every((leg) => journeyLegProgress(1, leg) === 1)).toBe(
      true,
    );
  });
  it("keeps every sample within the circuit board and arc lengths monotonic", () => {
    expect(route.lengths[0]).toBe(0);
    expect(route.lengths.at(-1)).toBe(route.totalLength);
    route.points.forEach(([x, y], i) => {
      expect(x).toBeGreaterThan(0);
      expect(y).toBeGreaterThan(0);
      expect(x).toBeLessThan(route.width);
      expect(y).toBeLessThan(route.height);
      if (i > 0)
        expect(route.lengths[i]).toBeGreaterThanOrEqual(route.lengths[i - 1]);
    });
  });
  it("never sends the car backwards during forward scrolling", () => {
    let previous = 0;
    for (let i = 0; i <= 2000; i++) {
      const current = journeyScrollState(i / 2000).distance;
      expect(current).toBeGreaterThanOrEqual(previous - 1e-10);
      previous = current;
    }
    expect(previous).toBe(1);
  });
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

  it("spreads travel across the scroll gesture before revealing the story", () => {
    for (let index = 1; index < route.stops.length; index++) {
      const at = (fraction: number) =>
        journeyScrollState(journeyProgressAt(index, fraction));
      expect(at(0.45).distance).toBeLessThan(route.stops[index]);
      expect(at(0.45).arrival).toBe(0);
      expect(at(0.64).distance).toBeCloseTo(route.stops[index], 6);
      expect(at(0.64).arrival).toBe(1);
      // A chapter boundary must not teleport the car when scrolling either way.
      expect(
        Math.abs(at(0.000001).distance - at(-0.000001).distance),
      ).toBeLessThan(0.00001);
    }
  });
  it("gives each chapter scroll in proportion to its leg, at a steady pace", () => {
    const legs = route.stops.map(
      (to, i) => (to - (i > 0 ? route.stops[i - 1] : 0)) * route.circuitLength,
    );
    for (let i = 2; i < legs.length; i++)
      expect(Math.sign(JOURNEY_CHAPTERS[i] - JOURNEY_CHAPTERS[i - 1])).toBe(
        Math.sign(legs[i] - legs[i - 1]),
      );
    // Driving takes the first 55% of a chapter: roughly 1–2.5 km per screen.
    legs.forEach((metres, i) => {
      if (i === 0) return;
      const pace = metres / (0.55 * JOURNEY_CHAPTERS[i]);
      expect(pace).toBeGreaterThan(900);
      expect(pace).toBeLessThan(2500);
    });
    // The chapters exactly fill the scroll between the intro and the outro.
    expect(journeyProgressAt(0, 0)).toBeCloseTo(JOURNEY_INTRO, 10);
    expect(journeyProgressAt(route.stops.length - 1, 1)).toBeCloseTo(
      JOURNEY_END,
      10,
    );
    expect(JOURNEY_SCROLL_SCREENS * (JOURNEY_END - JOURNEY_INTRO)).toBeCloseTo(
      JOURNEY_CHAPTERS.reduce((sum, h) => sum + h, 0),
      10,
    );
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
    expect(journeyLegProgress((third.from + third.to) / 2, third)).toBeCloseTo(
      0.5,
    );
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
