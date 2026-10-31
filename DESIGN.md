# Bauhaus / Swiss Modern Design System — Deep Spec

### Philosophy
This is not minimalism. Minimalism removes. Bauhaus replaces — with geometry, color, and grid. Every element that might be decorative in another style is here made structural: a large ochre rectangle defines a section boundary, a buff circle marks a feature, a deep cypress vertical rule divides the column. Color is architecture. Type is architecture. The grid is the constitution.

Reference: Josef Müller-Brockmann's poster work, Herbert Bayer's typography experiments, El Lissitzky's Constructivist compositions. In digital: Knoll, Swiss Typefaces, Are.na.

---

### Color System — Primary Palette as Architecture

Extracted from the architectural specimen:

```
Ochre Amber:     #A65600  — the activating color; calls to action, section titles, structural accents
Deep Cypress:    #022015  — the grounding color; hero backgrounds, large fields, authority, deep borders
Warm Buff:       #F3D3B1  — the highlighting color; featured plans, hover fills, emphasis, soft structural cells
Alabaster Linen: #F8EBDD  — warm page background canvas (never sterile pure white for body sections)
Structural Dark: #0B120E  — structural rules, high-contrast borders, dominant dark surfaces
Pure White:      #FFFFFF  — inverted text on dark fields; high-contrast type on Cypress/Dark fields
Muted Cypress:   #4A6256  — secondary labels, muted technical text, supporting copy
```

**The five laws of Bauhaus color:**
1. **Use color in large flat blocks ONLY** — never gradients, never tints, never soft opacity or blurs.
2. **One primary color per section maximum** — never Ochre + Cypress + Buff in the same content cell.
3. **Color communicates structure and hierarchy, NOT decoration or mood.**
4. **Black, Cypress, and Linen are colors** — treat them with the exact same architectural weight as the primaries.
5. **When in doubt: more deep structural tone, not more accent color.** Color earns its place.

**Color DNA strip:** Place a 5-band horizontal strip (8–12px tall) immediately below the navigation. Five equal columns: Ochre · Cypress · Buff · Structural Dark · Alabaster Linen. This is the Bauhaus signature mark — it appears on every page as the identity system's fingerprint.

```css
.color-dna {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: 10px;
}
.color-dna .c1 { background: #A65600; } /* Ochre Amber */
.color-dna .c2 { background: #022015; } /* Deep Cypress */
.color-dna .c3 { background: #F3D3B1; } /* Warm Buff */
.color-dna .c4 { background: #0B120E; } /* Structural Dark */
.color-dna .c5 { background: #F8EBDD; border-top: 1px solid #E2D2C0; } /* Alabaster Linen */
```

---

### Typography — Type as Visual Architecture

```
Primary typeface (Bauhaus/Swiss):
  'Jost', 'Helvetica Neue', 'Inter', sans-serif
  Jost is the digital Futura — geometric, Bauhaus-adjacent, free on Google Fonts.

Scale (use aggressive contrast — never middling sizes):
  Poster / Hero:      clamp(72px, 13vw, 180px)  / weight 900 / leading 0.85 / tracking -0.04em
  Display:            clamp(40px, 6vw, 80px)     / weight 900 / leading 0.9  / tracking -0.03em
  Section title:      clamp(24px, 3vw, 40px)     / weight 700 / leading 1.05 / tracking -0.02em
  Card title:         18–22px                    / weight 700 / leading 1.1
  Body:               14–15px                    / weight 300–400 / leading 1.65 / color #4A6256
  Label / eyebrow:    10–11px                    / weight 700 / UPPERCASE / tracking 0.16em
  Micro:              10px                       / weight 500 / color #4A6256
```

**Key technique — vertical type labels:**
Section labels rotate 90° counterclockwise along the left edge of grid columns. Used in the pricing column header, about section, manifesto rail.
```css
.vertical-label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4A6256;
}
/* When used on a colored cell (Cypress/Dark): */
.vertical-label.on-dark {
  color: rgba(248, 235, 221, 0.5);
}
```

**Key technique — poster-scale display text as section architecture:**
A single word or number at 100–180px dominates an entire grid cell, used as both headline and structural mass. The text IS the visual element.

**Key technique — type at 90° running along the left border:**
For taller colored sidebar columns (like pricing label, manifesto word), the text rotates vertical and fills the full column height. Font size 48–80px, weight 900, uppercase.

---

### Signature Element 1 — Geometric Shape Compositions

Bauhaus design uses the primary shapes — circle, square, triangle — as structural elements, not decoration. In UI, these appear as:

**1. The background composition** (behind hero content):
Large geometric forms — a circle 60% the height of the section, a rectangle crossing the boundary, overlapping forms — placed at the edges of colored sections.
```css
/* Deep Cypress hero with geometric composition */
.hero-geo {
  position: relative;
  overflow: hidden;
}
.hero-geo::before {
  content: '';
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: rgba(243, 211, 177, 0.14); /* Warm Buff geometric form */
  bottom: -120px;
  right: -80px;
  pointer-events: none;
}
.hero-geo::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  top: 40px;
  right: 140px;
  pointer-events: none;
}
```

**2. The colored circle as feature marker:**
A circle (48–64px) filled with an architectural tone, used to number items or mark featured content. No text inside — the circle IS the mark.
```css
.geo-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--ochre);
  flex-shrink: 0;
}
.geo-circle.cypress { background: #022015; }
.geo-circle.buff    { background: #F3D3B1; }
```

**3. The right-angle corner rule:**
A large L-shaped border (thick: 4–6px) in an architectural color anchored to the corner of a section or card. Creates the constructivist "corner bracket" motif.
```css
.corner-rule {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-top: 5px solid #A65600;
  border-left: 5px solid #A65600;
}
```

---

### Signature Element 2 — The Asymmetric Grid

Every section uses an asymmetric grid. Never equal columns. Ratios that work:
```
Hero:          40% / 60%        (Deep Cypress field / Alabaster Linen content)
Features:      2fr / 1fr / 1fr  (main / two architectural accents)
Manifesto:     200px / 1fr      (vertical label column / content)
Pricing:       180px / 1fr      (vertical label / 3-up plans)
Work grid:     3fr / 2fr        or 1fr / 1fr / 1fr / 1fr (portrait vs landscape)
About:         1fr / 2fr        (structural image / text)
```

Grid cells are separated by thick borders (4px `#022015` or `#0B120E`) rather than gutters. NO spacing between cells — borders do the structural work.

```css
/* The grid rule: borders, not gaps */
.section-grid {
  display: grid;
  gap: 0;
}
.grid-cell {
  border-right: 4px solid #022015;
  border-bottom: 4px solid #022015;
  padding: 40px 36px;
}
.grid-cell:last-child {
  border-right: none;
}
.grid-row:last-child .grid-cell {
  border-bottom: none;
}
```

---

### Signature Element 3 — Constructivist Work Grid with Color Overlays

The portfolio/work grid uses high-contrast monochrome imagery (or colored background cells) with an architectural color overlay that activates on hover.

```css
.work-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  background: #022015;
}
.work-card {
  position: relative;
  overflow: hidden;
  background: #0B120E;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28px;
  cursor: pointer;
}

/* Color field backgrounds — alternating palette roles */
.work-card.ochre   { background: #A65600; }
.work-card.cypress { background: #022015; }
.work-card.buff    { background: #F3D3B1; color: #022015; }

/* Hover: architectural tone fills over dark base */
.work-card:not(.ochre):not(.cypress):not(.buff):hover {
  background: #A65600;
}

.work-card-overlay {
  position: absolute;
  inset: 0;
  background: #A65600;
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.work-card:hover .work-card-overlay {
  opacity: 0.92;
}

.work-num {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 235, 221, 0.4);
  margin-bottom: auto;
}
.work-title {
  font-size: clamp(20px, 3vw, 32px);
  font-weight: 900;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 1.05;
  position: relative;
  z-index: 1;
}
.work-cat {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(248, 235, 221, 0.6);
  position: relative;
  z-index: 1;
  margin-top: 6px;
}
```

---

### Navigation

Height 60px. Bottom border 4px `#022015`. Logo: geometric ochre square dot + brand name, weight 900, uppercase. Center links: 10px caps, tracking 0.12em, muted → deep cypress on hover. Active link: 3px ochre bottom border. Right: adjacent buttons (zero gap), outline + fill pair.

```css
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #F8EBDD;
  border-bottom: 4px solid #022015;
  padding: 0 32px;
  height: 60px;
  display: flex;
  align-items: stretch;
}
.nav-logo {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 24px;
  border-right: 4px solid #022015;
  margin-right: 24px;
  flex-shrink: 0;
  color: #022015;
}
.nav-dot {
  width: 14px;
  height: 14px;
  background: #A65600;
  flex-shrink: 0;
}
.nav-links {
  display: flex;
  align-items: stretch;
  list-style: none;
  gap: 0;
}
.nav-links a {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4A6256;
  text-decoration: none;
  padding: 0 18px;
  display: flex;
  align-items: center;
  border-bottom: 3px solid transparent;
  transition: color 120ms, border-color 120ms;
}
.nav-links a:hover {
  color: #022015;
}
.nav-links a.active {
  color: #022015;
  border-bottom-color: #A65600;
}
.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0;
}
.btn {
  border: 2px solid #022015;
  padding: 0 20px;
  height: 38px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 120ms, color 120ms;
  white-space: nowrap;
}
.btn-ghost {
  background: #F8EBDD;
  color: #022015;
  border-right: none;
}
.btn-ghost:hover {
  background: #022015;
  color: #F8EBDD;
}
.btn-ochre {
  background: #A65600;
  color: #FFFFFF;
  border-color: #A65600;
}
.btn-ochre:hover {
  background: #874500;
  border-color: #874500;
}
```

---

### Hero Section — Deep Cypress Field / Alabaster Grid Split

Two-column asymmetric grid (40% Deep Cypress / 60% Alabaster Linen), separated by a 4px Deep Cypress border.

**Left column (Deep Cypress):**
- Geometric composition background (warm buff circle + white square, subtle opacity)
- Eyebrow label: tiny caps, rgba(248, 235, 221, 0.45)
- Poster-scale heading: 2–3 words, weight 900, white, tight leading
- One word in Warm Buff (`#F3D3B1`) or Ochre (`#A65600`) as Bauhaus emphasis
- Tagline: 11px caps, rgba(248, 235, 221, 0.45)

**Right column (Alabaster Linen):**
- Body description: 15px, weight 300, `#2A3A32`
- Two adjacent CTA buttons (Ochre + Ghost)
- Stat row: 3 stats separated by thin rules, numbers at 36px weight 900

```css
.hero {
  display: grid;
  grid-template-columns: 40% 60%;
  border-bottom: 4px solid #022015;
  min-height: 360px;
  background: #F8EBDD;
}
.hero-left {
  background: #022015;
  padding: 52px 36px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}
.hero-right {
  padding: 52px 36px;
  border-left: 4px solid #022015;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}
.hero-eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 235, 221, 0.45);
}
.hero-h1 {
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: #FFFFFF;
}
.hero-h1 .accent {
  color: #F3D3B1;
}
.hero-tagline {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(248, 235, 221, 0.45);
}
.hero-desc {
  font-size: 15px;
  line-height: 1.65;
  color: #2A3A32;
  font-weight: 300;
}
.hero-actions {
  display: flex;
  gap: 0;
}
.hero-stats {
  display: flex;
  gap: 0;
  border-top: 2px solid #022015;
  padding-top: 20px;
}
.hero-stat {
  flex: 1;
  padding-right: 20px;
  margin-right: 20px;
  border-right: 1px solid #D5C2AF;
}
.hero-stat:last-child {
  border-right: none;
}
.stat-num {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #022015;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4A6256;
  margin-top: 4px;
}
```

---

### Feature Grid — Colored Cells, Asymmetric

Three columns (2fr / 1fr / 1fr). Each cell has a thick border separating it. One cell uses Ochre bg, one Warm Buff bg, one Alabaster Linen. The colored cells use architectural colors as large background fields — not cards with color accents.

```
┌──────────────────────────────┬──────────────┬──────────────┐
│  ALABASTER — main copy cell  │  OCHRE — stat│  BUFF — cta  │
│  (2fr)                       │  (1fr)       │  (1fr)       │
└──────────────────────────────┴──────────────┴──────────────┘
```

---

### Manifesto / Method Rail

Left: vertical label column (200px wide, Deep Cypress or Dark bg, white text rotated 90°, weight 900, 56px).
Right: 3-column grid of principles. Each principle: Ochre number label (10px), bold title, light description.

```css
.manifesto {
  display: grid;
  grid-template-columns: 200px 1fr;
  border-bottom: 4px solid #022015;
  background: #F8EBDD;
}
.manifesto-label {
  background: #022015;
  border-right: 4px solid #022015;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}
.manifesto-word {
  font-size: 56px;
  font-weight: 900;
  text-transform: uppercase;
  color: #FFFFFF;
  letter-spacing: -0.03em;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}
.manifesto-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.manifesto-col {
  padding: 36px 32px;
  border-right: 2px solid #E2D2C0;
}
.manifesto-col:last-child {
  border-right: none;
}
.manifesto-num {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #A65600;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.manifesto-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #022015;
  margin-bottom: 8px;
  line-height: 1.2;
}
.manifesto-desc {
  font-size: 13px;
  color: #4A6256;
  line-height: 1.65;
  font-weight: 300;
}
```

---

### Work Grid — Colored Cells with Hover Overlay

See Signature Element 3 above. Grid of 4 cards (2×2 or 4×1 on mobile). Alternating color backgrounds. Each card: project number (tiny caps), project name (poster weight), category (tiny caps below). Hover reveals an Ochre overlay (`#A65600`) with the project link visible.

---

### Pricing Section — Vertical Label Rail + 3 Plans

Left column (180px): vertical text "RATES" in Warm Buff bg (`#F3D3B1`), weight 900, 48px, rotated 90°, color `#022015`.
Right: three plan columns with thick border separators. Featured plan uses Deep Cypress background (`#022015`), Warm Buff price (`#F3D3B1`), and white text.

---

### Footer

Two-column grid. Left: Ochre bg (`#A65600`), brand name white, weight 900. Right: Alabaster Linen (`#F8EBDD`), links + copyright.
Ochre left column separated from Alabaster right by 4px `#022015` border.

```css
footer {
  display: grid;
  grid-template-columns: 200px 1fr;
  border-top: 4px solid #022015;
  background: #F8EBDD;
}
.footer-left {
  background: #A65600;
  padding: 28px 32px;
  border-right: 4px solid #022015;
  display: flex;
  align-items: center;
}
.footer-brand {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #FFFFFF;
}
.footer-right {
  padding: 28px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.footer-links {
  display: flex;
  gap: 24px;
  list-style: none;
  flex-wrap: wrap;
}
.footer-links a {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4A6256;
  text-decoration: none;
  transition: color 120ms;
}
.footer-links a:hover {
  color: #022015;
}
```

---

### Scroll Reveal Animations (Subtle)

Only one animation type: elements slide up 20px and fade in. No complex sequences. Triggered by IntersectionObserver on `.reveal` elements. Stagger grid children with `transition-delay`.

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}
.reveal:nth-child(2) { transition-delay: 0.08s; }
.reveal:nth-child(3) { transition-delay: 0.16s; }
.reveal:nth-child(4) { transition-delay: 0.24s; }
```

---

### What NOT to Do
- ✗ NEVER use gradients — not even subtle ones. Color is flat or absent.
- ✗ NEVER use box-shadows or drop-shadows — depth comes strictly from color contrast and thick borders.
- ✗ NEVER use border-radius — all geometry is angular, except explicit circular feature markers.
- ✗ NEVER use equal-column grids (`1fr 1fr 1fr` is for spreadsheets, not Bauhaus).
- ✗ NEVER use more than one primary color per section — color is structural, not decorative.
- ✗ NEVER use mid-size type — go large (display) or small (label). Nothing in between.
- ✗ NEVER use photography with color — black and white only, high contrast.
- ✗ NEVER use icon libraries — use geometric shapes (■ ● ▲) and typographic symbols.
- ✗ NEVER use whitespace as filler — every empty area is an intentional architectural decision.
- ✗ NEVER use animations longer than 450ms — Bauhaus is decisive, not floaty.

### Data to Replace (Placeholder Map)
- `[BRAND_NAME]` — nav logo, footer brand
- `[HERO_HEADLINE]` — 2–3 words max, one word in Warm Buff (`#F3D3B1`) or Ochre (`#A65600`)
- `[HERO_SUBTEXT]` — 2–3 sentences, weight 300, `#2A3A32`
- `[HERO_STATS]` — 3 stats: number (`#022015`) + label (`#4A6256`)
- `[FEATURE_CELLS]` — 3 cells: main cell (Alabaster), Ochre stat cell (`#A65600`), Warm Buff cell (`#F3D3B1`)
- `[MANIFESTO_WORD]` — vertical label word (e.g. "METHOD", "CRAFT", "SYSTEM") in `#022015` rail
- `[PRINCIPLES]` — 3 items: Ochre number, title, description
- `[WORK_ITEMS]` — 4 projects: number, title, category, card color (`#A65600` / `#022015` / `#F3D3B1` / `#0B120E`)
- `[PRICING_TIERS]` — 3 tiers: name, price, period, 3–5 features (featured plan on `#022015` with `#F3D3B1` price)
- `[FOOTER_LINKS]` — 4–6 links
- `[COLOR_DNA]` — Ochre (`#A65600`) · Cypress (`#022015`) · Warm Buff (`#F3D3B1`) · Structural Dark (`#0B120E`) · Alabaster Linen (`#F8EBDD`)
