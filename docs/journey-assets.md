# Journey asset sources

## Spa career circuit

The user requested Circuit de Spa-Francorchamps as the journey route and a Red Bull Formula 1 car as its moving marker.

- Geometry: the `be-1925` feature of [Tomislav Bacinger’s F1 circuit dataset](https://github.com/bacinger/f1-circuits), retrieved 17 October 2026. MIT licence, copyright 2019–2025 Tomislav Bacinger. The full notice is retained in `public/assets/spa-circuit-LICENSE.txt` and included in the static export.
- Conversion: `scripts/build-spa-route.cjs` projects longitude with a latitude correction, rotates the map for presentation, then samples a closed Catmull-Rom centreline. Its output is `src/content/journey-route.json`. The road, lap progress, car and chapter positions all use this same local geometry.
- Circuit reference: [Formula 1’s Spa circuit guide](https://www.formula1.com/en/information/belgium-circuit-de-spa-francorchamps.3LltuYaAXVRU8iezEsjzGw), which gives the 7.004 km length, and the [FIA circuit map](https://www.fia.com/sites/default/files/decision-document/2023%20Spa%20Francorchamps%20Event%20-%20Circuit%20Map%20Spa%20Francorchamps%202023.pdf).
- Real scale: `src/lib/trackside.ts` maps the route to metres so the lap measures Spa's published 7.004 km. Because the map's uniform Catmull-Rom curve doubles back for about 10 m near Malmedy (and forms smaller loops where control points bunch), the 3D centreline is rebuilt through the same control points with a centripetal Catmull-Rom curve. The 2D map, minimap and fallback still use `journey-route.json` unchanged.
- Start position: the route's first point sits about 255 m before La Source's apex, consistent with the [265 m start-to-Turn 1 figure](https://www.racecar.com/news/82390/motorsport/mclaren-the-long-and-power-hungry-nature-of-spa-wont-suit-us), so it is used as the start line. The car starts in the pole slot just behind it; slots follow F1's 8 m stagger and the 2026 grid of 22 cars. Pole is placed on the inside for La Source (a right-hander), which is the usual convention rather than a sourced detail of this circuit. The pit lane is on the inside of the start straight; [a track guide](https://coachdaveacademy.com/tutorials/circuit-de-spa-francorchamps-track-guide/) places its exit just after La Source on the inside.
- Elevation: an approximate profile built from [Formula 1's figure](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc) of a 102.2 m difference, highest at Malmedy (Turn 7) and lowest near Paul Frère (Turn 15), plus the roughly 30 m rise from Eau Rouge to Raidillon reported by [Oversteer48](https://oversteer48.com/eau-rouge-raidillion/). Intermediate heights are interpolated; this is not survey data.
- Car: `src/components/portfolio/trackside/FormulaCar.ts`, an original procedural model built to the 2026 dimensions (approximately 5.45 m long, 1.9 m wide, 3.4 m wheelbase, 18-inch wheels, no beam wing). The reference is the user's three RB22 launch photographs (front, top and three-quarter views): cobalt paint with dark flecks fading to carbon low down, a yellow nose and airbox, white-keylined red bulls, carbon wings, sponsor lettering and open-spoke wheels with blue rim bands. The livery is painted as flat side and top views in `livery.ts` and projected onto the bodywork in the shader, so marks sit where the photos show them. Sponsor names are set in plain type rather than reproduced logos. The charging-bull path comes from `siRedbull` in the already-installed Simple Icons package; every texture is drawn locally. The photographs remain reference material and are not bundled into the site. Geometry is an interpretation of the photographs, not a production CAD replica. The same model is used on the circuit and, at higher texture resolution, in the lazy-loaded `CarStudio.ts` inspection view.
- Environment: `src/components/portfolio/trackside/` (`terrain.ts`, `surface.ts`, `venue.ts`, `forest.ts`, `textures.ts`). Terrain, forest, grandstands and crowds, pit building and paddock, kerbs, run-off, barriers, gantry and screens are procedural original artwork around the real centreline. Placements of grandstands, gravel traps and marshal posts are illustrative. Team colours on garages and motorhomes are generic. Ad boards use the portfolio's own names, not real sponsors. No real-world career locations are implied.
- Sky: the Three.js `Sky` shader (part of the same MIT-licensed package) for the sky, clouds and reflections.
- Renderer: Three.js 0.186.1, loaded locally in a separate chunk. Its MIT notice is retained in `public/assets/three-LICENSE.txt` and copied into the static export.
- Chapter-to-corner placement is illustrative storytelling. The map is a real circuit, not a claim about where the career events happened. No race times, speed or competitive results are invented.

To reproduce the geometry, download `f1-circuits.geojson` from that repository and run:

```powershell
node scripts/build-spa-route.cjs path/to/f1-circuits.geojson
```

The previous city map, pin and compass assets remain in `public/assets/` for historical compatibility; the new journey does not load them. No external scripts, remote images or mapping API are required at runtime.

## Career assets

Company assets were obtained from the official sites supplied by the user:

- BVRIT: https://bvrit.ac.in/wp-content/uploads/2023/04/BVRIT-engineering-technology-college-logo-narsapur.webp
- Tectoro: https://www.tectoro.com/image/logo/tectoro.png
- Haritha Industries: https://harithaindustries.com/logo.png
- Sanket: the user-provided `Gemini_Generated_Image_5qrv4v5qrv4v5qrv.png` attachment. Converted to lossless WebP after trimming excess outer whitespace; the lettering and tagline were preserved.

Full logos and compact crops from those same assets are in `public/assets/logos/`. Compact crops keep each mark readable in the map pins. The user's original Downloads file is unchanged. Brand assets identify the education/work milestones; they do not imply endorsement.

Sanket gallery screenshots and the portrait reuse the portfolio’s existing local assets. No personal or employer photos were invented. Story dates follow the user’s supplied chronology, including Tectoro’s overlap with Haritha. Sanket remains “Now” because a founding date has not been supplied.
