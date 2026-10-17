/* Prepare hero imagery: node scripts/prepare-images.cjs <cutout.png>
   Input is rembg's full-size cutout of public/assets/portrait.webp. Writes
   public/images/portrait-cutout.webp (trimmed, transparent) and
   public/images/id-photo.webp (square head-and-shoulders crop on a plain warm background). */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const cutout = process.argv[2];
if (!cutout || !fs.existsSync(cutout)) {
  console.error("Usage: node scripts/prepare-images.cjs <cutout.png>");
  process.exit(1);
}
const out = path.join(root, "public/images");
fs.mkdirSync(out, { recursive: true });

/**
 * rembg keeps a sliver of the blue fence picket seen through the gap between the left arm
 * and the torso. Make bright, saturated blue pixels transparent. The navy tie and trousers
 * are too dark to match, and the white shirt is not saturated.
 */
async function removeFenceBlue(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let cleared = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a > 0 && b > 140 && b - r > 60 && b - g > 25) {
      data[i + 3] = 0;
      cleared++;
    }
  }
  return { image: sharp(data, { raw: info }), cleared };
}

(async () => {
  const { image, cleared } = await removeFenceBlue(cutout);
  const clean = await image.png().toBuffer();
  console.log(`cleared ${cleared} fence-blue pixels`);

  const hero = await sharp(clean)
    .trim({ threshold: 1 })
    .resize({ width: 720, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(path.join(out, "portrait-cutout.webp"));
  console.log(`portrait-cutout.webp ${hero.width}×${hero.height}, ${(hero.size / 1024).toFixed(0)} KB`);

  // The cutout keeps the original 720 × 1432 canvas, so this box matches the original portrait.
  const id = await sharp(clean)
    .flatten({ background: "#ebe7de" })
    .extract({ left: 182, top: 262, width: 360, height: 360 })
    .resize(320, 320)
    .webp({ quality: 85 })
    .toFile(path.join(out, "id-photo.webp"));
  console.log(`id-photo.webp ${id.width}×${id.height}, ${(id.size / 1024).toFixed(0)} KB`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
