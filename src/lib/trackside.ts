import route from "@/content/journey-route.json";
import { LIGHTS_OUT, clampJourney, easeJourney } from "./careerJourney";

export interface DriveFrame {
  distance: number;
  approach: number;
  overview: boolean;
  index: number;
  arrival: number;
  compact: boolean;
  dark: boolean;
}

export type Vec3 = [number, number, number];

/** One world unit is one metre. The lap is Spa's published 7.004 km. */
export const LAP = route.circuitLength;
/** Uniform centreline samples, about 2.5 m apart. */
export const SAMPLES = 2800;
export const STEP = LAP / SAMPLES;

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const wrap = (s: number) => ((s % LAP) + LAP) % LAP;
/** Signed distance along the lap from `b` to `a`, within half a lap. */
export const lapDelta = (a: number, b: number) => {
  const d = wrap(a - b);
  return d > LAP / 2 ? d - LAP : d;
};
const smoothLoop = (values: Float64Array, passes: number) => {
  const n = values.length;
  for (let pass = 0; pass < passes; pass++) {
    const copy = values.slice();
    for (let i = 0; i < n; i++)
      values[i] =
        (copy[(i + n - 1) % n] + 2 * copy[i] + copy[(i + 1) % n]) / 4;
  }
};

// ── Centreline ──────────────────────────────────────────────────────────────
// The map route samples a uniform Catmull-Rom curve, which forms small loops
// where the source's control points bunch up (one doubles back ~10 m near
// Malmedy). At true scale those would fold the road, so the 3D centreline is
// rebuilt through the same control points with a centripetal curve, which
// cannot loop.
const ROUTE_SAMPLES_PER_POINT = 8;
function centripetal(p: number[][], t: number) {
  const knots = [0];
  for (let i = 1; i < 4; i++)
    knots.push(
      knots[i - 1] +
        Math.sqrt(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])),
    );
  const [t0, t1, t2, t3] = knots;
  const u = t1 + (t2 - t1) * t;
  const lerp = (a: number[], b: number[], from: number, to: number) =>
    a.map((v, i) => (v * (to - u) + b[i] * (u - from)) / (to - from));
  const a1 = lerp(p[0], p[1], t0, t1),
    a2 = lerp(p[1], p[2], t1, t2),
    a3 = lerp(p[2], p[3], t2, t3);
  return lerp(lerp(a1, a2, t0, t2), lerp(a2, a3, t1, t3), t1, t2);
}
function buildCentreline() {
  const k = LAP / route.totalLength;
  const control: number[][] = [];
  for (let i = 0; i < route.points.length - 1; i += ROUTE_SAMPLES_PER_POINT) {
    const [x, y] = route.points[i];
    const point = [(x - route.width / 2) * k, (y - route.height / 2) * k];
    const last = control.at(-1);
    if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) > 0.5)
      control.push(point);
  }
  const line: number[][] = [];
  const n = control.length;
  for (let i = 0; i < n; i++) {
    const p = [-1, 0, 1, 2].map((o) => control[(i + o + n) % n]);
    for (let j = 0; j < 12; j++) line.push(centripetal(p, j / 12));
  }
  const lengths = [0];
  for (let i = 1; i <= line.length; i++) {
    const a = line[i - 1],
      b = line[i % line.length];
    lengths.push(lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const perimeter = lengths[line.length];
  const scale = LAP / perimeter;
  const x = new Float64Array(SAMPLES),
    z = new Float64Array(SAMPLES);
  let j = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const target = (i / SAMPLES) * perimeter;
    while (lengths[j + 1] < target) j++;
    const a = line[j],
      b = line[(j + 1) % line.length];
    const t = (target - lengths[j]) / (lengths[j + 1] - lengths[j] || 1);
    x[i] = (a[0] + (b[0] - a[0]) * t) * scale;
    z[i] = (a[1] + (b[1] - a[1]) * t) * scale;
  }
  smoothLoop(x, 4);
  smoothLoop(z, 4);
  return { x, z };
}

const { x: X, z: Z } = buildCentreline();
const TX = new Float64Array(SAMPLES),
  TZ = new Float64Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) {
  const a = (i + SAMPLES - 1) % SAMPLES,
    b = (i + 1) % SAMPLES;
  const dx = X[b] - X[a],
    dz = Z[b] - Z[a],
    length = Math.hypot(dx, dz);
  TX[i] = dx / length;
  TZ[i] = dz / length;
}
/** Signed curvature (1/m); positive turns right. The driver's right is (−tz, tx). */
const CURVE = new Float64Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) {
  const a = (i + SAMPLES - 1) % SAMPLES,
    b = (i + 1) % SAMPLES;
  CURVE[i] =
    ((TX[b] - TX[a]) * -TZ[i] + (TZ[b] - TZ[a]) * TX[i]) / (2 * STEP);
}
const BEND = CURVE.slice();
smoothLoop(BEND, 30);

// ── Elevation ───────────────────────────────────────────────────────────────
/**
 * Approximate Spa profile in metres above the lowest point. Built from published
 * figures (102.2 m overall; high point at Malmedy, low point near Paul Frère;
 * roughly 30 m from the Eau Rouge dip to the top of Raidillon). Not survey data.
 */
const PROFILE: [number, number][] = [
  [0, 34],
  [256, 37],
  [430, 31],
  [700, 22],
  [930, 18],
  [1160, 50],
  [1700, 76],
  [2250, 96],
  [2540, 102.2],
  [2950, 86],
  [3200, 75],
  [3650, 58],
  [4000, 41],
  [4400, 22],
  [4850, 0],
  [5100, 5],
  [5600, 17],
  [6050, 25],
  [6620, 30],
  [LAP, 34],
];
function monotoneProfile(keys: [number, number][]) {
  const xs = [keys.at(-2)![0] - LAP, ...keys.map(([s]) => s), keys[1][0] + LAP];
  const ys = [keys.at(-2)![1], ...keys.map(([, h]) => h), keys[1][1]];
  const n = xs.length,
    h: number[] = [],
    d: number[] = [],
    m = new Array<number>(n).fill(0);
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1] - xs[i]);
    d.push((ys[i + 1] - ys[i]) / h[i]);
  }
  for (let i = 1; i < n - 1; i++)
    if (d[i - 1] * d[i] > 0) {
      const w1 = 2 * h[i] + h[i - 1],
        w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  return (s: number) => {
    const x = wrap(s);
    let i = 1;
    while (xs[i + 1] < x) i++;
    const t = (x - xs[i]) / h[i],
      t2 = t * t,
      t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}
const profile = monotoneProfile(PROFILE);
const ELEVATION = new Float64Array(SAMPLES).map((_, i) => profile(i * STEP));

// ── Widths and the start straight ──────────────────────────────────────────
/** The pit straight, measured from the start line. */
export const PIT_STRAIGHT: [number, number] = [-330, 150];
const HALF_WIDTH = new Float64Array(SAMPLES).map((_, i) => {
  const s = lapDelta(i * STEP, 0);
  return (
    7 + smoothstep(-400, -330, s) * (1 - smoothstep(190, 250, s))
  );
});

// ── Racing line ─────────────────────────────────────────────────────────────
// Minimum-curvature line inside the track limits, solved on a 10 m lattice.
function buildRacingLine() {
  const every = 4,
    count = SAMPLES / every,
    offset = new Float64Array(count);
  const px = new Float64Array(count),
    pz = new Float64Array(count);
  const place = (j: number) => {
    const i = j * every;
    px[j] = X[i] - TZ[i] * offset[j];
    pz[j] = Z[i] + TX[i] * offset[j];
  };
  for (let j = 0; j < count; j++) place(j);
  for (let pass = 0; pass < 1400; pass++)
    for (let j = 0; j < count; j++) {
      const a = (j + count - 2) % count,
        b = (j + count - 1) % count,
        c = (j + 1) % count,
        d = (j + 2) % count,
        i = j * every;
      const tx = (4 * (px[b] + px[c]) - px[a] - px[d]) / 6,
        tz = (4 * (pz[b] + pz[c]) - pz[a] - pz[d]) / 6;
      const wanted = (tx - X[i]) * -TZ[i] + (tz - Z[i]) * TX[i];
      const limit = HALF_WIDTH[i] - 1.35;
      offset[j] = clamp(offset[j] + 1.5 * (wanted - offset[j]), -limit, limit);
      place(j);
    }
  const fine = new Float64Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const j = Math.floor(i / every),
      t = (i % every) / every;
    const p0 = offset[(j + count - 1) % count],
      p1 = offset[j],
      p2 = offset[(j + 1) % count],
      p3 = offset[(j + 2) % count];
    const limit = HALF_WIDTH[i] - 1.35;
    fine[i] = clamp(
      0.5 *
        (2 * p1 +
          (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t),
      -limit,
      limit,
    );
  }
  return fine;
}
const RACING = buildRacingLine();

// ── Run-off, kerbs and barriers ─────────────────────────────────────────────
/** Gravel run-off zones (illustrative): Raidillon, Rivage, Fagnes/Campus, Stavelot. */
const GRAVEL: [number, number][] = [
  [1010, 1210],
  [2860, 3080],
  [4300, 4620],
  [4780, 5150],
];
function buildLayout() {
  const runoff = [new Float64Array(SAMPLES), new Float64Array(SAMPLES)];
  const kerb = [new Uint8Array(SAMPLES), new Uint8Array(SAMPLES)];
  const gravel = [new Uint8Array(SAMPLES), new Uint8Array(SAMPLES)];
  const barrier = [new Float64Array(SAMPLES), new Float64Array(SAMPLES)];
  // Index 0 is the driver's left, 1 the right. A right-hand bend's outside is the left.
  const raw = [new Float64Array(SAMPLES), new Float64Array(SAMPLES)];
  for (let i = 0; i < SAMPLES; i++) {
    const width = clamp((Math.abs(BEND[i]) - 1 / 900) * 9000, 0, 26);
    raw[BEND[i] > 0 ? 0 : 1][i] = width;
  }
  for (let side = 0; side < 2; side++) {
    // Run-off grows after a corner more than before it.
    for (let i = 0; i < SAMPLES; i++) {
      let most = 0;
      for (let j = -26; j <= 8; j++)
        most = Math.max(most, raw[side][(i + j + SAMPLES) % SAMPLES]);
      runoff[side][i] = most;
    }
    smoothLoop(runoff[side], 12);
  }
  for (let i = 0; i < SAMPLES; i++) {
    const s = i * STEP,
      straight = lapDelta(s, 0);
    const inGravel = GRAVEL.some(([a, b]) => s >= a && s <= b);
    for (let side = 0; side < 2; side++) {
      const toward = side === 1 ? BEND[i] : -BEND[i];
      const inside = toward > 0;
      let near = false;
      for (let j = -6; j <= 6 && !near; j++) {
        const b = BEND[(i + j + SAMPLES) % SAMPLES] * (side === 1 ? 1 : -1);
        near = b > 1 / 420 || b < -1 / 150;
      }
      kerb[side][i] = near ? 1 : 0;
      gravel[side][i] = inGravel && runoff[side][i] > 4 ? 1 : 0;
      let wall = HALF_WIDTH[i] + 1.3 + Math.max(7, runoff[side][i] + 3);
      if (inside) wall = Math.min(wall, Math.max(HALF_WIDTH[i] + 3, 0.8 / toward));
      if (side === 1) {
        const pits =
          smoothstep(PIT_STRAIGHT[0] - 60, PIT_STRAIGHT[0], straight) *
          (1 - smoothstep(PIT_STRAIGHT[1], PIT_STRAIGHT[1] + 60, straight));
        wall = wall + (HALF_WIDTH[i] + 1.6 - wall) * pits;
        if (pits > 0.98) runoff[side][i] = 0;
      }
      barrier[side][i] = wall;
    }
  }
  return { runoff, kerb, gravel, barrier };
}
const LAYOUT = buildLayout();

/** Typed per-sample arrays for building the scenery. Index 0 is left, 1 right. */
export const trackModel = {
  samples: SAMPLES,
  step: STEP,
  x: X,
  z: Z,
  y: ELEVATION,
  tx: TX,
  tz: TZ,
  bend: BEND,
  halfWidth: HALF_WIDTH,
  racing: RACING,
  ...LAYOUT,
};

const sample = (values: ArrayLike<number>, s: number) => {
  const f = wrap(s) / STEP,
    i = Math.floor(f) % SAMPLES,
    t = f - Math.floor(f);
  return values[i] * (1 - t) + values[(i + 1) % SAMPLES] * t;
};
export const elevationAt = (s: number) => sample(ELEVATION, s);
export const halfWidthAt = (s: number) => sample(HALF_WIDTH, s);
export const barrierAt = (s: number, side: 0 | 1) =>
  sample(LAYOUT.barrier[side], s);
/** Centre point and unit direction of travel at lap distance `s` (metres). */
export function frameAt(s: number) {
  const x = sample(X, s),
    z = sample(Z, s);
  let tx = sample(TX, s),
    tz = sample(TZ, s);
  const length = Math.hypot(tx, tz) || 1;
  tx /= length;
  tz /= length;
  return { x, z, y: elevationAt(s), tx, tz, rx: -tz, rz: tx };
}
/** A point `lateral` metres right of the centreline, on the road surface. */
export function lateralPoint(s: number, lateral: number): Vec3 {
  const f = frameAt(s);
  return [f.x + f.rx * lateral, f.y, f.z + f.rz * lateral];
}

// ── Grid, start lights and the car ──────────────────────────────────────────
/** Car centre on pole. Its front wing sits just behind the start line. */
export const POLE_S = -4.6;
/** F1 grid slots are 8 m apart, alternating sides. Pole takes the inside for La Source. */
export const GRID_SLOTS = 22;
export const GRID_SPACING = 8;
export const GRID_LATERAL = 3.4;
export const gridSlot = (n: number) => ({
  s: POLE_S - n * GRID_SPACING,
  lateral: (n % 2 === 0 ? 1 : -1) * GRID_LATERAL,
});
const carLateral = (s: number) => {
  const w = smoothstep(4, 170, Math.abs(lapDelta(s, POLE_S)));
  return GRID_LATERAL * (1 - w) + sample(RACING, s) * w;
};
/** A point on the car's line: the grid slot, blending into the racing line. */
export const carLine = (s: number) => lateralPoint(s, carLateral(s));

export function carPose(distance: number) {
  const s = clampJourney(distance) * LAP + POLE_S;
  const position = carLine(s),
    back = carLine(s - 2),
    front = carLine(s + 2);
  const heading = Math.atan2(front[0] - back[0], front[2] - back[2]);
  const pitch = -Math.atan2(
    front[1] - back[1],
    Math.hypot(front[0] - back[0], front[2] - back[2]),
  );
  const before = carLine(s - 6),
    after = carLine(s + 6);
  let turn =
    Math.atan2(after[0] - position[0], after[2] - position[2]) -
    Math.atan2(position[0] - before[0], position[2] - before[2]);
  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  // Bicycle model: 3.6 m wheelbase over the 6 m it took to turn.
  const steer = clamp(Math.atan((3.6 * turn) / 6), -0.42, 0.42);
  return { s, position, heading, pitch, steer };
}

/** How many of the five start lights are lit, 0 once they go out. */
export function startLights(
  frame: Pick<DriveFrame, "approach" | "overview" | "index">,
) {
  if (frame.overview || frame.index > 0) return 0;
  const t = frame.approach;
  if (t >= LIGHTS_OUT || t < 0.18) return 0;
  return Math.min(5, 1 + Math.floor((t - 0.18) / 0.06));
}

// ── Checkpoint screens ──────────────────────────────────────────────────────
export const BOARD = { width: 9, height: 4.6, clearance: 3.6 };
/**
 * Where the stop shots are taken from: ahead of the car and to its left, in
 * the car's own frame so a corner can't swing the camera off the circuit.
 * Phones pull further back along the same line, so both views share an angle.
 */
function stopCameras(index: number) {
  const car = carPose(route.stops[index]);
  const sin = Math.sin(car.heading),
    cos = Math.cos(car.heading);
  const at = (ahead: number, left: number, up: number): Vec3 => [
    car.position[0] + sin * ahead + cos * left,
    Math.max(car.position[1], elevationAt(car.s + ahead)) + up,
    car.position[2] + cos * ahead - sin * left,
  ];
  return { car, desktop: at(34, 10, 5), phone: at(62, 22, 17) };
}

/** Trackside screen for a checkpoint, on a truss at the driver's right just past the car. */
export function checkpointBoard(index: number) {
  const last = index === route.stops.length - 1;
  const { car, desktop } = stopCameras(index);
  const s = car.s + (last ? 12 : 16);
  const f = frameAt(s);
  const edge = halfWidthAt(s);
  // The last screen hangs on the pit wall; the rest stand in the verge.
  const lateral = last
    ? edge + 1.9
    : Math.max(edge + 2.5, Math.min(edge + 7.5, barrierAt(s, 1) - 1));
  const base: Vec3 = [f.x + f.rx * lateral, f.y, f.z + f.rz * lateral];
  // Face the stop cameras.
  const centre = BOARD.clearance + BOARD.height / 2;
  return {
    base,
    yaw: Math.atan2(desktop[0] - base[0], desktop[2] - base[2]),
    anchor: [base[0], base[1] + centre, base[2]] as Vec3,
  };
}

// ── Camera ──────────────────────────────────────────────────────────────────
export interface Shot {
  position: Vec3;
  target: Vec3;
  fov: number;
  /** Where the target sits on screen, as fractions of width and height. */
  screen: [number, number];
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
const blend = (a: Shot, b: Shot, t: number): Shot => ({
  position: mix3(a.position, b.position, t),
  target: mix3(a.target, b.target, t),
  fov: mix(a.fov, b.fov, t),
  screen: [mix(a.screen[0], b.screen[0], t), mix(a.screen[1], b.screen[1], t)],
});
/** A drone move: distance changes geometrically so the descent feels even. */
function swoop(from: Shot, to: Shot, t: number): Shot {
  const target = mix3(from.target, to.target, 1 - (1 - t) ** 2.4);
  const a = from.position.map((v, i) => v - from.target[i]) as Vec3,
    b = to.position.map((v, i) => v - to.target[i]) as Vec3;
  const la = Math.hypot(...a),
    lb = Math.hypot(...b);
  // Stay steep (a drone drop) until late, so the descent clears the treetops.
  const direction = mix3(
    a.map((v) => v / la) as Vec3,
    b.map((v) => v / lb) as Vec3,
    t ** 3,
  );
  const length = (la * (lb / la) ** t) / Math.hypot(...direction);
  return {
    ...blend(from, to, t),
    target,
    position: target.map((v, i) => v + direction[i] * length) as Vec3,
  };
}
const overviewShot = (compact: boolean): Shot =>
  compact
    ? {
        position: [260, 3950, 2950],
        target: [0, 40, 60],
        fov: 50,
        screen: [0.5, 0.43],
      }
    : {
        position: [260, 1650, 1750],
        target: [-60, 40, 20],
        fov: 40,
        screen: [0.6, 0.5],
      };
function chaseShot(distance: number, compact: boolean): Shot {
  const { s } = carPose(distance);
  const rail = carLine(s - (compact ? 17 : 10));
  const ahead = carLine(s + 8);
  return {
    position: [rail[0], rail[1] + (compact ? 6.5 : 3), rail[2]],
    target: [ahead[0], ahead[1] + 1, ahead[2]],
    fov: compact ? 52 : 40,
    screen: compact ? [0.5, 0.32] : [0.56, 0.5],
  };
}
/** The stop shot: the screen left of centre (the story opens beside it), the car right. */
function showcaseShot(index: number, compact: boolean): Shot {
  const { car, desktop, phone } = stopCameras(index);
  const { anchor } = checkpointBoard(index);
  const target: Vec3 = [
    mix(car.position[0], anchor[0], 0.5),
    mix(car.position[1] + 1, anchor[1], 0.4),
    mix(car.position[2], anchor[2], 0.5),
  ];
  return compact
    ? { position: phone, target, fov: 54, screen: [0.52, 0.27] }
    : { position: desktop, target, fov: 40, screen: [0.55, 0.47] };
}
/** The camera dives from the overview while the car waits on the grid. */
export const DIVE_END = 0.32;

type CarPose = ReturnType<typeof carPose>;
/** A shot expressed in a car's own frame: metres ahead, up and to its left. */
const toCarFrame = (car: CarPose, p: Vec3): Vec3 => {
  const dx = p[0] - car.position[0],
    dz = p[2] - car.position[2];
  const sin = Math.sin(car.heading),
    cos = Math.cos(car.heading);
  return [dx * sin + dz * cos, p[1] - car.position[1], dx * cos - dz * sin];
};
const fromCarFrame = (car: CarPose, [ahead, up, left]: Vec3): Vec3 => {
  const sin = Math.sin(car.heading),
    cos = Math.cos(car.heading);
  return [
    car.position[0] + sin * ahead + cos * left,
    car.position[1] + up,
    car.position[2] + cos * ahead - sin * left,
  ];
};
/**
 * Swing from the chase to a stop shot by orbiting the car: the stop shot is
 * carried along with the car in its own frame, and the camera's bearing, range
 * and height round the car are interpolated, so the car never leaves the frame.
 */
function orbit(car: CarPose, chase: Shot, stop: Shot, stopCar: CarPose, t: number): Shot {
  const a = toCarFrame(car, chase.position),
    b = toCarFrame(stopCar, stop.position);
  const from = Math.atan2(a[2], a[0]),
    to = Math.atan2(b[2], b[0]);
  const turn = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const bearing = from + turn * t,
    range = mix(Math.hypot(a[0], a[2]), Math.hypot(b[0], b[2]), t);
  const ahead = Math.cos(bearing) * range;
  const position = fromCarFrame(car, [
    ahead,
    mix(a[1], b[1], t),
    Math.sin(bearing) * range,
  ]);
  // Never dip below the road ahead (Raidillon climbs steeply).
  position[1] = Math.max(position[1], elevationAt(car.s + ahead) + 2);
  return {
    position,
    target: mix3(chase.target, fromCarFrame(car, toCarFrame(stopCar, stop.target)), t),
    fov: mix(chase.fov, stop.fov, t),
    screen: [
      mix(chase.screen[0], stop.screen[0], t),
      mix(chase.screen[1], stop.screen[1], t),
    ],
  };
}

export function tracksidePose(
  frame: Pick<DriveFrame, "distance" | "approach" | "overview" | "compact"> &
    Partial<Pick<DriveFrame, "index">>,
) {
  const car = carPose(frame.distance);
  const compact = frame.compact;
  if (frame.overview) return { car, ...overviewShot(compact) };
  const index = frame.index ?? 0;
  const from = index > 0 ? route.stops[index - 1] : 0,
    to = route.stops[index];
  // The camera swings to the stop shot over the last stretch of each leg, and
  // back to the chase over the first stretch of the next.
  const leg = (to - from) * LAP;
  const arriving =
    1 - smoothstep(0, Math.min(220, leg / 2), (to - frame.distance) * LAP);
  const leaving =
    index > 0
      ? 1 - smoothstep(0, Math.min(150, leg / 2), (frame.distance - from) * LAP)
      : 0;
  let shot = chaseShot(frame.distance, compact);
  const weight = easeJourney(Math.max(arriving, leaving));
  if (weight > 0) {
    const stop = arriving >= leaving ? index : index - 1;
    shot = orbit(
      car,
      shot,
      showcaseShot(stop, compact),
      carPose(route.stops[stop]),
      weight,
    );
  }
  const dive = clampJourney(frame.approach / DIVE_END);
  if (dive < 1) shot = swoop(overviewShot(compact), shot, easeJourney(dive));
  return { car, ...shot };
}
