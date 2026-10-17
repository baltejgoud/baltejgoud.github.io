import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { smoothstep, trackModel } from "@/lib/trackside";
import { mulberry32 } from "@/lib/random";
import { forestMask, type Ground } from "./terrain";
import { insideClearing, type Clearing } from "./venue";

const tint = (geometry: T.BufferGeometry, color: number) => {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const c = new T.Color(color);
  const count = g.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new T.BufferAttribute(colors, 3));
  g.deleteAttribute("uv");
  return g;
};
/** Unit-height trees; foliage is white so each instance's colour shows through. */
function spruce(detailed: boolean) {
  const parts = [tint(new T.CylinderGeometry(0.018, 0.028, 0.2, 5).translate(0, 0.1, 0), 0x7a6450)];
  const tiers = detailed
    ? [
        [0.17, 0.42, 0.32],
        [0.13, 0.36, 0.55],
        [0.085, 0.3, 0.8],
      ]
    : [[0.2, 0.85, 0.55]];
  for (const [radius, height, y] of tiers)
    parts.push(
      tint(new T.ConeGeometry(radius, height, detailed ? 7 : 4, 1, true).translate(0, y, 0), 0xffffff),
    );
  return mergeGeometries(parts)!;
}
function broadleaf() {
  const crown = new T.IcosahedronGeometry(1, 1).scale(0.3, 0.27, 0.3).translate(0, 0.66, 0);
  return mergeGeometries([
    tint(new T.CylinderGeometry(0.025, 0.04, 0.45, 5).translate(0, 0.22, 0), 0x6d5a45),
    tint(crown, 0xffffff),
  ])!;
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
        const c = conifer
          ? new T.Color().setHSL(0.36 + random() * 0.04, 0.32 + random() * 0.16, 0.12 + random() * 0.07)
          : new T.Color().setHSL(0.21 + random() * 0.08, 0.38 + random() * 0.18, 0.2 + random() * 0.1);
        const tree = { x, y, z, h, w: h * (0.85 + random() * 0.3), r: random() * Math.PI * 2, c };
        if (ring[0] > 0) {
          // Distant trees are sparser but broader, so the canopy reads as continuous.
          tree.w *= 1.5;
          tree.h *= 1.15;
          far.push(tree);
        }
        else if (conifer) near.push(tree);
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
  const material = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    flatShading: true,
  });
  const meshes: T.InstancedMesh[] = [];
  // Chunk the forest so whole patches outside the view (or the shadow camera) are culled.
  for (const [list, geometry, shadow, chunk] of [
    [near, spruce(true), true, 450],
    [leafy, broadleaf(), true, 450],
    [far, spruce(false), false, 1600],
  ] as [Tree[], T.BufferGeometry, boolean, number][]) {
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
