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

## Realism pass — 17 October 2026

Car, track and scenery were rebuilt for a more photographic look; the drive, camera and story timing are unchanged.

- Car: airfoil-section wings, curved endplates, letterbox sidepod inlets, matte floor and diffuser, exhaust, lettered tyres, wheel covers and nuts, brake drums, wheel-wake deflectors, mirror glass and a contact shadow. Satin paint and carbon reflect a sky-and-ground environment, so lower bodywork no longer mirrors the sky.
- Track: textured, relief-mapped asphalt with patches and braking streaks; ridged, rubbered kerbs with a raised profile; textured gravel and painted run-off; W-beam Armco; a fine catch fence; braking boards.
- Scenery: textured spruce and beech in place of low-poly cones and spheres, two-scale turf and softer shadows.

### Checks

- `npm run lint`, `npm test` (83 tests), `npm run build` and `npm run check` passed.
- Development build at 800×450 in the desktop app's browser pane: aerial overview, grid start with lights, Kemmel chase, La Source, Eau Rouge and Stavelot stops, and sunset mode all render with no console errors.
- Frame submit time stayed at about 4–6 ms at that size, roughly what it was before; instanced tree triangles rose from about 2.6 M to 2.9 M before culling.

### Limits

Not checked on a phone, a large high-DPI display or a low-end GPU. Alpha-to-coverage foliage costs more fill rate on big screens than the old opaque trees.

## Journey polish and RB22 reference pass — 17 October 2026

The car now follows the user's three RB22 reference photographs: cobalt paint with dark flecks, a yellow nose and airbox, keylined red bull graphics, sponsor lettering, carbon wings, a wider rear wing, exposed ten-spoke wheels, blue rim rings and white tyre lettering. The car inspection dialog shares the circuit model and offers rotation, zoom, keyboard rotation and front/top camera presets. Its renderer loads on demand, compiles shaders asynchronously and releases its resources on close.

Experience cards now stay in one place. The body scrolls independently while its checkpoint navigation stays visible; reaching the body's edge hands scrolling back to the page. Chapter selection resets the reading position. The journey adds named desktop chapters, 44px phone chapter buttons, a lap-progress rail, a working map toggle and a skip control. Camera framing clears the reading area, travel takes a longer share of each chapter's scroll range, and resizing preserves the current point in the lap. Rendering skips identical frames, coalesces scroll events into one pending animation frame, reduces distant foliage and lowers render resolution after sustained expensive frame submissions.

### Verification

- `npm run lint`, TypeScript checking, `npm test` (85 tests), production build and static link checks passed. The export contains 7 pages and 246 checked local references.
- New regression coverage checks the full car's bounds, including its front wing and raised airbox, at 1440×900, 1024×768, 800×450, 640×360, 375×812 and 360×812; travel timing and continuity across chapter boundaries are also covered.
- Browser checks cover desktop/phone/landscape layouts, a production export, night mode, the car viewer's camera presets and Escape dismissal, and opening/closing the viewer without changing page scroll position.
- Native wheel checks: the expanded Sanket card scrolled from about 53px to 358px while page scroll stayed at 10803px. Another downward gesture at the card's edge moved the page to about 10870px.
- Rotation check: chapter 04 and the sticky scene's top position were preserved when switching from 640×360 to 375×812 and back. Neither layout introduced horizontal page overflow.
- Screenshots: `.cache/spa-qa/rb22-car-quarter.png`, `.cache/spa-qa/journey-mobile-refined.png` and `.cache/spa-qa/journey-night-refined.png`.

These checks used an emulated browser viewport, not a physical touchscreen. GPU frame time was not benchmarked, and OS reduced-motion emulation was unavailable; the existing reduced-motion path remains in place.

## RB22 rebuild, road surface and scroll pacing — 17 October 2026 (evening)

Following the user's three RB22 reference photographs (front, top, three-quarter):

- Car: rebuilt to 2026 proportions (3.4 m wheelbase, 1.9 m wide, about 1 m tall). It now has a slim, low nose resting on the front wing, high letterbox sidepod inlets over a deep undercut, a downwash ramp, a yellow roll-hoop airbox with a T-camera, a faired halo, faired wishbones, floor fences, a front wing whose outboard flaps sweep up into tall endplates, and a two-element rear wing with no beam wing. The livery is painted as side and top views (`livery.ts`) and projected onto the bodywork in the shader. Placement follows the photos: nose bull, number plates, CARLYLE / 1Password, the big engine-cover bull on its yellow sun, ORACLE on the sidepod, Ford oval, sponsor stack, roundel, TAG shield, twin-bull emblem, Red Bull / VISA / Gate wing lettering, and blue Mobil endplates. Paint is cobalt with dark flecks that fade to carbon low down. Darker tyres carry larger sidewall lettering.
- Car viewer: a dark launch-studio set (overhead soft key, cool rims, a painted sun disc with a red glow) with presets matching the photo angles; the top view now has the nose to the left, as in the reference.
- Road: finer, lower-contrast aggregate with a roughness map, so the surface sheens at a low sun. It has a darker rubbered racing line and braking zones, stretches resurfaced in different shades (some on one lane only), a wear layer with paving seams, a transverse joint, tar-sealed cracks and faint oil stains, and a softer, narrower painted run-off band.
- Scroll: each chapter's scroll length now follows its leg (a reading share plus one screen per 1.7 km), so long legs drive at a steady, readable pace; the track grew from 8.9 to 10.9 screens. The chase camera drops, hangs back and widens with pace, swings to the outside of bends (averaged over 40 m) and banks up to 1.7°; it calms for hairpins and chicanes. A forward scroll that comes to rest mid-way through the swing to a checkpoint glides on to the stop (scrolling back is left alone; dialogs suppress it). Short landscape screens lift the action above the chapter bar.

### Checks

- `npm run lint` (changed files), TypeScript, `npm test` (87 tests), `npm run build` and `npm run check` (7 pages, 239 local references) passed; `git diff --check` was clean.
- New tests: chapter scroll scales with leg length at 0.9–2.5 km per screen and fills the intro-to-outro range exactly; the chase widens at speed on the Kemmel straight and calms through the Bus Stop chicane. The existing "car in frame from grid to flag" check caught the first camera swing pushing the car out of the phone frame at the chicane; corner averaging and a pace cut for tight bends fixed it (worst case now 0.74 of the half-frame).
- Browser (dev server, desktop app pane): the car was compared with the photos from matching front, top, side and three-quarter cameras. Also checked: the inspection dialog presets, the chase on the Kemmel straight and at Pouhon at 800×450, the phone layout at 375×812, night mode, and the checkpoint glide (it moved from 48% to the 64% stop and opened the story; a backward scroll stayed put). There were no console errors from the page.

### Limits

Not checked on a physical phone or touchscreen, a high-DPI display or a low-end GPU. The 4096 px livery canvases are used only in the viewer; the circuit uses 2048 px. Sponsor marks are typeset names, not the brands' artwork.
