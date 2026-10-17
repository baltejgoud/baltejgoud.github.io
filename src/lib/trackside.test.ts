import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import route from "@/content/journey-route.json";
import {
  JOURNEY_END,
  JOURNEY_INTRO,
  LIGHTS_OUT,
  journeyScrollState,
  journeyStopProgress,
} from "./careerJourney";
import {
  DIVE_END,
  LAP,
  POLE_S,
  STEP,
  carPose,
  checkpointBoard,
  gridSlot,
  lateralPoint,
  startLights,
  trackModel,
  tracksidePose,
} from "./trackside";

const { samples, x, z, y, tx, tz, racing, halfWidth } = trackModel;
const nearestSample = (px: number, pz: number) => {
  let best = Infinity,
    index = 0;
  for (let i = 0; i < samples; i++) {
    const d = (x[i] - px) ** 2 + (z[i] - pz) ** 2;
    if (d < best) {
      best = d;
      index = i;
    }
  }
  return index;
};

describe("trackside drive", () => {
  it("reveals a checkpoint story only after the car has arrived", () => {
    for (let i = 0; i <= 2000; i++) {
      const state = journeyScrollState(i / 2000);
      if (state.arrival > 0.7)
        expect(state.distance).toBeCloseTo(route.stops[state.index], 6);
    }
    route.stops.forEach((_, index) => {
      expect(journeyScrollState(journeyStopProgress(index)).arrival).toBe(1);
      const traveling =
        JOURNEY_INTRO +
        ((index + 0.1) / route.stops.length) * (JOURNEY_END - JOURNEY_INTRO);
      expect(journeyScrollState(traveling).arrival).toBe(0);
    });
  });

  it("builds a closed lap at Spa's true 7.004 km without kinks", () => {
    let length = 0,
      sharpest = 0;
    for (let i = 0; i < samples; i++) {
      const j = (i + 1) % samples;
      length += Math.hypot(x[j] - x[i], z[j] - z[i]);
      const turn = Math.acos(Math.min(1, tx[i] * tx[j] + tz[i] * tz[j]));
      sharpest = Math.max(sharpest, turn);
    }
    expect(Math.abs(length - LAP) / LAP).toBeLessThan(0.005);
    // Tightest corner (La Source) still turns under 12° per 2.5 m sample.
    expect((sharpest * 180) / Math.PI).toBeLessThan(12);
    expect(STEP).toBeCloseTo(2.5, 1);
  });

  it("follows Spa's published 102.2 m climb: high at Malmedy, low near Paul Frère", () => {
    let high = 0,
      low = 0;
    for (let i = 0; i < samples; i++) {
      if (y[i] > y[high]) high = i;
      if (y[i] < y[low]) low = i;
    }
    expect(y[high] - y[low]).toBeCloseTo(102.2, 1);
    expect(high * STEP).toBeGreaterThan(2400);
    expect(high * STEP).toBeLessThan(2700);
    expect(low * STEP).toBeGreaterThan(4700);
    expect(low * STEP).toBeLessThan(5000);
    // Eau Rouge dips before Raidillon climbs about 30 m.
    const dip = y[Math.round(930 / STEP)],
      crest = y[Math.round(1160 / STEP)];
    expect(crest - dip).toBeGreaterThan(25);
  });

  it("keeps the racing line inside the track limits", () => {
    for (let i = 0; i < samples; i++)
      expect(Math.abs(racing[i])).toBeLessThanOrEqual(halfWidth[i] - 1.3);
  });

  it("starts on pole behind the start line and finishes back in the same slot", () => {
    const start = carPose(0);
    expect(start.s).toBeCloseTo(POLE_S, 6);
    expect(start.s).toBeLessThan(-2.8); // the front wing stays behind the line
    const slot = gridSlot(0);
    const box = lateralPoint(slot.s, slot.lateral);
    start.position.forEach((value, i) => expect(value).toBeCloseTo(box[i], 1));
    // Pole takes the inside for La Source, a right-hander: the driver's right.
    expect(slot.lateral).toBeGreaterThan(0);
    expect(gridSlot(1).lateral).toBeLessThan(0);
    expect(gridSlot(1).s - slot.s).toBeCloseTo(-8);
    const finish = carPose(1);
    finish.position.forEach((value, i) =>
      expect(value).toBeCloseTo(start.position[i], 3),
    );
  });

  it("lights the five start lights one by one and launches only after lights out", () => {
    let previous = 0,
      peak = 0;
    for (let i = 0; i <= 1000; i++) {
      const p = JOURNEY_INTRO + (i / 1000) * 0.2;
      const state = journeyScrollState(p);
      if (state.index > 0) break;
      const lit = startLights({
        approach: state.firstApproach,
        overview: state.overview,
        index: state.index,
      });
      if (lit > 0) expect(lit).toBeGreaterThanOrEqual(previous);
      peak = Math.max(peak, lit);
      if (state.distance > 0) {
        expect(state.firstApproach).toBeGreaterThan(LIGHTS_OUT);
        expect(lit).toBe(0);
      }
      previous = lit;
    }
    expect(peak).toBe(5);
    expect(startLights({ approach: 1, overview: false, index: 0 })).toBe(0);
  });

  it("dives from the overview to the car waiting on the grid", () => {
    for (const compact of [false, true]) {
      const overview = tracksidePose({ distance: 0, approach: 0, overview: true, compact });
      expect(overview.position[1]).toBeGreaterThan(1400);
      const opening = tracksidePose({ distance: 0, approach: 0, overview: false, compact });
      opening.position.forEach((v, i) => expect(v).toBeCloseTo(overview.position[i], 3));
      const grid = tracksidePose({ distance: 0, approach: DIVE_END, overview: false, compact });
      expect(grid.position[1] - grid.car.position[1]).toBeLessThan(20);
      expect(
        Math.hypot(grid.position[0] - grid.car.position[0], grid.position[2] - grid.car.position[2]),
      ).toBeLessThan(40);
    }
  });

  it("keeps the camera finite and above the ground along the whole drive", () => {
    for (const compact of [false, true])
      for (let i = 0; i <= 1400; i++) {
        const state = journeyScrollState(i / 1400);
        const pose = tracksidePose({
          ...state,
          approach: state.overview ? 0 : state.firstApproach,
          compact,
        });
        const values = [...pose.position, ...pose.target, ...pose.car.position, pose.fov];
        expect(values.every(Number.isFinite)).toBe(true);
        const under = nearestSample(pose.position[0], pose.position[2]);
        expect(pose.position[1]).toBeGreaterThan(y[under] + 2);
      }
  });

  it("keeps the car in frame from the grid to the flag", () => {
    for (const [w, h, compact] of [
      [1536, 864, false],
      [390, 844, true],
    ] as [number, number, boolean][])
      for (let i = 0; i <= 2000; i++) {
        const state = journeyScrollState(i / 2000);
        if (state.overview || (state.index === 0 && state.firstApproach < DIVE_END))
          continue;
        const pose = tracksidePose({ ...state, approach: state.firstApproach, compact });
        const camera = new PerspectiveCamera(pose.fov, w / h, 0.3, 40000);
        camera.position.set(...pose.position);
        camera.lookAt(new Vector3(...pose.target));
        camera.setViewOffset(w, h, -(pose.screen[0] - 0.5) * w, -(pose.screen[1] - 0.5) * h, w, h);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        const p = new Vector3(...pose.car.position).project(camera);
        expect(p.z).toBeLessThan(1);
        expect(Math.abs(p.x)).toBeLessThan(0.95);
        expect(Math.abs(p.y)).toBeLessThan(0.95);
      }
  });

  it("frames each checkpoint screen and the stopped car on screen", () => {
    for (const [w, h, compact] of [
      [1536, 864, false],
      [390, 844, true],
    ] as [number, number, boolean][])
      route.stops.forEach((stop, index) => {
        const pose = tracksidePose({
          distance: stop,
          approach: 1,
          overview: false,
          compact,
          index,
        });
        const camera = new PerspectiveCamera(pose.fov, w / h, 0.3, 40000);
        camera.position.set(...pose.position);
        camera.lookAt(new Vector3(...pose.target));
        camera.setViewOffset(w, h, -(pose.screen[0] - 0.5) * w, -(pose.screen[1] - 0.5) * h, w, h);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        for (const point of [pose.car.position, checkpointBoard(index).anchor]) {
          const p = new Vector3(...point).project(camera);
          expect(p.z).toBeLessThan(1);
          expect(Math.abs(p.x)).toBeLessThan(0.92);
          expect(Math.abs(p.y)).toBeLessThan(0.92);
        }
      });
  });
});
