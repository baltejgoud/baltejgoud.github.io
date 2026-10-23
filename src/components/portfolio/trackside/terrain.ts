import * as T from "three";
import { smoothstep, trackModel } from "@/lib/trackside";
import { grassTexture } from "./textures";

// ── Smooth value noise ─────────────────────────────────────────────────────
const hash = (x: number, z: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function noise(x: number, z: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, z: number, octaves = 4) {
  let total = 0,
    amplitude = 0.5,
    frequency = 1,
    norm = 0;
  for (let o = 0; o < octaves; o++) {
    total += noise(x * frequency + o * 17.3, z * frequency - o * 9.1) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return total / norm;
}
/** 0 in meadows, 1 in Ardennes forest. */
export const forestMask = (x: number, z: number) =>
  smoothstep(0.4, 0.55, fbm(x / 700 + 13, z / 700 - 7, 3));

export interface Ground {
  mesh: T.Mesh;
  heightAt: (x: number, z: number) => number;
  /** Distance to the centreline and its nearest sample. */
  trackDistance: (x: number, z: number) => { distance: number; index: number };
}

/**
 * Rolling Ardennes terrain. Near the circuit it takes the road's elevation so
 * the tarmac sits on the land; further out it relaxes into hills.
 */
export async function createGround(
  fine: boolean,
  pause: () => Promise<void>,
): Promise<Ground> {
  const { x: TX, z: TZ, y: TY, halfWidth, samples, step } = trackModel;
  const cell = fine ? 12 : 16;
  const axis = (inner: number, outer: number) => {
    const count = Math.ceil(inner / cell);
    const values: number[] = [];
    for (let i = -count; i <= count; i++) values.push(i * cell);
    let v = count * cell,
      grow = cell;
    while (v < outer) {
      grow *= 1.16;
      v += grow;
      values.push(v);
      values.unshift(-v);
    }
    return values;
  };
  const xs = axis(1800, 9000),
    zs = axis(1350, 9000);
  const nx = xs.length,
    nz = zs.length,
    count = nx * nz;

  // Nearest centreline sample for every vertex: seed, then sweep twice.
  const site = new Int32Array(count).fill(-1);
  const siteDistance = new Float64Array(count).fill(Infinity);
  const locate = (values: number[], v: number) => {
    let low = 0,
      high = values.length - 2;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (values[mid] <= v) low = mid;
      else high = mid - 1;
    }
    return low;
  };
  const consider = (vertex: number, sample: number) => {
    const vx = xs[vertex % nx],
      vz = zs[Math.floor(vertex / nx)];
    const d = Math.hypot(TX[sample] - vx, TZ[sample] - vz);
    if (d < siteDistance[vertex]) {
      siteDistance[vertex] = d;
      site[vertex] = sample;
    }
  };
  for (let i = 0; i < samples; i++) {
    const ix = locate(xs, TX[i]),
      iz = locate(zs, TZ[i]);
    for (const [a, b] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
      consider((iz + b) * nx + ix + a, i);
  }
  const sweep = (forward: boolean) => {
    const offsets = forward
      ? [
          [-1, 0],
          [-1, -1],
          [0, -1],
          [1, -1],
        ]
      : [
          [1, 0],
          [1, 1],
          [0, 1],
          [-1, 1],
        ];
    for (let k = 0; k < count; k++) {
      const v = forward ? k : count - 1 - k;
      const ix = v % nx,
        iz = Math.floor(v / nx);
      for (const [a, b] of offsets) {
        const jx = ix + a,
          jz = iz + b;
        if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue;
        const s = site[jz * nx + jx];
        if (s >= 0) consider(v, s);
      }
    }
  };
  sweep(true);
  sweep(false);
  sweep(true);
  await pause();

  // Smooth background elevation from a sparse set of samples.
  const sparse: number[] = [];
  for (let i = 0; i < samples; i += 20) sparse.push(i);
  const heights = new Float32Array(count);
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3),
    uvs = new Float32Array(count * 2);
  const mown = new T.Color(0x5b8238),
    meadow = new T.Color(0x71894a),
    dry = new T.Color(0x8c8f58),
    floor = new T.Color(0x2c3d25),
    far = new T.Color(0x4f6648),
    color = new T.Color();
  for (let v = 0; v < count; v++) {
    const x = xs[v % nx],
      z = zs[Math.floor(v / nx)];
    let weights = 0,
      sum = 0;
    for (const i of sparse) {
      const d2 = (TX[i] - x) ** 2 + (TZ[i] - z) ** 2 + 400;
      const w = 1 / d2;
      weights += w;
      sum += TY[i] * w;
    }
    const background = sum / weights;
    const i = site[v],
      d = siteDistance[v];
    const hw = halfWidth[i];
    const radial = Math.hypot(x / 1.3, z);
    const hills =
      (fbm(x / 900, z / 900) - 0.5) * 2 * (6 + 42 * smoothstep(120, 1100, d)) +
      smoothstep(2200, 6500, radial) * 140 * fbm(x / 2600 + 5, z / 2600 + 3, 3);
    const near = 1 - smoothstep(hw + 16, hw + 150, d);
    const h = (background + hills) * (1 - near) + (TY[i] - 0.25) * near;
    heights[v] = h;
    positions.set([x, h, z], v * 3);
    uvs.set([x / 7, z / 7], v * 2);
    // Ground colour: mown verges, meadows, forest floor, hazy distance.
    const patch = fbm(x / 160, z / 160, 2);
    color.copy(meadow).lerp(dry, smoothstep(0.55, 0.75, patch));
    color.lerp(floor, forestMask(x, z) * smoothstep(hw + 50, hw + 110, d));
    const verge = 1 - smoothstep(hw + 30, hw + 55, d);
    if (verge > 0) {
      const stripe = Math.floor((i * step) / 9) % 2 ? 1.07 : 0.94;
      const c = mown.clone().multiplyScalar(stripe);
      color.lerp(c, verge);
    }
    color.lerp(far, smoothstep(2200, 5000, radial));
    colors.set([color.r, color.g, color.b], v * 3);
  }
  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let k = 0;
  for (let iz = 0; iz < nz - 1; iz++)
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      indices.set([a, c, b, b, c, d], k);
      k += 6;
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
  geometry.setIndex(new T.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const turf = new T.MeshStandardMaterial({
    vertexColors: true,
    map: grassTexture(),
    roughness: 1,
  });
  // Blend the turf at two scales: blades up close, and a wider pattern that
  // hides the repeat from further away.
  turf.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#ifdef USE_MAP
        vec4 blades = texture2D( map, vMapUv * 2.8 );
        vec4 patches = texture2D( map, vMapUv * 0.29 + vec2( 0.37, 0.11 ) );
        diffuseColor *= mix( blades, patches, 0.45 );
      #endif`,
    );
  };
  const mesh = new T.Mesh(geometry, turf);
  mesh.receiveShadow = true;
  mesh.matrixAutoUpdate = false;

  const heightAt = (x: number, z: number) => {
    const ix = locate(xs, x),
      iz = locate(zs, z);
    const fx = clamp01((x - xs[ix]) / (xs[ix + 1] - xs[ix])),
      fz = clamp01((z - zs[iz]) / (zs[iz + 1] - zs[iz]));
    const a = heights[iz * nx + ix],
      b = heights[iz * nx + ix + 1],
      c = heights[(iz + 1) * nx + ix],
      d = heights[(iz + 1) * nx + ix + 1];
    // Match the triangle split used by the mesh (a, c, b / b, c, d).
    return fx + fz <= 1
      ? a + (b - a) * fx + (c - a) * fz
      : d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
  };
  const trackDistance = (x: number, z: number) => {
    const ix = locate(xs, x),
      iz = locate(zs, z);
    const start = site[iz * nx + ix];
    let best = Infinity,
      index = start;
    for (let j = -10; j <= 10; j++) {
      const i = (start + j + samples) % samples;
      const d = Math.hypot(TX[i] - x, TZ[i] - z);
      if (d < best) {
        best = d;
        index = i;
      }
    }
    return { distance: best, index };
  };
  return { mesh, heightAt, trackDistance };
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
