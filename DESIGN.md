---
version: alpha
name: Totality Portfolio (日食)
description: A solar eclipse cinematic theme. Obsidian backgrounds, solar corona gold, totality-sky cyan, and deep indigo—evoking the awe of watching the moon swallow the sun.
colors:
  surface: "#121318"
  surface-dim: "#0d0e13"
  surface-container-lowest: "#0d0e13"
  surface-container-low: "#1a1b21"
  surface-container: "#1e1f25"
  surface-container-high: "#292a2f"
  surface-container-highest: "#34343a"
  on-surface: "#e3e1e9"
  on-surface-variant: "#d0c6ab"
  outline: "#999077"
  outline-variant: "#4d4732"
  primary: "#fff6df"
  on-primary: "#3a3000"
  primary-container: "#ffd700"
  on-primary-container: "#705e00"
  secondary: "#bdf4ff"
  on-secondary: "#00363d"
  secondary-container: "#00e3fd"
  on-secondary-container: "#00616d"
  tertiary: "#fcf3ff"
  on-tertiary: "#3b2754"
  tertiary-container: "#e7d1ff"
  on-tertiary-container: "#6b5586"
  surface-tint: "#e9c400"
  background: "#121318"
  on-background: "#e3e1e9"
  inverse-surface: "#e3e1e9"
  inverse-on-surface: "#2f3036"
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 9rem
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 4.5rem
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  label-md:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.15em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.68rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.2em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 24px
components:
  glass-card:
    backgroundColor: rgba(52, 52, 58, 0.25)
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: 24px
  glass-card-elevated:
    backgroundColor: rgba(52, 52, 58, 0.45)
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 48px
    padding: 0 28px
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 48px
    padding: 0 28px
  button-secondary-hover:
    backgroundColor: rgba(0, 227, 253, 0.08)
  nav-link:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-mono}"
  nav-link-active:
    textColor: "{colors.primary}"
---

## Overview

Solar Eclipse Editorial Cinematic. The design evokes the visceral awe of **totality** — the moment the moon completely eclipses the sun and the sky turns an impossible midnight blue while the corona blazes with gold fire. The theme is called 日食 (Nisshoku — solar eclipse).

The aesthetic is Cosmic Premium: deep obsidian surfaces floating on a dark void, semi-transparent glass panels that catch the light, and two razor-sharp accent colors — the **solar corona gold** (`primary`) for high-importance triggers and the **totality-sky cyan** (`secondary`) for interactive states and hover effects. Movement is cinematic and purposeful.

## Colors

The palette transitions from darkness into blinding radiance:

- **Surface / Background (#121318):** The deep obsidian void of totality — the sky just after the moon covers the sun.
- **Surface-Container (#1e1f25 → #34343a):** Layered surface elevations used for cards, panels, and containers. Glass surfaces sit on these.
- **On-Surface (#e3e1e9):** Ethereal silver-white for primary body text against the dark void.
- **Primary (#fff6df):** The **solar corona** — a brilliant warm white-gold. Used for critical CTAs and glow highlights.
- **Primary-Container (#ffd700):** The "diamond ring" flash. Saturated gold used for primary button fills and key accent elements.
- **Secondary (#bdf4ff):** The **totality-sky cyan** — the eerie pale blue the sky turns during a total eclipse. Used for interactive states, borders, and secondary text.
- **Tertiary (#fcf3ff):** A pale cosmic violet for subtle atmospheric gradients and badge backgrounds.
- **Surface-Tint (#e9c400):** Gold tint used for glowing borders and the progress bar.

## Typography

A dual-font strategy balancing cinematic impact with utility:

- **Space Grotesk** is the voice of this design. Its geometric, slightly technical quirks feel both futuristic and astronomical. All display headings and labels use Space Grotesk. Display sizes use very tight letter spacing (-0.04em) to feel "locked" and monumental, like a launch countdown.
- **Inter** provides a neutral, highly legible counterpoint for body text and descriptions. It ensures that even against dark backgrounds, the information remains perfectly accessible.
- **JetBrains Mono** is used for technical captions, monospace tags, and data labels — emphasizing precision and the computational edge.

For the cinematic feel, apply a subtle `text-shadow` or "corona glow" to `display-hero` elements when they appear on the darkest backgrounds, using a low-opacity version of the primary gold color.

## Layout & Spacing

The layout uses a **Fixed Grid** (12-column desktop, single-column mobile), maintaining a prestigious editorial feel.

- **Rhythm:** An 8px base unit governs all dimensions.
- **Spacing:** Generous outer margins (64px+ on desktop) simulate the isolation of a celestial body in a void. Component groups use tight internal spacing (8–16px) but wide external margins (64–128px) to create distinct "islands" of content.
- **Borders:** Ultra-thin 1px lines in `rgba(255, 255, 255, 0.08)` separate panels, mimicking the horizon boundary of the eclipse disk.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and light-based layering, not traditional drop shadows:

- **Level 1 (Base):** Deep obsidian/neutral `#121318` background. May use a radial gradient toward a subtle indigo-violet center to simulate the eclipse corona atmospheric scattering.
- **Level 2 (Panels / Glass Cards):** Semi-transparent `rgba(52, 52, 58, 0.25)` with `backdrop-filter: blur(20px)` and a `1px solid rgba(255, 255, 255, 0.10)` border to define the glass edge.
- **Level 3 (Interactive / Elevated):** `backdrop-filter: blur(40px)`, `rgba(52, 52, 58, 0.45)` background. Hovered elements emit an **Ambient Glow** — a soft, diffused shadow tinted with the secondary cyan or primary gold, creating the effect of light bleeding from behind the element.
- **Shadows:** Use extremely soft, large-spread box-shadows (e.g., `0 8px 32px rgba(0, 0, 0, 0.3)`) to separate glass layers from the background without heaviness.

## Shapes

The shape language is **Soft-Technical**. While the overall feel is geometric, small corner radii on all components prevent the UI from feeling aggressive:

- **Buttons:** `rounded-lg` (12px) for a modern, confident feel.
- **Cards / Panels:** `rounded-xl` (16px) to soften the glass containers and give them an organic, atmospheric quality.
- **Tags / Chips:** `rounded-full` (9999px) for pill-shaped labels.
- **Decorative Eclipse Circles:** Perfect arcs and circles are encouraged as supporting graphic elements to mirror the orbital theme.

## Components

### Glass Cards (Panel Grid)
Cards implement level-2 glassmorphism using a semi-transparent `surface-container` fill and a fine 1px inner stroke. For interactive states, cards expand their **Ambient Glow** using the secondary cyan color. The halftone screen-tone overlay on hover is retained as a retro-cinematic texture.

### Action Elements
- Primary buttons use a golden corona fill (`#fff6df` → `#ffd700` hover) — the "diamond ring" flash effect. They should emit a subtle golden glow on hover using `box-shadow`.
- Secondary/ghost buttons are transparent with a cyan `secondary` border, suggesting the totality-sky atmosphere. On hover, a `rgba(0, 227, 253, 0.08)` background fills in.

### Navigation
Nav links use the label-mono style in `on-surface-variant`. Active/hover states use primary gold. The nav header uses a `rgba(18, 19, 24, 0.85)` glassmorphic backdrop on scroll.

### PRISMA HUD
The HUD dashboard implements the glass-card-elevated styling with a `surface-container` background. The chart line color switches between verticals using the secondary cyan as the primary trace color. The scanner sweep animation uses a gold-to-cyan gradient.

## Do's and Don'ts

- **DO** use the radial gradient background in the hero, moving from void-black at edges to a subtle indigo/violet in the focal center, to simulate the eclipse atmosphere.
- **DO** use `backdrop-filter: blur()` on all glass containers — the blur is what defines the aesthetic.
- **DO** emit a subtle ambient glow on interactive hover states (gold for primary actions, cyan for secondary).
- **DO** reserve the full-saturation gold `#ffd700` for the single most important CTA per section.
- **DON'T** use heavy drop shadows; use ambient color-tinted glows instead.
- **DON'T** use warm/red tones (from the previous Blue Hour theme) as accents — those belong to the old shu vermillion palette.
- **DON'T** use Fraunces serif; the new display font is Space Grotesk.
- **DON'T** let the background feel "empty" — use subtle radial gradients to give depth to the void.
