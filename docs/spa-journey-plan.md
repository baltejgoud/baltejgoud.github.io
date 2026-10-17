# Spa trackside journey — implementation plan

## Intended experience

A full-viewport, scroll-driven 3D drive around Spa-Francorchamps. The camera follows a Red Bull-livery open-wheel car. Career stories appear as floating trackside panels only after arriving at their checkpoints, then clear while the car travels to the next chapter. Desktop and phones both follow the entire circuit through normal page scrolling.

## 1. Route and storytelling

- Retain the real Spa centreline and seven existing career chapters.
- Use a shared arc-length position for the road, car, checkpoint signs and circuit minimap.
- Give each chapter a travel interval followed by a reading interval. Reveal the panel after arrival; reverse scrolling retraces the same route.
- Preserve all career facts, dates, employer logos and the Sanket gallery.

## 2. Trackside world and vehicle

- One world unit is one metre. The lap is Spa's published 7.004 km, the road about 14 m wide (16 m on the start straight) and the car 5.6 m long, so the car, kerbs, grandstands and buildings share real proportions.
- The 3D centreline is rebuilt through the source's control points with a centripetal curve (the map's uniform curve loops back on itself near Malmedy), then resampled every 2.5 m. A minimum-curvature racing line inside the track limits gives the car its line and the rubbered tarmac its darker groove.
- Elevation follows Spa's broad published profile (102.2 m overall, highest at Malmedy, lowest near Paul Frère, about 30 m from the Eau Rouge dip to the top of Raidillon). It is an approximation, not survey data; the terrain takes the road's height near the circuit and relaxes into hills further out.
- Start: the car waits in the pole slot (inside for La Source) with 22 painted grid slots behind it, under a gantry. Scrolling dives the camera from the aerial view to the grid, the five red lights come on one by one and go out, and only then does the car launch. The journey ends back in the same slot.
- Track: asphalt with a rubbered racing line and darker braking zones, white edge lines, red/white kerbs on corners, tarmac run-off with Spa-style blue bands, gravel traps at Raidillon, Rivage, Fagnes/Campus and Stavelot, Armco with debris fencing and belted tyre walls.
- Venue: pit lane, pit wall with team stands, a three-storey pit building with 22 garages, paddock motorhomes and transporters, roofed grandstands with crowds at the main straight, La Source, Raidillon, Les Combes, Pouhon, Stavelot, Blanchimont and the Bus Stop, ad boards carrying the portfolio's own names, marshal posts and TV camera towers. Placements are illustrative.
- Setting: an Ardennes forest of spruce and beech (chunked, instanced and culled), a physical sky with clouds, sun shadows that follow the camera and sky reflections on the car. Night mode is a low summer sunset.
- Car: an original modern open-wheeler with lofted survival cell, undercut sidepods, engine cover with shark fin, airbox, halo, mirrors, four-element front wing, rear wing with DRS flap and beam wing, floor, diffuser, suspension, 18-inch wheels with covers and soft-compound sidewall bands. The Red Bull-style livery is painted onto the bodywork. Front wheels steer and the car pitches with the hills.
- Camera: a low chase while driving; over the last stretch to each stop it orbits round the car's left to a front three-quarter shot with the checkpoint's LED screen beside it, then swings back behind as the car leaves. Phones use a higher, stacked version of each shot.

## 3. Panels and controls

- Project each roadside checkpoint into screen space and connect its floating story panel with a short leader line.
- Keep panels inside safe viewport bounds, clear of the car and persistent navigation. Panels may scroll independently for longer stories and gallery controls.
- Include chapter selection, next/previous, restart, optional circuit minimap and keyboard controls.
- Reduced motion uses immediate manual chapter selection. A 2D overview remains available if WebGL cannot initialize; a no-JavaScript career summary stays readable.

## 4. Performance and lifecycle

- Render only when scroll position, dimensions, chapter or theme changes; no permanent animation loop.
- Merge static parts per material, instance and chunk the forest, cap pixel density, and use a lighter tier (fewer trees, coarser terrain, smaller shadow map) on phones and low-core devices.
- Build the scene in stages that yield to the browser, precompile shaders asynchronously, and cancel the build if the section unmounts.
- Observe the section's proximity before loading the renderer. Disconnect observers, cancel pending frames and dispose GPU geometry, materials and textures on unmount.
- Recover to the overview if the graphics context is lost.

## 5. Verification

- Test closed-lap geometry, checkpoint reachability, monotonic distance, arrival timing, camera bounds and finish/start continuity.
- Check actual 3D rendering, forward/reverse travel, popup placement, chapter navigation, long story scrolling, gallery dismissal, phone layouts and day/night styling.
- Run lint, tests, TypeScript, production export and local-reference checks.
- Save screenshots, record any untested device-specific behavior and open the local production preview. Publishing remains outside this request.

## Sources and results

Geometry, artwork and licence details: [journey-assets.md](journey-assets.md).
Verification: [spa-journey-verification.md](spa-journey-verification.md).
