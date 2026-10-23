# Career Circuit — reference reconstruction QA

final result: blocked

Functional verification: passed. Strict visual acceptance remains open; this report does not claim a pixel-perfect match.

## Source and evidence

- Target: user-supplied `C:/Users/admin/Downloads/ChatGPT Image Oct 23, 2026, 02_23_25 PM.png`, 1672 × 941.
- Bottom-navigation placement: user-supplied `Screenshot (264).png`.
- Latest desktop: [1672 × 941](docs/verification/journey-final-1672x941.jpg).
- Combined comparison (target left, implementation right): [comparison](docs/verification/journey-source-comparison.png).
- Other sizes: [laptop](docs/verification/journey-laptop-1366x768.jpg), [large desktop](docs/verification/journey-desktop-1920x1080.jpg), [phone](docs/verification/journey-mobile-390x844.jpg), [compact phone](docs/verification/journey-mobile-375x667.jpg).
- [Interaction results](docs/verification/journey-interaction-results.json) and [full verification report](docs/verification/career-reconstruction-verification.md).
- Previous report preserved at [prior QA](docs/verification/design-qa-before-reconstruction.md).

## Iteration evidence

The initial render was opened at the reference viewport and compared against the target. Corrections included headline scale/width/baseline, supporting-text position, charcoal asphalt, the compact 380 × 160 card, one wider bottom dock with an ivory résumé button, safe popup placement, readable marker placement, the initial active story, and keeping the editorial content visible throughout travel. Follow-up browser captures confirmed the changes.

Phone comparisons exposed a duplicate baked road, text/checkpoint overlap and a clipped Home link. These were fixed with a separate outer forest layer, a uniformly scaled complete circuit, compact-height framing, tighter navigation and a dedicated card position. The resulting phone views were captured again.

## Open reference-fidelity findings

### P1 — Geographic circuit and illustrated target differ

The existing geographic Spa centerline does not match the generated reference's road silhouette. It remains a closed, recognizably geographic Spa lap, with the same source geometry used for live road, car and seven stops. Reproducing the illustrated target's exact silhouette would require individually moving corners. This conflicts with the user's explicit instruction not to reshape Spa, so the geographic constraint takes priority. The final image visibly differs in track shape and positions of University/finish and other markers. This remains an open visual acceptance issue.

### P1 — Card location follows the actual road clearing

The target's University card at roughly (529,436) would cover the real route in this projection. The implemented card starts at approximately (529,517), stays compact and expands on request. Other cards choose a clearing while protecting the headline and dock. This is visible and is not represented as an exact position match.

### P2 — Landscape, perspective and car fidelity

The forest/mist/lighting are a new guide-constrained environment asset, not the exact individual trees and buildings in the reference. Ground-plane perspective and road reflections differ. The live car is smaller than the reference's illustrative car; it is correctly scaled to, and registered with, the shared road path. These differences remain visible in the combined comparison.

## Verified functionality

Seven track markers, synchronized car/rail/card/progress, forward and reverse scrolling, compact/expanded stories, retained links and career facts, all five in-page main-navigation destinations and résumé, one fixed bottom dock, reduced-motion code paths, desktop/phone containment. Build, 101 tests and local-link checks pass; no final browser console errors observed.

The implementation is available locally for inspection. The open visual findings above prevent a strict reference-match signoff.
