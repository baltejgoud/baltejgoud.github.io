import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { trackModel } from "@/lib/trackside";

/** Collects many small parts and merges them into one mesh per material. */
export class Batch {
  private parts = new Map<T.Material, T.BufferGeometry[]>();
  add(material: T.Material, geometry: T.BufferGeometry, matrix?: T.Matrix4) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g === geometry) g = geometry.clone();
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (!g.getAttribute("uv"))
      g.setAttribute(
        "uv",
        new T.Float32BufferAttribute(
          new Float32Array(g.getAttribute("position").count * 2),
          2,
        ),
      );
    if (matrix) g.applyMatrix4(matrix);
    const list = this.parts.get(material) ?? [];
    list.push(g);
    this.parts.set(material, list);
    geometry.dispose();
  }
  build(parent: T.Object3D, cast = true, receive = true) {
    const meshes: T.Mesh[] = [];
    this.parts.forEach((list, material) => {
      const merged = mergeGeometries(list);
      list.forEach((g) => g.dispose());
      if (!merged) return;
      const mesh = new T.Mesh(merged, material);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
      meshes.push(mesh);
    });
    this.parts.clear();
    return meshes;
  }
}

const tmpPosition = new T.Vector3(),
  tmpScale = new T.Vector3(1, 1, 1),
  tmpQuaternion = new T.Quaternion(),
  tmpEuler = new T.Euler(0, 0, 0, "YXZ");

/** A local frame (origin + yaw) for placing parts: x along, y up, z across. */
export class Placer {
  readonly matrix = new T.Matrix4();
  constructor(
    readonly batch: Batch,
    origin: T.Vector3Like,
    yaw: number,
  ) {
    this.matrix.compose(
      tmpPosition.set(origin.x, origin.y, origin.z),
      tmpQuaternion.setFromEuler(tmpEuler.set(0, yaw, 0)),
      tmpScale.set(1, 1, 1),
    );
  }
  local(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    const m = new T.Matrix4().compose(
      tmpPosition.set(x, y, z),
      tmpQuaternion.setFromEuler(tmpEuler.set(rx, ry, rz)),
      tmpScale.set(1, 1, 1),
    );
    return m.premultiply(this.matrix);
  }
  box(
    material: T.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    rx = 0,
  ) {
    this.batch.add(material, new T.BoxGeometry(w, h, d), this.local(x, y, z, rx));
  }
  add(
    material: T.Material,
    geometry: T.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    this.batch.add(material, geometry, this.local(x, y, z, rx, ry, rz));
  }
}

/** Yaw that turns local +x to point along (dx, dz). */
export const yawAlong = (dx: number, dz: number) => Math.atan2(-dz, dx);

// ── Spatial index of centreline samples ────────────────────────────────────
const CELL = 40;
const buckets = new Map<number, number[]>();
const key = (cx: number, cz: number) => (cx + 2000) * 4096 + (cz + 2000);
for (let i = 0; i < trackModel.samples; i++) {
  const k = key(
    Math.floor(trackModel.x[i] / CELL),
    Math.floor(trackModel.z[i] / CELL),
  );
  const list = buckets.get(k) ?? [];
  list.push(i);
  buckets.set(k, list);
}
/**
 * Nearest centreline sample within `radius` metres, optionally ignoring the
 * stretch of track around sample `exclude` (so a point can be tested against
 * *other* parts of the circuit).
 */
export function nearestSample(
  x: number,
  z: number,
  radius = 240,
  exclude = -1,
  window = 90,
) {
  const reach = Math.ceil(radius / CELL);
  const cx = Math.floor(x / CELL),
    cz = Math.floor(z / CELL);
  let best = radius * radius,
    index = -1;
  const n = trackModel.samples;
  for (let a = -reach; a <= reach; a++)
    for (let b = -reach; b <= reach; b++) {
      const list = buckets.get(key(cx + a, cz + b));
      if (!list) continue;
      for (const i of list) {
        if (exclude >= 0) {
          const gap = Math.abs(i - exclude);
          if (Math.min(gap, n - gap) < window) continue;
        }
        const dx = trackModel.x[i] - x,
          dz = trackModel.z[i] - z,
          d = dx * dx + dz * dz;
        if (d < best) {
          best = d;
          index = i;
        }
      }
    }
  return { index, distance: index < 0 ? radius : Math.sqrt(best) };
}
/** True if (x, z) keeps `margin` metres clear of the tarmac of every *other* part of the lap. */
export const clearOfOtherTrack = (
  x: number,
  z: number,
  near: number,
  margin = 3,
) => {
  const hit = nearestSample(x, z, 80, near);
  return (
    hit.index < 0 ||
    hit.distance > trackModel.halfWidth[hit.index] + margin
  );
};

// ── Ribbons that follow the track ──────────────────────────────────────────
export interface RibbonSpec {
  /** First sample and how many to walk (wrapping round the lap). */
  start?: number;
  count?: number;
  /** Lateral offsets of the two edges in metres, + is the driver's right; left < right. */
  left: (i: number) => number;
  right: (i: number) => number;
  lift: number | ((i: number, lateral: number) => number);
  across?: number;
  /** World metres per texture repeat: [across, along]. */
  repeat?: [number, number];
  /** Map the across coordinate to 0..1 instead of metres. */
  stretchAcross?: boolean;
  keep?: (i: number) => boolean;
  color?: (i: number, lateral: number, out: T.Color) => void;
  /** Vertical ribbon: left/right become heights above the road and this gives the lateral offset. */
  wall?: (i: number) => number;
}
export function ribbon(spec: RibbonSpec) {
  const { x, z, y, tx, tz, samples, step } = trackModel;
  const start = spec.start ?? 0,
    count = spec.count ?? samples + 1,
    across = spec.across ?? 1;
  const positions: number[] = [],
    uvs: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const color = new T.Color();
  const [ru, rv] = spec.repeat ?? [1, 4];
  for (let k = 0; k < count; k++) {
    const i = (start + k) % samples;
    const s = (start + k) * step;
    const a = spec.left(i),
      b = spec.right(i);
    for (let j = 0; j <= across; j++) {
      const t = j / across;
      const value = a + (b - a) * t;
      if (spec.wall) {
        const lateral = spec.wall(i);
        positions.push(
          x[i] - tz[i] * lateral,
          y[i] + value,
          z[i] + tx[i] * lateral,
        );
        uvs.push(s / rv, t);
      } else {
        const lift =
          typeof spec.lift === "number" ? spec.lift : spec.lift(i, value);
        positions.push(x[i] - tz[i] * value, y[i] + lift, z[i] + tx[i] * value);
        uvs.push(spec.stretchAcross ? t : value / ru, s / rv);
      }
      if (spec.color) {
        spec.color(i, value, color);
        colors.push(color.r, color.g, color.b);
      }
    }
    if (k < count - 1) {
      const next = (start + k + 1) % samples;
      if (spec.keep && !(spec.keep(i) && spec.keep(next))) continue;
      for (let j = 0; j < across; j++) {
        const p = k * (across + 1) + j,
          q = p + across + 1;
        indices.push(p, p + 1, q, p + 1, q + 1, q);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  if (spec.color)
    geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
