# Spa trackside journey — verification

Verified locally on 17 October 2026. Implementation plan: [spa-journey-plan.md](spa-journey-plan.md).

## Completed

- Full-viewport, scroll-driven 3D circuit with a wide establishing view and an elevated trackside follow camera.
- Real Spa centreline shared by the road, car, checkpoint boards and minimap.
- Original 3D Red Bull-livery open-wheel car with exposed tyres, suspension, cockpit, halo, sidepods and wings.
- Seven career popups appear only after arrival and clear during travel. Existing narratives, dates, achievements, logos and gallery remain available.
- Forward/reverse travel, direct chapter selection, hero-pin integration, keyboard controls, restart, minimap and final contact link.
- Continuous scrolling on desktop and phones. Reduced motion uses manual chapter selection; WebGL failure has a 2D fallback; a no-JavaScript career summary remains in the document.
- Day/night rendering, independent story-panel scrolling and native gallery dismissal.
- Lazy-loaded renderer, instanced forest/barriers, capped pixel density, rendering on change and GPU cleanup.

## Automated checks

- `npm run lint`: passed.
- `npm test`: 76 tests passed across 10 files.
- `npm run build`: passed, including TypeScript and static export.
- `npm run check`: 7 pages, 245 local references; no missing links/assets, duplicate IDs or h1 errors.
- `git diff --check`: passed.

Route checks cover closure, checkpoint reachability, chronology, exact start/finish position, geometry bounds, arc-length ordering and monotonic forward travel. New checks ensure popups reveal only after arrival, desktop/mobile camera poses stay finite and above terrain, and the finish returns to the starting position.

## Browser evidence

- Production export at 1536×695: a WebGL canvas loads, the scene remains pinned at viewport top, and the car is visible beside its floating story panel. BVRIT opens at 3%, Haritha at 52%, and the final chapter at 100%.
- Reverse wheel scrolling from Haritha moves back to Freelance around 31%, with the scene still pinned at 0px and the popup clearing during travel.
- Phone at 390×844: wheel scrolling moves the car from BVRIT towards tutoring; the first popup clears during travel and the tutoring popup opens at arrival. The camera places the car above the lower story panel.
- Compact phone at 320×568: document width is 305px within the 320px viewport, with the scrollbar using the remaining width. The car remains visible above the independently scrollable popup; chapter controls remain below it.
- Sanket details expand, its gallery opens, and Escape closes the native dialog and removes the Lenis scroll lock.
- Night mode renders the circuit and popup palette. The day preference and temporary viewport overrides were restored.
- The final chapter's contact control exits the pinned scene and scrolls to contact (measured 45px from viewport top).
- The production preview returned no console errors or warnings during these checks.

Screenshots:

- `.cache/spa-qa/trackside-desktop.png` — production export, BVRIT checkpoint.
- `.cache/spa-qa/trackside-mobile.png` — 390×844 viewport, BVRIT checkpoint.

## Limits

Responsive checks used browser viewport overrides, not a physical touchscreen. Physical touch gestures, live OS reduced-motion changes and deliberate graphics-context loss were not exercised. Their alternate paths are implemented; numerical route/camera/arrival behavior is covered by unit tests.

The car is an original stylised 3D model, not a model-year replica. Terrain and scenery are illustrative around Spa's real centreline. Career stops are narrative placements. Source and artwork details are in [journey-assets.md](journey-assets.md).

The production export is available locally at `http://localhost:8000/#journey`. No commit, push or public deployment was performed.

## Real-scale circuit upgrade — 17 October 2026

The journey was rebuilt at true scale with a race start from the grid, a full venue and a new car. Details are in the plan and asset notes above.

### Automated checks

- `npm run lint`: passed with no warnings.
- `npm test`: 83 tests passed across 10 files. New checks cover a closed 7.004 km lap without kinks, the 102.2 m elevation range with its high point at Malmedy and low point near Paul Frère, the racing line staying inside track limits, pole position behind the start line with the finish returning to the same slot, the five lights coming on one by one and going out before the car moves, the dive from the aerial view to the grid, the camera staying above the ground, the car staying on screen for the whole drive on desktop and phone, and each checkpoint screen and the stopped car both framed on screen.
- `npm run build` and `npm run check`: passed (7 pages, 245 local references).

### Browser evidence

- Development and production builds, with the viewport emulated at 800×450 (landscape) and 375×812 (phone): the overview shows the circuit in dense forest with numbered pins. The camera dives over the paddock to the grid, the lights go out, and the car launches. A low chase follows it down the Kemmel straight. At each stop the camera orbits to a front three-quarter shot with the LED screen beside the car. The finish returns to pole beside the pit building and gantry.
- Night mode renders a sunset with long shadows and glowing start lights.
- The scene builds in stages. In the production build the longest main-thread task was about 0.3 s, the first draw that uploads geometry to the GPU; build stages ran 0.08–0.24 s each. Submitting a frame took about 2–6 ms of main-thread time in development.
- Screenshots: `.cache/spa-qa/real-scale-*.jpg`.

### Limits

- Checked only in the desktop app's browser pane with emulated viewports. No physical phone or touchscreen, and GPU frame time was not measured.
- Elevation is an approximation from published figures. Grandstand, gravel and marshal-post positions are illustrative. Pole on the inside for La Source is a convention, not a sourced detail.
