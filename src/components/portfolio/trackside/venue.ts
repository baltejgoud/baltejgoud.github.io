import * as T from "three";
import route from "@/content/journey-route.json";
import { journeyStories } from "@/content/journey-stories";
import {
  BOARD,
  PIT_STRAIGHT,
  barrierAt,
  checkpointBoard,
  frameAt,
  halfWidthAt,
  trackModel,
  type Vec3,
} from "@/lib/trackside";
import { mulberry32 } from "@/lib/random";
import { Batch, Placer, nearestSample, yawAlong } from "./builder";
import type { Ground } from "./terrain";
import {
  HOARDINGS,
  crowdTexture,
  hoardingTexture,
  screenTexture,
  signTexture,
} from "./textures";

/** Areas the forest must leave open: centre, yaw, half length (along x) and half depth. */
export interface Clearing {
  x: number;
  z: number;
  yaw: number;
  halfLength: number;
  halfDepth: number;
}
export const insideClearing = (c: Clearing, x: number, z: number) => {
  const dx = x - c.x,
    dz = z - c.z;
  const cos = Math.cos(c.yaw),
    sin = Math.sin(c.yaw);
  // Inverse of the y rotation used by Placer: local x = (cos, -sin), local z = (sin, cos).
  const lx = dx * cos - dz * sin,
    lz = dx * sin + dz * cos;
  return Math.abs(lx) < c.halfLength && Math.abs(lz) < c.halfDepth;
};

/** Generic team colours for garages and motorhomes; no real team is implied. */
const TEAMS = [
  0x1e3a8a, 0xd01818, 0x00a19c, 0xff8000, 0x0b6b52, 0x1f8fff, 0xf2f2f2,
  0xff7eb6, 0x6fd64f, 0x27384f, 0xaeb3b8,
];

type Side = 1 | -1;
interface Stand {
  s: number;
  side: Side;
  length: number;
  depth?: number;
  rise?: number;
  roof?: boolean;
  /** Extra setback beyond the barrier, to clear a nearby part of the lap. */
  setback?: number;
}
/** Illustrative grandstand placements around the circuit's famous viewing areas. */
const STANDS: Stand[] = [
  { s: -150, side: -1, length: 140, depth: 26, rise: 15, roof: true },
  { s: 0, side: -1, length: 120, depth: 26, rise: 15, roof: true },
  { s: 110, side: -1, length: 90, depth: 22, rise: 13, roof: true },
  { s: 262, side: -1, length: 110, roof: true },
  { s: 985, side: 1, length: 60, depth: 18, setback: 14 },
  { s: 1085, side: -1, length: 150, depth: 28, rise: 17, roof: true },
  { s: 2200, side: 1, length: 70, depth: 18, setback: 14 },
  { s: 2300, side: -1, length: 120 },
  { s: 3610, side: 1, length: 110, roof: true },
  { s: 3820, side: 1, length: 130 },
  { s: 4990, side: 1, length: 60, depth: 18, setback: 16 },
  { s: 5070, side: -1, length: 100, roof: true },
  { s: 6150, side: 1, length: 120 },
  { s: 6540, side: -1, length: 110, roof: true },
];

export function createVenue(scene: T.Object3D, ground: Ground) {
  const batch = new Batch();
  const clearings: Clearing[] = [];
  const random = mulberry32(77);
  const mat = {
    concrete: new T.MeshStandardMaterial({ color: 0xd6d2c8, roughness: 0.85 }),
    steel: new T.MeshStandardMaterial({
      color: 0x737a82,
      metalness: 0.7,
      roughness: 0.4,
    }),
    dark: new T.MeshStandardMaterial({ color: 0x1d2229, roughness: 0.6 }),
    roof: new T.MeshStandardMaterial({
      color: 0xeceeed,
      metalness: 0.35,
      roughness: 0.4,
    }),
    cladding: new T.MeshStandardMaterial({ color: 0x2f3c4d, roughness: 0.7 }),
    glass: new T.MeshStandardMaterial({
      color: 0x1d3347,
      metalness: 0.9,
      roughness: 0.08,
    }),
    lightGlass: new T.MeshStandardMaterial({
      color: 0x6f8aa0,
      metalness: 0.85,
      roughness: 0.12,
    }),
    interior: new T.MeshStandardMaterial({
      color: 0x2a2f36,
      emissive: 0xc9d4de,
      emissiveIntensity: 0.06,
      roughness: 0.8,
    }),
    hut: new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.7 }),
    orange: new T.MeshStandardMaterial({ color: 0xf47b20, roughness: 0.6 }),
  };
  const teams = TEAMS.map(
    (color) =>
      new T.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 }),
  );
  const crowds = [3, 5, 8].map(
    (seed) =>
      new T.MeshStandardMaterial({ map: crowdTexture(seed), roughness: 0.9 }),
  );
  const hoardings = HOARDINGS.map(
    (design) =>
      new T.MeshStandardMaterial({
        map: hoardingTexture(design),
        roughness: 0.55,
      }),
  );
  const clearOf = (x: number, z: number, margin: number) => {
    const hit = nearestSample(x, z, 120);
    return (
      hit.index < 0 || hit.distance > trackModel.halfWidth[hit.index] + margin
    );
  };
  /** Placer whose local +z points away from the track on `side`. */
  const trackside = (s: number, side: Side, lateral: number) => {
    const f = frameAt(s);
    const x = f.x + f.rx * side * lateral,
      z = f.z + f.rz * side * lateral;
    const yaw = yawAlong(f.tx, f.tz) + (side < 0 ? Math.PI : 0);
    return { x, z, yaw, y: ground.heightAt(x, z), f };
  };

  // ── Grandstands ──────────────────────────────────────────────────────────
  const quad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3, u: number, v: number) => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      "position",
      new T.Float32BufferAttribute([...a, ...b, ...c, ...d], 3),
    );
    g.setAttribute(
      "uv",
      new T.Float32BufferAttribute([0, 0, u, 0, u, v, 0, v], 2),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return g;
  };
  const sideWall = (depth: number, top: number) => {
    const shape = new T.Shape([
      new T.Vector2(0, -5),
      new T.Vector2(depth + 0.6, -5),
      new T.Vector2(depth + 0.6, top + 1.5),
      new T.Vector2(0, 3.2),
    ]);
    const g = new T.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    return g;
  };
  STANDS.forEach((stand, n) => {
    const depth = stand.depth ?? 20,
      rise = stand.rise ?? 11,
      half = stand.length / 2;
    const gap =
      barrierAt(stand.s, stand.side > 0 ? 1 : 0) + 6 + (stand.setback ?? 0);
    const at = trackside(stand.s, stand.side, gap);
    // Keep stands off other parts of the circuit.
    const corners = [
      [-half, 0],
      [half, 0],
      [-half, depth],
      [half, depth],
      [0, depth],
    ].map(([lx, lz]) => [
      at.x + lx * Math.cos(at.yaw) + lz * Math.sin(at.yaw),
      at.z - lx * Math.sin(at.yaw) + lz * Math.cos(at.yaw),
    ]);
    if (!corners.every(([x, z]) => clearOf(x, z, 9))) {
      if (process.env.NODE_ENV !== "production")
        console.warn(
          `[trackside] grandstand at ${stand.s} m overlaps the circuit`,
        );
      return;
    }
    const base = Math.min(...corners.map(([x, z]) => ground.heightAt(x, z)));
    const p = new Placer(batch, { x: at.x, y: base, z: at.z }, at.yaw);
    const top = 2.6 + rise;
    p.box(mat.concrete, stand.length, 7.6, 0.6, 0, -1.2, 0.3);
    p.batch.add(
      crowds[n % crowds.length],
      quad(
        [-half, 2.6, 0.6],
        [half, 2.6, 0.6],
        [half, top, depth],
        [-half, top, depth],
        stand.length / 30,
        1,
      ),
      p.matrix,
    );
    p.box(
      mat.cladding,
      stand.length,
      top + 6,
      0.5,
      0,
      (top + 6) / 2 - 5,
      depth + 0.35,
    );
    p.add(mat.concrete, sideWall(depth, top), -half, 0, 0);
    p.add(mat.concrete, sideWall(depth, top), half + 0.5, 0, 0);
    if (stand.roof) {
      const height = top + 6.5;
      p.box(
        mat.roof,
        stand.length + 3,
        0.5,
        depth + 7,
        0,
        height,
        depth / 2 - 2.5,
        -0.06,
      );
      for (
        let x = -half;
        x <= half + 0.1;
        x += stand.length / Math.ceil(stand.length / 18)
      )
        p.box(
          mat.steel,
          0.6,
          height + 5,
          0.6,
          x,
          height / 2 - 2.5,
          depth + 0.9,
        );
    }
    // Ad boards along the front of the stand.
    for (let x = -half + 4; x < half - 3; x += 6.4)
      p.add(
        hoardings[Math.floor(random() * hoardings.length)],
        new T.PlaneGeometry(6, 1.3),
        x,
        1.75,
        -0.02,
        0,
        Math.PI,
        0,
      );
    clearings.push({
      x: at.x + Math.sin(at.yaw) * depth * 0.5,
      z: at.z + Math.cos(at.yaw) * depth * 0.5,
      yaw: at.yaw,
      halfLength: half + 10,
      halfDepth: depth / 2 + 14,
    });
  });

  // ── Pit building, team pit-wall stands and the paddock ──────────────────
  const a = frameAt(PIT_STRAIGHT[0] + 45),
    b = frameAt(PIT_STRAIGHT[1] - 45);
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const dx = (b.x - a.x) / length,
    dz = (b.z - a.z) / length;
  const pitYaw = yawAlong(dx, dz);
  const garageFront = halfWidthAt(0) + 16;
  const mid = {
    x: (a.x + b.x) / 2 - dz * garageFront,
    z: (a.z + b.z) / 2 + dx * garageFront,
  };
  const midY = (a.y + b.y) / 2;
  const pits = new Placer(batch, { x: mid.x, y: midY - 0.2, z: mid.z }, pitYaw);
  const halfLength = length / 2;
  pits.box(mat.concrete, length, 5.4, 22, 0, 2.5, 11);
  const garages = 22,
    bay = length / garages;
  for (let g = 0; g < garages; g++) {
    const x = -halfLength + bay * (g + 0.5);
    pits.box(mat.interior, bay - 1.6, 4.2, 0.3, x, 2.1, -0.1);
    pits.box(
      teams[Math.floor(g / 2) % teams.length],
      bay - 0.6,
      0.7,
      0.3,
      x,
      4.7,
      -0.12,
    );
  }
  pits.box(mat.roof, length + 2, 0.35, 25, 0, 5.4, 9.5);
  pits.box(mat.glass, length, 3.3, 20, 0, 7.2, 12);
  pits.box(mat.roof, length + 2, 0.35, 25, 0, 8.9, 9.5);
  pits.box(mat.lightGlass, length, 3.3, 20, 0, 10.6, 12);
  pits.box(mat.roof, length + 4, 0.8, 27, 0, 12.5, 10);
  for (let x = -halfLength; x <= halfLength; x += 4) {
    pits.box(mat.dark, 0.18, 3.3, 0.2, x, 7.2, 1.9);
    pits.box(mat.dark, 0.18, 3.3, 0.2, x, 10.6, 1.9);
  }
  pits.add(
    new T.MeshBasicMaterial({
      map: signTexture("SPA-FRANCORCHAMPS", "#0d1724", "#ffffff"),
    }),
    new T.PlaneGeometry(64, 8),
    0,
    16.5,
    -0.6,
    0,
    Math.PI,
    0,
  );
  pits.box(mat.dark, 66, 8.6, 0.6, 0, 16.5, 0);
  // Team stands on the pit wall, one per team.
  const wallLane = halfWidthAt(0) + 3.3 - garageFront;
  for (let t = 0; t < TEAMS.length; t++) {
    const x = -halfLength + (length / TEAMS.length) * (t + 0.5);
    pits.box(mat.dark, 5, 2.2, 2.2, x, 1.1, wallLane);
    pits.box(teams[t], 5.6, 0.3, 2.8, x, 2.6, wallLane);
  }
  clearings.push({
    x: mid.x + Math.sin(pitYaw) * 30,
    z: mid.z + Math.cos(pitYaw) * 30,
    yaw: pitYaw,
    halfLength: halfLength + 30,
    halfDepth: 70,
  });
  // Paddock: motorhomes and transporters behind the garages.
  for (let t = 0; t < TEAMS.length; t++) {
    const x = -halfLength + 25 + t * ((length - 50) / (TEAMS.length - 1));
    for (const [w, h, d, z, material] of [
      [16, 4.2, 2.6, 34, mat.hut],
      [20, 10, 12, 52, teams[t]],
    ] as [number, number, number, number, T.Material][]) {
      const wx = mid.x + dx * x - dz * z,
        wz = mid.z + dz * x + dx * z;
      if (!clearOf(wx, wz, 22)) continue;
      const y = ground.heightAt(wx, wz);
      const p = new Placer(batch, { x: wx, y: y - 1, z: wz }, pitYaw);
      p.box(material, w, h + 1, d, 0, (h + 1) / 2, 0);
      if (h > 5) p.box(mat.glass, w + 0.2, 2.6, d + 0.2, 0, h - 1.2, 0);
      clearings.push({
        x: wx,
        z: wz,
        yaw: pitYaw,
        halfLength: w / 2 + 8,
        halfDepth: d / 2 + 8,
      });
    }
  }

  // ── Start gantry with the five red lights ────────────────────────────────
  const g = frameAt(3);
  const span = halfWidthAt(3) + 2.4;
  const gantry = new Placer(
    batch,
    { x: g.x, y: g.y, z: g.z },
    yawAlong(g.tx, g.tz),
  );
  for (const z of [-span, span]) gantry.box(mat.dark, 0.9, 10, 0.9, 0, 4.6, z);
  gantry.box(mat.dark, 1.2, 1.5, span * 2 + 0.9, 0, 8.9, 0);
  gantry.add(
    new T.MeshBasicMaterial({
      map: signTexture("THE CAREER GRAND PRIX", "#0d1724", "#ffffff"),
    }),
    new T.PlaneGeometry(span * 2 - 1, 1.3),
    -0.62,
    8.9,
    0,
    0,
    -Math.PI / 2,
    0,
  );
  const lamps = Array.from(
    { length: 5 },
    () =>
      new T.MeshStandardMaterial({
        color: 0x1a0606,
        emissive: 0xff1212,
        emissiveIntensity: 0,
        roughness: 0.3,
        toneMapped: false,
      }),
  );
  lamps.forEach((lamp, k) => {
    const z = (k - 2) * 1.05;
    gantry.box(mat.dark, 0.5, 1.8, 0.75, 0, 7.2, z);
    for (const y of [7.62, 6.78])
      gantry.add(
        lamp,
        new T.CircleGeometry(0.24, 20),
        -0.27,
        y,
        z,
        0,
        -Math.PI / 2,
        0,
      );
  });

  // ── Marshal posts and TV camera towers ──────────────────────────────────
  for (let s = 140, n = 0; s < 6900; s += 430, n++) {
    const side: Side = n % 2 ? 1 : -1;
    if (side > 0 && s > 6600) continue;
    const at = trackside(s, side, barrierAt(s, side > 0 ? 1 : 0) + 2.6);
    if (!clearOf(at.x, at.z, 6)) continue;
    const p = new Placer(batch, { x: at.x, y: at.y - 0.3, z: at.z }, at.yaw);
    p.box(mat.hut, 2.4, 2.6, 2.2, 0, 1.3, 0.6);
    p.box(mat.orange, 2.8, 0.3, 2.6, 0, 2.75, 0.6);
    p.box(mat.orange, 2.42, 0.4, 2.22, 0, 1.9, 0.6);
  }
  for (const [s, side] of [
    [180, -1],
    [1130, -1],
    [2350, -1],
    [3760, 1],
    [5120, -1],
    [6080, 1],
  ] as [number, Side][]) {
    const at = trackside(s, side, barrierAt(s, side > 0 ? 1 : 0) + 4);
    if (!clearOf(at.x, at.z, 6)) continue;
    const p = new Placer(batch, { x: at.x, y: at.y - 0.3, z: at.z }, at.yaw);
    for (const [lx, lz] of [
      [-1.2, 0],
      [1.2, 0],
      [-1.2, 2.4],
      [1.2, 2.4],
    ])
      p.box(mat.steel, 0.16, 11, 0.16, lx, 5.5, lz);
    for (let y = 2; y < 11; y += 3)
      p.box(mat.steel, 2.5, 0.1, 0.1, 0, y, 0, Math.PI / 5);
    p.box(mat.hut, 3.4, 0.25, 3.4, 0, 11, 1.2);
    p.box(mat.dark, 0.5, 0.5, 1, 0, 11.6, 0.6);
    p.box(mat.orange, 0.06, 1, 3.4, -1.7, 11.6, 1.2);
  }

  batch.build(scene, true, true);

  // ── Checkpoint screens ───────────────────────────────────────────────────
  const screens: { mesh: T.Mesh; anchor: T.Vector3 }[] = [];
  const screenBatch = new Batch();
  journeyStories.forEach((story, i) => {
    const board = checkpointBoard(i);
    const y = Math.min(
      board.base[1],
      ground.heightAt(board.base[0], board.base[2]),
    );
    const p = new Placer(
      screenBatch,
      { x: board.base[0], y, z: board.base[2] },
      board.yaw,
    );
    const { width, height, clearance } = BOARD;
    const centre = clearance + height / 2;
    for (const x of [-width / 2 + 1.2, width / 2 - 1.2])
      p.box(
        mat.dark,
        0.5,
        centre + 0.5,
        0.5,
        x,
        (centre + 0.5) / 2 - 0.5,
        -0.5,
      );
    p.box(mat.dark, width + 0.7, height + 0.7, 0.45, 0, centre, -0.3);
    const trim = new T.MeshStandardMaterial({
      color: story.color,
      metalness: 0.4,
      roughness: 0.4,
      emissive: story.color,
      emissiveIntensity: 0.3,
    });
    p.box(trim, width + 0.8, 0.08, 0.12, 0, centre + height / 2 + 0.22, -0.02);
    p.box(
      mat.steel,
      width + 1,
      0.14,
      0.75,
      0,
      centre - height / 2 - 0.35,
      -0.3,
    );
    // Ribbed rear housing and braced feet give the screens a physical presence.
    for (const x of [-width / 2 + 1.2, width / 2 - 1.2]) {
      p.box(mat.steel, 1.7, 0.18, 2.2, x, 0.1, -0.5);
      p.box(mat.steel, 0.16, clearance, 0.16, x, clearance / 2, -0.9);
    }
    const mesh = new T.Mesh(
      new T.PlaneGeometry(width, height),
      new T.MeshBasicMaterial({
        map: screenTexture(
          i + 1,
          story.name,
          route.corners[i],
          story.color,
          story.title,
        ),
        toneMapped: false,
      }),
    );
    mesh.position.set(board.base[0], y + centre, board.base[2]);
    mesh.rotation.y = board.yaw;
    mesh.position.x += Math.sin(board.yaw) * -0.05;
    mesh.position.z += Math.cos(board.yaw) * -0.05;
    scene.add(mesh);
    screens.push({ mesh, anchor: mesh.position.clone() });
    clearings.push({
      x: board.base[0],
      z: board.base[2],
      yaw: board.yaw,
      halfLength: width / 2 + 6,
      halfDepth: 8,
    });
  });
  screenBatch.build(scene, true, true);
  return { lamps, screens, clearings };
}
