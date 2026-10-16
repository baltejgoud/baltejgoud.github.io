import { describe, expect, it } from "vitest";
import {
  createRope,
  endAngle,
  energy,
  nudge,
  pinEnd,
  ropePath,
  setAnchor,
  simulate,
  stepRope,
  stepSpin,
  SUBSTEP,
  type Rope,
  type RopeConfig,
} from "@/lib/physics/rope";
import { mulberry32 } from "@/lib/random";

const config: RopeConfig = {
  anchor: { x: 100, y: 0 },
  segments: 9,
  segmentLength: 18,
  gravity: 2400,
  damping: 0.985,
  iterations: 12,
  endMass: 6,
  maxStretch: 1.35,
};

const run = (rope: Rope, seconds: number) => {
  for (let t = 0; t < seconds; t += SUBSTEP) stepRope(rope);
};
const end = (rope: Rope) => rope.pos[rope.pos.length - 1];

describe("rope", () => {
  it("hangs straight down from the anchor", () => {
    const rope = createRope(config);
    run(rope, 2);
    expect(Math.abs(end(rope).x - 100)).toBeLessThan(0.01);
    expect(end(rope).y).toBeGreaterThan(150);
  });

  it("keeps segment lengths within 2% once settled", () => {
    const rope = createRope(config);
    nudge(rope, { x: 800, y: 0 });
    run(rope, 12);
    for (let i = 0; i < rope.pos.length - 1; i++) {
      const d = Math.hypot(rope.pos[i + 1].x - rope.pos[i].x, rope.pos[i + 1].y - rope.pos[i].y);
      expect(Math.abs(d - 18) / 18).toBeLessThan(0.02);
    }
  });

  it("comes to rest after a swing", () => {
    const rope = createRope(config);
    nudge(rope, { x: 800, y: 0 });
    run(rope, 20);
    expect(energy(rope)).toBeLessThan(1e-6);
    expect(Math.abs(end(rope).x - 100)).toBeLessThan(0.5);
  });

  it("moves when nudged", () => {
    const rope = createRope(config);
    nudge(rope, { x: 600, y: 0 });
    stepRope(rope);
    expect(end(rope).x).toBeGreaterThan(100);
  });

  it("stays finite and within reach through random drags and releases", () => {
    const rope = createRope(config);
    const rand = mulberry32(1);
    const reach = config.segments * config.segmentLength * config.maxStretch;
    for (let step = 0; step < 10_000; step++) {
      if (step % 50 === 0) {
        if (rand() < 0.5) pinEnd(rope, { x: 100 + (rand() - 0.5) * 800, y: (rand() - 0.2) * 800 });
        else {
          pinEnd(rope, null);
          nudge(rope, { x: (rand() - 0.5) * 5000, y: (rand() - 0.5) * 5000 });
        }
      }
      stepRope(rope);
      for (const p of rope.pos) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        expect(Math.hypot(p.x - 100, p.y)).toBeLessThan(reach * 1.25);
      }
    }
  });

  it("clamps a pin to the maximum reach", () => {
    const rope = createRope(config);
    pinEnd(rope, { x: 100, y: 10_000 });
    expect(rope.pin?.y).toBeCloseTo(config.segments * config.segmentLength * config.maxStretch, 6);
  });

  it("carries the rope with its anchor", () => {
    const rope = createRope(config);
    setAnchor(rope, { x: 160, y: 0 });
    expect(end(rope).x).toBe(160);
    expect(rope.config.anchor.x).toBe(160);
  });

  it("runs whole substeps and returns the remainder", () => {
    const rope = createRope(config);
    const carry = simulate(rope, 0.02);
    expect(carry).toBeGreaterThanOrEqual(0);
    expect(carry).toBeLessThan(SUBSTEP);
  });
});

describe("endAngle", () => {
  it("is zero when hanging straight", () => {
    expect(endAngle(createRope(config))).toBeCloseTo(0, 9);
  });

  it("is negative when the end swings to the right", () => {
    const rope = createRope(config);
    rope.pos[rope.pos.length - 1].x += 10;
    expect(endAngle(rope)).toBeLessThan(0);
  });
});

describe("stepSpin", () => {
  it("settles on the target", () => {
    const spin = { angle: 0, velocity: 0 };
    for (let t = 0; t < 5; t += SUBSTEP) stepSpin(spin, 0.4, SUBSTEP);
    expect(spin.angle).toBeCloseTo(0.4, 3);
  });
});

describe("ropePath", () => {
  it("starts at the anchor and ends at the last point", () => {
    const d = ropePath(createRope(config).pos);
    expect(d.startsWith("M 100.0 0.0")).toBe(true);
    expect(d.endsWith("L 100.0 162.0")).toBe(true);
    expect(d.match(/ Q /g)).toHaveLength(config.segments - 1);
  });
});
