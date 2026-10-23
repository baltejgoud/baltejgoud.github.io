# Career Circuit reconstruction — verification

Date: 2026-10-23

## Audit and retained implementation

- Next.js 16.4.2 App Router, React 19.3, TypeScript. Existing Lenis smooth scrolling, Motion, Lucide, Three.js and GSAP dependencies were inspected. No new dependencies were added.
- Entry: `src/components/portfolio/Portfolio.tsx`; Journey: `CareerJourney.tsx`; map/car/pins: `CareerCircuit.tsx`.
- The existing source `src/content/journey-route.json` has the MIT-attributed bacinger/f1-circuits `be-1925` geographic centerline, 7.004 km circuit length, a closed sampled route, cumulative lengths, seven ordered stops and their positions. It was not changed.
- Existing transparent `red-bull-car.png` is reused. There is no GLB/model in the active Journey implementation. Position, heading and arrivals are driven by the existing document-scroll controller and Lenis, without autonomous driving or camera chasing.
- Original `journey.ts`, `journey-stories.ts`, all detailed stories, dates, bullets, gallery links, company links and contact destinations were retained. Labels use the requested University/Teaching/etc. aliases.
- Existing fixed site navigation and anchor handling are reused. Home, Work, Journey, About, Contact, and Résumé remain in one bottom dock. No new top navigation was added.
- Existing unrelated, uncommitted portfolio changes were present before this task and were left in place. The starting Journey diff and prior QA report are archived in this directory.

## Rendering architecture

- One 1672 × 941 environment artboard contains the new cinematic forest, small buildings, warm illumination, perimeter mist and empty circuit.
- `careerScene.ts` applies one rotation and ground-plane aerial projection to the entire existing geographic route. No individual corner is relocated. The guide generator uses the same constants.
- The live SVG road is generated from those projected samples. The car position and tangent are projected from the same centerline; no independently traced driving approximation is used.
- Markers use projected stop coordinates. Fine connectors terminate at the route. Card placement scores road overlap and protects the masthead, headline and chapter rail.
- The small reference card expands to show the preserved full narrative, dates, bullets, links and gallery. There is only one expanded card. Reduced-motion mode removes transitions/mist motion and advances between chapter positions without a driving animation.
- Phone framing reduces the complete circuit without stretching its shape. The phone outer forest uses the existing terrain asset, avoiding a duplicated baked road. All six bottom links remain accessible.

## Checks

- `npm test`: 13 files, 101 tests passed.
- Four new geometric tests verify complete framing, closed-route registration, every arc-length sample on the rendered centerline, seven exact stop arrivals, finite headings and the single camera transform.
- `npm run build`: optimized Next.js static export passed.
- Targeted ESLint and TypeScript checks passed.
- `npm run check`: 7 pages and 240 local references; no missing links/assets, duplicate IDs or heading errors.
- In-app browser: all seven track markers selected the expected story, matching active rail, car position and percentage. Exact observed results are in `journey-interaction-results.json`.
- Scrolling up moved progress from 100% to 85%; scrolling down returned it to 100%. The camera remained stationary.
- Expanded Teaching and final-chapter cards displayed original facts and actions. Their native pointer controls were tested. A locator that auto-scrolled before clicking a sticky card was excluded as an automation artifact; native pointer clicks work.
- Home, Work, About, Contact and Journey anchors were activated, with the correct active item and one fixed dock throughout. Résumé was opened successfully in a separate browser tab and closed after inspection.
- Desktop checks: 1366 × 768, 1672 × 941, 1920 × 1080. Phone checks: 375 × 667 and 390 × 844. No horizontal document overflow; cards and navigation stayed inside their viewports. The browser's Windows pixel rounding can produce a fractional CSS height while its capture is 1672 × 941.
- No browser console errors in the final inspected state.

## Visual comparison and remaining differences

Compare `journey-source-comparison.png` (target on the left, implementation on the right) and `design-qa.md` at the project root.

The implementation is functional, but **pixel-perfect reference acceptance remains open**. The supplied image's road silhouette is different from the geographic Spa centerline. Exact reproduction of that silhouette would require reshaping the route, contrary to the request's most important constraint. The real closed Spa route was retained. Consequently, the University/finish locations, other checkpoint labels and the popup clearing differ from the reference. The generated forest also has different individual trees/buildings and less pronounced foreground road reflections. The live car is deliberately small relative to the actual road instead of the larger illustrative car in the reference.

No production deployment or Git commit was performed.
