# Editorial Collage Grid — Component Spec

**Component:** `EditorialCollage`
**Location:** `src/components/EditorialCollage.astro`
**Replaces:** `.bento` and `.bento-2` grids on homepage
**Author:** The Architect
**Date:** 2026-03-13

---

## 1. Purpose

The user lands on the homepage after the hero and marquee. They need to immediately understand: this site covers Rye, and here is the most important stuff happening right now. The editorial collage replaces the current uniform bento grid with an asymmetric, magazine-style layout that feels curated — like an editor pinned stories to a board — rather than algorithmically tiled.

The collage should feel like flipping open a well-designed local magazine, not scrolling a blog feed.

---

## 2. Design Tokens (extends existing `:root`)

```css
:root {
  /* Existing tokens — do not redefine */
  /* --red: #E8222A */
  /* --black: #111 */
  /* --white: #fff */
  /* --light: #f7f7f5 */
  /* --border: #f0efeb */
  /* --gray: #888880 */

  /* New warm accent palette for collage card backgrounds */
  --cream: #faf6f0;
  --sage: #e8ede4;
  --tan: #f0e6d8;
  --blush: #fdf0ef;    /* already used on .card-text */
  --ink: #1a1a18;      /* near-black for high-contrast text cards */

  /* Collage-specific */
  --collage-gap: 7px;
  --collage-radius: 28px;
  --collage-radius-sm: 20px;
  --rotate-cw: 1.8deg;
  --rotate-ccw: -2.2deg;
  --rotate-subtle: 0.8deg;
}
```

---

## 3. Grid Layout

### 3a. Desktop (above 1024px)

A 12-column CSS grid with explicit placement for 9 content slots. The grid uses `grid-template-areas` for clarity and maintainability. Two logical "rows" of content, with varied row heights.

```
┌─────────────────────┬──────────────┬───────────┐
│                     │              │           │
│    HERO CARD        │  TEXT CARD   │  PULLQUOTE│
│    (photo overlay)  │  (headline)  │  (rotated)│
│    5 cols, 2 rows   │  4 cols      │  3 cols   │
│                     │              │           │
│                     ├──────────────┤           │
│                     │  THUMB CARD  │           │
│                     │  (small)     │           │
├───────┬─────────────┼──────────────┼───────────┤
│ PHOTO │  TYPE CARD  │  PHOTO CARD  │ CATEGORY  │
│ CARD  │  (big text) │  (overlay)   │ BROWSE    │
│ 3 col │  4 cols     │  3 cols      │ 2 cols    │
│       │  (rotated)  │              │           │
└───────┴─────────────┴──────────────┴───────────┘
```

```css
.collage {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 260px 200px 320px;
  gap: var(--collage-gap);
  margin: clamp(28px, 4vw, 48px) 0 7px;
}
```

**Slot assignments (desktop):**

| Slot | Article | Card Type | Grid Position | Rotation |
|------|---------|-----------|---------------|----------|
| 1 | Garnets Hockey State Semis | `card-hero` (full-bleed photo, overlay text) | col 1-5, row 1-2 | none |
| 2 | The Snackery Closes | `card-editorial` (text-dominant, large headline) | col 6-9, row 1 | none |
| 3 | Coffee Shops Ranked | `card-thumb` (small thumbnail + title) | col 6-9, row 2 | none |
| 4 | Spring Sports Preview | `card-pullquote` (typography-only, rotated) | col 10-12, row 1-2 | +1.8deg |
| 5 | Playland 2026 | `card-photo` (photo with bottom overlay) | col 1-3, row 3 | none |
| 6 | Comprehensive Plan | `card-type` (big text, warm bg, rotated) | col 4-7, row 3 | -2.2deg |
| 7 | Spring in Rye | `card-photo` (photo with bottom overlay) | col 8-10, row 3 | none |
| 8 | This Weekend in Rye | `card-stamp` (bold label, date-forward) | col 11-12, row 3 | +0.8deg |
| 9 | Browse categories | `card-browse` (pill cloud) | Rendered below collage as a horizontal strip | none |

### 3b. Tablet (769px - 1024px)

Collapse to a 6-column grid with 4 rows. The pullquote and stamp cards move below. The hero card still spans wide.

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .collage {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: 240px 200px 280px 220px;
  }
}
```

| Slot | Grid Position |
|------|---------------|
| 1 Hero | col 1-4, row 1-2 |
| 2 Editorial | col 5-6, row 1 |
| 3 Thumb | col 5-6, row 2 |
| 4 Pullquote | col 1-3, row 3 |
| 5 Playland Photo | col 4-6, row 3 |
| 6 Type Card | col 1-3, row 4 |
| 7 Spring Photo | col 4-6, row 4 |
| 8 Stamp | Hidden (content moves to mobile scroll strip) |

### 3c. Mobile (below 769px)

Two layout options. Recommended: **vertical stack with horizontal scroll accent**.

**Vertical stack for primary cards:**
The hero card, editorial card, and type card stack full-width. These are the must-read stories.

**Horizontal scroll strip for secondary cards:**
A horizontally scrollable row of smaller cards (thumb, pullquote, photo cards). This gives the Instagram-browse feel on mobile without overwhelming vertical scroll.

```css
@media (max-width: 768px) {
  .collage {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .collage-scroll-strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    scrollbar-width: none; /* Firefox */
  }
  .collage-scroll-strip::-webkit-scrollbar { display: none; }

  .collage-scroll-strip > * {
    flex: 0 0 72vw;
    scroll-snap-align: start;
  }
}
```

**Mobile card order (top to bottom):**
1. Hero card (full-width, 56vw height)
2. Editorial card (full-width)
3. Scroll strip: [Thumb] [Pullquote] [Photo] [Photo] [Stamp]
4. Type card (full-width)

---

## 4. Card Type Definitions

### 4a. `card-hero` — Full-Bleed Photo with Overlay

The anchor story. Biggest card, most visual weight. Photo fills entire card, headline overlays at bottom with gradient scrim.

```html
<a href="/garnets-hockey-state-semis" class="collage-card card-hero">
  <img
    src="/images/garnets-hockey-state-semis.jpg"
    alt="Garnets hockey goalie making a sprawling pad save"
    class="collage-card__img"
    loading="eager"
  />
  <div class="collage-card__overlay">
    <span class="collage-card__cat">Sports</span>
    <h2 class="collage-card__title collage-card__title--hero">
      Fifty Saves and a Bus to Buffalo
    </h2>
    <p class="collage-card__dek">Garnets hockey is two wins from a state title.</p>
  </div>
</a>
```

**Styles:**
```css
.card-hero {
  grid-column: 1 / 6;
  grid-row: 1 / 3;
  position: relative;
  overflow: hidden;
  border-radius: var(--collage-radius);
}
.card-hero .collage-card__img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.card-hero .collage-card__overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 28px 28px 24px;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.82) 0%,
    rgba(0,0,0,0.4) 60%,
    transparent 100%
  );
}
.collage-card__title--hero {
  font-size: clamp(24px, 2.8vw, 38px);
  font-weight: 900;
  line-height: 1.05;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: -0.5px;
}
.collage-card__dek {
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  margin-top: 8px;
  font-weight: 400;
  line-height: 1.5;
}
```

**Hover:** Image scales to 1.04 over 400ms ease-out. Subtle parallax feel.

---

### 4b. `card-editorial` — Text-Dominant Headline Card

No image. Large headline dominates. Warm background. Includes an excerpt and a "read" indicator.

```html
<div class="collage-card card-editorial">
  <a href="/the-snackery-closes-purchase-street">
    <span class="collage-card__cat">Food</span>
    <h2 class="collage-card__title collage-card__title--editorial">
      The Snackery Is Gone, and Purchase Street <em>Feels</em> It
    </h2>
    <p class="collage-card__excerpt">
      Sara Leand closed her bakery at 64 Purchase Street after losing both parents.
    </p>
    <span class="collage-card__read-time">4 min read</span>
  </a>
</div>
```

**Styles:**
```css
.card-editorial {
  grid-column: 6 / 10;
  grid-row: 1 / 2;
  background: var(--blush);
  border-radius: var(--collage-radius);
  padding: clamp(22px, 2.5vw, 32px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.collage-card__title--editorial {
  font-size: clamp(20px, 2.2vw, 30px);
  font-weight: 900;
  line-height: 1.08;
  text-transform: uppercase;
  letter-spacing: -0.3px;
  color: var(--black);
  margin-top: 10px;
}
.collage-card__title--editorial em {
  font-style: italic;
  color: var(--red);
}
.collage-card__excerpt {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
  line-height: 1.6;
  margin-top: 10px;
}
.collage-card__read-time {
  font-size: 12px;
  font-weight: 700;
  color: var(--red);
  margin-top: auto;
  padding-top: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

**Hover:** Title color transitions to `var(--red)`. Card lifts `translateY(-3px)` with soft shadow.

---

### 4c. `card-thumb` — Small Thumbnail + Title

Compact card. Small image on the left, title on the right. Good for secondary stories that need visual presence without dominating.

```html
<a href="/coffee-shops-ranked" class="collage-card card-thumb">
  <img
    src="/images/coffee-shops-ranked.jpg"
    alt="Coffee shops in Rye"
    class="card-thumb__img"
    loading="lazy"
  />
  <div class="card-thumb__body">
    <span class="collage-card__cat">Food</span>
    <h3 class="collage-card__title collage-card__title--thumb">
      Every Coffee Shop in Rye, Ranked
    </h3>
  </div>
</a>
```

**Styles:**
```css
.card-thumb {
  grid-column: 6 / 10;
  grid-row: 2 / 3;
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--light);
  border-radius: var(--collage-radius);
  padding: 14px;
  overflow: hidden;
}
.card-thumb__img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--collage-radius-sm);
  flex-shrink: 0;
}
.collage-card__title--thumb {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: -0.2px;
}
```

**Hover:** Image border-radius animates to 50% (circle) over 300ms. Title color to red.

---

### 4d. `card-pullquote` — Typography-Only, Rotated

No image. A bold typographic treatment. Uses a pull-quote or provocative headline fragment. Slightly rotated for editorial chaos. Warm accent background.

```html
<a href="/spring-sports-preview-2026" class="collage-card card-pullquote">
  <span class="collage-card__cat">Sports</span>
  <blockquote class="card-pullquote__text">
    "Fifteen teams.<br/>One spring.<br/>Here's everyone."
  </blockquote>
  <span class="card-pullquote__label">Spring Sports Preview</span>
</a>
```

**Styles:**
```css
.card-pullquote {
  grid-column: 10 / 13;
  grid-row: 1 / 3;
  background: var(--ink);
  color: #fff;
  border-radius: var(--collage-radius);
  padding: clamp(22px, 2.5vw, 32px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  transform: rotate(var(--rotate-cw));
  transition: transform 0.35s ease-out;
  /* Overflow the rotation beyond grid cell */
  margin: -4px;
  z-index: 2;
}
.card-pullquote:hover {
  transform: rotate(0deg);
}
.card-pullquote__text {
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 800;
  line-height: 1.2;
  font-style: italic;
  margin-top: 14px;
  letter-spacing: -0.3px;
}
.card-pullquote__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.4);
  margin-top: auto;
  padding-top: 16px;
}
```

**Hover:** Rotation snaps to 0deg. Background shifts to `var(--red)`.

---

### 4e. `card-photo` — Standard Photo with Overlay

Used for mid-priority stories. Photo fills card, small text overlay at bottom. Smaller than hero.

```html
<a href="/playland-2026-season-preview" class="collage-card card-photo">
  <img
    src="/images/playland-beach.jpg"
    alt="Playland amusement park"
    class="collage-card__img"
    loading="lazy"
  />
  <div class="collage-card__overlay collage-card__overlay--compact">
    <span class="collage-card__cat">Events</span>
    <h3 class="collage-card__title collage-card__title--photo">
      Playland Is Back
    </h3>
  </div>
</a>
```

**Styles:**
```css
.card-photo {
  position: relative;
  overflow: hidden;
  border-radius: var(--collage-radius);
}
/* Slot 5: Playland */
.card-photo--slot5 {
  grid-column: 1 / 4;
  grid-row: 3 / 4;
}
/* Slot 7: Spring in Rye */
.card-photo--slot7 {
  grid-column: 8 / 11;
  grid-row: 3 / 4;
}
.collage-card__overlay--compact {
  padding: 18px 20px 16px;
}
.collage-card__title--photo {
  font-size: clamp(15px, 1.6vw, 20px);
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  line-height: 1.1;
  margin-top: 4px;
}
```

**Hover:** Same as hero — image scales 1.04.

---

### 4f. `card-type` — Big Typography Card, Rotated

All text, no image. The headline IS the design. Large, bold, stacked typography on a warm background. Slightly counter-rotated for asymmetry.

```html
<a href="/rye-comprehensive-plan-285k-rewrite" class="collage-card card-type">
  <span class="collage-card__cat">News</span>
  <h2 class="collage-card__title collage-card__title--type">
    Rye Is Rewriting Its
    <span class="card-type__accent">Master Plan</span>
    for the First Time Since 1985
  </h2>
</a>
```

**Styles:**
```css
.card-type {
  grid-column: 4 / 8;
  grid-row: 3 / 4;
  background: var(--sage);
  border-radius: var(--collage-radius);
  padding: clamp(22px, 2.5vw, 32px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transform: rotate(var(--rotate-ccw));
  transition: transform 0.35s ease-out;
  margin: -4px;
  z-index: 1;
}
.card-type:hover {
  transform: rotate(0deg);
}
.collage-card__title--type {
  font-size: clamp(20px, 2.4vw, 34px);
  font-weight: 900;
  line-height: 1.0;
  text-transform: uppercase;
  letter-spacing: -0.5px;
}
.card-type__accent {
  color: var(--red);
  display: block;
  font-size: 1.3em;
}
```

**Hover:** Rotation snaps to 0. Background transitions to `var(--tan)`.

---

### 4g. `card-stamp` — Bold Date/Label Card

A small, punchy card that reads like a stamp or sticker. Date-forward for time-sensitive content. Can be slightly rotated.

```html
<a href="/this-weekend-in-rye" class="collage-card card-stamp">
  <span class="card-stamp__date">This Weekend</span>
  <span class="card-stamp__title">In Rye</span>
  <span class="card-stamp__arrow">--></span>
</a>
```

**Styles:**
```css
.card-stamp {
  grid-column: 11 / 13;
  grid-row: 3 / 4;
  background: var(--red);
  color: #fff;
  border-radius: var(--collage-radius);
  padding: clamp(18px, 2vw, 28px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transform: rotate(var(--rotate-subtle));
  transition: transform 0.3s ease-out, background 0.3s ease-out;
}
.card-stamp:hover {
  transform: rotate(0deg) scale(1.04);
  background: var(--black);
}
.card-stamp__date {
  font-size: clamp(22px, 2.5vw, 32px);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.0;
  letter-spacing: -0.5px;
}
.card-stamp__title {
  font-size: clamp(14px, 1.5vw, 18px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 3px;
  opacity: 0.7;
  margin-top: 4px;
}
.card-stamp__arrow {
  font-size: 20px;
  margin-top: 12px;
  opacity: 0.5;
  transition: opacity 0.2s, transform 0.2s;
}
.card-stamp:hover .card-stamp__arrow {
  opacity: 1;
  transform: translateX(4px);
}
```

---

## 5. Shared Card Styles

```css
/* Base for all collage cards */
.collage-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--collage-radius);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
  /* No border — the old bento had border: 1px solid var(--red).
     The collage uses background color contrast and rotation
     to define card edges instead. */
}
.collage-card:hover {
  box-shadow: 0 16px 48px rgba(0,0,0,0.10);
}

/* Category label — consistent across all card types */
.collage-card__cat {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}
/* Light text variant (for dark/photo backgrounds) */
.card-hero .collage-card__cat,
.card-photo .collage-card__cat,
.card-pullquote .collage-card__cat {
  color: rgba(255,255,255,0.55);
}
/* Dark text variant (for light backgrounds) */
.card-editorial .collage-card__cat,
.card-thumb .collage-card__cat,
.card-type .collage-card__cat {
  color: var(--red);
}

/* Shared image behavior */
.collage-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease-out;
}
.collage-card:hover .collage-card__img {
  transform: scale(1.04);
}

/* Shared overlay */
.collage-card__overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 28px;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.8) 0%,
    rgba(0,0,0,0.35) 70%,
    transparent 100%
  );
}
```

---

## 6. CSS Class Naming Convention

Using a modified BEM approach consistent with the existing codebase (which uses flat class names). The collage component introduces a light BEM structure to avoid collision with existing `.card-*` classes:

| Pattern | Example | Usage |
|---------|---------|-------|
| `.collage` | `.collage` | Grid container |
| `.collage-card` | `.collage-card` | Base card class |
| `.card-{type}` | `.card-hero`, `.card-editorial` | Card variant |
| `.collage-card__{element}` | `.collage-card__title` | Child element |
| `.collage-card__title--{mod}` | `.collage-card__title--hero` | Element modifier |
| `.card-{type}__{element}` | `.card-thumb__img` | Type-specific child |
| `.card-{type}--slot{n}` | `.card-photo--slot5` | Position variant |

---

## 7. Scroll-Reveal Animation

Cards stagger into view as the user scrolls the collage into the viewport. Uses IntersectionObserver, not scroll event listeners.

### Animation keyframes:

```css
@keyframes collageReveal {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Rotated cards include their rotation in the "to" state */
@keyframes collageRevealCW {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97) rotate(0deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(var(--rotate-cw));
  }
}

@keyframes collageRevealCCW {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97) rotate(0deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(var(--rotate-ccw));
  }
}
```

### Stagger timing:

Each card gets a `--reveal-delay` custom property via inline style or nth-child:

| Card | Delay |
|------|-------|
| Hero | 0ms |
| Editorial | 80ms |
| Thumb | 160ms |
| Pullquote | 200ms |
| Photo (slot 5) | 280ms |
| Type | 340ms |
| Photo (slot 7) | 400ms |
| Stamp | 440ms |

```css
.collage-card {
  opacity: 0; /* Hidden by default */
}
.collage-card.revealed {
  animation: collageReveal 0.5s ease-out forwards;
  animation-delay: var(--reveal-delay, 0ms);
}
/* Override for rotated cards */
.card-pullquote.revealed {
  animation-name: collageRevealCW;
}
.card-type.revealed {
  animation-name: collageRevealCCW;
}
```

### JavaScript (vanilla):

```javascript
const collageCards = document.querySelectorAll('.collage-card');
const collageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      collageObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -60px 0px'
});

collageCards.forEach(card => collageObserver.observe(card));
```

### Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .collage-card {
    opacity: 1;
  }
  .collage-card.revealed {
    animation: none;
  }
  .card-pullquote,
  .card-type,
  .card-stamp {
    transform: none !important;
  }
}
```

---

## 8. Responsive Behavior

### Mobile (max-width: 768px)

```css
@media (max-width: 768px) {
  .collage {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* Hero card: full-width, fixed height */
  .card-hero {
    height: 56vw;
    min-height: 240px;
  }

  /* Editorial card: full-width, auto height */
  .card-editorial {
    padding: 24px;
  }

  /* Remove all rotations on mobile — they cause clipping issues */
  .card-pullquote,
  .card-type,
  .card-stamp {
    transform: none;
    margin: 0;
  }

  /* Scroll strip for secondary cards */
  .collage-scroll-strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 0 0 8px;
    margin: 0 calc(-1 * clamp(16px, 4vw, 48px));
    padding-left: clamp(16px, 4vw, 48px);
    padding-right: clamp(16px, 4vw, 48px);
    scrollbar-width: none;
  }
  .collage-scroll-strip::-webkit-scrollbar {
    display: none;
  }
  .collage-scroll-strip > .collage-card {
    flex: 0 0 72vw;
    max-width: 300px;
    scroll-snap-align: start;
    height: 220px;
  }

  /* Thumb card goes vertical on mobile in scroll strip */
  .card-thumb {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  .card-thumb__img {
    width: 100%;
    height: 120px;
    border-radius: var(--collage-radius-sm);
  }

  /* Stamp card fills less space */
  .card-stamp {
    flex: 0 0 44vw;
    max-width: 180px;
  }
}
```

### Tablet (769px - 1024px)

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .collage {
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: 220px 180px 260px 220px;
  }

  .card-hero { grid-column: 1 / 5; grid-row: 1 / 3; }
  .card-editorial { grid-column: 5 / 7; grid-row: 1 / 2; }
  .card-thumb { grid-column: 5 / 7; grid-row: 2 / 3; }
  .card-pullquote {
    grid-column: 1 / 4; grid-row: 3 / 4;
    transform: rotate(var(--rotate-cw));
  }
  .card-photo--slot5 { grid-column: 4 / 7; grid-row: 3 / 4; }
  .card-type {
    grid-column: 1 / 4; grid-row: 4 / 4;
    transform: rotate(var(--rotate-ccw));
  }
  .card-photo--slot7 { grid-column: 4 / 7; grid-row: 4 / 4; }
  .card-stamp { display: none; }
}
```

---

## 9. Interaction Specifications

| Element | Trigger | Behavior | Duration | Easing |
|---------|---------|----------|----------|--------|
| All cards | Hover | `translateY(-3px)`, shadow appears | 300ms | ease-out |
| Photo cards (hero, photo) | Hover | Image scales to 1.04 inside overflow:hidden | 400ms | ease-out |
| Rotated cards (pullquote, type, stamp) | Hover | Rotation snaps to 0deg | 350ms | ease-out |
| Stamp card | Hover | Scale 1.04, bg changes to black | 300ms | ease-out |
| Thumb card image | Hover | Border-radius transitions to 50% | 300ms | ease-out |
| Editorial title | Hover | Color transitions to `var(--red)` | 200ms | ease |
| All cards | Click | Navigate to article page | Instant | -- |
| Scroll strip (mobile) | Swipe | Horizontal scroll with snap | Native | -- |
| All cards | Scroll into view | Stagger reveal animation | 500ms | ease-out |

---

## 10. Edge Cases

### Too few articles
If fewer than 9 articles exist, the grid should degrade gracefully:
- **8 or fewer:** Hide the stamp card. The grid loses col 11-12 in row 3; expand `card-photo--slot7` to fill `col 8-12`.
- **6 or fewer:** Collapse to a simpler 2-row layout. Hide pullquote and stamp. Expand hero to span more columns.
- **3 or fewer:** Fall back to a single-row layout with hero + 2 cards.

### Long headlines
- Hero title: Clamp at 3 lines with `-webkit-line-clamp: 3`.
- Editorial title: Clamp at 4 lines.
- Thumb title: Clamp at 2 lines.
- All other card titles: Clamp at 3 lines.

```css
.collage-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.collage-card__title--hero { -webkit-line-clamp: 3; }
.collage-card__title--editorial { -webkit-line-clamp: 4; }
.collage-card__title--thumb { -webkit-line-clamp: 2; }
.collage-card__title--photo { -webkit-line-clamp: 3; }
.collage-card__title--type { -webkit-line-clamp: 4; }
```

### Missing images
If an article has no image, use the existing placeholder gradient system (`.ph-food`, `.ph-sport`, etc.) as a fallback `<div>` in place of `<img>`.

### Scroll strip overflow indicators (mobile)
On mobile, add a subtle fade gradient on the right edge of the scroll strip to indicate more content:

```css
.collage-scroll-wrap {
  position: relative;
}
.collage-scroll-wrap::after {
  content: '';
  position: absolute;
  right: 0; top: 0; bottom: 8px;
  width: 48px;
  background: linear-gradient(to left, var(--white) 0%, transparent 100%);
  pointer-events: none;
  z-index: 3;
}
```

---

## 11. Accessibility

- All `<img>` elements require descriptive `alt` text (already in article frontmatter).
- Card links must have meaningful accessible names — the `<h2>`/`<h3>` inside provides this.
- Rotated cards: rotation is purely decorative and does not affect reading order.
- Scroll strip: add `role="region"` and `aria-label="More stories"` to the scroll container.
- Focus styles: use the existing `a:focus-visible` rule (2px solid black outline with 2px offset).
- Reduced motion: all animations and rotations are disabled via `prefers-reduced-motion`.
- Color contrast: all text-on-background combinations meet WCAG AA.
  - White text on photo gradient overlay: ensure gradient starts at 0.8 opacity black minimum.
  - Red text on blush/cream backgrounds: `#E8222A` on `#fdf0ef` = 4.8:1 ratio (passes AA).
  - White text on ink/black: passes AAA.

---

## 12. Performance Notes

- **Hero image:** `loading="eager"`, all others `loading="lazy"`.
- **Image sizing:** The Builder should add `width` and `height` attributes to prevent layout shift. Recommended source images: 1200px wide for hero, 800px for photo cards, 400px for thumbnails.
- **No JavaScript frameworks.** The reveal animation uses a single IntersectionObserver instance observing all cards — minimal overhead.
- **CSS animations only.** No JS-driven animation loops.
- **Rotation transforms:** GPU-composited, no layout thrashing.
- **Font loading:** Outfit and Rock Salt are already loaded in `<head>`. No additional fonts needed.

---

## 13. File Structure for Implementation

```
src/
  components/
    EditorialCollage.astro    ← Main component
    CollageCard.astro         ← Individual card (optional, for DRY)
  pages/
    index.astro               ← Import and use EditorialCollage
```

The Builder should implement `EditorialCollage.astro` as a self-contained component with `<style>` scoped styles and a `<script>` block for the IntersectionObserver. It receives the article collection as a prop or fetches it internally.

---

## 14. Handoff Notes

**For The Eye:** Review the warm accent palette (cream, sage, tan, blush, ink) against the brand. Confirm the rotated cards don't read as "broken" — they should read as "intentional editorial chaos." Check that the typography scale across card types creates clear visual hierarchy: hero title > type card title > editorial title > photo title > thumb title.

**For The Builder:**
- The `.collage` grid replaces both `.bento` and `.bento-2` on the homepage.
- The mobile scroll strip requires a wrapper div (`collage-scroll-wrap`) around the scrollable cards, separate from the main flex column.
- Rotation margins (`margin: -4px`) on rotated cards prevent clipping at grid cell boundaries. Test at all breakpoints.
- The `--reveal-delay` custom property should be set via `style` attribute in the Astro template: `style={`--reveal-delay: ${index * 80}ms`}`.
- The browse/categories card currently in the bento should be moved below the collage as a standalone horizontal strip, or integrated into the footer area. It does not have a slot in the collage grid.
