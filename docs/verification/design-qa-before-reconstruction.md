# Night Lap — design QA

final result: passed

Reviewed 2026-10-23. Target: the third displayed design selected by the user, **Night Lap**. Scope: replace the portfolio career section in place; retain the existing scroll-driven Spa journey and all career facts.

Previous journey QA is retained in [the archived report](docs/verification/previous-journey-design-qa.md).

## Evidence

- Selected target: [reference](docs/verification/night-lap-reference.webp).
- Final implementation: [desktop](docs/verification/night-lap-desktop.jpg), [phone](docs/verification/night-lap-mobile.jpg), [tablet](docs/verification/night-lap-tablet.jpg), [landscape](docs/verification/night-lap-landscape.jpg).
- Combined comparison, reference left and implementation right: [full frame](docs/verification/night-lap-comparison.jpg).
- Combined readable detail comparison: [career popover](docs/verification/night-lap-popup-comparison.png).
- Earlier implementation used for the first visual pass: [iteration one](docs/verification/night-lap-desktop-v1.jpg).
- Captured desktop DOM geometry: [geometry](docs/verification/night-lap-desktop-geometry.json).

Source pixels: 1505 x 1045. Browser requested viewport: 1505 x 1045; the browser reported rounded CSS dimensions 1506 x 1046 with devicePixelRatio approximately 1. The content screenshot is 1490 x 1035 after browser scrollbar/capture bounds. Full comparisons preserve each image's aspect ratio at 1200 pixels wide and pad the one-pixel height difference. Popup crops use recorded DOM-to-raster scale, rather than assuming a 1:1 screenshot. Other tested viewport overrides: 375 x 812, 1024 x 768, and 844 x 390.

## Findings, fixes, and follow-up comparison

No remaining P0, P1, or P2 findings.

1. **P2 — initial circuit too high and tall.** Iteration one left too little space above the upper straight and placed the lower turn close to the dock. Tightened the render bounds, adjusted the stage size and position, and kept all existing route coordinates aligned with pins and the car. Final paired comparison shows the complete circuit with clear masthead and dock space.
2. **P2 — initial card hierarchy and type too small.** Increased the desktop popover to 400px, body copy to 16px, and company type to 33px; matched the selected Sanket headline line break. Kept the optional details control beside the primary link. The final readable popup comparison verifies the updated text scale and wrapping.
3. **P2 — active map marker hidden under the vehicle.** Offset the active pin beside the car. The warm active pin, number, and detailed car now remain distinct.
4. **P2 — narrow-layout collisions.** Moved the mobile circuit below the chapter rail and placed its card below the complete route. Hid only the redundant active label on compact layouts. In landscape, kept chapter hit areas at 44px, reduced the car, and removed the scroll hint text where it collided with the dock. Final phone and landscape captures show usable controls and no horizontal page overflow.
5. **P2 — section chrome outlived the circuit.** The process section intentionally shares the Journey dock item. Track the actual visible section separately from its dock category so the night chrome ends with the circuit. Verified that skipping to Process restores the normal header.
6. **Interaction follow-up — dismissed card focus.** Park the existing checkpoint when a popover is dismissed, preserving normal wheel movement afterward. Closing and native accessible reopening were verified. Expanded details, photo modal and close were also verified.

## Required fidelity surfaces

| Surface | Result |
| --- | --- |
| Fonts and typography | Passed. Existing DM Sans and JetBrains Mono provide the sans/label system; a Georgia serif headline follows the selected mockup. Company, role, headline, paragraph and link hierarchy were checked at full frame and readable popup scale. |
| Spacing and layout | Passed. Full-viewport background, large overhead circuit, left chapter rail, top corner controls, small vehicle, nearby connected popup and bottom navigation. No permanent information column or containing dashboard frame. |
| Colors and tokens | Passed. Dark evergreen terrain, navy popover, ivory text, periwinkle completed route, warm active pin and teal link/accent. This section retains its art direction without changing the rest of the site's theme. |
| Image quality | Passed. Separate generated terrain WebP (1500 x 1000, about 336KB) and transparent car PNG (256 x 588, about 286KB). No UI or route baked into the terrain; no white rectangle around the car. The live circuit uses the existing coordinate data for path tracing and exact car/pin alignment. |
| Copy and content | Passed. Actual companies, roles and supplied dates retained. Short popover summaries use existing facts; complete narratives, bullets, galleries and links remain accessible under Details. No generated career claims. |
| Icons and controls | Passed. Consistent outline controls for reset, skip, close, north, scroll and links. Clear labels, keyboard support, visible focus outlines and compact-layout 44px targets. |

## Functional verification

- All seven chapter buttons open their correct arrival popovers.
- Mouse scrolling backward moves from Sanket (89%) back to Tectoro (72%); forward scrolling returns to Sanket. The overhead stage stays pinned at top 0, and the car's position is owned by document scroll rather than a timer.
- No play/pause buttons remain.
- Left/right keyboard chapter navigation, close/reopen, details, Sanket gallery and photo dialog were exercised.
- Reset and skip controls are real navigation controls. The original Hero goToStop handle remains connected.
- Browser console: no errors in the final check.
- Reduced-motion preference uses discrete checkpoint positions and disables visual transitions; the continuous route/progress and popup placement helpers have focused unit tests.
- TypeScript / production build, ESLint, all 93 unit tests, and static export link/anchor checks pass.

## Accepted differences and P3 notes

- The functional track retains the portfolio's supplied Spa coordinates. A few bends and geographic label placements therefore differ from the generated concept, which had stylized the circuit.
- A small Details control preserves the existing career narratives and gallery, beyond the mockup's single case-study link.
- Mobile and short landscape compositions are responsive adaptations because the selected visual only specified a desktop frame.
- Terrain and car are separate original generated assets; their individual tree and paint details naturally differ from the concept image while matching its rendering direction.

## Implementation checklist

- [x] Full-screen selected visual direction implemented in the existing repository.
- [x] All generated production assets saved under public/assets/journey/.
- [x] Source and implementation opened and compared together.
- [x] Readable typography/popover comparison completed.
- [x] P0/P1/P2 findings fixed and post-fix evidence reviewed.
- [x] Desktop, phone, tablet and short landscape verified.
- [x] Primary scroll and career-card interactions checked.
- [x] Production checks completed; no deployment performed.
