# DESIGN.md — Grim-More Design System

## 1. Purpose and Scope
This document specifies the authoritative design system, token semantics, component constraints, and interaction physics for **Grim-More** (Track 01: Apothecary Inventory Surge Control & Pitch Deck). Any coding agent or designer creating or editing interfaces in this repository must strictly adhere to these rules.

---

## 2. Product and User Principles
1. **Mathematical Certainty Over Black-Box Magic**: Every alert and reorder quantity must be explainable in under 30 seconds via visible statistical parameters (Z-score, lead time, safety stock).
2. **Instant Crisis Perception**: Under sudden surge conditions, an operator or hackathon judge must recognize deficit status within 3 seconds of viewing the viewport.
3. **Tactile Terminal Precision**: Interfaces behave like calibrated hardware telemetry—dead still at rest, zero inertia or float, responding with 60–120ms mechanical snaps.
4. **No Generic AI Slop**: Banned from using purple SaaS gradients, soft circular pill badges, Inter-only branding, or bouncy cartoon physics.

---

## 3. Visual Hierarchy and Layout Rules
- **Canvas Model**: Single-viewport operational command center (`max-width: 1400px`).
- **Primary Split (2:1 Ratio)**:
  - **Left (66%)**: Dynamic visual telemetry (dual-simulation trajectory chart with historical solid series, dashed spike projection, and recovery curve).
  - **Right (33%)**: Explanatory proof deck (live worked formula calculation pinning active ingredient metrics).
- **Z-Index Scale**:
  - `0`: Background technical carbon grid (`36px x 36px`).
  - `1`: Base telemetry cards and reorder tables.
  - `10`: Translucent navigation command bar (`backdrop-filter: blur(20px)`).
  - `50`: Critical deficit emergency alert banner.

---

## 4. Token and Visual-System Guidance

### Color Tokens (Hex)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--c-black` | `#000000` | Pure obsidian background canvas |
| `--bg-card` | `#080202` | Matte dark chamber surface |
| `--bg-card-hover`| `#120303` | Interactive hover depth |
| `--border-maroon`| `#840000` | Structural resting border rule (1.5px) |
| `--c-crimson` | `#BD0000` | Focus, active selection, historical telemetry line |
| `--c-blaze` | `#FF0000` | Surgical hazard red, critical deficit, surge forecast |
| `--status-ok` | `#2ECC71` | Protected inventory curve, zero stockout recovery |
| `--text-main` | `#FFFFFF` | High-contrast chalk text |
| `--text-muted` | `#B8A4AA` | WCAG AA compliant technical labels (5.1:1 on black) |

### Typography Tokens
- `--font-primary-display`: `'OVR Demorny', 'Marcellus', serif` (Brand headline, card entities, chart titles).
- `--font-secondary-display`: `'Archetype', 'Grenze Gotisch', 'Instrument Serif', serif` (Emergency alerts, math proof titles).
- `--font-rave`: `'Syne', -apple-system, sans-serif` (Terminal buttons, table headers, priority tags).
- `--font-mono`: `'JetBrains Mono', monospace` (All numbers, formulas, ratios, `tabular-nums`).

### Geometry & Radius Tokens
- `--radius-sm`: `2px` (Terminal tags, priority chips).
- `--radius-md`: `3px` (Containers, formula boxes).
- `--radius-lg`: `4px` (Main chart panel).
- **Rule**: `border-radius: 999px` is strictly forbidden.

---

## 5. Component Selection and Usage Rules
- **Terminal Command Buttons**: Must use uppercase monospace action verbs enclosed in brackets: `[SIMULATE SURGE]`, `[ADVANCE EVENT]`, `[RESET SHOP]`. Never use decorative emojis in button labels.
- **Ingredient Cards**: Must display Icon, Name, Stock, Daily Forecast, Days of Cover, Lead Time, and Status Badge. Must trigger active chart inspection on `click`.
- **Status Badges**:
  - `ok`: Green border + low-opacity green background.
  - `watch`: Amber border + amber background.
  - `critical`: Laser-sharp `#FF0000` border + high-contrast alert footer.
- **Reorder Table**: Must strictly sort by urgency (highest priority first, then lowest days of cover). Numbers must format with thousand commas (e.g. `1,170`).

---

## 6. Interaction States and Behavior
- **Pointer Down**: Buttons compress to `scale(0.965)` and cards to `scale(0.985)` on `pointerdown` via cubic-bezier `(0.16, 1, 0.3, 1)`.
- **Keyboard Focus**: Every interactive control must show a crisp `2px solid #FF0000` outline with `2px` offset on `:focus-visible`.
- **Chart Animation**: Redraws are capped at `240ms` duration with `easeOutQuart`. Never use 1000ms slow draws.
- **State Reversibility**: Clicking `[RESET SHOP]` must immediately restore all baseline values and dismiss alerts in under `100ms`.

---

## 7. Content and Microcopy Guidance
- **Voice**: Cold, precise, mathematically confident.
- **Do**:
  - *"CRITICAL DEFICIT: INVENTORY COLLAPSE IN 1.3 DAYS"*
  - *"ALGORITHMIC REORDER PRESCRIPTION (+1,170 UNITS)"*
  - *"PROOF CALCULATION: MOONFLOWER"*
- **Don't**:
  - *"Oops! You might run out soon!"*
  - *"Suggested purchases for your cart"*

---

## 8. Accessibility Requirements
- **Contrast Standard**: All text tokens must achieve WCAG AA contrast (minimum 4.5:1; body labels set to `#B8A4AA` at 5.1:1).
- **Reduced Motion**: All animations must be gated by `@media (prefers-reduced-motion: reduce)`. When enabled, alert entrances and card transforms must resolve instantly with 0ms transition.
- **Touch Target Size**: All interactive buttons and cards must maintain a minimum touch bounding box of `44px x 44px`.

---

## 9. Responsive Behavior
- **Desktop / Projector (>1024px)**: 2-column layout with 6-card grid and side-by-side chart/formula panels.
- **Tablet / Laptop (768px – 1024px)**: Analytics row collapses to single-column stack (Chart full width, formula deck underneath).
- **Mobile (<768px)**: Cards collapse to 2-column grid; table scrolls horizontally with fixed header.

---

## 10. Anti-Patterns and Prohibited Choices
- ❌ **No Soft Round Pills**: No `border-radius: 999px` badges.
- ❌ **No Hover Floats**: No `transform: translateY(-3px)` card hover lifts.
- ❌ **No Blurry Gradient Blobs**: No ambient radial glow orbs across the background.
- ❌ **No Fake Numerical Badges**: No arbitrary circular `01/02/03` steps in formula cards.
- ❌ **No Emoji Navigation**: No raw emoji characters replacing button commands.

---

## 11. Canonical Design References
- **Typography & Event Aesthetic**: [Halloween 2026 at The Cause](https://fontsinuse.com/uses/80569/halloween-2026-at-the-cause) (*OVR Demorny* + *Archetype* + *Syne*).
- **Color Extraction**: Crimson Obsidian 4-band palette (`#000000`, `#840000`, `#BD0000`, `#FF0000`).
- **Mathematical Specification**: `docs/contract.md` and `docs/ingredients.md`.

---

## 12. Preflight Checklist (Before Generating or Modifying UI)
- [ ] Are all color values pulled from approved token variables (`--c-black`, `--border-maroon`, etc.)?
- [ ] Are buttons styled with `var(--font-rave)` and monospace bracketed verbs (`[COMMAND]`)?
- [ ] Does small body copy meet or exceed 4.5:1 contrast against `#080202`?
- [ ] Are border radii strictly between `2px` and `4px`?
- [ ] Is `font-variant-numeric: tabular-nums` applied to all dynamic metrics?

---

## 13. Final UI QA Checklist
- [ ] **Baseline State**: All 6 ingredients green (`ok`), Moonflower cover at 4.0 days, alert banner hidden.
- [ ] **Surprise Trigger (`[SIMULATE SURGE]`)**: Banner snaps in within 160ms, Moonflower card turns `#FF0000`, chart displays dual crash/recovery trajectories.
- [ ] **Advance Trigger (`[ADVANCE EVENT]`)**: Multiplier 3.0 applies with advance green indicator.
- [ ] **Reset Action (`[RESET SHOP]`)**: Entire system returns to baseline within 100ms.
- [ ] **Keyboard Tab**: Focus ring cleanly navigates all buttons and cards with visible red outline.
