import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { smoothstep, trackModel } from "@/lib/trackside";
import { mulberry32 } from "@/lib/random";
import { forestMask, type Ground } from "./terrain";
import { leafTexture, spruceTexture } from "./textures";
import { insideClearing, type Clearing } from "./venue";

const BARK = new T.Color(0x6a5644);
const WHITE = new T.Color(1, 1, 1);

/**
 * Bakes soft lighting into a part: normals bent away from `centre` so a crown
 * shades as one rounded mass, and vertex colour darkened where light can't reach.
 */
function shade(
  geometry: T.BufferGeometry,
  centre: T.Vector3,
  bend: number,
  occlusion: (p: T.Vector3) => number,
  color = WHITE,
) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const position = g.getAttribute("position"),
    normal = g.getAttribute("normal");
  const colors = new Float32Array(position.count * 3);
  const p = new T.Vector3(),
    n = new T.Vector3(),
    out = new T.Vector3();
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i);
    n.fromBufferAttribute(normal, i);
    out
      .copy(p)
      .sub(centre)
      .normalize()
      .multiplyScalar(bend)
      .addScaledVector(n, 1 - bend)
      .normalize();
    normal.setXYZ(i, out.x, out.y, out.z);
    const ao = occlusion(p);
    colors.set([color.r * ao, color.g * ao, color.b * ao], i * 3);
  }
  g.setAttribute("color", new T.BufferAttribute(colors, 3));
  if (!g.getAttribute("uv"))
    g.setAttribute("uv", new T.BufferAttribute(new Float32Array(position.count * 2), 2));
  return g;
}

/** Planar UVs per triangle along its dominant axis, so a lumpy crown has no seams. */
function boxUV(g: T.BufferGeometry, scale: number, offset: number) {
  const position = g.getAttribute("position");
  const uvs = new Float32Array(position.count * 2);
  const a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3(),
    n = new T.Vector3();
  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b));
    const [ax, ay, az] = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)];
    for (let k = 0; k < 3; k++) {
      const p = [a, b, c][k];
      const [u, v] =
        ax >= ay && ax >= az ? [p.z, p.y] : ay >= az ? [p.x, p.z] : [p.x, p.y];
      uvs.set([u * scale + offset, v * scale], (i + k) * 2);
    }
  }
  g.setAttribute("uv", new T.BufferAttribute(uvs, 2));
}

/** Unit-height Norway spruce: drooping tiers of boughs round a thin trunk. */
function spruce(tiers: number, segments: number, rows: number, trunk: boolean) {
  const random = mulberry32(tiers * 31 + segments);
  const parts: T.BufferGeometry[] = [];
  if (trunk)
    parts.push(
      shade(
        new T.CylinderGeometry(0.011, 0.022, 0.34, 5, 1, true).translate(0, 0.17, 0),
        new T.Vector3(0, 0.17, 0),
        0,
        () => 0.75,
        BARK,
      ),
    );
  for (let k = 0; k < tiers; k++) {
    const f = tiers > 1 ? k / (tiers - 1) : 0;
    const radius = 0.19 - f * 0.12,
      height = 0.36 - f * 0.08;
    const rim = 0.09 + f * 0.6;
    const cone = new T.ConeGeometry(radius, height, segments, rows, true);
    const position = cone.getAttribute("position");
    const phase = random() * 6;
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      if (y < -height / 2 + 1e-6) {
        // Ragged, sagging rim; matched at the seam so the tier stays closed.
        const angle = Math.atan2(position.getZ(i), position.getX(i));
        position.setY(i, y - 0.012 * (1.4 + Math.sin(angle * 3 + phase)));
      } else if (rows > 1 && y < height / 2 - 1e-6) {
        // Boughs bow outwards before their tips droop.
        position.setX(i, position.getX(i) * 1.14);
        position.setZ(i, position.getZ(i) * 1.14);
      }
    }
    cone.computeVertexNormals();
    cone.translate(0, rim + height / 2, 0);
    cone.rotateY(random() * Math.PI * 2);
    const uv = cone.getAttribute("uv"),
      shift = random();
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 2 + shift);
    parts.push(
      shade(cone, new T.Vector3(0, 0.42, 0), 0.45, (p) => {
        const out = Math.min(1, Math.hypot(p.x, p.z) / radius);
        return (0.5 + 0.5 * Math.min(1, p.y)) * (0.55 + 0.45 * out);
      }),
    );
  }
  return mergeGeometries(parts)!;
}

/** Unit-height beech: a crown of lumpy, leaf-textured masses on a short trunk. */
function beech(detail: number) {
  const random = mulberry32(17 + detail);
  const parts = [
    shade(
      new T.CylinderGeometry(0.016, 0.032, 0.52, 6, 1, true).translate(0, 0.26, 0),
      new T.Vector3(0, 0.26, 0),
      0,
      () => 0.7,
      BARK,
    ),
  ];
  const centre = new T.Vector3(0, 0.64, 0);
  const masses: [number, number, number, number][] = [
    [0, 0.67, 0, 0.27],
    [0.16, 0.56, 0.05, 0.19],
    [-0.14, 0.58, -0.08, 0.2],
    [0.02, 0.84, -0.05, 0.17],
    [-0.04, 0.6, 0.16, 0.17],
  ];
  masses.forEach(([mx, my, mz, r], m) => {
    const g = new T.IcosahedronGeometry(1, m === 0 ? detail : 0);
    const position = g.getAttribute("position");
    const [a, b, c] = [random() * 6, random() * 6, random() * 6];
    const v = new T.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).normalize();
      const lump =
        0.82 + 0.36 * (0.5 + 0.5 * Math.sin(v.x * 4.1 + a) * Math.sin(v.y * 3.7 + b) * Math.sin(v.z * 4.4 + c));
      position.setXYZ(i, mx + v.x * r * lump, my + v.y * r * lump * 0.88, mz + v.z * r * lump);
    }
    g.deleteAttribute("normal");
    g.computeVertexNormals();
    boxUV(g, 3.4, random());
    parts.push(
      shade(g, centre, 0.75, (p) => {
        const out = Math.min(1, p.distanceTo(centre) / 0.36);
        return (0.42 + 0.58 * smoothstep(0.38, 0.98, p.y)) * (0.7 + 0.3 * out);
      }),
    );
  });
  return mergeGeometries(parts)!;
}

/** An Ardennes forest of spruce with some beech, kept clear of the circuit and venue. */
export async function createForest(
  scene: T.Object3D,
  ground: Ground,
  clearings: Clearing[],
  fine: boolean,
  pause: () => Promise<void>,
) {
  const random = mulberry32(91);
  type Tree = { x: number; y: number; z: number; h: number; w: number; r: number; c: T.Color };
  const near: Tree[] = [],
    leafy: Tree[] = [],
    far: Tree[] = [];
  const plant = (spacing: number, extentX: number, extentZ: number, ring: [number, number]) => {
    for (let gx = -extentX; gx <= extentX; gx += spacing)
      for (let gz = -extentZ; gz <= extentZ; gz += spacing) {
        const x = gx + (random() - 0.5) * spacing * 0.9,
          z = gz + (random() - 0.5) * spacing * 0.9;
        const { distance, index } = ground.trackDistance(x, z);
        if (distance < ring[0] || distance >= ring[1]) continue;
        const wall = Math.max(trackModel.barrier[0][index], trackModel.barrier[1][index]);
        if (distance < Math.max(24, wall + 9)) continue;
        const chance =
          forestMask(x, z) * 0.95 + 0.3 * (1 - smoothstep(40, 220, distance));
        if (random() > chance) continue;
        if (clearings.some((c) => insideClearing(c, x, z))) continue;
        const y = ground.heightAt(x, z) - 0.4;
        const conifer = random() < 0.74;
        const h = conifer ? 20 + random() * 13 : 14 + random() * 9;
        // Near trees tint their textures; distant ones carry the whole colour.
        const c =
          ring[0] > 0
            ? new T.Color().setHSL(0.36 + random() * 0.04, 0.3 + random() * 0.14, 0.12 + random() * 0.06)
            : conifer
              ? new T.Color().setHSL(0.36 + random() * 0.08, 0.12 + random() * 0.14, 0.46 + random() * 0.16)
              : new T.Color().setHSL(0.2 + random() * 0.08, 0.3 + random() * 0.25, 0.62 + random() * 0.2);
        const tree = {
          x,
          y,
          z,
          h,
          w: h * (conifer ? 0.85 + random() * 0.3 : 0.9 + random() * 0.35),
          r: random() * Math.PI * 2,
          c,
        };
        if (ring[0] > 0) {
          // Distant trees are sparser but broader, so the canopy reads as continuous.
          tree.w *= 1.5;
          tree.h *= 1.15;
          far.push(tree);
        } else if (conifer) near.push(tree);
        else leafy.push(tree);
      }
  };
  plant(fine ? 13 : 18, 1900, 1450, [0, 520]);
  await pause();
  plant(fine ? 22 : 32, 4600, 3800, [520, Infinity]);
  await pause();

  const matrix = new T.Matrix4(),
    q = new T.Quaternion(),
    up = new T.Vector3(0, 1, 0);
  // Alpha-to-coverage gives the bough and leaf cut-outs soft, antialiased edges.
  const foliage = (map: T.Texture) =>
    new T.MeshStandardMaterial({
      map,
      vertexColors: true,
      alphaTest: 0.5,
      alphaToCoverage: true,
      side: T.DoubleSide,
      roughness: 0.9,
    });
  const distant = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const meshes: T.InstancedMesh[] = [];
  // Chunk the forest so whole patches outside the view (or the shadow camera) are culled.
  for (const [list, geometry, material, shadow, chunk] of [
    [near, fine ? spruce(5, 7, 2, true) : spruce(4, 6, 1, true), foliage(spruceTexture()), true, 450],
    [leafy, beech(fine ? 1 : 0), foliage(leafTexture()), true, 450],
    [far, spruce(2, 5, 1, false), distant, false, 1600],
  ] as [Tree[], T.BufferGeometry, T.Material, boolean, number][]) {
    const groups = new Map<string, Tree[]>();
    for (const t of list) {
      const key = `${Math.floor(t.x / chunk)}:${Math.floor(t.z / chunk)}`;
      const group = groups.get(key);
      if (group) group.push(t);
      else groups.set(key, [t]);
    }
    groups.forEach((trees) => {
      const mesh = new T.InstancedMesh(geometry, material, trees.length);
      trees.forEach((t, i) => {
        q.setFromAxisAngle(up, t.r);
        matrix.compose(new T.Vector3(t.x, t.y, t.z), q, new T.Vector3(t.w, t.h, t.w));
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, t.c);
      });
      mesh.castShadow = shadow;
      mesh.receiveShadow = false;
      mesh.matrixAutoUpdate = false;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      meshes.push(mesh);
    });
  }
  return meshes;
}
