# Signal Valley — artwork and photos still to make

Everything below is optional polish on top of a site that already works. Send the files over (or
drop them in the paths shown) and they slot in without code changes beyond the content file named.

## 1. Hero depth layers (biggest upgrade)

Today the hero is one painting, so the scroll camera can only push in on a flat image. Three
separate planes make the fly-in feel like moving *through* the valley: the foreground rushes past,
the buildings drift, the sky barely moves.

Use ChatGPT (image generation, it can output transparent PNGs). Attach
`public/assets/portfolio-valley.webp` to every prompt so the style and layout match exactly.

**Sky plane** → save as `public/assets/hero/sky.png`

> Using the attached painting as the exact reference for style, colours, light and composition,
> paint ONLY the sky and the far hazy mountain range as one full-bleed 2400×1350 image. Extend the
> sky naturally where buildings and trees were. Same warm late-afternoon sun from the upper right,
> same soft clouds. No buildings, trees, people, text or logos.

**Valley plane** → save as `public/assets/hero/valley.png`

> Using the attached painting as the exact reference, reproduce the middle distance only — the
> sandstone university on the left, the terracotta workshop by the turquoise lake, the waterfall,
> the bridge and the white glass observatory on the hill — at 2400×1350 in the same positions.
> Make the sky fully transparent. Leave out the tall foreground grasses, flowers and rocks along the
> bottom edge. Transparent PNG. No text or logos.

**Foreground plane** → save as `public/assets/hero/front.png`

> Using the attached painting as the exact reference, paint ONLY the nearest foreground at
> 2400×1350: the tall grasses, red and yellow wildflowers and mossy rocks along the bottom edge and
> the leafy branch in the top-left corner, slightly out of focus. Everything else fully
> transparent, including the stone path. Transparent PNG. No text or logos.

Repeat the three prompts with the phone painting `public/assets/portfolio-valley-mobile.webp`
attached and "1080×1620 portrait" instead, saving `sky-mobile.png`, `valley-mobile.png` and
`front-mobile.png`.

Then in `src/content/hero.ts` replace the single layer with:

```ts
layers: [
  { src: "/assets/hero/sky.webp", mobileSrc: "/assets/hero/sky-mobile.webp", depth: "sky" },
  { src: "/assets/hero/valley.webp", mobileSrc: "/assets/hero/valley-mobile.webp", depth: "ground" },
  { src: "/assets/hero/front.webp", mobileSrc: "/assets/hero/front-mobile.webp", depth: "front" },
],
```

(Convert to WebP with Sharp first, then run `node scripts/lqip.cjs` with the sky image.) Or just
send the PNGs and ask me to wire them in.

## 2. A full-body photo of you

The hero currently uses the knee-up cutout `public/images/portrait-cutout.webp`. A full-body shot
lets you stand *on the path* the way the reference's designer stands on his steps.

- Stand on flat ground, whole body in frame with a little space above your head and below your feet.
- Daylight from your left or slightly behind, to match the sun in the painting.
- Turn about 30° to your left (toward the valley), relaxed, smiling.
- Plain background helps; it gets removed either way (`npm run images -- photo.png` or remove.bg).

Save as `public/images/portrait-full.webp` and update `heroArt.cutout` in `src/content/hero.ts`
with its width and height.

## 3. Photos for the off-the-clock board

6–10 real photos: football, friends, a trip, your desk, food you love, a concert, anything that's
you. Put them in `public/images/life/` and add each to `src/content/life.ts`:

```ts
{ src: "/images/life/football.webp", width: 1200, height: 1500, caption: "match day", alt: "Baltej with his football team after a match", left: 58, top: 8, rotate: -4 },
```

`left`/`top` are percentages of the board. The most open spot on desktop is around `left` 54–56,
`top` 50–60; a little overlap looks natural on a corkboard. Or send them and I'll place them.

## 4. Optional extras

- **Night painting**: the same valley at dusk with lit windows and a moon, for night mode instead
  of the colour grade. Same prompt style as the layers, "at blue-hour dusk, warm lit windows".
- **Notes**: when someone sends you a note you'd like on the site, add it (with their permission,
  word for word) to `src/content/notes.ts`; the "Signals received" strip appears automatically.
- **Sanket numbers**: if you can share any honest figures (pilots, SKUs forecast, accuracy), they
  can replace the qualitative facts in the Sanket section.
