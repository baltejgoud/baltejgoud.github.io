import * as T from "three";
import { mulberry32 } from "@/lib/random";
import { smoothstep } from "@/lib/trackside";
import { Batch } from "./builder";
import { canvasTexture } from "./textures";

/**
 * An original open-wheel racer at real scale (metres): 5.7 m long, 2 m wide,
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

// ── Wings ───────────────────────────────────────────────────────────────────
interface Section {
  chord: (x: number) => number;
  /** Trailing edge up, radians. */
  pitch: (x: number) => number;
  thickness?: number;
  camber?: number;
}
const PROFILE = 9;
/**
 * A cambered airfoil swept across the car from −span to +span. `lead` gives
 * the leading edge [z, y] at each station; the camber is inverted for downforce.
 */
function foil(
  span: number,
  stations: number,
  lead: (x: number) => [number, number],
  { chord, pitch, thickness = 0.09, camber = 0.045 }: Section,
) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const ring = PROFILE * 2,
    stride = ring + 1;
  for (let s = 0; s <= stations; s++) {
    const x = -span + (2 * span * s) / stations;
    const [zl, yl] = lead(x),
      c = chord(x),
      a = pitch(x);
    const cos = Math.cos(a),
      sin = Math.sin(a);
    // Round the section: upper surface from the trailing edge to the nose, then the lower back.
    for (let k = 0; k <= ring; k++) {
      const upper = k <= PROFILE;
      const q = upper ? 1 - k / PROFILE : (k - PROFILE) / PROFILE;
      const t = (1 - Math.cos(q * Math.PI)) / 2;
      const half =
        5 *
        thickness *
        (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t ** 2 + 0.2843 * t ** 3 - 0.1036 * t ** 4);
      const offset = (-4 * camber * t * (1 - t) + (upper ? half : -half)) * c;
      const along = t * c;
      positions.push(x, yl + along * sin + offset * cos, zl - along * cos + offset * sin);
      uvs.push(s / stations, k / ring);
    }
  }
  for (let s = 0; s < stations; s++)
    for (let k = 0; k < ring; k++) {
      const a = s * stride + k,
        b = a + 1,
        c = a + stride,
        d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  // Close the tips.
  for (const [s, outward] of [
    [0, -1],
    [stations, 1],
  ]) {
    const centre = positions.length / 3;
    let cy = 0,
      cz = 0;
    for (let k = 0; k <= ring; k++) {
      cy += positions[(s * stride + k) * 3 + 1];
      cz += positions[(s * stride + k) * 3 + 2];
    }
    positions.push(positions[s * stride * 3], cy / stride, cz / stride);
    uvs.push(s / stations, 0.5);
    for (let k = 0; k < ring; k++)
      if (outward > 0) indices.push(centre, s * stride + k, s * stride + k + 1);
      else indices.push(centre, s * stride + k + 1, s * stride + k);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
/** Slotted elements: each leading edge tucks under the previous trailing edge. */
function cascade(
  span: number,
  stations: number,
  lead: (x: number) => [number, number],
  sections: Section[],
  [overlap, gap]: [number, number],
) {
  let edge = lead;
  return sections.map((section) => {
    const current = edge;
    edge = (x) => {
      const [z, y] = current(x),
        c = section.chord(x),
        a = section.pitch(x);
      return [z - c * Math.cos(a) + overlap, y + c * Math.sin(a) + gap];
    };
    return foil(span, stations, current, section);
  });
}

/** A flat plate in the car's z/y plane (endplates, fins), `thickness` across x. */
function plate(outline: T.Shape | [number, number][], thickness: number, x: number) {
  const shape =
    outline instanceof T.Shape
      ? outline
      : new T.Shape(outline.map(([z, y]) => new T.Vector2(z, y)));
  const g = new T.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 8,
  });
  // Shape x → world z, shape y → world y, extrusion → world −x.
  g.rotateY(-Math.PI / 2);
  g.translate(x + thickness / 2, 0, 0);
  return g;
}
/** Outline in [z, y]: `line` points and `curve` [control, end] pairs. */
function outline(start: [number, number], steps: ([number, number] | [number, number, number, number])[]) {
  const shape = new T.Shape();
  shape.moveTo(...start);
  for (const step of steps)
    if (step.length === 2) shape.lineTo(...step);
    else shape.quadraticCurveTo(...step);
  return shape;
}

/** A rounded rectangle facing +z, for inlets. */
function roundedRect(width: number, height: number, radius: number, depth: number) {
  const w = width / 2,
    h = height / 2,
    r = Math.min(radius, w, h);
  const shape = new T.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
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

/**
 * Tyre: v runs across the profile, outer face of the left wheels at v ≈ 0.2
 * and the right wheels at v ≈ 0.8, with the scuffed tread between.
 */
function tyreTexture() {
  return canvasTexture(
    1024,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#18181a";
      ctx.fillRect(0, 0, w, h);
      // Tread: grained, lighter where it has been working.
      ctx.fillStyle = "#26262a";
      ctx.fillRect(0, h * 0.44, w, h * 0.12);
      const random = mulberry32(5);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 3 ? "#2c2c30" : "#141416";
        ctx.fillRect(random() * w, h * (0.44 + random() * 0.12), 2 + random() * 8, 1);
      }
      for (const [band, mirror] of [
        [0.18, false],
        [0.82, true],
      ] as [number, boolean][]) {
        const y = band * h;
        ctx.fillStyle = "#e3262f";
        ctx.fillRect(0, (mirror ? band + 0.1 : band - 0.12) * h, w, h * 0.035);
        ctx.save();
        ctx.translate(0, y);
        if (mirror) ctx.scale(-1, 1);
        ctx.fillStyle = "rgba(236, 236, 232, 0.85)";
        ctx.font = `800 ${h * 0.11}px Arial, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let k = 0; k < 4; k++) {
          const x = ((k + 0.5) / 4) * w * (mirror ? -1 : 1);
          ctx.fillText(k % 2 ? "SOFT" : "SLICK 18", x, mirror ? h * 0.02 : -h * 0.02);
        }
        ctx.restore();
      }
    },
    { repeat: false },
  );
}

/** The aero wheel cover, painted to match the car. */
function coverTexture() {
  return canvasTexture(
    256,
    256,
    (ctx, w) => {
      const c = w / 2;
      const g = ctx.createRadialGradient(c * 0.8, c * 0.8, 4, c, c, c);
      g.addColorStop(0, "#28324a");
      g.addColorStop(1, "#0d1220");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
      ctx.lineWidth = 14;
      ctx.strokeStyle = YELLOW;
      ctx.beginPath();
      ctx.arc(c, c, c * 0.72, -0.4, 1.3);
      ctx.stroke();
      ctx.strokeStyle = RED;
      ctx.beginPath();
      ctx.arc(c, c, c * 0.72, 2.75, 4.4);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c, c, c * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#05070b";
      ctx.beginPath();
      ctx.arc(c, c, c * 0.2, 0, Math.PI * 2);
      ctx.fill();
    },
    { repeat: false },
  );
}

/** Soft occlusion under the floor and the four contact patches. */
function contactTexture() {
  return canvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let k = 0; k < 20; k++) {
        const y = h * (0.14 + (0.72 * k) / 19);
        const g = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, w * 0.36);
        g.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      for (const [x, y] of [
        [0.19, 0.22],
        [0.81, 0.22],
        [0.19, 0.78],
        [0.81, 0.78],
      ]) {
        const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, w * 0.15);
        g.addColorStop(0, "rgba(0, 0, 0, 0.75)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
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
  // Satin paint under a thin clear coat; glossy carbon elsewhere.
  const paint = (map?: T.Texture) =>
    new T.MeshPhysicalMaterial({
      color: map ? 0xffffff : NAVY,
      map,
      roughness: 0.48,
      metalness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.26,
    });
  const navy = paint();
  const carbon = new T.MeshPhysicalMaterial({
    color: 0x0f1013,
    roughness: 0.55,
    metalness: 0.2,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const carbonThin = carbon.clone();
  carbonThin.side = T.DoubleSide;
  // The floor and diffuser are raw, matte carbon.
  const floorCarbon = new T.MeshStandardMaterial({
    color: 0x0b0c0e,
    roughness: 0.72,
    metalness: 0.15,
    side: T.DoubleSide,
  });
  const yellow = new T.MeshPhysicalMaterial({ color: YELLOW, roughness: 0.4, clearcoat: 0.5 });
  const red = new T.MeshPhysicalMaterial({ color: RED, roughness: 0.42, clearcoat: 0.5 });
  const black = new T.MeshStandardMaterial({ color: 0x030405, roughness: 0.8 });
  const titanium = new T.MeshStandardMaterial({ color: 0x8b9097, metalness: 0.9, roughness: 0.28 });
  const mirror = new T.MeshStandardMaterial({ color: 0xb8c2cc, metalness: 1, roughness: 0.05 });

  // ── Survival cell and nose ──────────────────────────────────────────────
  const chassisMap = livery(
    3.5,
    1.6,
    (ctx, w, h) => {
      ctx.fillStyle = RED;
      ctx.fillRect(0, -h * 0.06, w * 0.04, h * 0.12);
      ctx.fillStyle = YELLOW;
      ctx.fillRect(0, -h * 0.1, w * 0.022, h * 0.2);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${h * 0.07}px Arial, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("ORACLE", w * 0.62, -h * 0.02);
      emblem(ctx, w * 0.3, -h * 0.02, h * 0.13, false);
    },
    (ctx, w, h) => {
      ctx.fillStyle = YELLOW;
      ctx.fillRect(0, -h * 0.12, w * 0.035, h * 0.24);
      ctx.fillStyle = RED;
      ctx.fillRect(w * 0.035, -h * 0.02, w * 0.42, h * 0.04);
    },
  );
  batch.add(
    paint(chassisMap),
    loft([
      [2.98, 0, 0.045, 0.07, 0.15, 2.3],
      [2.8, 0, 0.075, 0.075, 0.22, 2.4],
      [2.52, 0, 0.11, 0.1, 0.33, 2.6],
      [2.1, 0, 0.16, 0.14, 0.45, 3],
      [1.7, 0, 0.21, 0.13, 0.55, 3.2],
      [1.2, 0, 0.26, 0.11, 0.63, 3.6],
      [0.8, 0, 0.3, 0.09, 0.69, 4],
      [0.3, 0, 0.34, 0.08, 0.67, 4],
      [-0.2, 0, 0.35, 0.08, 0.69, 4],
      [-0.5, 0, 0.3, 0.1, 0.62, 3.6],
    ]),
  );
  // Pitot probe on the nose.
  batch.add(titanium, strut([0, 0.3, 2.55], [0, 0.25, 3.08], 0.006));
  // Cockpit opening, headrest, driver and the halo.
  const opening = new T.SphereGeometry(1, 24, 12);
  opening.scale(0.25, 0.07, 0.5).translate(0, 0.665, 0.38);
  batch.add(black, opening);
  const headrest = new T.SphereGeometry(1, 20, 10);
  headrest.scale(0.24, 0.07, 0.16).translate(0, 0.69, 0.08);
  batch.add(new T.MeshStandardMaterial({ color: 0x1b2232, roughness: 0.85 }), headrest);
  const helmetMaterial = new T.MeshPhysicalMaterial({ color: NAVY, roughness: 0.2, clearcoat: 1 });
  batch.add(helmetMaterial, new T.SphereGeometry(0.135, 24, 16).translate(0, 0.79, 0.29));
  batch.add(yellow, new T.TorusGeometry(0.128, 0.018, 8, 24).rotateY(Math.PI / 2).translate(0, 0.8, 0.29));
  const visor = new T.SphereGeometry(0.138, 24, 8, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.36, Math.PI * 0.18);
  batch.add(mirror, visor.translate(0, 0.79, 0.29));
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
  batch.add(navy, new T.TubeGeometry(halo, 48, 0.026, 10, false));
  batch.add(navy, strut([0, 0.68, 0.96], [0, 0.915, 0.71], 0.03));

  // ── Engine cover, airbox, roll hoop camera and shark fin ────────────────
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
  batch.add(black, roundedRect(0.16, 0.13, 0.05, 0.02).translate(0, 0.865, -0.025));
  batch.add(yellow, new T.BoxGeometry(0.16, 0.025, 0.035).translate(0, 1.0, -0.06));
  batch.add(yellow, new T.BoxGeometry(0.025, 0.04, 0.035).translate(0, 0.975, -0.06));
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

  // ── Sidepods with letterbox inlets, mirrors, floor and diffuser ─────────
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
    // Wide, high inlet with the lower lip jutting forward.
    batch.add(black, roundedRect(0.34, 0.13, 0.05, 0.03).translate(side * 0.53, 0.5, 0.615));
    batch.add(navy, roundedRect(0.38, 0.024, 0.012, 0.13).translate(side * 0.53, 0.42, 0.56));
    // Mirrors on stalks.
    const housing = new T.SphereGeometry(1, 18, 10);
    housing.scale(0.1, 0.042, 0.04).translate(side * 0.47, 0.74, 0.64);
    batch.add(navy, housing);
    batch.add(
      mirror,
      new T.CircleGeometry(1, 20).scale(0.088, 0.034, 1).rotateY(Math.PI).translate(side * 0.47, 0.74, 0.598),
    );
    batch.add(carbon, strut([side * 0.3, 0.62, 0.66], [side * 0.43, 0.735, 0.645], 0.012));
    batch.add(carbon, strut([side * 0.52, 0.6, 0.6], [side * 0.5, 0.72, 0.63], 0.01));
    // Floor edge wing.
    batch.add(
      floorCarbon,
      new T.BoxGeometry(0.11, 0.008, 1.9).rotateZ(side * 0.45).translate(side * 0.87, 0.13, -0.25),
    );
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
  const floor = new T.ExtrudeGeometry(floorShape, { depth: 0.03, bevelEnabled: false });
  floor.rotateX(Math.PI / 2).translate(0, 0.085, 0);
  batch.add(floorCarbon, floor);
  // Diffuser roof rising from the floor, side walls and strakes.
  const ramp = Math.atan2(0.215, 0.55);
  batch.add(
    floorCarbon,
    new T.PlaneGeometry(1.1, Math.hypot(0.215, 0.55))
      .rotateX(-Math.PI / 2 + ramp)
      .translate(0, 0.19, -2.225),
  );
  for (const x of [-0.55, 0.55])
    batch.add(floorCarbon, plate([[-1.95, 0.05], [-2.52, 0.05], [-2.52, 0.31], [-1.95, 0.1]], 0.012, x));
  for (const x of [-0.38, -0.14, 0.14, 0.38])
    batch.add(floorCarbon, plate([[-1.95, 0.07], [-2.5, 0.07], [-2.48, 0.28]], 0.01, x));

  // ── Front wing: four slotted elements sweeping up into the endplates ────
  const out = (x: number) => smoothstep(0.22, 0.92, Math.abs(x));
  cascade(
    0.93,
    30,
    (x) => [2.99 - 0.06 * out(x) ** 2, 0.055 + 0.05 * out(x) ** 1.6],
    [
      { chord: (x) => 0.31 - 0.06 * out(x), pitch: (x) => 0.04 + 0.1 * out(x), thickness: 0.09, camber: 0.05 },
      { chord: (x) => 0.17 - 0.02 * out(x), pitch: (x) => 0.28 + 0.14 * out(x) },
      { chord: (x) => 0.15 - 0.02 * out(x), pitch: (x) => 0.52 + 0.14 * out(x) },
      { chord: (x) => 0.13 - 0.02 * out(x), pitch: (x) => 0.78 + 0.12 * out(x) },
    ],
    [0.035, 0.012],
  ).forEach((g, k) => batch.add(k < 2 ? carbon : navy, g));
  const frontPlate = outline(
    [3.02, 0.03],
    [
      [2.4, 0.03],
      [2.33, 0.03, 2.35, 0.2],
      [2.42, 0.42],
      [2.5, 0.5, 2.62, 0.46],
      [2.9, 0.26],
      [3.04, 0.15, 3.02, 0.03],
    ],
  );
  for (const side of [-1, 1]) {
    batch.add(carbon, plate(frontPlate, 0.014, side * 0.945));
    batch.add(red, new T.BoxGeometry(0.018, 0.03, 0.42).translate(side * 0.947, 0.05, 2.7));
    // Nose pylons onto the main plane.
    batch.add(carbon, plate([[2.92, 0.07], [2.62, 0.08], [2.66, 0.2], [2.88, 0.14]], 0.012, side * 0.05));
  }

  // ── Rear wing: spoon main plane, DRS flap, beam wing and endplates ──────
  const tip = (x: number) => Math.abs(x) / 0.49;
  cascade(
    0.49,
    26,
    (x) => [-2.27 + 0.02 * tip(x) ** 2, 0.8 - 0.09 * tip(x) ** 5],
    [
      { chord: (x) => 0.3 - 0.04 * tip(x) ** 2, pitch: (x) => 0.16 + 0.12 * tip(x) ** 4, thickness: 0.1, camber: 0.06 },
      { chord: () => 0.19, pitch: (x) => 0.6 + 0.1 * tip(x) ** 4, thickness: 0.09, camber: 0.05 },
    ],
    [0.03, 0.014],
  ).forEach((g, k) => batch.add(k ? navy : carbon, g));
  cascade(
    0.42,
    12,
    () => [-2.2, 0.36],
    [
      { chord: () => 0.13, pitch: () => 0.18 },
      { chord: () => 0.1, pitch: () => 0.45 },
    ],
    [0.025, 0.01],
  ).forEach((g) => batch.add(carbon, g));
  const rearPlate = outline(
    [-2.18, 0.4],
    [
      [-2.6, 0.4],
      [-2.72, 0.42, -2.73, 0.6],
      [-2.73, 0.96],
      [-2.72, 1.04, -2.62, 1.04],
      [-2.42, 1.0],
      [-2.2, 0.95, -2.18, 0.7],
    ],
  );
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
    batch.add(navy, plate(rearPlate, 0.018, side * 0.5));
    const decal = new T.PlaneGeometry(0.42, 0.21);
    decal.rotateY((side * Math.PI) / 2).translate(side * 0.511, 0.72, -2.45);
    batch.add(endplate, decal);
    // Twin pillars wrapped round the exhaust.
    batch.add(
      carbon,
      plate([[-2.05, 0.4], [-2.3, 0.4], [-2.43, 0.8], [-2.3, 0.8], [-2.13, 0.52]], 0.02, side * 0.045),
    );
  }
  batch.add(navy, new T.BoxGeometry(0.05, 0.11, 0.1).translate(0, 0.89, -2.55));
  // Crash structure, rain light and the exhaust.
  batch.add(
    carbon,
    loft([
      [-1.85, 0, 0.13, 0.25, 0.47, 2.6],
      [-2.2, 0, 0.1, 0.28, 0.45, 2.6],
      [-2.42, 0, 0.065, 0.31, 0.42, 2.4],
    ]),
  );
  const rainLight = new T.MeshStandardMaterial({
    color: 0x330000,
    emissive: 0xff1a24,
    emissiveIntensity: 3,
  });
  batch.add(rainLight, new T.BoxGeometry(0.11, 0.05, 0.02).translate(0, 0.365, -2.43));
  const exhaust = new T.CylinderGeometry(0.05, 0.056, 0.3, 18, 1, true);
  exhaust.rotateX(Math.PI / 2 + 0.14).translate(0, 0.52, -2.33);
  batch.add(titanium, exhaust);
  batch.add(
    black,
    new T.CircleGeometry(0.048, 18).rotateY(Math.PI).rotateX(0.14).translate(0, 0.54, -2.465),
  );

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
      batch.add(carbon, strut([side * inner, 0.36, z - 0.05], [hub, 0.36, z - 0.05], 0.012));
    }
  }
  batch.build(body, true, true);

  // ── Contact shadow ───────────────────────────────────────────────────────
  const contact = new T.Mesh(
    new T.PlaneGeometry(2.6, 6.4).rotateX(-Math.PI / 2).translate(0, 0.015, 0),
    new T.MeshBasicMaterial({
      map: contactTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  contact.renderOrder = 1;
  car.add(contact);

  // ── Wheels: steer → spin → tyre, rim and cover ──────────────────────────
  const rubber = new T.MeshStandardMaterial({
    map: tyreTexture(),
    roughness: 0.86,
    side: T.DoubleSide,
  });
  const rim = new T.MeshStandardMaterial({ color: 0x23262c, metalness: 0.85, roughness: 0.32 });
  const lip = new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.22 });
  const cover = new T.MeshPhysicalMaterial({
    map: coverTexture(),
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
  const nut = new T.MeshStandardMaterial({ color: 0xc02028, metalness: 0.7, roughness: 0.3 });
  const wheels: { steer: T.Group; spin: T.Group; front: boolean }[] = [];
  const add = (parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };
  for (const front of [true, false])
    for (const side of [-1, 1]) {
      const width = front ? 0.3 : 0.4,
        half = width / 2;
      const steer = new T.Group();
      steer.position.set(side * (front ? 0.81 : 0.79), WHEEL_RADIUS, front ? 1.8 : -1.8);
      const spin = new T.Group();
      steer.add(spin);
      car.add(steer);
      // Bulging sidewall, square shoulder, flat tread; the lathe's axis turns to x.
      const profile = [
        [0.229, -half + 0.01],
        [0.25, -half - 0.004],
        [0.28, -half - 0.012],
        [0.31, -half - 0.013],
        [0.335, -half - 0.006],
        [0.352, -half + 0.012],
        [WHEEL_RADIUS, -half + 0.04],
        [WHEEL_RADIUS, half - 0.04],
        [0.352, half - 0.012],
        [0.335, half + 0.006],
        [0.31, half + 0.013],
        [0.28, half + 0.012],
        [0.25, half + 0.004],
        [0.229, half - 0.01],
      ].map(([r, y]) => new T.Vector2(r, y));
      add(spin, new T.LatheGeometry(profile, 56).rotateZ(Math.PI / 2), rubber);
      add(spin, new T.CylinderGeometry(0.229, 0.229, width - 0.03, 36, 1, true).rotateZ(Math.PI / 2), rim);
      // Outer face: machined lip, painted cover and the centre-lock nut.
      const face = side * (half - 0.016);
      add(spin, new T.TorusGeometry(0.226, 0.008, 6, 48).rotateY(Math.PI / 2).translate(face, 0, 0), lip);
      add(spin, new T.CircleGeometry(0.222, 40).rotateY((side * Math.PI) / 2).translate(face - side * 0.008, 0, 0), cover);
      add(
        spin,
        new T.CylinderGeometry(0.042, 0.046, 0.05, 6).rotateZ(Math.PI / 2).translate(face, 0, 0),
        nut,
      );
      // Inner face: the brake duct drum, which steers but doesn't spin.
      add(
        steer,
        new T.CylinderGeometry(0.205, 0.205, 0.15, 28).rotateZ(Math.PI / 2).translate(-side * (half - 0.08), 0, 0),
        carbon,
      );
      if (front)
        // Wheel-wake deflector arcing over the top of the tyre.
        add(
          steer,
          new T.CylinderGeometry(0.43, 0.43, 0.2, 16, 1, true, 0.35, 1.3)
            .rotateZ(Math.PI / 2)
            .translate(-side * 0.03, 0, 0),
          carbonThin,
        );
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
