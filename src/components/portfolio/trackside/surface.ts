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
import { Batch, Placer, clearOfOtherTrack, ribbon, yawAlong } from "./builder";
import {
  armcoTexture,
  asphaltTexture,
  fenceTexture,
  gravelTexture,
  kerbTexture,
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
  const asphalt = new T.MeshStandardMaterial({
    map: asphaltTexture(),
    vertexColors: true,
    color: 0x4f5154,
    roughness: 0.94,
    envMapIntensity: 0.45,
  });
  const base = new T.Color(0xffffff);
  add(
    ribbon({
      left: (i) => -HW[i] - 0.15,
      right: (i) => HW[i] + 0.15,
      lift: 0,
      across: 16,
      repeat: [6, 6],
      color: (i, lateral, out) => {
        const line = Math.exp(-(((lateral - racing[i]) / 1.7) ** 2));
        const wear = 0.08 + 0.1 * line + 0.22 * line * braking[i];
        const dust = smoothstep(HW[i] - 2.2, HW[i], Math.abs(lateral)) * 0.08;
        out.copy(base).multiplyScalar(1 - wear + dust);
      },
    }),
    asphalt,
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
  const kerbMaterial = new T.MeshStandardMaterial({
    map: kerbTexture(),
    roughness: 0.6,
  });
  for (const side of [0, 1]) {
    const sign = side ? 1 : -1;
    add(
      ribbon({
        left: (i) => (sign < 0 ? -HW[i] - 1.4 : HW[i] - 0.05),
        right: (i) => (sign < 0 ? -HW[i] + 0.05 : HW[i] + 1.4),
        lift: (i, lateral) => 0.03 + 0.07 * smoothstep(HW[i], HW[i] + 1.4, Math.abs(lateral)),
        across: 2,
        stretchAcross: true,
        repeat: [1, 3],
        keep: (i) => kerb[side][i] === 1 && !onPitStraight(i, 40),
      }),
      kerbMaterial,
    );
  }

  // ── Run-off: tarmac or gravel on the outside of corners ─────────────────
  const tarmacRunoff = new T.MeshStandardMaterial({
    map: asphaltTexture(),
    color: 0x6b6d70,
    roughness: 0.95,
    envMapIntensity: 0.5,
  });
  const gravelMaterial = new T.MeshStandardMaterial({
    map: gravelTexture(),
    color: 0xd9c49d,
    roughness: 1,
  });
  // Spa paints its tarmac run-off with a band of colour beyond the kerbs.
  const band = decal(0x2f6d9a);
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
          repeat: [5, 5],
          keep: (i) => wide(i) && gravel[side][i] === surface,
        }),
        surface ? gravelMaterial : tarmacRunoff,
      );
    add(
      ribbon({
        ...span(
          (i) => from(i) + 1.2,
          (i) => from(i) + 1.2 + Math.min(3, runoff[side][i] - 1.2),
        ),
        lift: -0.005,
        keep: (i) => wide(i) && runoff[side][i] > 4 && gravel[side][i] === 0,
      }),
      band,
    );
  }

  // ── Barriers: Armco, debris fence, tyre walls ───────────────────────────
  const armco = new T.MeshStandardMaterial({
    map: armcoTexture(),
    metalness: 0.55,
    roughness: 0.45,
    side: T.DoubleSide,
  });
  const fence = new T.MeshStandardMaterial({
    map: fenceTexture(),
    color: 0xd0d4d8,
    metalness: 0.3,
    roughness: 0.6,
    alphaTest: 0.45,
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
    add(
      ribbon({ left: () => -0.3, right: () => 0.85, lift: 0, wall, keep, repeat: [1, 4] }),
      armco,
    );
    add(
      ribbon({ left: () => 0.85, right: () => 3.9, lift: 0, wall, keep, repeat: [1, 3] }),
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
      const lateral = wall(i) + sign * 0.15;
      const p = new T.Vector3(X[i] - TZ[i] * lateral, trackModel.y[i], Z[i] + TX[i] * lateral);
      const placer = new Placer(posts, p, yawAlong(TX[i], TZ[i]));
      placer.box(steel, 0.12, 4.3, 0.12, 0, 1.8, 0);
    }
  }
  posts.build(scene, true, false);

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
    map: asphaltTexture(),
    color: 0x48494c,
    roughness: 0.92,
    envMapIntensity: 0.45,
  });
  add(
    ribbon({
      start: pitStart,
      count: pitCount,
      left: (i) => HW[i] + 1.9,
      right: (i) => HW[i] + 1.9 + 13.5 * lane(i),
      lift: 0.01,
      repeat: [6, 6],
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
