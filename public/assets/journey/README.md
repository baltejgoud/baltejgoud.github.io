# Night Lap assets

Generated with the built-in image tool for the user-selected third design (Night Lap), 2026-10-23.

- `ardennes-night.webp`: 1500 x 1000 overhead Ardennes terrain, dense evergreen canopies, small local roads, clearings and muted teal stream. Contains no race circuit, UI, labels, pins or car. Compressed to WebP with Sharp.
- `red-bull-car.png`: 256 x 588 straight-down Formula 1 miniature, nose facing up, navy/yellow/red Red Bull-inspired livery. Genuine transparent alpha; trimmed/resized with Sharp. Rotation, position and contact shadow are handled by the live map.

Visual source: the third generated concept selected in this chat. Circuit geometry remains the existing `src/content/journey-route.json` data, so tracing and checkpoints remain interactive.


## Cinematic reconstruction — 2026-10-23

- `spa-cinematic.webp`: 1672 × 941, 430 kB. Generated with the supplied target image as the lighting/forest reference and `docs/verification/spa-scene-guide.png` as the geometry guide. Contains the environment and empty road only, no text, car, markers, navigation, or card. The live SVG centerline overlays this road; car and checkpoints use the same projected geographic samples.
- `university-reference.webp`: 100 × 127. The architectural thumbnail extracted from the user-supplied design. This is a reference illustration, not represented as a photograph of BVRIT.
- Existing `ardennes-night.webp` is retained as the mobile outer forest, and the original transparent car is reused.

The original geographic `journey-route.json` and its attribution remain unchanged. `src/lib/careerScene.ts` rotates and projects the entire ground plane; it does not alter individual corners. `scripts/career-scene-guide.cjs` reproduces the provider guide.
