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

const speckle = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  base: number,
  spread: number,
  tint: [number, number, number] = [1, 1, 1],
) => {
  const random = mulberry32(seed);
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < image.data.length; i += 4) {
    let v = base + (random() - 0.5) * spread;
    if (random() < 0.03) v += spread * 0.9;
    image.data[i] = v * tint[0];
    image.data[i + 1] = v * tint[1];
    image.data[i + 2] = v * tint[2];
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
};

/** Fine aggregate. Vertex colours carry the darker rubbered line. */
export const asphaltTexture = () =>
  canvasTexture(512, 512, (ctx, w, h) => {
    speckle(ctx, w, h, 11, 196, 70);
    const random = mulberry32(12);
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = random() < 0.5 ? "#000" : "#fff";
      ctx.beginPath();
      ctx.ellipse(
        random() * w,
        random() * h,
        8 + random() * 40,
        4 + random() * 18,
        random() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

export const grassTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    speckle(ctx, w, h, 21, 200, 80, [0.92, 1, 0.82]);
    const random = mulberry32(22);
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 900; i++) {
      ctx.strokeStyle = random() < 0.5 ? "#e8f5c8" : "#55663d";
      ctx.beginPath();
      const x = random() * w,
        y = random() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * 3, y - 3 - random() * 4);
      ctx.stroke();
    }
  });

export const gravelTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    speckle(ctx, w, h, 31, 200, 110, [1, 0.93, 0.8]);
  });

/** One red and one white block along the kerb, 1.5 m each. */
export const kerbTexture = () =>
  canvasTexture(64, 128, (ctx) => {
    ctx.fillStyle = "#d42a2f";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 64, 64, 64);
    ctx.fillStyle = "#00000022";
    ctx.fillRect(0, 0, 64, 3);
    ctx.fillRect(0, 64, 64, 3);
    ctx.fillRect(56, 0, 8, 128);
  });

/** Two galvanised Armco rails. */
export const armcoTexture = () =>
  canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = "#56606a";
    ctx.fillRect(0, 0, 64, 64);
    for (const y of [6, 36]) {
      const g = ctx.createLinearGradient(0, y, 0, y + 22);
      g.addColorStop(0, "#d9dee2");
      g.addColorStop(0.5, "#9aa3ab");
      g.addColorStop(1, "#c3c9ce");
      ctx.fillStyle = g;
      ctx.fillRect(0, y, 64, 22);
    }
    ctx.fillStyle = "#3c444c";
    ctx.fillRect(60, 0, 4, 64);
  });

/** Debris fence mesh. Transparent between the wires. */
export const fenceTexture = () =>
  canvasTexture(64, 64, (ctx) => {
    ctx.clearRect(0, 0, 64, 64);
    ctx.strokeStyle = "#c8ccd0";
    ctx.lineWidth = 2;
    for (let i = -64; i < 128; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 64, 64);
      ctx.moveTo(i + 64, 0);
      ctx.lineTo(i, 64);
      ctx.stroke();
    }
    ctx.fillStyle = "#c8ccd0";
    ctx.fillRect(0, 0, 64, 3);
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
  });

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
      for (let x = 0; x < w; x += seatW) ctx.fillRect(x + 1, y + rowH * 0.5, seatW - 2, rowH * 0.45);
      for (let x = 0; x < w; x += seatW) {
        if (random() < 0.12) continue;
        const shirt = shirts[Math.floor(random() * (random() < 0.4 ? 3 : shirts.length))];
        const jitter = (random() - 0.5) * 3;
        ctx.fillStyle = shirt;
        ctx.fillRect(x + 2 + jitter, y + rowH * 0.42, seatW - 4, rowH * 0.5);
        ctx.fillStyle = random() < 0.2 ? shirt : skin[Math.floor(random() * skin.length)];
        ctx.beginPath();
        ctx.arc(x + seatW / 2 + jitter, y + rowH * 0.3, seatW * 0.24, 0, Math.PI * 2);
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
) =>
  canvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0e1f33");
      g.addColorStop(1, "#08131f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, 26);
      ctx.fillRect(58, 120, 10, 270);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 210px Arial, sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(String(number).padStart(2, "0"), 96, 300);
      ctx.font = "700 30px Arial, sans-serif";
      ctx.fillStyle = "#9fb3c8";
      ctx.fillText("CAREER CHECKPOINT", 100, 110);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 70px Arial, sans-serif";
      ctx.fillText(name.toUpperCase(), 96, 400, w - 150);
      ctx.fillStyle = "#9fb3c8";
      ctx.font = "600 34px Arial, sans-serif";
      ctx.fillText(place.toUpperCase(), 100, 455, w - 150);
      // LED pixel grid
      ctx.fillStyle = "#00000030";
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    },
    { repeat: false },
  );

export const signTexture = (text: string, bg: string, fg: string, width = 1024) =>
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
