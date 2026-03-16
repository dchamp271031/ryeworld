# Editorial Collage Grid — Creative Direction Brief

**Author:** The Eye
**Date:** 2026-03-13
**Status:** Ready for Builder

---

## The Problem

The current homepage grid is clean, competent, and forgettable. Every card has `border-radius: 28px`, a `1px solid var(--red)` border, and sits in a perfectly aligned CSS grid. It looks like a design system demo, not a magazine. The 7px gap is tight but monotonous — every card breathes the same way. Nothing surprises you. Nothing makes you stop scrolling.

The brand promise is "street editorial meets local media" but the grid reads as "Squarespace template meets local media." We need to close that gap.

## The Direction

Think of the grid as a **mood board pinned to a wall**, not a spreadsheet. Cards should feel like they were placed by hand — some overlapping, some tilted, some bleeding to the edge. The overall composition should read like a spread from Interview Magazine if Interview covered a small town in Westchester.

Key tension to hold: **raw but not messy, warm but not soft, editorial but not pretentious.**

---

## 1. Card Type Definitions

The collage needs variety. Seven distinct card types, each with a specific visual role.

### Type A — Hero Image (full-bleed photo with type overlay)

The anchor card. Large. Demands attention.

```
Dimensions:        spans 2 columns, ~480px tall on desktop
Border-radius:     28px
Border:            none (the photo IS the edge)
Image treatment:   object-fit: cover; full bleed
Text overlay:      bottom-aligned, over a gradient scrim
                   background: linear-gradient(to top, rgba(17,17,17,0.85) 0%, transparent 60%)
Headline:          Outfit 900, clamp(28px, 3.5vw, 42px), uppercase, #fff
                   letter-spacing: -0.5px, line-height: 1.05
Category pill:     position: absolute; top: 16px; left: 16px
                   background: var(--red); color: #fff
                   font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase
                   padding: 6px 14px; border-radius: 20px
Rotation:          none (anchor stays level)
Hover:             transform: scale(1.015); transition: transform 0.3s ease-out
                   box-shadow: 0 24px 60px rgba(0,0,0,0.12)
```

### Type B — Typography-Only Card

No image. The headline IS the visual. Big, bold, fills the card.

```
Dimensions:        1 column, auto height (driven by text)
Border-radius:     28px
Background:        var(--cream) (#F5EDE3) or var(--sage-light) (#E8EDE4)
                   alternating, never two of the same adjacent
Padding:           clamp(28px, 3.5vw, 40px)
Border:            none
Headline:          Outfit 900, clamp(24px, 3vw, 36px), uppercase
                   line-height: 1.0, letter-spacing: -0.5px
                   color: var(--black)
Category:          Outfit 800, 10px, uppercase, letter-spacing: 3px
                   color: var(--red) for news/sports, var(--sage) for community/events
Excerpt:           Outfit 400, 14px, line-height: 1.6, color: rgba(17,17,17,0.5)
                   max 2 lines, overflow: hidden
Rotation:          transform: rotate(-1.5deg)
                   (subtle — just enough to break the grid monotony)
Hover:             rotation resets to 0deg; background darkens 3%
                   transition: all 0.25s ease-out
```

### Type C — Photo Card with Text Below

The workhorse. Photo on top, text underneath. Classic editorial layout.

```
Dimensions:        1 column
Border-radius:     28px
Border:            none
Background:        var(--light) (#f7f7f5)
Image:             aspect-ratio: 3/4 (portrait) or 4/3 (landscape, used sparingly)
                   object-fit: cover; border-radius: 28px 28px 0 0
Body padding:      20px 22px 24px
Headline:          Outfit 800, 16px, uppercase, letter-spacing: -0.2px
                   line-height: 1.2, color: var(--black)
Category line:     Outfit 600, 11px, color: var(--gray)
Rotation:          transform: rotate(1deg) — alternate +/- across cards
Hover:             rotation resets to 0deg; translateY(-4px)
                   box-shadow: 0 16px 40px rgba(0,0,0,0.08)
```

### Type D — Sticker/Badge Card

Small, punchy, decorative. Breaks up the grid with personality.

```
Dimensions:        small — roughly 1 column, max 180px tall
Border-radius:     50% (circle) or 28px (rounded square)
Background:        var(--red) or var(--black)
Content:           Single bold word or phrase, e.g. "GO GARNETS" / "NEW" / "THIS WEEKEND"
                   or a category icon/emoji at 48px
Typography:        Outfit 900, clamp(14px, 2vw, 20px), uppercase, letter-spacing: 2px
                   color: #fff (on red/black bg)
Rotation:          transform: rotate(3deg) to rotate(8deg) — more aggressive rotation
                   these are the "stickers on the mood board"
Hover:             scale(1.08) with a slight wiggle
                   transition: transform 0.2s ease-out
```

### Type E — Pull Quote Card

Editorial tension. A single quote or stat, big and centered.

```
Dimensions:        1 column, short (~200px)
Border-radius:     28px
Background:        var(--black)
Padding:           clamp(24px, 3vw, 36px)
Border:            none
Quote text:        Outfit 700 italic, clamp(18px, 2.2vw, 24px)
                   color: #fff, line-height: 1.35
                   text-align: center
Attribution:       Outfit 600, 11px, uppercase, letter-spacing: 2px
                   color: rgba(255,255,255,0.35), margin-top: 12px
Rotation:          transform: rotate(-0.5deg)
Hover:             background shifts to var(--red)
                   transition: background 0.3s ease-out
```

### Type F — Full-Bleed Landscape Photo (no text)

Pure visual. Breathing room. The "art" card.

```
Dimensions:        spans full width (3 columns) OR 2 columns, ~220px tall
Border-radius:     28px
Image:             object-fit: cover; full bleed
                   images to use: marshlands-aerial.jpg, playland-parkway.jpg, playland-sound-beach.jpg
Text:              none — or a single small watermark-style location tag
                   e.g., "marshlands conservancy" in Outfit 700, 9px, uppercase
                   letter-spacing: 3px, color: rgba(255,255,255,0.5)
                   position: absolute; bottom: 14px; right: 18px
Rotation:          none (full-width cards stay level)
Hover:             slight zoom on the image: img scale(1.03) with overflow: hidden on card
                   transition: transform 0.4s ease-out
```

### Type G — Category Navigation Card

Interactive utility card. The "browse" card stays, but gets warmer.

```
Dimensions:        1 column
Border-radius:     28px
Background:        var(--cream) (#F5EDE3)
Padding:           clamp(24px, 3vw, 32px)
Border:            none
Section label:     unchanged (10px, 800, uppercase, red)
Pills:             background: #fff; border: 1.5px solid var(--border)
                   font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 20px
                   hover: border-color: var(--red); color: var(--red)
Rotation:          transform: rotate(0.5deg)
```

---

## 2. Expanded Color Palette

The current palette is red, black, white, and light gray. That is a newspaper, not an editorial collage. We need warmth and earth to complement the red without diluting it.

### New CSS Custom Properties

```css
:root {
  /* Existing — do not change */
  --red: #E8222A;
  --black: #111;
  --white: #fff;
  --gray: #888880;
  --light: #f7f7f5;
  --border: #f0efeb;

  /* New — editorial collage palette */
  --cream: #F5EDE3;         /* warm paper tone — card backgrounds, replaces cold #fdf0ef */
  --cream-dark: #E8DDD0;    /* slightly deeper cream for hover states */
  --sage: #7A8C73;          /* muted sage green — accent for community/events categories */
  --sage-light: #E8EDE4;    /* light sage — card backgrounds */
  --tan: #C4A87A;           /* warm gold/tan — decorative accents, dividers */
  --tan-light: #F0E6D4;     /* light tan — alternate card background */
  --ink: #2A2A28;           /* warm near-black — softer than #111 for body text on warm bgs */
  --paper: #FAF8F4;         /* warm off-white — page background, replaces pure #fff */
}
```

### Usage Rules

- `--paper` replaces `#fff` as the page `body` background. Pure white is sterile. This is cream stationery.
- `--cream` is the default background for Type B and Type G cards. Replaces the current `#fdf0ef` (which is pink-tinted and clashes).
- `--sage-light` is the alternate card background. Use for every 3rd or 4th text card.
- `--tan` appears as thin decorative lines, small accents, and the sticker card background (alongside red and black).
- `--red` remains the primary action color. It pops harder against warm backgrounds than it does against cold white.
- `--sage` is the category text color for community, events, and things-to-do. Sports and news stay red.
- `--ink` replaces `--black` for body copy that sits on warm backgrounds. On white/paper backgrounds, keep `--black`.

### What Gets Removed

- `#fdf0ef` (the pinkish card background) — replaced by `--cream`
- `#f5ebe0` (the current categories card background) — replaced by `--cream`
- The placeholder gradient backgrounds (`.ph-food`, `.ph-sport`, etc.) — all cards will have real images or solid warm fills

---

## 3. Typography Treatments

Outfit is the only body font. The goal is to make it feel like five different fonts by using weight, size, case, spacing, and style aggressively.

### Treatment 1 — Screaming Headline
```css
font-family: 'Outfit', sans-serif;
font-weight: 900;
font-size: clamp(28px, 3.5vw, 42px);
line-height: 1.0;
letter-spacing: -0.5px;
text-transform: uppercase;
color: var(--black);
```
Used on: Hero card headline (Type A), key story headlines

### Treatment 2 — Confident Subhead
```css
font-weight: 800;
font-size: clamp(16px, 1.8vw, 20px);
line-height: 1.2;
letter-spacing: -0.2px;
text-transform: uppercase;
```
Used on: Type C card headlines, secondary stories

### Treatment 3 — Whisper Label
```css
font-weight: 800;
font-size: 10px;
letter-spacing: 3px;
text-transform: uppercase;
color: var(--red); /* or var(--sage) for softer categories */
```
Used on: Section labels, category tags, card category lines

### Treatment 4 — Editorial Body
```css
font-weight: 400;
font-size: 14px;
line-height: 1.65;
color: rgba(17, 17, 17, 0.55);
```
Used on: Excerpts, descriptions

### Treatment 5 — Pull Quote
```css
font-weight: 700;
font-style: italic;
font-size: clamp(18px, 2.2vw, 24px);
line-height: 1.35;
text-align: center;
color: #fff;
```
Used on: Type E cards

### Treatment 6 — Sticker Type
```css
font-weight: 900;
font-size: clamp(14px, 2vw, 20px);
letter-spacing: 2px;
text-transform: uppercase;
color: #fff;
```
Used on: Type D sticker/badge cards

### Key Typographic Rule

Never use more than 2 treatments on the same card. A card has one job: either it shouts (Treatment 1) or it informs (Treatment 2 + 4). Mixing screaming headlines with body copy on a single small card creates noise, not hierarchy.

---

## 4. Layout Specification

### Grid Structure

Replace the current rigid `grid-template-columns` with a more flexible masonry-adjacent approach. The grid should feel hand-arranged, not computed.

```css
.collage-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
}
```

Using a 12-column grid gives us flexibility to make cards span 4, 5, 6, 7, or 8 columns — breaking the monotony of thirds.

### Card Placement Map (Desktop, first viewport)

```
Row 1:
  [Type A — Hero Image]           [Type B — Text Only]     [Type D — Sticker]
  grid-column: 1 / 8              grid-column: 8 / 11      grid-column: 11 / 13
  grid-row: 1 / 3                 grid-row: 1 / 2          grid-row: 1 / 2
  rotate: 0deg                    rotate: -1.5deg          rotate: 5deg

Row 2:
                                  [Type C — Photo+Text]    [Type E — Pull Quote]
  (Hero continues)                grid-column: 8 / 11      grid-column: 11 / 13
                                  grid-row: 2 / 3          grid-row: 2 / 3
                                  rotate: 1deg             rotate: -0.5deg

Row 3:
  [Type C — Photo+Text]  [Type F — Full Landscape]
  grid-column: 1 / 5     grid-column: 5 / 13
  rotate: -1deg           rotate: 0deg

Row 4:
  [Type B — Text Only]   [Type C — Photo+Text]    [Type C — Photo+Text]   [Type G — Categories]
  grid-column: 1 / 4     grid-column: 4 / 7       grid-column: 7 / 10    grid-column: 10 / 13
  rotate: 0.5deg          rotate: -1deg            rotate: 1.5deg         rotate: 0.5deg
```

### Rotation Rules

- Maximum rotation: 3deg for content cards, 8deg for sticker/badge cards
- Never rotate two adjacent cards in the same direction
- Hero cards (Type A) and full-bleed landscape cards (Type F) never rotate
- Rotation resets to 0deg on hover (creates a satisfying "click into place" feel)
- Use `transform-origin: center center` on all rotated cards

```css
.card-rotated {
  transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
}
.card-rotated:hover {
  transform: rotate(0deg) translateY(-4px) !important;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
}
```

### Overlap Effects

Select cards can overlap their neighbors by pulling them with negative margins or `position: relative` and offset values. Use sparingly — max 2 overlapping pairs per viewport.

```css
.card-overlap-left {
  position: relative;
  z-index: 2;
  margin-left: -12px;  /* tucks under the card to its left */
}
.card-overlap-up {
  position: relative;
  z-index: 2;
  margin-top: -20px;  /* tucks under the card above */
}
```

### Mobile Layout (max-width: 768px)

On mobile, the 12-column grid collapses to a 2-column grid with occasional full-width cards.

```css
@media (max-width: 768px) {
  .collage-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  /* Hero and landscape cards go full width */
  .card-type-a,
  .card-type-f {
    grid-column: 1 / -1;
  }

  /* Reduce rotations on mobile — less room for tilt */
  .card-rotated {
    transform: rotate(0deg) !important;
  }

  /* Sticker cards become inline, sitting between content rows */
  .card-type-d {
    grid-column: 1 / -1;
    max-height: 80px;
    border-radius: 20px;
  }

  /* Remove overlaps */
  .card-overlap-left,
  .card-overlap-up {
    margin-left: 0;
    margin-top: 0;
  }
}
```

### Tablet Layout (769px - 1024px)

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .collage-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }

  .card-type-a {
    grid-column: 1 / 6;
  }

  /* Halve rotation values */
  [style*="rotate"] {
    /* Builder: divide all rotation values by 2 at this breakpoint */
  }
}
```

---

## 5. Texture and Grain Effects

### Paper Grain Overlay

Apply a subtle noise texture to the entire content area. This is the single biggest thing that separates "digital template" from "editorial collage."

```css
.collage-grid::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}
```

Keep the opacity at 0.025 (2.5%). Any higher and it looks like a Photoshop tutorial. The existing `hero-grain` using `radial-gradient` dots is decent for the hero but reads as synthetic up close. The SVG feTurbulence noise is more organic.

### Card Shadow Depth

Current cards have no shadow at rest and only show shadow on hover. For the collage feel, cards need a resting shadow that suggests physical depth — like paper cutouts on a table.

```css
/* Resting state — very subtle, warm-toned */
.card {
  box-shadow: 0 2px 8px rgba(42, 42, 40, 0.06), 0 1px 2px rgba(42, 42, 40, 0.04);
}

/* Hover — lifts off the page */
.card:hover {
  box-shadow: 0 20px 50px rgba(42, 42, 40, 0.1), 0 8px 16px rgba(42, 42, 40, 0.06);
}
```

Note the use of warm-toned `rgba(42, 42, 40, ...)` instead of pure black `rgba(0,0,0,...)`. Warm shadows on warm backgrounds. Cold shadows on warm backgrounds look wrong.

### Image Treatment

Some photos should have a subtle warmth filter to unify the visual tone across the grid, since the source photos will vary in color temperature.

```css
.card img {
  filter: saturate(0.92) contrast(1.03) brightness(1.01);
  transition: filter 0.3s ease-out, transform 0.4s ease-out;
}
.card:hover img {
  filter: saturate(1.0) contrast(1.0) brightness(1.0);
  transform: scale(1.03);
}
```

This very slightly desaturates and warms photos at rest (the "film stock" look), then snaps to true color on hover. The effect should be barely noticeable — if someone can see it at a glance, dial it back.

---

## 6. Removal / Migration Notes

### What Dies

- `.bento` grid (the `5fr 4fr 3fr` grid) — replaced by `.collage-grid` (12-col)
- `.bento-2` grid — absorbed into the collage grid
- `border: 1px solid var(--red)` on `.card` — the uniform red border is the single biggest thing making the grid look like a wireframe. Kill it. Let shadow and background do the work.
- `.ph-*` placeholder gradient classes — no more fake gradients
- `.feed-grid` as a separate section — the collage grid IS the feed; it infinite-scrolls with varied card types
- `#fdf0ef` and `#f5ebe0` hardcoded backgrounds — use the new CSS variables

### What Stays

- The card hover lift effect (`translateY(-4px)`) — it is good. Just pair it with the rotation reset.
- The marquee — it is already editorial and adds kinetic energy between sections.
- The newsletter block — it stands alone, does not need collage treatment.
- The events list — clean list UI is correct for time-based data. Do not collage-ify events.
- The sticky nav — functional, stays as-is.
- `border-radius: 28px` on cards — this is brand. Do not change it.

### What Changes

- `body { background: var(--white) }` becomes `body { background: var(--paper) }`
- `.card { border: 1px solid var(--red) }` becomes `.card { border: none }`
- `.card-text { background: #fdf0ef }` becomes `.card-text { background: var(--cream) }`
- `.card-categories { background: #f5ebe0 }` becomes `.card-categories { background: var(--cream) }`
- Grid gap from `7px` to `10px` — the rotation and overlap effects need slightly more room to breathe

---

## 7. Horizontal Scroll Carousel Variant

For the "keep reading" section below the main collage, consider a horizontal scroll carousel instead of a grid. This adds a different interaction mode and breaks the vertical scroll monotony.

```css
.carousel-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 20px 0 28px;
  scrollbar-width: none; /* Firefox */
}
.carousel-track::-webkit-scrollbar {
  display: none;
}
.carousel-track .card {
  flex: 0 0 clamp(260px, 30vw, 320px);
  scroll-snap-align: start;
}
```

On mobile, this becomes the natural swipe interaction. Cards peek from the right edge, inviting horizontal scroll.

---

## 8. Implementation Priority

1. **Replace the grid** — move from `.bento` to `.collage-grid` with 12 columns
2. **Add the warm palette** — new CSS variables, swap backgrounds
3. **Remove red borders** — add resting shadows instead
4. **Add card type variety** — implement Types A through G
5. **Add rotations** — subtle transforms on alternating cards
6. **Add grain overlay** — the SVG noise texture
7. **Image filter** — subtle desaturation for film-stock consistency
8. **Carousel for feed section** — horizontal scroll for secondary content
9. **Overlap effects** — last, as they require the most layout tuning

---

## 9. Reference Composition

Here is how the first viewport should feel when assembled:

```
+----------------------------------------------------------+
|                                                          |
|  [GIANT HOCKEY PHOTO ---- hero anchor ---]  [text card] |
|  [sprawling, dramatic, 7 columns wide   ]  [tilted -1d] |
|  [headline over gradient at bottom      ]  [cream bg  ] |
|  [category pill: SPORTS, top-left       ]               |
|  [                                       ]  [sticker   ]|
|  [                                       ]  ["GARNETS" ]|
|  [                                       ]  [red, +5d  ]|
|                                                          |
|  [photo card]  [--- full landscape: marshlands aerial --]|
|  [snackery  ]  [no text, just breathing room            ]|
|  [tilted +1d]  [                                        ]|
|                                                          |
|  [text card ]  [photo card]  [photo card]  [categories ]|
|  [master    ]  [spring    ]  [coffee    ]  [browse     ]|
|  [plan      ]  [in rye    ]  [ranked    ]  [cream bg   ]|
|                                                          |
+----------------------------------------------------------+
```

The key visual difference from the current grid: **asymmetry, warmth, depth, and variety**. No two adjacent cards should look like they came from the same template. The grid should feel alive — like someone is actively curating a wall of content, not feeding rows into a CMS.

---

## Final Note for Builder

Do NOT implement this as a JavaScript masonry library. This is a CSS grid with intentional card placement. The "organic" feel comes from rotations, shadows, varied card types, and warm colors — not from a layout algorithm. Keep it static, keep it vanilla, keep it fast.
