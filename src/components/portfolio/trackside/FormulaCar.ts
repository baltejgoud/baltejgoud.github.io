import * as T from "three";
import { Batch } from "./builder";
import { canvasTexture } from "./textures";

/**
 * An original open-wheel racer at real scale (metres): 5.6 m long, 2 m wide,
 * 3.6 m wheelbase, 18-inch wheels. Local +Z is the nose, +Y is up and the
 * origin sits on the ground midway between the axles. Red Bull-style livery
 * as a stylised tribute, not a model-year replica.
 */
export const WHEEL_RADIUS = 0.36;

/** [z, centre x, half width, bottom y, top y, squareness, undercut] */
type Ring = [number, number, number, number, number, number?, number?];

function loft(rings: Ring[], segments = 32) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const first = rings[0][0],
    span = rings[0][0] - rings[rings.length - 1][0];
  const point = ([, cx, hw, yb, yt, e = 2.6, under = 0]: Ring, j: number) => {
    const a = -Math.PI / 2 + (j / segments) * Math.PI * 2;
    const c = Math.cos(a),
      s = Math.sin(a);
    const pow = 2 / e;
    const squeeze = s < 0 ? 1 - under * Math.abs(s) : 1;
    return [
      cx + hw * Math.sign(c) * Math.abs(c) ** pow * squeeze,
      (yb + yt) / 2 + ((yt - yb) / 2) * Math.sign(s) * Math.abs(s) ** pow,
    ];
  };
  rings.forEach((ring) => {
    for (let j = 0; j <= segments; j++) {
      const [x, y] = point(ring, j);
      positions.push(x, y, ring[0]);
      uvs.push((first - ring[0]) / span, j / segments);
    }
  });
  const stride = segments + 1;
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < segments; j++) {
      const a = k * stride + j,
        b = a + 1,
        c = a + stride,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  // Flat caps at both ends.
  for (const [k, front] of [
    [0, true],
    [rings.length - 1, false],
  ] as [number, boolean][]) {
    const ring = rings[k];
    const centre = positions.length / 3;
    positions.push(ring[1], (ring[3] + ring[4]) / 2, ring[0]);
    uvs.push((first - ring[0]) / span, 0.5);
    const start = positions.length / 3;
    for (let j = 0; j <= segments; j++) {
      const [x, y] = point(ring, j);
      positions.push(x, y, ring[0]);
      uvs.push((first - ring[0]) / span, j / segments);
    }
    for (let j = 0; j < segments; j++)
      if (front) indices.push(centre, start + j, start + j + 1);
      else indices.push(centre, start + j + 1, start + j);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A thin rod between two points. */
function strut(a: number[], b: number[], radius: number) {
  const from = new T.Vector3(...a),
    to = new T.Vector3(...b);
  const length = from.distanceTo(to);
  const g = new T.CylinderGeometry(radius, radius, length, 6);
  g.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      to.clone().sub(from).normalize(),
    ),
  );
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}

/** A wing element swept across the car as short angled segments. */
function wing(
  span: number,
  chord: number,
  thickness: number,
  y: (x: number) => number,
  z: (x: number) => number,
  pitch: number,
  segments = 14,
) {
  const parts: T.BufferGeometry[] = [];
  for (let i = 0; i < segments; i++) {
    const x0 = -span + (2 * span * i) / segments,
      x1 = -span + (2 * span * (i + 1)) / segments;
    const xm = (x0 + x1) / 2,
      w = x1 - x0;
    const g = new T.BoxGeometry(w * 1.04, thickness, chord);
    const roll = Math.atan2(y(x1) - y(x0), w),
      yaw = -Math.atan2(z(x1) - z(x0), w);
    g.applyMatrix4(
      new T.Matrix4().makeRotationFromEuler(new T.Euler(pitch, yaw, roll, "YZX")),
    );
    g.translate(xm, y(xm), z(xm));
    parts.push(g);
  }
  return parts;
}

/** A flat plate in the car's z/y plane (endplates, fins), `thickness` across x. */
function plate(points: [number, number][], thickness: number, x: number) {
  const shape = new T.Shape(points.map(([z, y]) => new T.Vector2(z, y)));
  const g = new T.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  // Shape x → world z, shape y → world y, extrusion → world −x.
  g.rotateY(-Math.PI / 2);
  g.translate(x + thickness / 2, 0, 0);
  return g;
}

// ── Livery ──────────────────────────────────────────────────────────────────
const NAVY = "#14213f";
const RED = "#d8202e";
const YELLOW = "#ffc906";
function bull(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flip: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -size : size, size);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(-1, 0.25);
  ctx.lineTo(-0.55, -0.25);
  ctx.lineTo(-0.1, -0.15);
  ctx.lineTo(0.25, -0.45);
  ctx.lineTo(0.95, -0.25);
  ctx.lineTo(0.62, 0.02);
  ctx.lineTo(1, 0.35);
  ctx.lineTo(0.42, 0.25);
  ctx.lineTo(0.05, 0.62);
  ctx.lineTo(-0.1, 0.25);
  ctx.lineTo(-0.6, 0.55);
  ctx.lineTo(-0.52, 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
/** The sun disc between two charging bulls, with the wordmark. */
function emblem(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, words = true) {
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.08, h * 0.32, 0, Math.PI * 2);
  ctx.fill();
  bull(ctx, x - h * 0.42, y, h * 0.36, false);
  bull(ctx, x + h * 0.42, y, h * 0.36, true);
  if (words) {
    ctx.fillStyle = RED;
    ctx.font = `italic 900 ${h * 0.42}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Red Bull", x, y + h * 0.62);
  }
}
/**
 * Paints a loft texture. `u` runs nose → tail, `v` round the section from the
 * bottom: the left face is v = 0.25, the top 0.5, the right face 0.75.
 */
function livery(
  length: number,
  girth: number,
  side: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  top?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const w = 1024,
    h = Math.round((1024 * girth) / length / 4) * 4;
  return canvasTexture(
    w,
    h,
    (ctx) => {
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, 0, w, h);
      // Left face (v = 0.25 → canvas y = 0.75h), drawn upright reading nose → tail.
      ctx.save();
      ctx.translate(0, h * 0.75);
      side(ctx, w, h);
      ctx.restore();
      // Right face (v = 0.75): the same artwork rotated half a turn.
      ctx.save();
      ctx.translate(w, h * 0.25);
      ctx.rotate(Math.PI);
      side(ctx, w, h);
      ctx.restore();
      if (top) {
        ctx.save();
        ctx.translate(0, h * 0.5);
        top(ctx, w, h);
        ctx.restore();
      }
    },
    { repeat: false },
  );
}

export function createFormulaCar() {
  const car = new T.Group();
  car.rotation.order = "YXZ";
  const body = new T.Group();
  car.add(body);
  const batch = new Batch();
  const paint = (map?: T.Texture) =>
    new T.MeshPhysicalMaterial({
      color: map ? 0xffffff : NAVY,
      map,
      roughness: 0.42,
      metalness: 0.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
    });
  const navy = paint();
  const carbon = new T.MeshPhysicalMaterial({
    color: 0x111317,
    roughness: 0.42,
    metalness: 0.3,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.6,
  });
  const floorMaterial = new T.MeshStandardMaterial({
    color: 0x0c0d10,
    roughness: 0.75,
    envMapIntensity: 0.4,
  });
  const yellow = new T.MeshPhysicalMaterial({ color: YELLOW, roughness: 0.4, clearcoat: 0.4 });
  const black = new T.MeshStandardMaterial({ color: 0x050608, roughness: 0.7 });
  const rubber = new T.MeshStandardMaterial({
    color: 0x1b1c1f,
    roughness: 0.88,
    side: T.DoubleSide,
  });
  const rim = new T.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.85, roughness: 0.3 });
  const titanium = new T.MeshStandardMaterial({ color: 0x8b9097, metalness: 0.9, roughness: 0.25 });

  // ── Survival cell and nose ──────────────────────────────────────────────
  const chassisMap = livery(
    3.3,
    1.6,
    (ctx, w, h) => {
      ctx.fillStyle = RED;
      ctx.fillRect(0, -h * 0.06, w * 0.035, h * 0.12);
      ctx.fillStyle = YELLOW;
      ctx.fillRect(0, -h * 0.1, w * 0.02, h * 0.2);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${h * 0.07}px Arial, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("ORACLE", w * 0.6, -h * 0.02);
      emblem(ctx, w * 0.27, -h * 0.02, h * 0.13, false);
    },
    (ctx, w, h) => {
      ctx.fillStyle = YELLOW;
      ctx.fillRect(0, -h * 0.12, w * 0.03, h * 0.24);
      ctx.fillStyle = RED;
      ctx.fillRect(w * 0.03, -h * 0.02, w * 0.4, h * 0.04);
    },
  );
  batch.add(
    paint(chassisMap),
    loft([
      [2.8, 0, 0.06, 0.21, 0.29, 2.4],
      [2.52, 0, 0.1, 0.18, 0.36, 2.6],
      [2.1, 0, 0.16, 0.16, 0.46, 3],
      [1.7, 0, 0.21, 0.14, 0.55, 3.2],
      [1.2, 0, 0.26, 0.11, 0.63, 3.6],
      [0.8, 0, 0.3, 0.09, 0.69, 4],
      [0.3, 0, 0.34, 0.08, 0.67, 4],
      [-0.2, 0, 0.35, 0.08, 0.69, 4],
      [-0.5, 0, 0.3, 0.1, 0.62, 3.6],
    ]),
  );
  // Cockpit opening, driver and the halo.
  const opening = new T.SphereGeometry(1, 24, 12);
  opening.scale(0.25, 0.07, 0.5).translate(0, 0.665, 0.38);
  batch.add(black, opening);
  const helmetMaterial = new T.MeshPhysicalMaterial({ color: NAVY, roughness: 0.2, clearcoat: 1 });
  batch.add(helmetMaterial, new T.SphereGeometry(0.135, 24, 16).translate(0, 0.79, 0.29));
  batch.add(yellow, new T.TorusGeometry(0.128, 0.018, 8, 24).rotateY(Math.PI / 2).translate(0, 0.8, 0.29));
  const visor = new T.SphereGeometry(0.138, 24, 8, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.36, Math.PI * 0.18);
  batch.add(black, visor.translate(0, 0.79, 0.29));
  const halo = new T.CatmullRomCurve3(
    [
      [0.3, 0.66, -0.05],
      [0.28, 0.85, 0.12],
      [0.26, 0.9, 0.4],
      [0.17, 0.91, 0.62],
      [0, 0.915, 0.72],
      [-0.17, 0.91, 0.62],
      [-0.26, 0.9, 0.4],
      [-0.28, 0.85, 0.12],
      [-0.3, 0.66, -0.05],
    ].map((p) => new T.Vector3(...p)),
  );
  batch.add(navy, new T.TubeGeometry(halo, 40, 0.026, 8, false));
  batch.add(navy, strut([0, 0.68, 0.96], [0, 0.915, 0.71], 0.03));

  // ── Engine cover, airbox and shark fin ──────────────────────────────────
  const engineMap = livery(
    2.2,
    1.5,
    (ctx, w, h) => emblem(ctx, w * 0.45, -h * 0.04, h * 0.2),
    (ctx, w, h) => {
      ctx.fillStyle = YELLOW;
      ctx.fillRect(w * 0.08, -h * 0.03, w * 0.5, h * 0.06);
    },
  );
  batch.add(
    paint(engineMap),
    loft([
      [-0.02, 0, 0.17, 0.62, 0.97, 2.4],
      [-0.3, 0, 0.24, 0.5, 0.96, 2.6],
      [-0.8, 0, 0.27, 0.36, 0.85, 3],
      [-1.3, 0, 0.23, 0.3, 0.72, 3],
      [-1.8, 0, 0.15, 0.28, 0.58, 2.6],
      [-2.2, 0, 0.08, 0.3, 0.46, 2.2],
    ]),
  );
  batch.add(black, new T.BoxGeometry(0.17, 0.15, 0.05).translate(0, 0.86, -0.02));
  batch.add(yellow, new T.BoxGeometry(0.09, 0.05, 0.08).translate(0, 0.995, -0.08));
  batch.add(
    navy,
    plate(
      [
        [-0.35, 0.94],
        [-1.9, 0.86],
        [-2.15, 0.56],
        [-1.6, 0.6],
        [-0.6, 0.86],
      ],
      0.014,
      0,
    ),
  );

  // ── Sidepods with undercut, inlets and the floor ────────────────────────
  const podMap = livery(2.2, 1.3, (ctx, w, h) => {
    emblem(ctx, w * 0.42, -h * 0.02, h * 0.3);
    ctx.fillStyle = RED;
    ctx.fillRect(w * 0.82, -h * 0.2, w * 0.18, h * 0.04);
  });
  const podMaterial = paint(podMap);
  for (const side of [-1, 1]) {
    batch.add(
      podMaterial,
      loft(
        [
          [0.62, side * 0.52, 0.2, 0.18, 0.58, 3.2, 0.3],
          [0.25, side * 0.56, 0.24, 0.13, 0.62, 3.2, 0.45],
          [-0.35, side * 0.53, 0.23, 0.1, 0.58, 3, 0.5],
          [-1.0, side * 0.43, 0.18, 0.1, 0.45, 2.8, 0.5],
          [-1.6, side * 0.3, 0.1, 0.1, 0.28, 2.4, 0.4],
        ],
        28,
      ),
    );
    batch.add(black, new T.BoxGeometry(0.34, 0.32, 0.03).translate(side * 0.53, 0.4, 0.635));
    // Mirrors on stalks.
    batch.add(navy, new T.BoxGeometry(0.17, 0.075, 0.05).translate(side * 0.47, 0.73, 0.64));
    batch.add(carbon, strut([side * 0.3, 0.62, 0.62], [side * 0.42, 0.73, 0.64], 0.012));
  }
  const floorShape = new T.Shape(
    [
      [0, 1.4],
      [0.42, 1.38],
      [0.85, 0.9],
      [0.86, -1.25],
      [0.6, -1.95],
      [-0.6, -1.95],
      [-0.86, -1.25],
      [-0.85, 0.9],
      [-0.42, 1.38],
    ].map(([x, z]) => new T.Vector2(x, z)),
  );
  const floor = new T.ExtrudeGeometry(floorShape, { depth: 0.035, bevelEnabled: false });
  floor.rotateX(Math.PI / 2).translate(0, 0.085, 0);
  batch.add(floorMaterial, floor);
  batch.add(
    floorMaterial,
    new T.PlaneGeometry(1.1, 0.8)
      .rotateX(-Math.PI / 2 + 0.36)
      .translate(0, 0.19, -2.3),
  );
  for (const x of [-0.42, -0.14, 0.14, 0.42])
    batch.add(floorMaterial, plate([[-1.95, 0.07], [-2.5, 0.07], [-2.48, 0.27]], 0.012, x));

  // ── Front wing: four elements, swept and raised outboard ────────────────
  const outboard = (x: number) => Math.max(0, (Math.abs(x) - 0.3) / 0.65);
  for (let k = 0; k < 4; k++) {
    const parts = wing(
      0.93 - k * 0.02,
      k === 0 ? 0.3 : 0.15,
      0.022,
      (x) => 0.1 + k * 0.045 + outboard(x) ** 1.6 * (0.03 + k * 0.05),
      (x) => 2.73 - k * 0.15 - outboard(x) * 0.08 * k,
      0.08 + k * 0.22,
    );
    parts.forEach((g) => batch.add(k === 2 ? navy : carbon, g));
  }
  for (const side of [-1, 1]) {
    batch.add(
      carbon,
      plate(
        [
          [2.95, 0.05],
          [2.36, 0.05],
          [2.3, 0.33],
          [2.62, 0.36],
          [2.95, 0.16],
        ],
        0.016,
        side * 0.94,
      ),
    );
    batch.add(yellow, new T.BoxGeometry(0.02, 0.035, 0.5).translate(side * 0.945, 0.3, 2.6));
  }

  // ── Rear wing: endplates, main plane, DRS flap and beam wing ────────────
  const tips = (x: number) => (x / 0.5) ** 4 * 0.06;
  wing(0.5, 0.3, 0.025, (x) => 0.78 + tips(x), () => -2.42, 0.22).forEach((g) =>
    batch.add(carbon, g),
  );
  wing(0.5, 0.2, 0.02, (x) => 0.9 + tips(x), () => -2.6, 0.62).forEach((g) =>
    batch.add(navy, g),
  );
  wing(0.44, 0.12, 0.02, () => 0.42, () => -2.3, 0.3).forEach((g) => batch.add(carbon, g));
  const endplateMap = canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = RED;
      ctx.font = "italic 900 46px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Red Bull", w / 2, h * 0.42);
      ctx.fillStyle = YELLOW;
      ctx.fillRect(20, h * 0.72, w - 40, 8);
    },
    { repeat: false },
  );
  const endplate = paint(endplateMap);
  for (const side of [-1, 1]) {
    batch.add(
      navy,
      plate(
        [
          [-2.16, 0.46],
          [-2.66, 0.46],
          [-2.7, 0.9],
          [-2.5, 0.99],
          [-2.2, 0.88],
        ],
        0.018,
        side * 0.5,
      ),
    );
    const decal = new T.PlaneGeometry(0.42, 0.21);
    decal.rotateY((side * Math.PI) / 2).translate(side * 0.511, 0.72, -2.43);
    batch.add(endplate, decal);
  }
  batch.add(carbon, new T.BoxGeometry(0.03, 0.42, 0.24).translate(0.07, 0.62, -2.35));
  batch.add(carbon, new T.BoxGeometry(0.03, 0.42, 0.24).translate(-0.07, 0.62, -2.35));
  batch.add(carbon, new T.BoxGeometry(0.14, 0.13, 0.42).translate(0, 0.36, -2.2));
  const rainLight = new T.MeshStandardMaterial({
    color: 0x330000,
    emissive: 0xff1a24,
    emissiveIntensity: 3,
  });
  batch.add(rainLight, new T.BoxGeometry(0.12, 0.05, 0.02).translate(0, 0.36, -2.42));

  // ── Suspension ───────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    for (const [z, inner] of [
      [1.8, 0.2],
      [-1.8, 0.24],
    ]) {
      const front = z > 0;
      const hub = side * (front ? 0.66 : 0.62);
      batch.add(carbon, strut([side * inner, 0.5, z + 0.32], [hub, 0.5, z], 0.018));
      batch.add(carbon, strut([side * inner, 0.48, z - 0.3], [hub, 0.5, z], 0.018));
      batch.add(carbon, strut([side * inner, 0.2, z + 0.34], [hub, 0.2, z], 0.018));
      batch.add(carbon, strut([side * inner, 0.2, z - 0.32], [hub, 0.2, z], 0.018));
      batch.add(carbon, strut([side * inner, front ? 0.56 : 0.18, z + 0.12], [hub, front ? 0.22 : 0.48, z - 0.04], 0.016));
      batch.add(titanium, new T.BoxGeometry(0.08, 0.36, 0.12).translate(hub + side * 0.02, 0.36, z));
    }
  }
  batch.build(body, true, true);

  // ── Wheels: steer → spin → tyre, rim and cover ──────────────────────────
  const coverMap = canvasTexture(
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#121418";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(64, 64, 46, -0.4, 1.4);
      ctx.stroke();
      ctx.strokeStyle = RED;
      ctx.beginPath();
      ctx.arc(64, 64, 46, 2.7, 4.3);
      ctx.stroke();
      ctx.fillStyle = "#3b4048";
      ctx.beginPath();
      ctx.arc(64, 64, 12, 0, Math.PI * 2);
      ctx.fill();
    },
    { repeat: false },
  );
  const cover = new T.MeshStandardMaterial({ map: coverMap, metalness: 0.5, roughness: 0.4 });
  const stripe = new T.MeshStandardMaterial({ color: 0xe0242e, roughness: 0.6 });
  const wheels: { steer: T.Group; spin: T.Group; front: boolean }[] = [];
  for (const front of [true, false])
    for (const side of [-1, 1]) {
      const width = front ? 0.3 : 0.4;
      const steer = new T.Group();
      steer.position.set(side * (front ? 0.81 : 0.79), WHEEL_RADIUS, front ? 1.8 : -1.8);
      const spin = new T.Group();
      steer.add(spin);
      car.add(steer);
      const profile = [
        [0.232, -width / 2],
        [0.3, -width / 2 - 0.006],
        [0.344, -width / 2 + 0.012],
        [WHEEL_RADIUS, -width / 2 + 0.045],
        [WHEEL_RADIUS, width / 2 - 0.045],
        [0.344, width / 2 - 0.012],
        [0.3, width / 2 + 0.006],
        [0.232, width / 2],
      ].map(([r, y]) => new T.Vector2(r, y));
      const parts: [T.BufferGeometry, T.Material][] = [
        [new T.LatheGeometry(profile, 40), rubber],
        [new T.CylinderGeometry(0.229, 0.229, width - 0.03, 32, 1, true), rim],
      ];
      for (const face of [-1, 1]) {
        parts.push([
          new T.RingGeometry(0.29, 0.305, 40).rotateY((face * Math.PI) / 2).translate(0, 0, 0),
          stripe,
        ]);
        parts[parts.length - 1][0].translate(face * (width / 2 + 0.008), 0, 0);
        parts.push([
          new T.CircleGeometry(0.226, 32).rotateY((face * Math.PI) / 2).translate(face * (width / 2 - 0.02), 0, 0),
          cover,
        ]);
      }
      for (const [geometry, material] of parts) {
        if (material === rubber || material === rim) geometry.rotateZ(Math.PI / 2);
        const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        spin.add(mesh);
      }
      wheels.push({ steer, spin, front });
    }
  return {
    group: car,
    /** Roll the wheels `metres` along and steer the fronts by `angle` radians. */
    update(metres: number, angle: number) {
      for (const wheel of wheels) {
        wheel.spin.rotation.x = metres / WHEEL_RADIUS;
        wheel.steer.rotation.y = wheel.front ? angle : 0;
      }
    },
  };
}
