import * as T from "three";
import { mulberry32 } from "@/lib/random";

/** Canvas-drawn textures. Everything is generated locally; nothing is fetched. */
export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  { repeat = true, color = true } = {},
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!, width, height);
  const texture = new T.CanvasTexture(canvas);
  if (color) texture.colorSpace = T.SRGBColorSpace;
  if (repeat) texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// ── Tileable fields ────────────────────────────────────────────────────────
const lattice = (x: number, y: number, period: number, seed: number) => {
  const ix = ((x % period) + period) % period,
    iy = ((y % period) + period) % period;
  let h =
    Math.imul(ix, 374761393) +
    Math.imul(iy, 668265263) +
    Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** Value noise that repeats every `period` lattice cells. */
function tileNoise(x: number, y: number, period: number, seed: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  const a = lattice(ix, iy, period, seed),
    b = lattice(ix + 1, iy, period, seed),
    c = lattice(ix, iy + 1, period, seed),
    d = lattice(ix + 1, iy + 1, period, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Fractal noise across a tile `size` pixels wide, `cells` lattice cells at the coarsest octave. */
function tileFbm(
  x: number,
  y: number,
  size: number,
  cells: number,
  octaves: number,
  seed: number,
) {
  let total = 0,
    amplitude = 0.5,
    norm = 0,
    period = cells;
  for (let o = 0; o < octaves; o++) {
    total +=
      tileNoise((x / size) * period, (y / size) * period, period, seed + o) *
      amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    period *= 2;
  }
  return total / norm;
}

/** A greyscale map the size of a texture. Writes wrap round the edges so it tiles. */
class Field {
  readonly data: Float32Array;
  constructor(
    readonly w: number,
    readonly h: number,
    fill = 0,
  ) {
    this.data = new Float32Array(w * h).fill(fill);
  }
  index(x: number, y: number) {
    const { w, h } = this;
    return (
      (((Math.round(y) % h) + h) % h) * w + (((Math.round(x) % w) + w) % w)
    );
  }
  at(x: number, y: number) {
    return this.data[this.index(x, y)];
  }
  /** Visits the pixels of an ellipse; `d` runs from 0 at its centre to 1 at the rim. */
  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    angle: number,
    visit: (i: number, d: number) => void,
  ) {
    const r = Math.max(rx, ry),
      cos = Math.cos(angle),
      sin = Math.sin(angle);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x - cx,
          dy = y - cy;
        const u = (dx * cos + dy * sin) / rx,
          v = (dy * cos - dx * sin) / ry;
        const d = u * u + v * v;
        if (d <= 1) visit(this.index(x, y), Math.sqrt(d));
      }
  }
}

/** Fills a canvas pixel by pixel from `rgb(i)`, colour values 0–1. */
function pixels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: (i: number) => [number, number, number],
) {
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = rgb(i);
    image.data.set([r * 255, g * 255, b * 255, 255], i * 4);
  }
  ctx.putImageData(image, 0, 0);
}
const grey =
  (field: Field) =>
  (i: number): [number, number, number] => {
    const v = field.data[i];
    return [v, v, v];
  };
const colours =
  (rgb: Float32Array) =>
  (i: number): [number, number, number] => [
    rgb[i * 3],
    rgb[i * 3 + 1],
    rgb[i * 3 + 2],
  ];

/** Tangent-space normals from a height field (canvas y runs down the texture's v). */
function normalTexture(height: Field, strength: number) {
  return canvasTexture(
    height.w,
    height.h,
    (ctx, w, h) => {
      const image = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const nx = (height.at(x - 1, y) - height.at(x + 1, y)) * strength,
            ny = (height.at(x, y + 1) - height.at(x, y - 1)) * strength;
          const length = Math.hypot(nx, ny, 1);
          image.data.set(
            [
              (nx / length) * 127.5 + 127.5,
              (ny / length) * 127.5 + 127.5,
              (1 / length) * 127.5 + 127.5,
              255,
            ],
            (y * w + x) * 4,
          );
        }
      ctx.putImageData(image, 0, 0);
    },
    { color: false },
  );
}

/** Runs `draw` at (x, y) and at the copies a mark `reach` px wide needs to wrap round the tile. */
function tiled(
  x: number,
  y: number,
  reach: number,
  w: number,
  h: number,
  draw: (x: number, y: number) => void,
) {
  for (const ox of [0, -w, w])
    for (const oy of [0, -h, h]) {
      if (ox && (x + ox < -reach || x + ox > w + reach)) continue;
      if (oy && (y + oy < -reach || y + oy > h + reach)) continue;
      draw(x + ox, y + oy);
    }
}

// ── Track surfaces ─────────────────────────────────────────────────────────
/**
 * Aggregate in binder with relief and roughness. Stones are low-contrast and
 * polished smoother than the binder, so the surface sheens at a low sun.
 * Vertex colours carry the rubbered line and resurfaced patches.
 */
export function asphaltMaps() {
  const size = 512,
    random = mulberry32(11);
  const tone = new Field(size, size),
    height = new Field(size, size),
    rough = new Field(size, size, 0.95);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      tone.data[i] =
        0.5 +
        (tileFbm(x, y, size, 6, 4, 3) - 0.5) * 0.18 +
        (random() - 0.5) * 0.07;
      height.data[i] = random() * 0.3;
    }
  for (let n = 0; n < 14000; n++) {
    const r = 0.6 + random() ** 2.4 * 2.4;
    const pick = random();
    const shade =
      pick < 0.12
        ? 0.66 + random() * 0.1
        : pick < 0.4
          ? 0.3 + random() * 0.1
          : 0.44 + random() * 0.16;
    tone.ellipse(
      random() * size,
      random() * size,
      r,
      r * (0.6 + random() * 0.4),
      random() * 3,
      (i, d) => {
        tone.data[i] = shade * (1 - 0.25 * d * d);
        height.data[i] = Math.max(
          height.data[i],
          (1 - d * d) * (0.5 + r * 0.45),
        );
        rough.data[i] = 0.62 + d * 0.2;
      },
    );
  }
  return {
    map: canvasTexture(size, size, (ctx, w, h) =>
      pixels(ctx, w, h, grey(tone)),
    ),
    normalMap: normalTexture(height, 0.8),
    roughnessMap: canvasTexture(
      size,
      size,
      (ctx, w, h) => pixels(ctx, w, h, grey(rough)),
      { color: false },
    ),
  };
}

/**
 * Road wear over one 64 m stretch, stretched across the full width: paving
 * seams between the three laid lanes, a transverse joint, tar-sealed cracks
 * (some following the seams) and faint oil stains. Black with alpha.
 */
export const roadWearTexture = () =>
  canvasTexture(512, 2048, (ctx, w, h) => {
    const random = mulberry32(91);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [u, alpha] of [
      [1 / 3, 0.2],
      [2 / 3, 0.2],
    ]) {
      ctx.strokeStyle = `rgba(10, 10, 12, ${alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 64)
        ctx.lineTo(u * w + Math.sin(y / 300 + u * 9) * 1.5, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(10, 10, 12, 0.18)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w, h * 0.62 + 6);
    ctx.stroke();
    // Tar snakes: glossy black sealant laid along cracks, with short branches.
    const stroke = (points: [number, number][]) => {
      for (const oy of [-h, 0, h]) {
        ctx.beginPath();
        points.forEach(([x, y], k) =>
          k ? ctx.lineTo(x, y + oy) : ctx.moveTo(x, y + oy),
        );
        ctx.stroke();
      }
    };
    const snake = (x: number, y: number, heading: number, steps: number) => {
      ctx.strokeStyle = `rgba(6, 6, 7, ${0.4 + random() * 0.2})`;
      const width = 1.2 + random() * 1.4;
      const points: [number, number][] = [[x, y]];
      const branches: [number, number][][] = [];
      for (let k = 0; k < steps; k++) {
        heading += (random() - 0.5) * 0.9;
        x += Math.cos(heading) * (6 + random() * 10);
        y += Math.sin(heading) * (6 + random() * 10);
        points.push([x, y]);
        if (random() < 0.08) {
          const branch: [number, number][] = [[x, y]];
          let a = heading + (random() < 0.5 ? 1.2 : -1.2),
            bx = x,
            by = y;
          for (let b = 0; b < 4; b++) {
            a += (random() - 0.5) * 0.8;
            bx += Math.cos(a) * 9;
            by += Math.sin(a) * 9;
            branch.push([bx, by]);
          }
          branches.push(branch);
        }
      }
      ctx.lineWidth = width;
      stroke(points);
      ctx.lineWidth = width * 0.7;
      branches.forEach(stroke);
    };
    for (let n = 0; n < 5; n++) {
      // Along a seam…
      const u = random() < 0.5 ? 1 / 3 : 2 / 3;
      snake(
        u * w,
        random() * h,
        Math.PI / 2 + (random() - 0.5) * 0.3,
        10 + Math.floor(random() * 26),
      );
    }
    for (let n = 0; n < 7; n++)
      // …and across the lanes.
      snake(
        random() * w,
        random() * h,
        (random() < 0.5 ? 0 : Math.PI) + (random() - 0.5) * 0.7,
        4 + Math.floor(random() * 12),
      );
    for (let n = 0; n < 6; n++) {
      const x = random() * w,
        y = random() * h,
        r = 8 + random() * 22;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(0, 0, 0, 0.16)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

/** Mown turf: blades over soft mottling. Mixed at two scales in the terrain shader. */
export const grassTexture = () =>
  canvasTexture(512, 512, (ctx, w, h) => {
    const random = mulberry32(21);
    pixels(ctx, w, h, (i) => {
      const x = i % w,
        y = Math.floor(i / w);
      const v =
        0.8 +
        (tileFbm(x, y, w, 4, 4, 22) - 0.5) * 0.34 +
        (random() - 0.5) * 0.1;
      return [v * 0.9, v, v * 0.76];
    });
    const blades = [
      "#f3fadc",
      "#dbeab4",
      "#b4cc86",
      "#8ea862",
      "#6f8a4c",
      "#c8d49a",
    ];
    ctx.lineCap = "round";
    for (let n = 0; n < 16000; n++) {
      const x = random() * w,
        y = random() * h,
        length = 2 + random() * 5,
        lean = (random() - 0.5) * 2.4;
      ctx.globalAlpha = 0.22 + random() * 0.35;
      ctx.strokeStyle = blades[Math.floor(random() * blades.length)];
      ctx.lineWidth = 0.6 + random() * 0.9;
      tiled(x, y, 8, w, h, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + lean, py - length);
        ctx.stroke();
      });
    }
  });

/** Rounded river gravel with relief. */
export function gravelMaps() {
  const size = 256,
    random = mulberry32(31);
  const height = new Field(size, size);
  const rgb = new Float32Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    const v = 0.36 + random() * 0.08;
    rgb.set([v * 1.05, v, v * 0.88], i * 3);
  }
  const stones = [
    [0.86, 0.81, 0.72],
    [0.78, 0.72, 0.61],
    [0.91, 0.88, 0.82],
    [0.64, 0.6, 0.52],
    [0.55, 0.53, 0.5],
    [0.74, 0.7, 0.64],
  ];
  for (let n = 0; n < 3600; n++) {
    const r = 1.6 + random() * 3.2;
    const [cr, cg, cb] = stones[Math.floor(random() * stones.length)];
    const lift = 0.85 + random() * 0.25;
    height.ellipse(
      random() * size,
      random() * size,
      r,
      r * (0.65 + random() * 0.35),
      random() * 3,
      (i, d) => {
        const dome = Math.sqrt(1 - d * d) * r * 0.5;
        if (dome < height.data[i]) return;
        height.data[i] = dome;
        const shade = lift * (1 - 0.35 * d * d);
        rgb.set([cr * shade, cg * shade, cb * shade], i * 3);
      },
    );
  }
  return {
    map: canvasTexture(size, size, (ctx, w, h) =>
      pixels(ctx, w, h, colours(rgb)),
    ),
    normalMap: normalTexture(height, 0.7),
  };
}

/**
 * One red and one white kerb block, 1.5 m each. u = 0 is the outer edge and
 * u = 1 the track side, where tyres leave rubber; ridges run across the outer half.
 */
export function kerbMaps() {
  const w = 128,
    h = 256,
    random = mulberry32(51);
  const height = new Field(w, h);
  const rgb = new Float32Array(w * h * 3);
  const red = [0.78, 0.13, 0.15],
    white = [0.93, 0.92, 0.89];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x,
        seam = y % 128 < 2;
      const ridge = Math.sin(((y % 12.8) / 12.8) * Math.PI) ** 0.7;
      const outer = 1 - Math.min(1, Math.max(0, (x / w - 0.45) / 0.12));
      height.data[i] = ridge * outer * 1.6 + (seam ? -1 : 0);
      const base = y < h / 2 ? red : white;
      const grime =
        1 -
        0.18 * tileFbm(x, y, w, 4, 3, 52) -
        0.08 * random() -
        (seam ? 0.25 : 0);
      rgb.set([base[0] * grime, base[1] * grime, base[2] * grime], i * 3);
    }
  // Rubber laid down by the inside wheels.
  for (let n = 0; n < 90; n++) {
    const x = w * (0.62 + random() * 0.38),
      y = random() * h,
      length = 20 + random() * 120,
      weight = (0.15 + random() * 0.35) * 0.35,
      width = 1.5 + random() * 2;
    for (let k = 0; k < length; k++)
      height.ellipse(x + Math.sin(k / 30) * 2, y + k, width, 1, 0, (i) => {
        for (let c = 0; c < 3; c++) rgb[i * 3 + c] *= 1 - weight;
      });
  }
  return {
    map: canvasTexture(w, h, (ctx) => pixels(ctx, w, h, colours(rgb))),
    normalMap: normalTexture(height, 1.2),
  };
}

/** Tyre streaks for braking zones: two tracks across a 2.6 m strip, black with alpha. */
export const skidTexture = () =>
  canvasTexture(128, 512, (ctx, w, h) => {
    const random = mulberry32(61);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    for (let n = 0; n < 70; n++) {
      const lane = n % 2 ? 0.19 : 0.81;
      const x = (lane + (random() - 0.5) * 0.12) * w,
        length = h * (0.15 + random() * 0.55),
        wobble = (random() - 0.5) * 8;
      ctx.strokeStyle = `rgba(6, 6, 7, ${0.06 + random() * 0.2})`;
      ctx.lineWidth = 1.5 + random() * 5;
      tiled(x, random() * h, length, w, h, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(
          px + wobble * 0.3,
          py + length / 3,
          px + wobble * 0.7,
          py + (2 * length) / 3,
          px + wobble,
          py + length,
        );
        ctx.stroke();
      });
    }
  });

/** Catch fence: fine diamond mesh and tensioning cables. u runs 1 m along, v up the full height. */
export const fenceTexture = () =>
  canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(150, 157, 164, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -h; i < w + h; i += 16) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
    }
    ctx.stroke();
    ctx.fillStyle = "#8f979f";
    for (const y of [0.31, 0.62, 0.93]) ctx.fillRect(0, y * h, w, 3);
    ctx.fillStyle = "#9aa2aa";
    ctx.fillRect(0, 0, w, 8);
  });

/** Conveyor-belt cover over a tyre wall. */
export const tyreWallTexture = () =>
  canvasTexture(128, 64, (ctx) => {
    ctx.fillStyle = "#e9e6df";
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = "#cf2630";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#1a1b1e";
    ctx.fillRect(0, 0, 128, 8);
    ctx.fillRect(0, 58, 128, 6);
    ctx.fillStyle = "#00000026";
    for (let x = 4; x < 128; x += 16) ctx.fillRect(x, 12, 3, 42);
  });

// ── Foliage ────────────────────────────────────────────────────────────────
/** One tier of spruce boughs: the apex at the top, ragged drooping tips along the rim. */
export const spruceTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const random = mulberry32(71);
    ctx.clearRect(0, 0, w, h);
    const core = ctx.createLinearGradient(0, 0, 0, h);
    core.addColorStop(0, "#22392a");
    core.addColorStop(0.5, "#29452f");
    core.addColorStop(0.7, "rgba(41, 69, 47, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);
    const greens = [
      "#2b4a31",
      "#335a38",
      "#3d6741",
      "#4a7546",
      "#5a854f",
      "#739a5c",
    ];
    ctx.lineCap = "round";
    const boughs = 22;
    for (let b = 0; b < boughs; b++) {
      let x = (b / boughs) * w + random() * 5,
        y = random() * h * 0.25;
      const drift = (random() - 0.5) * 0.6,
        end = h * (0.8 + random() * 0.19);
      while (y < end) {
        const t = y / h,
          spread = 2.5 + t * 8;
        for (let k = 0; k < 4; k++) {
          const side = k % 2 ? 1 : -1,
            reach = spread * (0.5 + random() * 0.6),
            drop = reach * (0.5 + random() * 0.7);
          ctx.strokeStyle =
            greens[Math.min(5, Math.floor(random() * 2.5 + t * 3.5))];
          ctx.lineWidth = 1 + random() * 0.8;
          tiled(x, y, 14, w, h, (px, py) => {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + side * reach, py + drop);
            ctx.stroke();
          });
        }
        x += drift;
        y += 2;
      }
    }
  });

/** Clusters of beech leaves with gaps between them. */
export const leafTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const random = mulberry32(81);
    ctx.clearRect(0, 0, w, h);
    const greens = [
      "#36602a",
      "#437032",
      "#517f39",
      "#5f8e41",
      "#73a24e",
      "#2f5525",
    ];
    for (let c = 0; c < 150; c++) {
      const cx = random() * w,
        cy = random() * h,
        r = 7 + random() * 13;
      for (let n = 0; n < 26; n++) {
        const a = random() * Math.PI * 2,
          d = Math.sqrt(random()) * r;
        const rx = 2.4 + random() * 2.2,
          ry = 1.4 + random() * 1.2,
          turn = random() * Math.PI;
        ctx.fillStyle = greens[Math.floor(random() * greens.length)];
        tiled(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6, w, h, (px, py) => {
          ctx.beginPath();
          ctx.ellipse(px, py, rx, ry, turn, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  });

// ── Signage ────────────────────────────────────────────────────────────────
/** Braking marker board: black distance on white. */
export const markerTexture = (metres: number) =>
  canvasTexture(
    256,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = "#f4f4f1";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#16181b";
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.fillStyle = "#16181b";
      ctx.font = "800 118px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(metres), w / 2, h / 2 + 6, w - 30);
    },
    { repeat: false },
  );

/** Rows of spectators. Orange is common at Spa; the rest are team colours. */
export const crowdTexture = (seed: number) =>
  canvasTexture(1024, 512, (ctx, w, h) => {
    const random = mulberry32(seed);
    const rows = 24,
      rowH = h / rows,
      seatW = 13;
    const shirts = [
      "#ff7a1a",
      "#ff8c2b",
      "#f26b10",
      "#13235a",
      "#d81f2a",
      "#f2f2ef",
      "#141418",
      "#ffd23f",
      "#2a8f5b",
      "#2a6fd6",
      "#7a7f86",
      "#e8559a",
    ];
    const skin = ["#f1c7a5", "#d9a47e", "#a8714f", "#6e452f", "#f6d7c0"];
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.fillStyle = r % 2 ? "#3b4552" : "#424d5b";
      ctx.fillRect(0, y, w, rowH);
      ctx.fillStyle = "#1f5aa8";
      for (let x = 0; x < w; x += seatW)
        ctx.fillRect(x + 1, y + rowH * 0.5, seatW - 2, rowH * 0.45);
      for (let x = 0; x < w; x += seatW) {
        if (random() < 0.12) continue;
        const shirt =
          shirts[Math.floor(random() * (random() < 0.4 ? 3 : shirts.length))];
        const jitter = (random() - 0.5) * 3;
        ctx.fillStyle = shirt;
        ctx.fillRect(x + 2 + jitter, y + rowH * 0.42, seatW - 4, rowH * 0.5);
        ctx.fillStyle =
          random() < 0.2 ? shirt : skin[Math.floor(random() * skin.length)];
        ctx.beginPath();
        ctx.arc(
          x + seatW / 2 + jitter,
          y + rowH * 0.3,
          seatW * 0.24,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  });

/** Trackside advertising: the portfolio's own names, not real sponsors. */
export const HOARDINGS: [string, string, string][] = [
  ["SANKET", "#0d1b2e", "#ffcf3d"],
  ["BALTEJ GOUD", "#f4f1e8", "#13233a"],
  ["DATA × AI", "#d6372b", "#ffffff"],
  ["THE CAREER GRAND PRIX", "#13233a", "#ffffff"],
  ["OPEN TO DATA & AI ROLES", "#1f8a63", "#ffffff"],
  ["SPA-FRANCORCHAMPS", "#ffffff", "#c8102e"],
];
export const hoardingTexture = ([text, bg, fg]: [string, string, string]) =>
  canvasTexture(
    512,
    112,
    (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = fg;
      ctx.font = "800 58px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2 + 3, w - 40);
    },
    { repeat: false },
  );

/** A checkpoint's giant LED screen face. */
export const screenTexture = (
  number: number,
  name: string,
  place: string,
  color: string,
  title: string,
) =>
  canvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#132c3d");
      g.addColorStop(1, "#060f1b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 14, h);
      ctx.fillRect(48, 99, w - 96, 2);
      ctx.fillStyle = "#d7e5e9";
      ctx.font = "600 22px monospace";
      ctx.fillText("THE CAREER GRAND PRIX", 48, 62);
      ctx.textAlign = "right";
      ctx.fillStyle = color;
      ctx.fillText(`${String(number).padStart(2, "0")} / 07`, w - 48, 62);
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 132px Arial, sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(name.toUpperCase(), 48, 260, w - 96);
      ctx.fillStyle = "#c4d2da";
      ctx.font = "500 36px Arial, sans-serif";
      ctx.fillText(title, 52, 330, w - 104);
      ctx.fillStyle = "#ffffff30";
      ctx.fillRect(48, 394, w - 96, 1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(59, 449, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c4d2da";
      ctx.font = "600 25px monospace";
      ctx.fillText(place.toUpperCase(), 84, 457, w - 300);
      ctx.textAlign = "right";
      ctx.fillText("SPA / 7.004 KM", w - 48, 457);
      // LED pixel grid
      ctx.fillStyle = "#00000018";
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    },
    { repeat: false },
  );

export const signTexture = (
  text: string,
  bg: string,
  fg: string,
  width = 1024,
) =>
  canvasTexture(
    width,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = fg;
      ctx.font = "800 76px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2 + 4, w - 60);
    },
    { repeat: false },
  );
