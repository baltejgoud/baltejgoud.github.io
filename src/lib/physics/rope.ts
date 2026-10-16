export interface Vec {
  x: number;
  y: number;
}

export interface RopeConfig {
  anchor: Vec;
  segments: number;
  segmentLength: number;
  /** px/s² */
  gravity: number;
  /** Velocity kept per substep, e.g. 0.985 */
  damping: number;
  /** Constraint passes per substep */
  iterations: number;
  /** Weight of the end particle (the card) relative to the strap particles */
  endMass: number;
  /** How far the end may be pulled, as a multiple of the rope's rest length */
  maxStretch: number;
}

export interface Rope {
  config: RopeConfig;
  pos: Vec[];
  prev: Vec[];
  /** When set, the end particle is held at this point (the user is dragging) */
  pin: Vec | null;
}

export interface Spin {
  angle: number;
  velocity: number;
}

export const SUBSTEP = 1 / 120;

/** A rope hanging straight down from its anchor, at rest. */
export function createRope(config: RopeConfig): Rope {
  const pos = Array.from({ length: config.segments + 1 }, (_, i) => ({
    x: config.anchor.x,
    y: config.anchor.y + i * config.segmentLength,
  }));
  return { config, pos, prev: pos.map((p) => ({ ...p })), pin: null };
}

/** Move the anchor and carry every particle with it (used on resize). */
export function setAnchor(rope: Rope, anchor: Vec): void {
  const dx = anchor.x - rope.config.anchor.x;
  const dy = anchor.y - rope.config.anchor.y;
  rope.config = { ...rope.config, anchor };
  for (const list of [rope.pos, rope.prev]) {
    for (const p of list) {
      p.x += dx;
      p.y += dy;
    }
  }
}

/** Hold the end at `point` (clamped to the maximum reach), or release it with `null`. */
export function pinEnd(rope: Rope, point: Vec | null): void {
  if (!point) {
    rope.pin = null;
    return;
  }
  const { anchor, segments, segmentLength, maxStretch } = rope.config;
  const reach = segments * segmentLength * maxStretch;
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const d = Math.hypot(dx, dy);
  rope.pin = d > reach ? { x: anchor.x + (dx / d) * reach, y: anchor.y + (dy / d) * reach } : { ...point };
}

/** Give the end particle a velocity (px/s), e.g. on release or a key press. */
export function nudge(rope: Rope, velocity: Vec): void {
  const i = rope.pos.length - 1;
  rope.prev[i].x -= velocity.x * SUBSTEP;
  rope.prev[i].y -= velocity.y * SUBSTEP;
}

/** One Verlet substep followed by distance-constraint relaxation. Mutates the rope. */
export function stepRope(rope: Rope, dt: number = SUBSTEP): void {
  const { pos, prev, config } = rope;
  const last = pos.length - 1;
  pos[0].x = config.anchor.x;
  pos[0].y = config.anchor.y;
  prev[0].x = config.anchor.x;
  prev[0].y = config.anchor.y;

  for (let i = 1; i <= last; i++) {
    const p = pos[i];
    const q = prev[i];
    if (i === last && rope.pin) {
      p.x = q.x = rope.pin.x;
      p.y = q.y = rope.pin.y;
      continue;
    }
    const vx = (p.x - q.x) * config.damping;
    const vy = (p.y - q.y) * config.damping;
    q.x = p.x;
    q.y = p.y;
    p.x += vx;
    p.y += vy + config.gravity * dt * dt;
  }

  for (let k = 0; k < config.iterations; k++) {
    for (let i = 0; i < last; i++) {
      const a = pos[i];
      const b = pos[i + 1];
      const wa = i === 0 ? 0 : 1;
      const wb = i + 1 === last ? (rope.pin ? 0 : 1 / config.endMass) : 1;
      const sum = wa + wb;
      if (sum === 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const diff = (d - config.segmentLength) / d;
      a.x += dx * diff * (wa / sum);
      a.y += dy * diff * (wa / sum);
      b.x -= dx * diff * (wb / sum);
      b.y -= dy * diff * (wb / sum);
    }
  }
}

/** Advance by `elapsed` seconds in fixed substeps; returns the leftover time to carry into the next frame. */
export function simulate(rope: Rope, elapsed: number, carry = 0): number {
  let t = carry + Math.min(Math.max(elapsed, 0), 0.1);
  while (t >= SUBSTEP) {
    stepRope(rope, SUBSTEP);
    t -= SUBSTEP;
  }
  return t;
}

/** Sum of squared per-substep displacements — near zero when the rope is at rest. */
export function energy(rope: Rope): number {
  let e = 0;
  for (let i = 1; i < rope.pos.length; i++) {
    const dx = rope.pos[i].x - rope.prev[i].x;
    const dy = rope.pos[i].y - rope.prev[i].y;
    e += dx * dx + dy * dy;
  }
  return e;
}

/**
 * CSS rotation (radians, clockwise positive) that aligns a card hanging from
 * the end with the last segment. Negative when the end swings right.
 */
export function endAngle(rope: Rope): number {
  const n = rope.pos.length;
  const a = rope.pos[n - 2];
  const b = rope.pos[n - 1];
  return Math.atan2(a.x - b.x, b.y - a.y);
}

/** Damped angular spring toward `target` (semi-implicit Euler). Mutates `spin`. */
export function stepSpin(spin: Spin, target: number, dt: number, stiffness = 120, damping = 14): void {
  const accel = stiffness * (target - spin.angle) - damping * spin.velocity;
  spin.velocity += accel * dt;
  spin.angle += spin.velocity * dt;
}

/** Smooth SVG path through the rope's particles. */
export function ropePath(points: readonly Vec[]): string {
  if (points.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const n = points[i + 1];
    d += ` Q ${f(p.x)} ${f(p.y)} ${f((p.x + n.x) / 2)} ${f((p.y + n.y) / 2)}`;
  }
  const end = points[points.length - 1];
  return `${d} L ${f(end.x)} ${f(end.y)}`;
}
