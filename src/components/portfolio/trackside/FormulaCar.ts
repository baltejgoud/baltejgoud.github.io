import * as T from "three";
import { mulberry32 } from "@/lib/random";
import { smoothstep } from "@/lib/trackside";
import { Batch } from "./builder";
import {
  BODY,
  COLOURS,
  FRONT_PLATE,
  REAR_PLATE,
  bodyViews,
  endplateViews,
  projectedPaint,
  tyreTexture,
  wingSkin,
} from "./livery";
import { canvasTexture } from "./textures";

/**
 * An original open-wheel racer to the 2026 rules at real scale (metres): about
 * 5.45 m long, 1.9 m wide, 3.4 m wheelbase, 18-inch wheels, no beam wing.
 * Local +Z is the nose, +Y is up and the origin sits on the ground midway
 * between the axles. Proportions, bodywork and livery follow the user's three
 * RB22 launch photographs; the geometry is an interpretation, not CAD.
 */
export const WHEEL_RADIUS = 0.36;
export const WHEELBASE = 3.4;
const AXLE = WHEELBASE / 2;

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

/** A rod between two points; `flat` < 1 gives it an aerofoil-like fairing. */
function strut(a: number[], b: number[], radius: number, flat = 1) {
  const from = new T.Vector3(...a),
    to = new T.Vector3(...b);
  const length = from.distanceTo(to);
  const g = new T.CylinderGeometry(radius, radius, length, 8);
  if (flat !== 1) g.scale(flat, 1, 1);
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
        (0.2969 * Math.sqrt(t) -
          0.126 * t -
          0.3516 * t ** 2 +
          0.2843 * t ** 3 -
          0.1036 * t ** 4);
      const offset = (-4 * camber * t * (1 - t) + (upper ? half : -half)) * c;
      const along = t * c;
      positions.push(
        x,
        yl + along * sin + offset * cos,
        zl - along * cos + offset * sin,
      );
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
function plate(
  outline: T.Shape | [number, number][],
  thickness: number,
  x: number,
) {
  const shape =
    outline instanceof T.Shape
      ? outline
      : new T.Shape(outline.map(([z, y]) => new T.Vector2(z, y)));
  const g = new T.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 10,
  });
  // Shape x → world z, shape y → world y, extrusion → world −x.
  g.rotateY(-Math.PI / 2);
  g.translate(x + thickness / 2, 0, 0);
  return g;
}
/** Outline in [z, y]: `line` points and `curve` [control, end] pairs. */
function outline(
  start: [number, number],
  steps: ([number, number] | [number, number, number, number])[],
) {
  const shape = new T.Shape();
  shape.moveTo(...start);
  for (const step of steps)
    if (step.length === 2) shape.lineTo(...step);
    else shape.quadraticCurveTo(...step);
  return shape;
}

/** A rounded rectangle facing +z, for inlets. */
function roundedRect(
  width: number,
  height: number,
  radius: number,
  depth: number,
) {
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
  return new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 6,
  });
}

/** Soft occlusion under the floor and the four contact patches. */
function contactTexture() {
  return canvasTexture(
    128,
    320,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let k = 0; k < 20; k++) {
        const y = h * (0.15 + (0.7 * k) / 19);
        const g = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, w * 0.36);
        g.addColorStop(0, "rgba(0, 0, 0, 0.22)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      // Plane: 2.4 m across, 6 m long, centred on the car.
      for (const x of [-0.79, 0.79])
        for (const z of [-AXLE, AXLE]) {
          const cx = (0.5 + x / 2.4) * w,
            cy = (0.5 - z / 6) * h;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.15);
          g.addColorStop(0, "rgba(0, 0, 0, 0.78)");
          g.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
    },
    { repeat: false },
  );
}

export interface FormulaCarOptions {
  /** Livery canvas width in pixels; the close-up viewer uses more. */
  resolution?: number;
}

export function createFormulaCar({ resolution = 2048 }: FormulaCarOptions = {}) {
  const car = new T.Group();
  car.rotation.order = "YXZ";
  const body = new T.Group();
  car.add(body);
  const batch = new Batch();

  const paint = projectedPaint(bodyViews(resolution), BODY);
  const weave = canvasTexture(
    128,
    128,
    (ctx) => {
      ctx.fillStyle = "#35383c";
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 8)
        for (let x = 0; x < 128; x += 8) {
          ctx.fillStyle = (x + y) % 16 ? "#202329" : "#454a50";
          ctx.fillRect(x, y, 7, 3);
          ctx.fillRect(x + 3, y + 4, 3, 4);
        }
    },
    { color: false },
  );
  weave.repeat.set(14, 14);
  const carbon = new T.MeshPhysicalMaterial({
    color: 0x14171c,
    bumpMap: weave,
    bumpScale: 0.005,
    roughness: 0.36,
    metalness: 0.15,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
  });
  // The floor and diffuser are satin carbon that should read black, not mirror the sky.
  const floorCarbon = new T.MeshStandardMaterial({
    color: 0x040506,
    bumpMap: weave,
    bumpScale: 0.003,
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.25,
    side: T.DoubleSide,
  });
  const black = new T.MeshStandardMaterial({ color: 0x020304, roughness: 0.85 });
  const titanium = new T.MeshStandardMaterial({
    color: 0x8b9097,
    metalness: 0.9,
    roughness: 0.28,
  });
  const glass = new T.MeshStandardMaterial({
    color: 0xb8c2cc,
    metalness: 1,
    roughness: 0.05,
  });
  const yellow = new T.MeshPhysicalMaterial({
    color: 0xffb400,
    roughness: 0.35,
    clearcoat: 0.6,
  });

  // ── Survival cell and nose ──────────────────────────────────────────────
  // A slim, low nose that rests on the front wing, rising to the cockpit rim.
  batch.add(
    paint,
    loft(
      [
        [2.97, 0, 0.028, 0.115, 0.16, 2.2],
        [2.88, 0, 0.058, 0.1, 0.2, 2.4],
        [2.65, 0, 0.085, 0.105, 0.265, 2.6],
        [2.35, 0, 0.112, 0.12, 0.335, 2.8],
        [2.05, 0, 0.142, 0.145, 0.405, 3],
        [1.7, 0, 0.175, 0.16, 0.47, 3.2],
        [1.35, 0, 0.21, 0.14, 0.53, 3.4],
        [1.0, 0, 0.245, 0.1, 0.572, 3.6],
        [0.62, 0, 0.285, 0.07, 0.6, 3.8],
        [0.2, 0, 0.318, 0.065, 0.588, 4],
        [-0.22, 0, 0.33, 0.065, 0.6, 4],
        [-0.55, 0, 0.29, 0.07, 0.56, 3.6],
        [-0.9, 0, 0.23, 0.08, 0.44, 3],
      ],
      40,
    ),
  );
  // Cockpit opening, padded rim, headrest and steering wheel.
  const opening = new T.SphereGeometry(1, 28, 12);
  opening.scale(0.235, 0.05, 0.43).translate(0, 0.592, 0.2);
  batch.add(black, opening);
  const rim = new T.TorusGeometry(1, 0.035, 8, 40);
  rim.rotateX(Math.PI / 2).scale(0.24, 1, 0.44).translate(0, 0.598, 0.2);
  batch.add(carbon, rim);
  const pads = new T.MeshStandardMaterial({ color: 0x131a2c, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const pad = new T.SphereGeometry(1, 16, 10);
    pad.scale(0.07, 0.07, 0.17).translate(side * 0.19, 0.63, -0.06);
    batch.add(pads, pad);
  }
  batch.add(
    black,
    new T.BoxGeometry(0.26, 0.11, 0.04).rotateX(-0.5).translate(0, 0.62, 0.5),
  );
  // Driver: dark helmet with a yellow crown stripe and a mirrored visor.
  const helmet = new T.MeshPhysicalMaterial({
    color: 0x101a3a,
    roughness: 0.2,
    clearcoat: 1,
  });
  batch.add(helmet, new T.SphereGeometry(0.128, 28, 18).translate(0, 0.705, 0.02));
  batch.add(
    yellow,
    new T.TorusGeometry(0.12, 0.016, 8, 28)
      .rotateY(Math.PI / 2)
      .translate(0, 0.715, 0.02),
  );
  batch.add(
    glass,
    new T.SphereGeometry(
      0.131,
      24,
      8,
      Math.PI * 0.1,
      Math.PI * 0.8,
      Math.PI * 0.36,
      Math.PI * 0.17,
    ).translate(0, 0.705, 0.02),
  );
  // Halo: a faired titanium hoop with its single forward pillar.
  const halo = new T.CatmullRomCurve3(
    [
      [0.285, 0.6, -0.2],
      [0.275, 0.73, -0.1],
      [0.255, 0.785, 0.1],
      [0.18, 0.8, 0.33],
      [0, 0.806, 0.44],
      [-0.18, 0.8, 0.33],
      [-0.255, 0.785, 0.1],
      [-0.275, 0.73, -0.1],
      [-0.285, 0.6, -0.2],
    ].map((p) => new T.Vector3(...p)),
  );
  batch.add(carbon, new T.TubeGeometry(halo, 56, 0.034, 12, false));
  batch.add(carbon, strut([0, 0.598, 0.68], [0, 0.8, 0.45], 0.034, 0.6));

  // ── Roll-hoop airbox, engine cover and fin ──────────────────────────────
  batch.add(
    paint,
    loft(
      [
        [-0.13, 0, 0.12, 0.66, 0.9, 2.3],
        [-0.26, 0, 0.19, 0.55, 0.925, 2.5],
        [-0.55, 0, 0.27, 0.4, 0.87, 2.9],
        [-0.9, 0, 0.28, 0.32, 0.76, 3],
        [-1.25, 0, 0.22, 0.29, 0.64, 2.9],
        [-1.6, 0, 0.15, 0.28, 0.53, 2.6],
        [-1.92, 0, 0.09, 0.3, 0.45, 2.3],
        [-2.1, 0, 0.05, 0.33, 0.41, 2.2],
      ],
      36,
    ),
  );
  // Oval intake above the driver's head, the T-camera and the marshalling light.
  batch.add(
    black,
    roundedRect(0.17, 0.13, 0.065, 0.02).translate(0, 0.79, -0.13),
  );
  batch.add(
    black,
    new T.BoxGeometry(0.2, 0.03, 0.06).translate(0, 0.955, -0.23),
  );
  batch.add(black, new T.BoxGeometry(0.02, 0.03, 0.03).translate(0, 0.932, -0.23));
  batch.add(
    new T.MeshStandardMaterial({
      color: 0x0c3d14,
      emissive: 0x33ff55,
      emissiveIntensity: 2.2,
    }),
    new T.BoxGeometry(0.03, 0.012, 0.02).translate(0, 0.93, -0.165),
  );
  batch.add(
    paint,
    plate(
      [
        [-0.42, 0.9],
        [-1.95, 0.7],
        [-2.06, 0.5],
        [-1.6, 0.52],
        [-0.7, 0.82],
      ],
      0.012,
      0,
    ),
  );

  // ── Sidepods: high letterbox inlets over a deep undercut, then a steep ramp ──
  for (const side of [-1, 1]) {
    batch.add(
      paint,
      loft(
        [
          [0.63, side * 0.5, 0.16, 0.37, 0.585, 3.2, 0.2],
          [0.46, side * 0.54, 0.21, 0.25, 0.6, 3.6, 0.45],
          [0.15, side * 0.555, 0.23, 0.17, 0.585, 3.6, 0.55],
          [-0.25, side * 0.53, 0.23, 0.12, 0.54, 3.4, 0.6],
          [-0.7, side * 0.46, 0.2, 0.1, 0.44, 3, 0.6],
          [-1.1, side * 0.37, 0.15, 0.1, 0.34, 2.6, 0.5],
          [-1.45, side * 0.29, 0.1, 0.1, 0.27, 2.4, 0.4],
          [-1.75, side * 0.22, 0.06, 0.11, 0.23, 2.2, 0.3],
        ],
        32,
      ),
    );
    batch.add(
      black,
      roundedRect(0.24, 0.13, 0.05, 0.02).translate(side * 0.5, 0.5, 0.628),
    );
    // Lower lip jutting forward under the inlet.
    batch.add(
      paint,
      roundedRect(0.27, 0.026, 0.012, 0.12).translate(side * 0.5, 0.418, 0.56),
    );
    // Mirrors on twin stalks.
    const housing = new T.SphereGeometry(1, 18, 10);
    housing.scale(0.085, 0.038, 0.034).translate(side * 0.47, 0.695, 0.66);
    batch.add(carbon, housing);
    batch.add(
      glass,
      new T.CircleGeometry(1, 20)
        .scale(0.074, 0.03, 1)
        .rotateY(Math.PI)
        .translate(side * 0.47, 0.695, 0.624),
    );
    batch.add(
      carbon,
      strut([side * 0.28, 0.6, 0.68], [side * 0.42, 0.69, 0.665], 0.01, 0.5),
    );
    batch.add(
      carbon,
      strut([side * 0.51, 0.595, 0.62], [side * 0.49, 0.682, 0.655], 0.009),
    );
    // Floor fences behind the front wheels, curling outboard.
    for (const [k, x] of [0.19, 0.26, 0.33, 0.4].entries()) {
      const fence = plate(
        [
          [1.22, 0.068],
          [0.62, 0.068],
          [0.62, 0.15 - k * 0.012],
          [1.16, 0.2 - k * 0.02],
        ],
        0.008,
        0,
      );
      fence.rotateY(side * (0.05 + k * 0.035)).translate(side * x, 0, 0);
      batch.add(carbon, fence);
    }
    // Upturned floor edge with its edge wing.
    batch.add(
      carbon,
      new T.BoxGeometry(0.012, 0.06, 1.7).translate(side * 0.795, 0.095, -0.35),
    );
    batch.add(
      floorCarbon,
      new T.BoxGeometry(0.09, 0.006, 1.5)
        .rotateZ(side * 0.4)
        .translate(side * 0.76, 0.13, -0.3),
    );
  }
  const floorShape = new T.Shape(
    [
      [0, 1.25],
      [0.28, 1.25],
      [0.46, 1.04],
      [0.72, 0.76],
      [0.8, 0.5],
      [0.8, -1.2],
      [0.7, -1.5],
      [0.58, -1.95],
      [-0.58, -1.95],
      [-0.7, -1.5],
      [-0.8, -1.2],
      [-0.8, 0.5],
      [-0.72, 0.76],
      [-0.46, 1.04],
      [-0.28, 1.25],
    ].map(([x, z]) => new T.Vector2(x, z)),
  );
  const floor = new T.ExtrudeGeometry(floorShape, {
    depth: 0.022,
    bevelEnabled: false,
  });
  floor.rotateX(Math.PI / 2).translate(0, 0.068, 0);
  batch.add(floorCarbon, floor);
  // Diffuser roof rising from the floor, side walls and strakes.
  const ramp = Math.atan2(0.24, 0.45);
  batch.add(
    floorCarbon,
    new T.PlaneGeometry(1.12, Math.hypot(0.24, 0.45))
      .rotateX(-Math.PI / 2 + ramp)
      .translate(0, 0.068 + 0.12, -2.175),
  );
  for (const x of [-0.56, 0.56])
    batch.add(
      floorCarbon,
      plate(
        [
          [-1.95, 0.046],
          [-2.42, 0.046],
          [-2.42, 0.33],
          [-1.95, 0.09],
        ],
        0.012,
        x,
      ),
    );
  for (const x of [-0.36, -0.12, 0.12, 0.36])
    batch.add(
      floorCarbon,
      plate(
        [
          [-1.95, 0.06],
          [-2.4, 0.06],
          [-2.38, 0.29],
        ],
        0.01,
        x,
      ),
    );

  // ── Front wing: four slotted elements sweeping up into tall endplates ───
  const span = 0.86;
  const out = (x: number) => smoothstep(0.2, span, Math.abs(x));
  const frontSkins = [
    wingSkin([
      {
        text: "Red Bull",
        colour: COLOURS.red,
        at: [0.24, 0.76],
        size: 0.36,
        italic: true,
        stretch: 1.26,
      },
    ]),
    wingSkin([
      {
        text: "VISA",
        colour: COLOURS.white,
        at: [0.22, 0.78],
        size: 0.42,
        stretch: 0.72,
      },
    ]),
    wingSkin([]),
    wingSkin([]),
  ];
  cascade(
    span,
    34,
    // Low and flat under the nose, the outboard flaps stacking up steeply.
    (x) => [2.96 - 0.1 * out(x) ** 2, 0.05 + 0.09 * out(x) ** 1.4],
    [
      {
        chord: (x) => 0.28 - 0.07 * out(x),
        pitch: (x) => 0.04 + 0.22 * out(x),
        thickness: 0.09,
        camber: 0.05,
      },
      { chord: (x) => 0.15 - 0.02 * out(x), pitch: (x) => 0.28 + 0.3 * out(x) },
      { chord: (x) => 0.13 - 0.02 * out(x), pitch: (x) => 0.5 + 0.34 * out(x) },
      { chord: (x) => 0.11 - 0.02 * out(x), pitch: (x) => 0.72 + 0.36 * out(x) },
    ],
    [0.03, 0.011],
  ).forEach((g, k) => {
    const wing = carbon.clone();
    wing.map = frontSkins[k];
    wing.color.setHex(0xffffff);
    wing.roughness = 0.42;
    batch.add(wing, g);
  });
  const frontPlate = outline(
    [2.99, 0.035],
    [
      [2.33, 0.035],
      [2.26, 0.035, 2.27, 0.2],
      [2.32, 0.36],
      [2.42, 0.42, 2.56, 0.4],
      [2.86, 0.28],
      [3.0, 0.18, 2.99, 0.035],
    ],
  );
  const front = endplateViews(FRONT_PLATE, false);
  for (const side of [-1, 1]) {
    batch.add(
      projectedPaint(side > 0 ? front.leftPlate : front.rightPlate, FRONT_PLATE),
      plate(frontPlate, 0.016, side * 0.87),
    );
    // Footplate curling outboard and down from the endplate's foot.
    batch.add(
      floorCarbon,
      new T.BoxGeometry(0.09, 0.007, 0.46)
        .rotateZ(-side * 0.38)
        .translate(side * 0.91, 0.045, 2.7),
    );
  }

  // ── Rear wing: spoon main plane, flap and endplates; no beam wing in 2026 ──
  const tip = (x: number) => Math.abs(x) / 0.5;
  const rearSkins = [
    wingSkin([]),
    wingSkin([
      {
        text: "◉ Gate",
        colour: COLOURS.white,
        at: [0.5],
        size: 0.4,
        stretch: 1.6,
        width: 0.7,
      },
    ]),
  ];
  cascade(
    0.5,
    26,
    (x) => [-2.0 + 0.02 * tip(x) ** 2, 0.76 - 0.05 * tip(x) ** 5],
    [
      {
        chord: (x) => 0.27 - 0.03 * tip(x) ** 2,
        pitch: (x) => 0.14 + 0.1 * tip(x) ** 4,
        thickness: 0.1,
        camber: 0.065,
      },
      {
        chord: () => 0.2,
        pitch: (x) => 0.62 + 0.08 * tip(x) ** 4,
        thickness: 0.09,
        camber: 0.05,
      },
    ],
    [0.03, 0.015],
  ).forEach((g, k) => {
    const wing = carbon.clone();
    wing.map = rearSkins[k];
    wing.color.setHex(0xffffff);
    wing.roughness = 0.42;
    batch.add(wing, g);
  });
  const rearPlate = outline(
    [-1.98, 0.42],
    [
      [-2.42, 0.42],
      [-2.56, 0.44, -2.57, 0.6],
      [-2.57, 0.92],
      [-2.56, 1.0, -2.46, 1.0],
      [-2.2, 0.975],
      [-1.98, 0.94, -1.97, 0.72],
    ],
  );
  const rear = endplateViews(REAR_PLATE, true);
  for (const side of [-1, 1]) {
    batch.add(
      projectedPaint(side > 0 ? rear.leftPlate : rear.rightPlate, REAR_PLATE),
      plate(rearPlate, 0.018, side * 0.51),
    );
    // Twin pylons wrapped round the exhaust.
    batch.add(
      carbon,
      plate(
        [
          [-1.95, 0.4],
          [-2.2, 0.4],
          [-2.36, 0.79],
          [-2.22, 0.79],
          [-2.03, 0.52],
        ],
        0.02,
        side * 0.045,
      ),
    );
  }
  // Crash structure, rain light and the single exhaust.
  batch.add(
    carbon,
    loft([
      [-1.85, 0, 0.13, 0.24, 0.46, 2.6],
      [-2.2, 0, 0.1, 0.27, 0.44, 2.6],
      [-2.42, 0, 0.065, 0.3, 0.41, 2.4],
    ]),
  );
  batch.add(
    new T.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0xff1a24,
      emissiveIntensity: 3,
    }),
    new T.BoxGeometry(0.11, 0.05, 0.02).translate(0, 0.355, -2.43),
  );
  const exhaust = new T.CylinderGeometry(0.048, 0.054, 0.28, 18, 1, true);
  exhaust.rotateX(Math.PI / 2 + 0.14).translate(0, 0.5, -2.26);
  batch.add(titanium, exhaust);
  batch.add(
    black,
    new T.CircleGeometry(0.046, 18)
      .rotateY(Math.PI)
      .rotateX(0.14)
      .translate(0, 0.52, -2.39),
  );

  // ── Suspension: faired wishbones, push rods at the front, pull rods behind ──
  for (const side of [-1, 1]) {
    for (const z of [AXLE, -AXLE]) {
      const front = z > 0;
      const hub = side * (front ? 0.64 : 0.56),
        inner = side * (front ? 0.16 : 0.2);
      batch.add(carbon, strut([inner, 0.47, z + 0.3], [hub, 0.5, z], 0.028, 0.32));
      batch.add(carbon, strut([inner, 0.45, z - 0.28], [hub, 0.5, z], 0.028, 0.32));
      batch.add(carbon, strut([inner, 0.2, z + 0.32], [hub, 0.21, z], 0.028, 0.32));
      batch.add(carbon, strut([inner, 0.2, z - 0.3], [hub, 0.21, z], 0.028, 0.32));
      batch.add(
        carbon,
        strut(
          [inner, front ? 0.5 : 0.17, z + 0.1],
          [hub * 0.97, front ? 0.23 : 0.48, z - 0.03],
          0.015,
        ),
      );
      batch.add(
        carbon,
        strut([inner, 0.33, z - 0.06], [hub, 0.33, z - 0.06], 0.012, 0.6),
      );
    }
  }
  batch.build(body, true, true);

  // ── Contact shadow ───────────────────────────────────────────────────────
  const contact = new T.Mesh(
    new T.PlaneGeometry(2.4, 6).rotateX(-Math.PI / 2).translate(0, 0.012, 0),
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

  // ── Wheels: open spokes, blue rim bands, white tyre lettering ────────────
  const rubber = new T.MeshStandardMaterial({
    map: tyreTexture(),
    roughness: 0.82,
    side: T.DoubleSide,
  });
  const alloy = new T.MeshStandardMaterial({
    color: 0x17191d,
    metalness: 0.75,
    roughness: 0.3,
  });
  const lip = new T.MeshStandardMaterial({
    color: 0x2357e0,
    metalness: 0.4,
    roughness: 0.3,
  });
  const nut = new T.MeshStandardMaterial({
    color: 0x101318,
    metalness: 0.7,
    roughness: 0.3,
  });
  const random = mulberry32(9);
  const wheels: { steer: T.Group; spin: T.Group; front: boolean }[] = [];
  const add = (
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };
  for (const front of [true, false])
    for (const side of [-1, 1]) {
      const width = front ? 0.3 : 0.38,
        half = width / 2;
      const steer = new T.Group();
      steer.position.set(side * (0.95 - half), WHEEL_RADIUS, front ? AXLE : -AXLE);
      const spin = new T.Group();
      // Stagger the lettering so the four tyres don't turn in step.
      spin.rotation.x = random() * Math.PI * 2;
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
      add(spin, new T.LatheGeometry(profile, 64).rotateZ(Math.PI / 2), rubber);
      add(
        spin,
        new T.CylinderGeometry(0.229, 0.229, width - 0.03, 36, 1, true).rotateZ(
          Math.PI / 2,
        ),
        alloy,
      );
      const face = side * (half - 0.016);
      add(
        spin,
        new T.TorusGeometry(0.226, 0.006, 6, 56)
          .rotateY(Math.PI / 2)
          .translate(face, 0, 0),
        lip,
      );
      const spokes = new Batch();
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        spokes.add(
          alloy,
          strut(
            [face - side * 0.016, Math.cos(a) * 0.05, Math.sin(a) * 0.05],
            [face, Math.cos(a + 0.12) * 0.218, Math.sin(a + 0.12) * 0.218],
            0.009,
          ),
        );
      }
      spokes.build(spin, true, true);
      add(
        spin,
        new T.CylinderGeometry(0.042, 0.046, 0.05, 6)
          .rotateZ(Math.PI / 2)
          .translate(face, 0, 0),
        nut,
      );
      // Inner face: the brake duct drum, which steers but doesn't spin.
      add(
        steer,
        new T.CylinderGeometry(0.205, 0.205, 0.15, 28)
          .rotateZ(Math.PI / 2)
          .translate(-side * (half - 0.08), 0, 0),
        carbon,
      );
      wheels.push({ steer, spin, front });
    }
  const phase = wheels.map((wheel) => wheel.spin.rotation.x);
  return {
    group: car,
    /** Roll the wheels `metres` along and steer the fronts by `angle` radians. */
    update(metres: number, angle: number) {
      wheels.forEach((wheel, i) => {
        wheel.spin.rotation.x = phase[i] + metres / WHEEL_RADIUS;
        wheel.steer.rotation.y = wheel.front ? angle : 0;
      });
    },
  };
}
