# Portfolio fixes and verification

Verified locally on 17 October 2026.

## Fixes

- Project cards now scroll to the live model using its position in the document. The old section-relative offset could send visitors back up the page.
- Lenis delegates wheel events to scrollable textareas and story panels, handing scrolling back to the page at their edges.
- Decorative cards start dragging only for mouse input. Touch retains vertical scrolling and pinch zoom, including on touch laptops. Nested buttons and links no longer start a drag, and their arrow keys no longer move the enclosing card.
- The hero portrait uses the shared scroll controller to reach the About section.
- Smooth scrolling responds to changes in the reduced-motion preference. The music dialog also releases its scroll lock during effect cleanup.
- The dock fits a 320px screen and respects the bottom safe area. Journey scenes fit short phone screens, with a smaller overview map and compact heading spacing.
- Desktop journey stop destinations use the same scene height as the scroll-driven camera.
- Project tabs support Left/Right, Home and End, with one tab in the keyboard sequence.

## Verification

- `npm run lint`: passed.
- `npm test`: 70 tests passed across 9 files.
- `npm run build`: passed, including TypeScript and static export.
- `npm run check`: 7 pages and 257 local references passed; no missing local links/assets, duplicate IDs or heading errors.
- Desktop browser: wheel scrolling advances the pinned journey; the active dock follows it; all six project selectors update; opening a project places the model about 90px below the viewport top; project tabs respond to keyboard navigation.
- Music dialog: opening applies the Lenis lock; closing removes it and page scrolling resumes.
- Contact field: a 24-line note scrolled 348px inside the textarea while the document scroll position stayed unchanged. Test text was cleared.
- Production browser at 390×844 and 320×568: journey start/next controls respond. At 320×568 the scene is 568px tall, the story and next controls are visible, and every dock link fits inside the viewport.
- Production résumé and Sanket case study load with their expected headings. No console errors or warnings were returned for these production page checks.

## Limits

Responsive checks used browser viewport overrides, not a physical touchscreen. Touch scrolling was checked through the resulting gesture styles and event handling. Live OS reduced-motion changes were not exercised. The development browser reported a hydration warning from Grammarly-added body attributes; no application change was made to hide that extension warning.

Changes are local; no deployment was performed.
