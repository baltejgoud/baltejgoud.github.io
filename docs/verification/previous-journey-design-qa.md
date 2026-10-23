# Journey design QA — 2026-10-17

final result: passed

## Scope and visual truth

Reference: https://www.jameschugh.com/#journey. Implementation: http://localhost:3001/#journey, the production static export. The brief adapts the reference's journey to Baltej's seven chapters, confirmed dates, company identities, portrait and project interfaces. James's nine employers, personal photographs, city names, visitor count and affiliations are intentionally excluded.

Source captures: `.cache/journey-match/source-desktop-overview.png`, `source-desktop-active.png`, `source-mobile-overview.png`, `source-mobile-active.png`.

Implementation captures: `.cache/journey-match/local-desktop-overview-final.png`, `local-desktop-active-final.png`, `local-mobile-overview-final.png`, `local-mobile-active-final.png`, `local-mobile-gallery.png`.

Desktop CSS viewport: 1440 × 900; source and implementation screenshot rasters: 1425 × 891. Mobile CSS viewport: 390 × 844; both screenshot rasters: 375 × 811. The in-app browser's capture scaling is equal within each pair. Sharp normalized both members of each desktop pair to 1440 × 900 and each phone pair to 390 × 844 for comparison; no asymmetric crop, device frame or density scaling was used.

## Comparison evidence

Full-view side-by-side comparisons, source left / implementation right:

- `.cache/journey-match/comparison-desktop-overview-final.png`
- `.cache/journey-match/comparison-desktop-active-final.png`
- `.cache/journey-match/comparison-mobile-overview-final.png`
- `.cache/journey-match/comparison-mobile-active-final.png`

Focused, readable card comparison: `.cache/journey-match/comparison-cards-focused.png`. The desktop active pair compares the second narrative chapter; the mobile active pair compares the first education chapter. Card height and copy wrapping differ with the user's own content. The reference's second chapter has personal photos; Baltej's tutoring card has supported teaching facts. Sanket has the existing project screenshot gallery instead.

## Findings and comparison history

1. **[P1, fixed] Previous journey was a static map/detail panel.** Replaced it with a viewport-pinned map, scroll-driven camera, progressive blue route, navigation arrow, floating story cards, compass, official logo pins, and desktop timeline. Mobile uses the reference's single-screen start/next/previous/read-more pattern. Final desktop and phone pairs verify the resulting structure.
2. **[P2, fixed] Initial anchor offset shifted the overview and its controls downward.** The inherited 45px scroll margin was overridden specifically for `#journey`. Browser measurements after settling show the section at approximately 0.3px from the viewport top. Final overview captures verify the corrected framing.
3. **[P2, fixed] First phone overview used oversized pins and a hard map boundary.** Applied separate mobile pin scaling, matched map framing, a fading map edge and revised start/step-control placement. Compare `comparison-mobile-overview.png` with `comparison-mobile-overview-final.png`.
4. **[P2, fixed] Standalone compass rotation used the wrong transform origin.** Made the SVG rotation explicitly pivot around (54, 54). The final mobile active comparison shows the complete needle inside the dial.
5. **[P1, fixed] Browser scroll anchoring could shift the page during mobile camera motion.** Disabled scroll anchoring for the journey subtree. Production browser checks traversed the chapters with the section remaining within about 1.3px of the viewport top. Step destinations also update immediately and use the current destination when advancing/reversing, allowing navigation to interrupt an ongoing camera animation.

No actionable P0/P1/P2 findings remain for the requested journey and logo integration.

## Required fidelity surfaces

- **Typography:** Bricolage Grotesque matches the source journey family. Desktop headline 69px, card heading 31px and body 16.5px; compact phone heading/card typography and three-line story truncation match the reference pattern. The user's narrative creates different line breaks. Small desktop date labels are slightly smaller than the reference: P3 polish only.
- **Spacing/layout:** Same centered overview, full-height sticky scene, 416px floating desktop card, rounded tinted header, map control placement, bottom dot rail, and phone bottom card/step controls. User-content card height differs appropriately. Persistent controls fit the viewport; no horizontal page overflow was observed.
- **Colors/tokens:** Warm paper, navy text, blue route, tinted company headers, translucent controls, map fade and card shadows follow the source. Company accent colors identify Baltej's chapters. Dark-mode styling is retained.
- **Images/assets:** Real source city geometry, pin outline and compass are local SVG assets. Company logo marks come from the official URLs supplied by the user; Sanket comes from the attached image. Logos were checked loaded with nonzero intrinsic dimensions. The full Sanket wordmark is also shown in the founder section. No invented employer photos or hotlinked source assets are used. Provenance: `docs/journey-assets.md`.
- **Copy/content:** Chronology uses BVRIT 2019–2023, tutoring Jan–Jun 2023, freelance Jun 2023–Feb 2024, Haritha Mar 2024–present, Tectoro Oct–Dec 2025 alongside Haritha, Sanket now, then an invitation to the next role. Sanket's founding month remains unspecified. The map is symbolic rather than a claim about geographic office locations.

## Functional and accessibility verification

- Production browser: desktop chapter selection and route/camera updates; zoom-in and recenter; phone start, chapter changes and previous controls; collapsed/expanded narrative; Sanket gallery modal opening and close button; final role invitation.
- Labelled semantic buttons, visible keyboard focus styles, left/right scene navigation, native modal semantics, and reduced-motion manual stepping are implemented. The gallery pauses smooth scrolling while open.
- Browser console checked on the static preview: no warnings or errors returned.
- `npm run lint`: passed. `npm test`: 81 tests passed across 14 files, including route reachability, bounds, finite camera positions and chronology. An initial concurrent build/test run hit the existing rope stress-test timeout; rerunning after the build completed passed all tests without changing that test.
- `npm run build`: passed after the final navigation correction. `npm run check`: 7 pages and 246 local references checked; no missing local links, duplicate IDs or h1 errors.

## Follow-up polish and limits

- P3: Match the tiny desktop company-date label size more precisely if desired.
- Exact personal photos and founding dates can be added when supplied. No physical touch-device or OS reduced-motion run was performed; phone layout was checked in the in-app browser at 390 × 844.
- The remaining portfolio retains the previous redesign and was not re-audited against the reference in this focused journey pass.

## Implementation checklist

- [x] Reference desktop and phone captured before implementation.
- [x] Local assets and official logos installed with provenance.
- [x] Production desktop and phone layouts compared side by side.
- [x] Major visual and interaction findings fixed and recaptured.
- [x] Build, lint, tests, links and runtime console checked.
- [x] Local preview running for handoff.
