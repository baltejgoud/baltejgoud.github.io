import * as T from "three";
import { siRedbull } from "simple-icons";
import { mulberry32 } from "@/lib/random";
import { canvasTexture } from "./textures";

/**
 * The RB22 livery from the user's three reference photographs, painted as flat
 * side and top views and projected onto the bodywork in the shader. Laying it
 * out like a livery drawing keeps every mark where the photos put it, whatever
 * shape the panel underneath has. Sponsor names are set in plain type, not
 * reproduced logos; the charging bull comes from the installed Simple Icons set.
 */
export const COLOURS = {
  navy: "#16338f",
  deep: "#0b1c5c",
  ink: "#040a26",
  yellow: "#ffb400",
  red: "#e3111c",
  white: "#f6f4ee",
  carbon: "#0b0d11",
};
const { navy, deep, ink, yellow, red, white, carbon } = COLOURS;

type Ctx = CanvasRenderingContext2D;

/** Projection bounds in the car's metres: z runs nose → tail, x across, y up. */
export interface Bounds {
  z: [number, number];
  y: [number, number];
  x: [number, number];
}

/**
 * Satin paint under clear coat whose colour comes from three planar views:
 * the left and right sides (projected along x) and the top (along y).
 * Surfaces facing forward or back take the side views, which are continuous
 * along the car, and undersides take a darkened side view.
 */
export function projectedPaint(
  views: { left: T.Texture; right: T.Texture; top: T.Texture },
  bounds: Bounds,
  finish: T.MeshPhysicalMaterialParameters = {},
) {
  const material = new T.MeshPhysicalMaterial({
    roughness: 0.3,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    ...finish,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      liveryLeft: { value: views.left },
      liveryRight: { value: views.right },
      liveryTop: { value: views.top },
      liveryZ: { value: new T.Vector2(...bounds.z) },
      liveryY: { value: new T.Vector2(...bounds.y) },
      liveryX: { value: new T.Vector2(...bounds.x) },
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLiveryPosition;\nvarying vec3 vLiveryNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvLiveryPosition = position;\nvLiveryNormal = normal;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D liveryLeft;
uniform sampler2D liveryRight;
uniform sampler2D liveryTop;
uniform vec2 liveryZ;
uniform vec2 liveryY;
uniform vec2 liveryX;
varying vec3 vLiveryPosition;
varying vec3 vLiveryNormal;`,
      )
      .replace(
        "#include <map_fragment>",
        `{
  vec3 n = normalize(vLiveryNormal);
  vec3 p = vLiveryPosition;
  float along = (liveryZ.x - p.z) / (liveryZ.x - liveryZ.y);
  float up = (p.y - liveryY.x) / (liveryY.y - liveryY.x);
  float across = (p.x - liveryX.x) / (liveryX.y - liveryX.x);
  vec4 left = texture2D(liveryLeft, vec2(along, up));
  vec4 right = texture2D(liveryRight, vec2(1.0 - along, up));
  vec4 top = texture2D(liveryTop, vec2(along, 1.0 - across));
  vec4 side = mix(right, left, step(0.0, n.x));
  vec4 above = mix(side * 0.3, top, step(0.0, n.y));
  vec3 w = pow(abs(n), vec3(8.0));
  diffuseColor *= (side * (w.x + w.z) + above * w.y) / max(w.x + w.y + w.z, 1e-5);
}`,
      );
  };
  material.customProgramCacheKey = () => "projected-livery";
  return material;
}

// ── Drawing helpers ─────────────────────────────────────────────────────────
/** A canvas laid out in metres: `at(a, b)` maps the view's two axes to pixels. */
interface Sheet {
  ctx: Ctx;
  k: number;
  at: (a: number, b: number) => [number, number];
}
const shape = (sheet: Sheet, points: [number, number][]) => {
  const { ctx, at } = sheet;
  ctx.beginPath();
  points.forEach(([a, b], i) =>
    i ? ctx.lineTo(...at(a, b)) : ctx.moveTo(...at(a, b)),
  );
  ctx.closePath();
};

interface LabelStyle {
  font?: string;
  weight?: number | string;
  colour?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  rotate?: number;
  spacing?: number;
  stretch?: number;
}
/** Text centred on (a, b), `height` metres tall. Rotation is in radians, canvas sense. */
function label(
  sheet: Sheet,
  text: string,
  a: number,
  b: number,
  height: number,
  {
    font = "Arial, Helvetica, sans-serif",
    weight = 700,
    colour = white,
    stroke,
    strokeWidth = 0.12,
    width,
    rotate = 0,
    spacing = 0,
    stretch = 1,
  }: LabelStyle = {},
) {
  const { ctx, k, at } = sheet;
  const px = height * k;
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.scale(stretch, 1);
  ctx.font = `${weight} ${px}px ${font}`;
  ctx.letterSpacing = `${spacing * px}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const max = width ? (width * k) / stretch : undefined;
  if (stroke) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth * px;
    ctx.strokeText(text, 0, 0, max);
  }
  ctx.fillStyle = colour;
  ctx.fillText(text, 0, 0, max);
  ctx.restore();
}

/** Dark flecks clustered over the blue paint, as on the launch car. */
function speckle(
  ctx: Ctx,
  w: number,
  h: number,
  k: number,
  seed: number,
  clusters: number,
) {
  const random = mulberry32(seed);
  for (let c = 0; c < clusters; c++) {
    const cx = random() * w,
      cy = random() * h,
      spread = (0.012 + random() * 0.03) * k;
    const count = 3 + Math.floor(random() * 10);
    ctx.fillStyle = random() < 0.75 ? `${ink}9c` : `${deep}b0`;
    for (let n = 0; n < count; n++) {
      const size = (0.0025 + random() ** 2.5 * 0.009) * k;
      ctx.fillRect(
        cx + (random() - 0.5) * spread * 2,
        cy + (random() - 0.5) * spread,
        size * (0.8 + random() * 0.8),
        size * (0.5 + random() * 0.6),
      );
    }
  }
}

let bullPath: Path2D | undefined;
/**
 * The charging bull, `length` metres nose to tail, centred on (a, b). The icon
 * faces right; `faceLeft` turns it. `sun` paints the yellow disc behind its head.
 */
function bull(
  sheet: Sheet,
  a: number,
  b: number,
  length: number,
  faceLeft: boolean,
  { sun = false, rotate = 0 } = {},
) {
  const { ctx, k, at } = sheet;
  bullPath ??= new Path2D(siRedbull.path);
  const s = (length * k) / 24;
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.scale(faceLeft ? -s : s, s);
  ctx.translate(-12, -12);
  if (sun) {
    ctx.fillStyle = yellow;
    ctx.beginPath();
    ctx.arc(18.2, 12.3, 6.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // The icon's own sun ring would cross the disc, so keep only the animal:
  // everything left of the ring, plus the lowered head inside it.
  const animal = new Path2D();
  animal.rect(-1, -1, 16.6, 26);
  animal.arc(16.8, 13.7, 2.15, 0, Math.PI * 2);
  ctx.clip(animal);
  ctx.lineJoin = "round";
  ctx.strokeStyle = white;
  ctx.lineWidth = 0.95;
  ctx.stroke(bullPath);
  ctx.fillStyle = red;
  ctx.fill(bullPath);
  ctx.restore();
}

/** The red, white-keylined wordmark. */
const wordmark = (
  sheet: Sheet,
  a: number,
  b: number,
  height: number,
  rotate = 0,
  width?: number,
) =>
  label(sheet, "Red Bull", a, b, height, {
    font: '"Arial Black", Arial, sans-serif',
    weight: 900,
    colour: red,
    stroke: white,
    strokeWidth: 0.16,
    rotate,
    spacing: -0.04,
    width,
  });

/** Two bulls facing each other over the sun, with the wordmark beneath. */
function emblem(
  sheet: Sheet,
  a: number,
  b: number,
  size: number,
  rotate: number,
) {
  const { ctx, at, k } = sheet;
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.arc(0, -size * 0.12 * k, size * 0.16 * k, 0, Math.PI * 2);
  ctx.fill();
  const local: Sheet = { ctx, k, at: (x, y) => [x * k, y * k] };
  bull(local, -size * 0.3, -size * 0.1, size * 0.62, false);
  bull(local, size * 0.3, -size * 0.1, size * 0.62, true);
  wordmark(local, 0, size * 0.26, size * 0.22, 0, size * 0.95);
  ctx.restore();
}

/** Blue oval with the maker's script. */
function oval(sheet: Sheet, a: number, b: number, width: number, rotate = 0) {
  const { ctx, at, k } = sheet;
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.fillStyle = "#1c3f94";
  ctx.strokeStyle = white;
  ctx.lineWidth = width * k * 0.05;
  ctx.beginPath();
  ctx.ellipse(0, 0, (width * k) / 2, (width * k) / 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = white;
  ctx.font = `italic 700 ${width * k * 0.3}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ford", 0, width * k * 0.02, width * k * 0.8);
  ctx.restore();
}

/** The race-number plate: red number on white, keylined. */
function numberPlate(
  sheet: Sheet,
  a: number,
  b: number,
  width: number,
  rotate = 0,
  round = false,
) {
  const { ctx, at, k } = sheet;
  const w = width * k,
    h = w * (round ? 0.72 : 0.62);
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.fillStyle = white;
  ctx.strokeStyle = ink;
  ctx.lineWidth = w * 0.04;
  ctx.beginPath();
  if (round) ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  else ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.roundRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.6, w * 0.06);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.font = `900 ${h * 0.56}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3", 0, h * 0.03);
  ctx.restore();
}

/** The watch maker's green shield with its red bar. */
function shield(sheet: Sheet, a: number, b: number, width: number, rotate = 0) {
  const { ctx, at, k } = sheet;
  const w = width * k;
  ctx.save();
  ctx.translate(...at(a, b));
  ctx.rotate(rotate);
  ctx.fillStyle = white;
  ctx.fillRect(-w / 2 - w * 0.05, -w * 0.42, w * 1.1, w * 0.84);
  ctx.fillStyle = "#11895a";
  ctx.fillRect(-w / 2, -w * 0.37, w, w * 0.4);
  ctx.fillStyle = "#d4161f";
  ctx.fillRect(-w / 2, w * 0.05, w, w * 0.32);
  ctx.fillStyle = white;
  ctx.font = `800 ${w * 0.26}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TAG", 0, -w * 0.17, w * 0.9);
  ctx.fillText("HEUER", 0, w * 0.22, w * 0.9);
  ctx.restore();
}

// ── Body views ──────────────────────────────────────────────────────────────
export const BODY: Bounds = { z: [3.0, -2.7], y: [0, 1.0], x: [-1, 1] };
const length = (b: Bounds) => b.z[0] - b.z[1];

/** One side of the car, drawn nose-left for the left side, nose-right for the right. */
function bodySide(ctx: Ctx, w: number, h: number, mirror: boolean) {
  const k = w / length(BODY);
  const sheet: Sheet = {
    ctx,
    k,
    at: (z, y) => [
      (mirror ? z - BODY.z[1] : BODY.z[0] - z) * k,
      (BODY.y[1] - y) * k,
    ],
  };
  const at = sheet.at;
  const tilt = (r: number) => (mirror ? -r : r);
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, k, mirror ? 7 : 3, 5200);
  // Paint gives way to bare carbon low down and towards the tail.
  const fade = ctx.createLinearGradient(0, at(0, 0.36)[1], 0, at(0, 0.16)[1]);
  fade.addColorStop(0, `${carbon}00`);
  fade.addColorStop(1, carbon);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  const tail = ctx.createLinearGradient(...at(-1.35, 0), ...at(-1.8, 0));
  tail.addColorStop(0, `${carbon}00`);
  tail.addColorStop(1, `${carbon}e6`);
  ctx.fillStyle = tail;
  shape(sheet, [
    [-1.2, 0],
    [-1.2, 0.5],
    [-2.7, 0.5],
    [-2.7, 0],
  ]);
  ctx.fill();
  // Yellow nose, its edge raked back towards the top, over a carbon underside.
  ctx.fillStyle = yellow;
  shape(sheet, [
    [3.0, 0.18],
    [3.0, 0.7],
    [1.98, 0.7],
    [2.06, 0.46],
    [2.3, 0.18],
  ]);
  ctx.fill();
  ctx.fillStyle = carbon;
  shape(sheet, [
    [3.0, 0],
    [3.0, 0.24],
    [2.6, 0.225],
    [2.0, 0.22],
    [1.6, 0.2],
    [1.6, 0],
  ]);
  ctx.fill();
  bull(sheet, 2.2, 0.38, 0.52, !mirror, { rotate: tilt(-0.16) });
  numberPlate(sheet, 1.66, 0.5, 0.15, tilt(-0.1));
  label(sheet, "CARLYLE", 1.0, 0.535, 0.06, {
    font: 'Georgia, "Times New Roman", serif',
    weight: 600,
    spacing: 0.16,
    width: 0.56,
  });
  label(sheet, "❶ 1Password", 1.02, 0.465, 0.042, { weight: 700, width: 0.4 });
  label(sheet, "Hard Rock", 0.6, 0.465, 0.032, {
    font: 'Georgia, "Times New Roman", serif',
    weight: "italic 700",
    width: 0.16,
  });
  // Airbox and roll hoop in yellow, with the big bull charging forward. Both
  // stay on the engine cover, above the sidepod's shoulder line.
  ctx.save();
  shape(sheet, [
    [0.3, 1.0],
    [0.3, 0.63],
    [-0.25, 0.575],
    [-0.7, 0.475],
    [-1.1, 0.37],
    [-1.5, 0.3],
    [-2.7, 0.3],
    [-2.7, 1.0],
  ]);
  ctx.clip();
  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.moveTo(...at(0.15, 1.0));
  ctx.lineTo(...at(0.15, 0.6));
  ctx.bezierCurveTo(...at(-0.05, 0.6), ...at(-0.22, 0.62), ...at(-0.32, 0.7));
  ctx.bezierCurveTo(...at(-0.42, 0.78), ...at(-0.46, 0.9), ...at(-0.5, 1.0));
  ctx.closePath();
  ctx.fill();
  bull(sheet, -0.62, 0.74, 1.34, !mirror, { sun: true, rotate: tilt(0.05) });
  ctx.restore();
  label(sheet, "ROKT", -0.08, 0.515, 0.05, { weight: 800, width: 0.2 });
  wordmark(sheet, -0.86, 0.45, 0.075, tilt(-0.08), 0.46);
  label(sheet, "ORACLE", -0.32, 0.305, 0.13, {
    weight: 500,
    stretch: 1.35,
    spacing: 0.05,
    width: 1.22,
  });
  label(sheet, "CLEAR   SIEMENS   HEXAGON", -0.4, 0.2, 0.022, {
    weight: 600,
    width: 0.62,
  });
  oval(sheet, -1.42, 0.6, 0.15, tilt(-0.05));
  label(sheet, "RACING", -1.43, 0.545, 0.026, { weight: 800, spacing: 0.2 });
  numberPlate(sheet, -1.9, 0.74, 0.12, tilt(0.1));
}

/** The car from above, nose left; the driver's right is at the top of the sheet. */
function bodyTop(ctx: Ctx, w: number, h: number) {
  const k = w / length(BODY);
  const sheet: Sheet = {
    ctx,
    k,
    at: (z, x) => [(BODY.z[0] - z) * k, (x - BODY.x[0]) * k],
  };
  const at = sheet.at;
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, k, 11, 9000);
  // Calmer paint along the spine of the chassis.
  const spine = ctx.createLinearGradient(...at(0, -0.3), ...at(0, 0.3));
  spine.addColorStop(0, `${navy}00`);
  spine.addColorStop(0.3, `${navy}e0`);
  spine.addColorStop(0.7, `${navy}e0`);
  spine.addColorStop(1, `${navy}00`);
  ctx.fillStyle = spine;
  shape(sheet, [
    [2.1, -0.3],
    [0.62, -0.3],
    [0.62, 0.3],
    [2.1, 0.3],
  ]);
  ctx.fill();
  // Coke-bottle tail in bare carbon either side of the engine cover.
  for (const side of [-1, 1]) {
    const g = ctx.createLinearGradient(...at(-1.0, 0), ...at(-1.55, 0));
    g.addColorStop(0, `${carbon}00`);
    g.addColorStop(1, `${carbon}f0`);
    ctx.fillStyle = g;
    shape(sheet, [
      [-0.9, side * 0.17],
      [-0.9, side * 1],
      [-2.7, side * 1],
      [-2.7, side * 0.12],
    ]);
    ctx.fill();
  }
  // Yellow nose with a bull on each shoulder, the Ford oval at the tip.
  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.moveTo(...at(3.0, -0.3));
  ctx.lineTo(...at(2.3, -0.3));
  ctx.bezierCurveTo(...at(2.22, -0.1), ...at(2.22, 0.1), ...at(2.3, 0.3));
  ctx.lineTo(...at(3.0, 0.3));
  ctx.closePath();
  ctx.fill();
  for (const side of [-1, 1])
    bull(sheet, 2.38, side * 0.11, 0.3, true, { rotate: side * 0.12 });
  oval(sheet, 2.64, 0, 0.1, Math.PI / 2);
  // Sponsor stack, reading across the car from the front.
  const stack = [
    "Mobil 1",
    "PIRELLI",
    "neat.",
    "CARLYLE",
    "Maui Jim",
    "AVATRADE",
    "AT&T",
    "Gate",
    "VISA",
  ];
  stack.forEach((name, i) =>
    label(sheet, name, 2.2 - i * 0.047, 0, 0.034, {
      weight: 800,
      width: 0.17,
      rotate: Math.PI / 2,
      font:
        name === "CARLYLE" ? 'Georgia, "Times New Roman", serif' : undefined,
    }),
  );
  numberPlate(sheet, 1.68, 0, 0.17, Math.PI / 2, true);
  shield(sheet, 1.47, 0, 0.11, Math.PI / 2);
  label(sheet, "ORACLE", 1.29, 0, 0.05, {
    weight: 500,
    width: 0.3,
    rotate: Math.PI / 2,
    spacing: 0.08,
  });
  emblem(sheet, 0.98, 0, 0.32, -Math.PI / 2);
  // Beside the cockpit and on the sidepods, each reading from its own side.
  for (const side of [-1, 1]) {
    const turn = side < 0 ? Math.PI : 0;
    label(sheet, "VISA", 0.32, side * 0.42, 0.06, { weight: 900, width: 0.2 });
    label(sheet, "Gate", 0.56, side * 0.28, 0.03, { weight: 800 });
    label(sheet, "ROKT", 0.02, side * 0.55, 0.045, {
      weight: 800,
      rotate: turn,
    });
    wordmark(sheet, -0.52, side * 0.5, 0.075, turn + side * 0.06, 0.5);
    label(sheet, "Pepe Jeans", 0.5, side * 0.66, 0.03, {
      font: 'Georgia, "Times New Roman", serif',
      weight: "italic 700",
      rotate: turn,
    });
  }
  // Yellow airbox and the bull charging back along the engine cover.
  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.ellipse(
    ...at(-0.2, 0),
    0.42 * k,
    0.24 * k,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  bull(sheet, -0.98, 0, 1.25, false);
}

/** Painted views for the body: the two sides and the top. */
export function bodyViews(resolution: number) {
  const w = resolution,
    k = w / length(BODY);
  const side = (mirror: boolean) =>
    canvasTexture(
      w,
      Math.round((BODY.y[1] - BODY.y[0]) * k),
      (ctx, cw, ch) => bodySide(ctx, cw, ch, mirror),
      { repeat: false },
    );
  return {
    left: side(false),
    right: side(true),
    top: canvasTexture(
      w,
      Math.round((BODY.x[1] - BODY.x[0]) * k),
      (ctx, cw, ch) => bodyTop(ctx, cw, ch),
      { repeat: false },
    ),
  };
}

// ── Wing endplates ─────────────────────────────────────────────────────────
export const FRONT_PLATE: Bounds = { z: [3.05, 2.2], y: [0, 0.45], x: [-1, 1] };
export const REAR_PLATE: Bounds = { z: [-1.9, -2.65], y: [0.35, 1.05], x: [-1, 1] };

/**
 * Endplate faces: the outer face painted blue with the oil sponsor, the inner
 * one bare carbon. Each endplate gets its own pair so both outer faces read.
 */
export function endplateViews(
  bounds: Bounds,
  rear: boolean,
  resolution = 512,
) {
  const k = resolution / length(bounds);
  const h = Math.round((bounds.y[1] - bounds.y[0]) * k);
  const face = (outer: boolean, mirror: boolean) =>
    canvasTexture(
      resolution,
      h,
      (ctx, w) => {
        const sheet: Sheet = {
          ctx,
          k,
          at: (z, y) => [
            (mirror ? z - bounds.z[1] : bounds.z[0] - z) * k,
            (bounds.y[1] - y) * k,
          ],
        };
        ctx.fillStyle = carbon;
        ctx.fillRect(0, 0, w, h);
        if (!outer) {
          const mid = (bounds.z[0] + bounds.z[1]) / 2;
          label(sheet, rear ? "Mobil 1" : "AT&T", mid, rear ? 0.8 : 0.26, 0.06, {
            weight: 800,
            width: 0.3,
          });
          return;
        }
        ctx.fillStyle = navy;
        ctx.fillRect(0, 0, w, h);
        speckle(ctx, w, h, k, rear ? 41 : 43, 700);
        const g = ctx.createLinearGradient(
          0,
          sheet.at(0, bounds.y[0] + (rear ? 0.25 : 0.14))[1],
          0,
          sheet.at(0, bounds.y[0] + 0.02)[1],
        );
        g.addColorStop(0, `${carbon}00`);
        g.addColorStop(1, carbon);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (rear) {
          label(sheet, "Mobil", -2.26, 0.86, 0.085, { weight: 900, width: 0.3 });
          ctx.fillStyle = white;
          const [x, y] = sheet.at(mirror ? -2.47 : -2.06, 0.86);
          ctx.fillRect(x - 0.035 * k, y - 0.045 * k, 0.07 * k, 0.09 * k);
          label(sheet, "1", mirror ? -2.47 : -2.06, 0.858, 0.075, {
            weight: 900,
            colour: red,
          });
          label(sheet, "◆", -2.3, 0.64, 0.05, { colour: red });
        } else {
          label(sheet, "Mobil", 2.55, 0.3, 0.075, { weight: 900, width: 0.3 });
          label(sheet, "✱", 2.4, 0.16, 0.04, { colour: red });
        }
      },
      { repeat: false },
    );
  const blank = canvasTexture(
    8,
    8,
    (ctx) => {
      ctx.fillStyle = carbon;
      ctx.fillRect(0, 0, 8, 8);
    },
    { repeat: false },
  );
  // The left endplate's outer face looks along +x; the right one's along −x.
  return {
    leftPlate: { left: face(true, false), right: face(false, true), top: blank },
    rightPlate: { left: face(false, false), right: face(true, true), top: blank },
  };
}

// ── Wing elements ──────────────────────────────────────────────────────────
interface WingMark {
  text: string;
  colour: string;
  /** Centres across the span, 0–1 from the driver's right. */
  at: number[];
  /** Letter height as a share of the sheet. */
  size: number;
  italic?: boolean;
  /** Horizontal scale that undoes the sheet's span/chord distortion. */
  stretch?: number;
  /** Widest a mark may be, as a share of the span. */
  width?: number;
}
/**
 * Carbon wing skin. `u` runs across the span (driver's right to left) and the
 * upper surface fills the lower half of the sheet, trailing edge at the bottom.
 */
export function wingSkin(marks: WingMark[]) {
  return canvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#0e1116";
      ctx.fillRect(0, 0, w, h);
      // Twill weave, faint.
      for (let i = -h; i < w; i += 5) {
        ctx.strokeStyle = i % 10 ? "#ffffff09" : "#00000020";
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      for (const mark of marks) {
        const { text, colour, size, stretch = 1, width = 0.4 } = mark;
        for (const x of mark.at) {
          ctx.save();
          ctx.translate(x * w, h * 0.75);
          ctx.scale(stretch, -1);
          const style = mark.italic ? "italic 900" : "900";
          ctx.font = `${style} ${h * size}px "Arial Black", Arial, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const max = (w * width) / stretch;
          if (colour === red) {
            ctx.lineJoin = "round";
            ctx.strokeStyle = white;
            ctx.lineWidth = h * size * 0.14;
            ctx.strokeText(text, 0, 0, max);
          }
          ctx.fillStyle = colour;
          ctx.fillText(text, 0, 0, max);
          ctx.restore();
        }
      }
    },
    { repeat: false },
  );
}

// ── Tyres ───────────────────────────────────────────────────────────────────
/**
 * Tyre: v runs across the profile, the left wheels' outer face at v ≈ 0.2 and
 * the right wheels' at v ≈ 0.8, scuffed tread between and a blue band at each rim.
 */
export function tyreTexture() {
  return canvasTexture(
    2048,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#0e0f11";
      ctx.fillRect(0, 0, w, h);
      const random = mulberry32(5);
      // Worked tread: grained and scuffed, a shade lighter than the sidewall.
      ctx.fillStyle = "#18191c";
      ctx.fillRect(0, h * 0.42, w, h * 0.16);
      for (let i = 0; i < 3200; i++) {
        ctx.fillStyle = i % 3 ? "#202125" : "#0b0b0d";
        ctx.fillRect(
          random() * w,
          h * (0.42 + random() * 0.16),
          4 + random() * 22,
          0.6 + random() * 0.8,
        );
      }
      ctx.fillStyle = "#2f5fe0";
      ctx.fillRect(0, h * 0.015, w, h * 0.04);
      ctx.fillRect(0, h * 0.945, w, h * 0.04);
      for (const [band, mirror] of [
        [0.2, false],
        [0.8, true],
      ] as [number, boolean][]) {
        ctx.save();
        ctx.translate(0, band * h);
        if (mirror) ctx.scale(-1, 1);
        ctx.fillStyle = "rgba(240, 240, 236, 0.92)";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let k = 0; k < 4; k++) {
          const x = ((k + 0.5) / 4) * w * (mirror ? -1 : 1);
          const size = h * (k % 2 ? 0.15 : 0.2);
          ctx.font = `${k % 2 ? "italic 800" : "900"} ${size}px Arial, sans-serif`;
          ctx.fillText(k % 2 ? "P ZERO" : "PIRELLI", x, 0, w * 0.18);
        }
        ctx.restore();
      }
    },
    { repeat: false },
  );
}
