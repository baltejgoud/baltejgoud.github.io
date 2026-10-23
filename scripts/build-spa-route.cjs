// Rebuild with: node scripts/build-spa-route.cjs <downloaded f1-circuits.geojson>
// Geometry: https://github.com/bacinger/f1-circuits (MIT, Tomislav Bacinger).
const fs = require("node:fs");
const path = require("node:path");
const input = process.argv[2];
if (!input)
  throw new Error(
    "Pass the source GeoJSON file. See docs/spa-journey-plan.md.",
  );
const data = JSON.parse(fs.readFileSync(input, "utf8"));
const feature = data.features.find((item) => item.properties.id === "be-1925");
if (!feature || feature.geometry.type !== "LineString")
  throw new Error("Spa circuit centreline not found.");
const degrees = Math.PI / 180;
const rotation = -62 * degrees;
const geo = feature.geometry.coordinates
  .slice(0, -1)
  .map(([longitude, latitude]) => {
    const x = (longitude - 5.96) * Math.cos(50.44 * degrees);
    const y = 50.45 - latitude;
    return [
      x * Math.cos(rotation) - y * Math.sin(rotation),
      x * Math.sin(rotation) + y * Math.cos(rotation),
    ];
  });
const minX = Math.min(...geo.map(([x]) => x));
const minY = Math.min(...geo.map(([, y]) => y));
const spanX = Math.max(...geo.map(([x]) => x)) - minX;
const spanY = Math.max(...geo.map(([, y]) => y)) - minY;
const width = 1500,
  height = 1000;
const scale = Math.min((width - 220) / spanX, (height - 220) / spanY);
const base = geo.map(([x, y]) => [
  (x - minX) * scale + (width - spanX * scale) / 2,
  (y - minY) * scale + (height - spanY * scale) / 2,
]);
// Sample a closed Catmull-Rom curve. The displayed road and car use these same points.
const points = [];
for (let i = 0; i < base.length; i++) {
  const [a, b, c, d] = [-1, 0, 1, 2].map(
    (offset) => base[(i + offset + base.length) % base.length],
  );
  for (let j = 0; j < 8; j++) {
    const t = j / 8;
    points.push(
      [0, 1].map((axis) =>
        Number(
          (
            0.5 *
            (2 * b[axis] +
              (-a[axis] + c[axis]) * t +
              (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t * t +
              (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t * t * t)
          ).toFixed(3),
        ),
      ),
    );
  }
}
points.push(points[0]);
const lengths = [0];
for (let i = 1; i < points.length; i++)
  lengths.push(
    lengths.at(-1) +
      Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      ),
  );
const totalLength = lengths.at(-1);
const stops = [0.033, 0.139, 0.324, 0.521, 0.722, 0.885, 1];
const pointAt = (fraction) => {
  const target = fraction * totalLength;
  const end = Math.max(
    1,
    lengths.findIndex((length) => length >= target),
  );
  const t = (target - lengths[end - 1]) / (lengths[end] - lengths[end - 1]);
  return points[end].map((value, axis) =>
    Number(
      (points[end - 1][axis] + (value - points[end - 1][axis]) * t).toFixed(3),
    ),
  );
};
const route = {
  name: "Circuit de Spa-Francorchamps",
  width,
  height,
  source: "https://github.com/bacinger/f1-circuits",
  sourceId: "be-1925",
  circuitLength: 7004,
  path: points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(""),
  points,
  lengths,
  totalLength,
  stops,
  positions: stops.map(pointAt),
  corners: [
    "La Source",
    "Eau Rouge / Raidillon",
    "Les Combes",
    "Pouhon",
    "Stavelot",
    "Blanchimont",
    "Start / Finish",
  ],
};
fs.writeFileSync(
  path.resolve(__dirname, "../src/content/journey-route.json"),
  JSON.stringify(route),
);
console.log(
  `Spa: ${points.length} route samples, ${stops.length} career checkpoints, closed lap.`,
);
