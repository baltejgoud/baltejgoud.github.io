import { describe, it, expect } from "vitest";
import route from "@/content/journey-route.json";
import { CAREER_SCENE, pointOnCareerScene, projectCareerPoint, sceneRoad, sceneStops } from "./careerScene";

describe("cinematic Spa registration", () => {
  it("keeps the entire geographic road inside the framed landscape", () => {
    expect(route.sourceId).toBe("be-1925");
    for (const p of sceneRoad) {
      expect(p.x).toBeGreaterThan(20);
      expect(p.x).toBeLessThan(CAREER_SCENE.width - 20);
      expect(p.y).toBeGreaterThan(20);
      expect(p.y).toBeLessThan(CAREER_SCENE.height - 20);
    }
    expect(sceneRoad[0]).toEqual(sceneRoad.at(-1));
  });
  it("keeps the car attached to the rendered centerline for the entire lap", () => {
    // Every source arc-length sample must arrive at its rendered road vertex.
    route.lengths.forEach((length, i) => {
      const car = pointOnCareerScene(length / route.totalLength);
      expect(Math.hypot(car.x - sceneRoad[i].x, car.y - sceneRoad[i].y)).toBeLessThan(.001);
      expect(Number.isFinite(car.angle)).toBe(true);
    });
  });
  it("registers all seven chronological checkpoints with car arrivals", () => {
    route.stops.forEach((stop, i) => {
      const car = pointOnCareerScene(stop);
      expect(Math.hypot(car.x - sceneStops[i].x, car.y - sceneStops[i].y)).toBeLessThan(.002);
    });
  });
  it("applies one ground-plane camera transform without moving individual corners", () => {
    const a = {x: 200, y: 300}, b = {x: 1000, y: 600};
    const pa = projectCareerPoint(a), pb = projectCareerPoint(b);
    const mid = projectCareerPoint({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    expect(mid.x).toBeCloseTo((pa.x+pb.x)/2, 8);
    expect(mid.y).toBeCloseTo((pa.y+pb.y)/2, 8);
  });
});
