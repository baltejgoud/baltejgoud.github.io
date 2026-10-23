# Project bookshelf

The Work section presents the six existing projects as illustrated clothbound books. Opening a book shows a native modal reader with Story, In pictures, Try it and The build chapters. Existing project facts, case-study/source links, screenshot provenance and synthetic-data labels are retained.

## Interaction and scrolling

- Shelf books use CSS perspective, page edges and transform-only lift feedback. They do not require a canvas or continuous render loop.
- Books open by click, tap or Enter. Arrow keys, Home and End move focus across the shelf.
- The native dialog contains focus and makes the background inert. Escape, the close button and Back to the shelf close it; focus returns to the original book without scrolling it into a new position.
- Lenis pauses and the document locks while reading. The reader is one native scroll area with a sticky close bar and chapter navigation. Both are released on unmount.
- Chapter tabs support arrow keys, Home and End. Demo sliders keep their own arrow-key behavior.
- Reduced-motion CSS removes the lift transition, opening cover and page-entry animations.
- On phones and tablets the collection uses two shelves. The open spread becomes a single column on phones. Tall screenshots fit within their preview and link to the full image.

## Browser checks, 2026-10-17

- Desktop: 1280 × 720 and 1440 × 1000; phone: 375 × 812; tablet: 800 × 1000. No document or reader horizontal overflow at the checked sizes.
- Light and night shelf layouts inspected. Phone scrolling stayed inside the reader, with the background position unchanged during import interactions.
- Close/Escape restored focus to the originating shelf book and released the document scroll lock.
- Keyboard chapter navigation and the forecast slider were exercised separately.
- The exported site at port 8000 opened the reader, loaded the lazy AgriTrust demo and verified its initial chain with no browser console errors.
- Sanket: industry selection and week change updated the outlook.
- Axon: batching reduced the model from 208 draw calls to 1.
- VIGOR: import reached review, Discard reset it; a second phone import could be cancelled.
- ExtraTicket: setting the asking price to ₹4,000 blocked the listing above its ₹2,500 face value.
- AgriTrust: tampering with the lab record broke verification from step 2 onward.
- Tandem: the reconciled simulation posted one transfer and skipped the retry.
- VIGOR's tall nutrition image remained within its 290px preview after the sizing correction.

Screenshots from this local verification are in the ignored `.cache/work-bookshelf/` directory.

Validation: ESLint passed; all 85 tests passed; the production build passed; the static-site check passed with 7 pages and 239 local references.
