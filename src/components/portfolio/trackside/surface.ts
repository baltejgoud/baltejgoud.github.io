import * as T from "three";
import {
  GRID_SLOTS,
  LAP,
  PIT_STRAIGHT,
  frameAt,
  gridSlot,
  lapDelta,
  smoothstep,
  trackModel,
} from "@/lib/trackside";
import {
  Batch,
  Placer,
  clearOfOtherTrack,
  ribbon,
  sweep,
  yawAlong,
} from "./builder";
import { mulberry32 } from "@/lib/random";
import { fbm } from "./terrain";
import {
  asphaltMaps,
  fenceTexture,
  gravelMaps,
  kerbMaps,
  markerTexture,
  roadWearTexture,
  skidTexture,
  tyreWallTexture,
} from "./textures";

const {
  samples: N,
  step,
  x: X,
  z: Z,
  tx: TX,
  tz: TZ,
  halfWidth: HW,
  racing,
  bend,
  runoff,
  kerb,
  gravel,
  barrier,
} = trackModel;

const decal = (color: number) =>
  new T.MeshStandardMaterial({
    color,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });

/** Per sample: does a point `lateral(i)` metres across stay clear of other parts of the lap? */
const clearance = (lateral: (i: number) => number, margin: number) => {
  const ok = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const l = lateral(i);
    ok[i] = clearOfOtherTrack(X[i] - TZ[i] * l, Z[i] + TX[i] * l, i, margin) ? 1 : 0;
  }
  return ok;
};

const onPitStraight = (i: number, pad = 0) => {
  const s = lapDelta(i * step, 0);
  return s > PIT_STRAIGHT[0] - pad && s < PIT_STRAIGHT[1] + pad;
};

/** The same texture mirrored across u, for the other side of the track. */
const mirrored = (texture: T.Texture) => {
  const copy = texture.clone();
  copy.repeat.x = -1;
  copy.offset.x = 1;
  copy.needsUpdate = true;
  return copy;
};

/** Galvanised W-beam: [offset towards the track, height], about 31 cm tall. */
const W_BEAM: [number, number][] = [
  [0, -0.155],
  [0.03, -0.15],
  [0.075, -0.105],
  [0.082, -0.07],
  [0.036, -0.026],
  [0.036, 0.026],
  [0.082, 0.07],
  [0.075, 0.105],
  [0.03, 0.15],
  [0, 0.155],
];

/** Road, kerbs, run-off, barriers and pit lane — everything that follows the lap. */
export function createSurface(scene: T.Object3D) {
  const meshes: T.Mesh[] = [];
  const add = (
    geometry: T.BufferGeometry,
    material: T.Material,
    shadow = false,
  ) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = shadow;
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  // ── Asphalt with a rubbered racing line and darker braking zones ─────────
  const braking = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let ahead = 0;
    for (let j = 4; j < 44; j += 4)
      ahead = Math.max(ahead, Math.abs(bend[(i + j) % N]));
    braking[i] = smoothstep(0.006, 0.03, ahead - Math.abs(bend[i]));
  }
  // Resurfacing: the lap was laid in stretches of 40–200 m, each a shade
  // apart, and some were relaid on one side only, up to the centre seam.
  const relaid = new Float64Array(N),
    laneSide = new Int8Array(N),
    laneShade = new Float64Array(N);
  {
    const random = mulberry32(17);
    for (let i = 0; i < N; ) {
      const length = Math.round((40 + random() * 160) / step);
      const shade = (random() - 0.5) * 0.14;
      const side = random() < 0.3 ? (random() < 0.5 ? -1 : 1) : 0;
      const lane = (random() - 0.5) * 0.18;
      for (let k = 0; k < length && i < N; k++, i++) {
        relaid[i] = shade;
        laneSide[i] = side;
        laneShade[i] = lane;
      }
    }
  }
  const road = asphaltMaps();
  const asphalt = new T.MeshStandardMaterial({
    ...road,
    vertexColors: true,
    color: 0x7a7b7f,
    roughness: 0.96,
    normalScale: new T.Vector2(0.75, 0.75),
    envMapIntensity: 0.65,
  });
  const base = new T.Color(0xffffff);
  add(
    ribbon({
      left: (i) => -HW[i] - 0.15,
      right: (i) => HW[i] + 0.15,
      lift: 0,
      across: 28,
      repeat: [3, 3],
      color: (i, lateral, out) => {
        // Rubber laid down on the line, heaviest where the cars brake.
        const line = Math.exp(-(((lateral - racing[i]) / 1.9) ** 2));
        const wear = 0.02 + 0.28 * line + 0.22 * line * braking[i];
        // Off the line the surface stays dusty and pale towards the edges.
        const dust = smoothstep(HW[i] - 2.6, HW[i], Math.abs(lateral)) * 0.17;
        const lane =
          laneSide[i] && Math.sign(lateral) === laneSide[i]
            ? laneShade[i] * smoothstep(0, 0.5, Math.abs(lateral))
            : 0;
        const mottle =
          (fbm((i * step) / 26 + 3.1, lateral / 6 + 0.7) - 0.5) * 0.12;
        out
          .copy(base)
          .multiplyScalar(1 - wear + dust + relaid[i] + lane + mottle);
      },
    }),
    asphalt,
  );
  // Paving seams, tar-sealed cracks and oil stains over the whole surface.
  add(
    ribbon({
      left: (i) => -HW[i],
      right: (i) => HW[i],
      lift: 0.004,
      stretchAcross: true,
      across: 4,
      repeat: [1, 64],
    }),
    new T.MeshStandardMaterial({
      map: roadWearTexture(),
      transparent: true,
      depthWrite: false,
      roughness: 0.5,
      envMapIntensity: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  // Rubber streaks laid down under braking, two tyre tracks wide.
  add(
    ribbon({
      left: (i) => racing[i] - 1.3,
      right: (i) => racing[i] + 1.3,
      lift: 0.006,
      stretchAcross: true,
      repeat: [1, 38],
      keep: (i) => braking[i] > 0.12 && !onPitStraight(i, 60),
      color: (_, __, out) => out.setRGB(1, 1, 1),
      alpha: (i) => smoothstep(0.12, 0.7, braking[i]),
    }),
    new T.MeshStandardMaterial({
      map: skidTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      roughness: 0.75,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  // Road edge skirt hides the seam where the verge drops away.
  const skirt = new T.MeshStandardMaterial({ color: 0x3c3f42, roughness: 1 });
  for (const side of [-1, 1])
    add(
      ribbon({
        left: () => -1.2,
        right: () => 0,
        lift: 0,
        wall: (i) => side * (HW[i] + 0.15),
      }),
      skirt,
    );

  // ── Painted lines ────────────────────────────────────────────────────────
  const white = decal(0xf1efe8);
  for (const side of [-1, 1])
    add(
      ribbon({
        left: (i) => (side < 0 ? -HW[i] : HW[i] - 0.35),
        right: (i) => (side < 0 ? -HW[i] + 0.35 : HW[i]),
        lift: 0.012,
      }),
      white,
    );

  // ── Kerbs: inside of corners and outside on exit ────────────────────────
  // Flush with the road on the track side, a 5 cm ridged crown, rounded off outside.
  const kerbs = kerbMaps();
  for (const side of [0, 1]) {
    const sign = side ? 1 : -1;
    const keep = (i: number) => kerb[side][i] === 1 && !onPitStraight(i, 40);
    add(
      ribbon({
        left: (i) => (sign < 0 ? -HW[i] - 1.4 : HW[i] - 0.05),
        right: (i) => (sign < 0 ? -HW[i] + 0.05 : HW[i] + 1.4),
        lift: (i, lateral) => {
          const d = Math.abs(lateral);
          return (
            0.012 +
            0.05 * smoothstep(HW[i] - 0.05, HW[i] + 0.45, d) -
            0.035 * smoothstep(HW[i] + 1.1, HW[i] + 1.4, d)
          );
        },
        across: 7,
        stretchAcross: true,
        repeat: [1, 3],
        keep,
      }),
      new T.MeshStandardMaterial({
        map: side ? mirrored(kerbs.map) : kerbs.map,
        normalMap: side ? mirrored(kerbs.normalMap) : kerbs.normalMap,
        roughness: 0.55,
        envMapIntensity: 0.6,
      }),
    );
    add(
      ribbon({
        left: () => -0.3,
        right: () => 0.028,
        lift: 0,
        wall: (i) => sign * (HW[i] + 1.4),
        keep,
      }),
      skirt,
    );
  }

  // ── Run-off: tarmac or gravel on the outside of corners ─────────────────
  const tarmacRunoff = new T.MeshStandardMaterial({
    ...road,
    color: 0x8c8f94,
    roughness: 1,
    normalScale: new T.Vector2(0.6, 0.6),
    envMapIntensity: 0.5,
  });
  const gravelMaterial = new T.MeshStandardMaterial({
    ...gravelMaps(),
    color: 0xe6ddcc,
    roughness: 1,
  });
  // Spa paints its tarmac run-off with a band of colour beyond the kerbs:
  // weathered paint, with the asphalt grain showing through.
  const band = new T.MeshStandardMaterial({
    ...road,
    color: 0x5d7d99,
    roughness: 1,
    normalScale: new T.Vector2(0.5, 0.5),
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  for (const side of [0, 1]) {
    const sign = side ? 1 : -1;
    const from = (i: number) => HW[i] + (kerb[side][i] ? 1.4 : 0.15);
    const to = (i: number) => from(i) + runoff[side][i];
    const span = (a: (i: number) => number, b: (i: number) => number) => ({
      left: (i: number) => (sign < 0 ? -b(i) : a(i)),
      right: (i: number) => (sign < 0 ? -a(i) : b(i)),
    });
    const open = clearance((i) => sign * to(i), 2);
    const wide = (i: number) => runoff[side][i] > 1.5 && open[i] === 1;
    for (const surface of [0, 1])
      add(
        ribbon({
          ...span(from, to),
          lift: surface ? -0.04 : -0.015,
          across: 2,
          repeat: surface ? [2.5, 2.5] : [4, 4],
          keep: (i) => wide(i) && gravel[side][i] === surface,
        }),
        surface ? gravelMaterial : tarmacRunoff,
      );
    add(
      ribbon({
        ...span(
          (i) => from(i) + 0.8,
          (i) => from(i) + 0.8 + Math.min(2, runoff[side][i] - 0.8),
        ),
        lift: -0.005,
        keep: (i) => wide(i) && runoff[side][i] > 4 && gravel[side][i] === 0,
      }),
      band,
    );
  }

  // ── Barriers: Armco, debris fence, tyre walls ───────────────────────────
  const armco = new T.MeshStandardMaterial({
    color: 0xb3bac1,
    metalness: 0.7,
    roughness: 0.34,
    side: T.DoubleSide,
  });
  // Coverage follows the mesh's alpha, so at a distance it fades to a haze.
  const fence = new T.MeshStandardMaterial({
    map: fenceTexture(),
    color: 0x9ea4aa,
    metalness: 0.3,
    roughness: 0.6,
    alphaToCoverage: true,
    side: T.DoubleSide,
  });
  const tyres = new T.MeshStandardMaterial({
    map: tyreWallTexture(),
    roughness: 0.8,
    side: T.DoubleSide,
  });
  const posts = new Batch();
  const steel = new T.MeshStandardMaterial({
    color: 0x6b7178,
    metalness: 0.7,
    roughness: 0.45,
  });
  for (const side of [0, 1]) {
    const sign = side ? 1 : -1;
    const wall = (i: number) => sign * barrier[side][i];
    const open = clearance(wall, 1.5);
    const keep = (i: number) =>
      !(side === 1 && onPitStraight(i)) && open[i] === 1;
    for (const centre of [0.43, 0.79])
      add(
        sweep({
          lateral: wall,
          keep,
          profile: W_BEAM.map(([offset, h]) => [offset, centre + h]),
        }),
        armco,
        true,
      );
    add(
      ribbon({ left: () => 0.95, right: () => 3.9, lift: 0, wall, keep, repeat: [1, 1] }),
      fence,
    );
    // Belted tyre walls where a tight corner's outside is close.
    add(
      ribbon({
        left: () => -0.3,
        right: () => 0.95,
        lift: 0,
        wall: (i) => wall(i) - sign * 0.75,
        repeat: [1, 2.4],
        keep: (i) => keep(i) && runoff[side][i] > 10 && sign * bend[i] < 0,
      }),
      tyres,
    );
    for (let i = 0; i < N; i += 2) {
      if (!keep(i)) continue;
      const lateral = wall(i) + sign * 0.12;
      const p = new T.Vector3(X[i] - TZ[i] * lateral, trackModel.y[i], Z[i] + TX[i] * lateral);
      const placer = new Placer(posts, p, yawAlong(TX[i], TZ[i]));
      placer.add(steel, new T.CylinderGeometry(0.055, 0.055, 4.3, 8), 0, 1.8, 0);
      // Spacer block between the post and the rails.
      placer.box(steel, 0.1, 0.62, 0.12, 0, 0.61, -sign * 0.06);
    }
  }
  posts.build(scene, true, false);

  // ── Braking markers: 150, 100 and 50 m boards before the big stops ──────
  const markers = new Batch();
  const boards = [150, 100, 50].map(
    (m) => new T.MeshStandardMaterial({ map: markerTexture(m), roughness: 0.6 }),
  );
  const backing = new T.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.7 });
  let lastStop = -Infinity;
  for (let i = 1; i < N; i++) {
    if (!(braking[i] > 0.5 && braking[i - 1] <= 0.5) || onPitStraight(i, 120)) continue;
    let peak = 0;
    for (let j = 0; j < 70; j++) peak = Math.max(peak, Math.abs(bend[(i + j) % N]));
    if (peak < 0.025 || i * step - lastStop < 450) continue;
    lastStop = i * step;
    // Outside of the coming corner, just short of the barrier.
    let ahead = 0;
    for (let j = 0; j < 70; j++) ahead += bend[(i + j) % N];
    const sign = ahead > 0 ? -1 : 1,
      side = sign > 0 ? 1 : 0;
    boards.forEach((material, b) => {
      const k = (i - Math.round((50 * (2 - b)) / step) + N) % N;
      const lateral = HW[k] + 3.2;
      if (barrier[side][k] < lateral + 1.5) return;
      if (!clearOfOtherTrack(X[k] - TZ[k] * sign * lateral, Z[k] + TX[k] * sign * lateral, k, 4))
        return;
      const placer = new Placer(
        markers,
        new T.Vector3(X[k] - TZ[k] * sign * lateral, trackModel.y[k], Z[k] + TX[k] * sign * lateral),
        yawAlong(TX[k], TZ[k]),
      );
      placer.add(material, new T.PlaneGeometry(1.4, 1.05), -0.035, 1.55, 0, 0, -Math.PI / 2, 0);
      placer.box(backing, 0.06, 1.13, 1.48, 0, 1.55, 0);
      for (const z of [-0.5, 0.5])
        placer.add(steel, new T.CylinderGeometry(0.04, 0.04, 1.1, 6), 0.05, 0.55, z);
    });
  }
  markers.build(scene, true, true);

  // ── Pit lane and pit wall (inside of the start straight) ────────────────
  const pitStart = Math.round(((PIT_STRAIGHT[0] - 40 + LAP) % LAP) / step);
  const pitCount = Math.round((PIT_STRAIGHT[1] + 40 - PIT_STRAIGHT[0]) / step);
  const lane = (i: number) => {
    const s = lapDelta(i * step, 0);
    return (
      smoothstep(PIT_STRAIGHT[0] - 40, PIT_STRAIGHT[0] + 20, s) *
      (1 - smoothstep(PIT_STRAIGHT[1] - 20, PIT_STRAIGHT[1] + 40, s))
    );
  };
  const pitAsphalt = new T.MeshStandardMaterial({
    ...road,
    color: 0x6c6f73,
    roughness: 1,
    normalScale: new T.Vector2(0.5, 0.5),
    envMapIntensity: 0.45,
  });
  add(
    ribbon({
      start: pitStart,
      count: pitCount,
      left: (i) => HW[i] + 1.9,
      right: (i) => HW[i] + 1.9 + 13.5 * lane(i),
      lift: 0.01,
      repeat: [4, 4],
    }),
    pitAsphalt,
  );
  add(
    ribbon({
      start: pitStart,
      count: pitCount,
      left: (i) => HW[i] + 1.9 + 6.4 * lane(i),
      right: (i) => HW[i] + 1.9 + 6.4 * lane(i) + 0.3,
      lift: 0.022,
      keep: (i) => lane(i) > 0.9,
    }),
    white,
  );
  const concrete = new T.MeshStandardMaterial({ color: 0xd3d0c8, roughness: 0.85 });
  const pitWall = new Batch();
  for (let s = PIT_STRAIGHT[0]; s < PIT_STRAIGHT[1]; s += 6) {
    const f = frameAt(s + 3);
    const lateral = HW[0] + 1.6;
    const p = new T.Vector3(f.x + f.rx * lateral, f.y, f.z + f.rz * lateral);
    const placer = new Placer(pitWall, p, yawAlong(f.tx, f.tz));
    placer.box(concrete, 6.02, 1.3, 0.7, 0, 0.4, 0);
    placer.box(steel, 0.1, 3.2, 0.1, -3, 2.6, 0);
  }
  pitWall.build(scene, true, true);
  const pitFence = ribbon({
    start: Math.round(((PIT_STRAIGHT[0] + LAP) % LAP) / step),
    count: Math.round((PIT_STRAIGHT[1] - PIT_STRAIGHT[0]) / step),
    left: () => 1.05,
    right: () => 4.2,
    lift: 0,
    wall: (i) => HW[i] + 1.6,
    repeat: [1, 3],
  });
  add(pitFence, fence);

  // ── Start line, chequered band and the 22 grid slots ────────────────────
  const markings = new Batch();
  const black = decal(0x15171a);
  const startFrame = frameAt(0);
  const startPlacer = new Placer(
    markings,
    new T.Vector3(startFrame.x, startFrame.y + 0.014, startFrame.z),
    yawAlong(startFrame.tx, startFrame.tz),
  );
  const width = HW[0] * 2;
  startPlacer.box(white, 0.6, 0.02, width, 0, 0, 0);
  const squares = 16,
    size = width / squares;
  for (let row = 0; row < 2; row++)
    for (let c = 0; c < squares; c++)
      startPlacer.box(
        (row + c) % 2 ? white : black,
        size,
        0.02,
        size,
        0.3 + size / 2 + row * size,
        0.001,
        -width / 2 + size / 2 + c * size,
      );
  for (let n = 0; n < GRID_SLOTS; n++) {
    const slot = gridSlot(n);
    const f = frameAt(slot.s + 2.9);
    const centre = new T.Vector3(
      f.x + f.rx * slot.lateral,
      f.y + 0.014,
      f.z + f.rz * slot.lateral,
    );
    const placer = new Placer(markings, centre, yawAlong(f.tx, f.tz));
    // Slot: a bar across the front with short returns either side.
    placer.box(white, 0.22, 0.02, 2.7, 0, 0, 0);
    placer.box(white, 1.1, 0.02, 0.2, -0.55, 0, -1.25);
    placer.box(white, 1.1, 0.02, 0.2, -0.55, 0, 1.25);
  }
  markings.build(scene, false, true);
  return meshes;
}
