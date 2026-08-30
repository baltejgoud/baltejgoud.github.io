# Baltej Goud — Founder Site

**Design system & page hierarchy · v2 (supersedes "Totality")**

A founder-led editorial system. Typography and whitespace carry the identity;
colour, motion and ornament are rationed. Every element must justify itself as
information or hierarchy — nothing decorative survives review.

---

## 1. Positioning

| | |
|---|---|
| **Subject** | Baltej Goud |
| **Line** | Founder & CEO · Product Builder · Engineer |
| **Order** | Founder first. Builder second. Engineer third. |
| **Centre of gravity** | Sanket — predictive intelligence platform |
| **Reader** | Investor, customer, senior operator, technical leader, journalist, partner |
| **Test** | "This person is building something serious." |

**Emphasis budget.** Sanket ≈ 60–70% of the page. Everything else combined ≈ 30–40%.
Selected builds are supporting evidence, not peers.

**Integrity rule.** No invented revenue, users, funding, customers, partnerships,
traction or awards. Product interfaces are labelled *illustrative · representative
data*. Where a fact is missing, the slot is designed to be filled later rather
than fabricated.

---

## 2. Page hierarchy

```
NAV ........... BALTEJ GOUD · Sanket / Work / Experience / About / Contact · LinkedIn GitHub
                sticky, hairline, no numbering

01  HERO ....................... authority in one viewport
      Baltej Goud
      Founder & CEO. I build intelligent products for complex industries.
      -> Sanket one-paragraph definition
      -> [Explore Sanket] [About me] · LinkedIn · GitHub
      -> Visual: demand-signal chart (actual -> forecast + confidence band)

02  APPROACH ................... the founder statement
      Pull quote + four philosophy blocks

03  SANKET ..................... the spine of the page (60-70%)
      3.1  Wordmark + logline
      3.2  The problem, in business terms
      3.3  Product surface — 6 switchable platform views
      3.4  Four verticals as one platform (modular glyph system)
      3.5  Business story 01-07
             01 Problem · 02 Insight · 03 Product · 04 Intelligence
             05 Platform · 06 Architecture · 07 Vision
      3.6  Architecture stack + operations sidecar
      3.7  Repository / architecture conversation links

04  SELECTED BUILDS ............ three, image-led, editorial
      Role · Problem · What I built · Key technology · Outcome

05  EXPERIENCE ................. credibility ledger, restrained timeline
      Wells Fargo · IKEA · Tectoro Consulting  (+ education footnote)

06  OPERATING RANGE ............ Product / Engineering / Intelligence / Design / Strategy
      Secondary stack listing, grouped, no chips

07  ABOUT ...................... large portrait + concise biography + factual marks

08  CURRENTLY .................. founder status, not availability

09  CONTACT .................... "Let's build something consequential."

FOOT .......... wordmark · location · résumé · year
```

Business explanation always precedes architecture. A reader who has never
written Python must understand Sanket by the end of story block 03.

---

## 3. Colour

Warm near-black interface. One accent, used as a *signal* — the forecast line,
the active state, the eyebrow rule. Never as a fill for large areas.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#08080A` | page ground |
| `--bg-alt` | `#0B0B0C` | alternating section ground |
| `--surface` | `#111214` | elevated panel |
| `--surface-2` | `#17181B` | inset row, table header |
| `--line` | `rgba(255,255,255,.08)` | default hairline |
| `--line-strong` | `rgba(255,255,255,.14)` | emphasis hairline, hover |
| `--text` | `#F5F5F3` | primary |
| `--text-2` | `#98989F` | secondary — 6.98:1 on `--bg` |
| `--text-3` | `#83838B` | metadata — 5.32:1 on `--bg`, 4.72:1 on `--surface-2` |
| `--signal` | `#E8A257` | accent — 9.72:1 on `--bg` |
| `--signal-soft` | `rgba(232,162,87,.12)` | confidence bands, active tint |

**Why amber.** *Sanket* means signal. The accent literally draws the signal:
the forecast line, the flagged SKU, the current view. Reserved. No second hue,
no gradient ramps, no glow, no glass.

Data visualisation uses neutral greys for everything except the one series that
matters. Severity uses tone, not a rainbow: `--signal` (attention) and
`--text-3` (nominal).

---

## 4. Typography

| Role | Face | Size | Weight | Tracking |
|---|---|---|---|---|
| Display | Inter Tight | `clamp(2.9rem, 6.4vw, 5.5rem)` | 600 | −0.038em |
| Section head | Inter Tight | `clamp(1.95rem, 3.6vw, 3rem)` | 600 | −0.03em |
| Sub head | Inter Tight | `clamp(1.15rem, 1.7vw, 1.45rem)` | 600 | −0.02em |
| Lede | Inter | `clamp(1.05rem, 1.35vw, 1.3rem)` | 400 | −0.011em |
| Body | Inter | `1rem / 1.68` | 400 | 0 |
| Small | Inter | `.875rem / 1.6` | 400 | 0 |
| Meta | JetBrains Mono | `.6875–.75rem` | 500 | .14em, uppercase |

Monospace is reserved for genuine technical metadata: SKU identifiers, model
names, layer labels, indices, section eyebrows. It is never used for atmosphere.

Measure: 62–72 characters for body, 30–44 for ledes. Headlines break on meaning,
never on decoration.

---

## 5. Layout & spacing

- Content max-width **1280px**; wide editorial rows may reach **1440px**.
- Gutters `clamp(20px, 5vw, 56px)`.
- 12-column desktop grid, 8-column tablet, 4-column mobile.
- Section rhythm `clamp(88px, 11vw, 152px)` block padding.
- Space scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160`.
- Sections are separated by a hairline, not by a card. Containers are the
  exception; typography and rules are the default.

**Breakpoints**: `560` · `760` · `1024` · `1280`.

---

## 6. Components

| Component | Rule |
|---|---|
| **Eyebrow** | mono label + 24px signal rule; one per section |
| **Section head** | eyebrow → h2 → optional lede, left-aligned, never centred |
| **Panel** | `--surface`, 1px `--line`, radius **3px**. No shadow, no blur, no glass |
| **Button — primary** | solid `--text` ground, `--bg` label, radius 3px |
| **Button — ghost** | transparent, 1px `--line`, hover → `--line-strong` |
| **Table** | mono header row, hairline separators, no zebra, no outer border |
| **Product surface** | app chrome + left view rail + main panel; captioned as illustrative |
| **Vertical glyph** | 24×24 box, 1.5px stroke, same grid primitives across all four |
| **Numbered story** | mono index, hairline rule per row, title + body in a 2-col split |
| **Architecture** | stacked layers + connectors; labels mono, descriptions sans |
| **Timeline** | company / role / one impact line; no chips, no logos |

Radii: `0` structural, `3px` panels, `999px` only for the status dot.

---

## 7. Motion

Purpose or nothing. All durations `160–520ms`, easing `cubic-bezier(.22,.61,.36,1)`.

**Allowed**: section reveal (opacity + 8–14px rise), one-time forecast line draw,
tab crossfade, nav hairline on scroll, hairline underline on link hover,
1.5% image scale on card hover.

**Forbidden**: loading screens, custom cursors, scroll-jacking, text scramble,
floating objects, parallax scenes, page transitions, eclipse/orbit animation,
persistent ambient movement.

`prefers-reduced-motion: reduce` disables every transform and animation; all
content renders in its final state.

---

## 8. Accessibility

- WCAG AA minimum on all text; primary pairings exceed 7:1.
- Semantic landmarks; one `h1`; no heading level skipped.
- Visible focus: 2px `--signal` outline, 3px offset, on every interactive element.
- Product view rail is a real tablist with roving tabindex and arrow-key support.
- Descriptive `alt` on content images; decorative SVG is `aria-hidden`.
- Skip link to `#main`.

---

## 9. Performance

Static HTML/CSS/JS. No framework, no bundler, no third-party runtime.

- One stylesheet, one script (~6KB), deferred.
- Two font families + one mono, variable ranges, `display=swap`, preconnected.
- All charts are inline SVG — no chart library, no canvas.
- Images: explicit `width`/`height`, `loading="lazy"` below the fold, heavy
  diagrams behind a disclosure so they are never in the critical path.
- No blur filters, no large composited layers, no scroll-linked layout work.

Targets: Performance / Accessibility / Best Practices / SEO ≥ 95.

---

## 10. Removed from v1

Japanese decorative typography · TOTALITY and eclipse branding · "Portfolio —
2026" title card · loading screen · numbered chapters · glass cards · gold/cyan
glow · skyline canvas · technology ticker · HUD framing and corner brackets ·
"Open to opportunities" · "defensible in a technical interview" · job-seeker
language · skill chip walls · decorative technical labels · manga panel grid.
