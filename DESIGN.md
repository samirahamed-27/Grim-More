# DESIGN.md — Grim-More Design System (Sketch Design System)

## 1. Personality & Philosophy
Hand-drawn, imperfect, and alive. Feels like a talented designer sketched the UI in a notebook. Warm, approachable, and unmistakably human. Every element looks slightly imperfect on purpose — lines are slightly off, fills are slightly uneven, borders are slightly wobbly.

---

## 2. Layout Rules
- **Loose, Organic Layouts**: Nothing feels rigidly grid-locked.
- **Slight Rotations**: Cards and elements carry slight transform rotations (`transform: rotate(-0.8deg)` to `rotate(1deg)`).
- **Uneven Spacing**: Embraced to enhance the notebook sketch feel.
- **Paper Containment**: Content areas are contained in "paper" or "card" shapes with organic rough edges.
- **Asymmetry**: Encouraged across hero sections and card grids.

---

## 3. Color System
- **Background**: Warm off-white paper texture (`#FFF9F0` / `#FAFAF5`) with pencil dot-grid texture.
- **Text & Borders**: Dark pencil charcoal (`#1C1917` / `#292524`).
- **Primary Washes (Highlighter Marker feel at 30–50% opacity)**:
  - Yellow wash: `#FEF08A` (`rgba(254, 240, 138, 0.65)`)
  - Blue wash: `#BAE6FD` (`rgba(186, 230, 253, 0.55)`)
  - Green wash: `#BBF7D0` (`rgba(187, 247, 208, 0.55)`)
  - Peach wash: `#FED7AA` (`rgba(254, 215, 170, 0.55)`)
- **Accent Highlighting**:
  - Terracotta: `#C2410C` (emergency alerts, critical hazard tags, primary accents).
  - Forest ink: `#15803D` (protected stock recovery, safe status).
- **Prohibited**: Bright neon saturated gradients, generic dark mode, pure sterile `#FFFFFF` body canvas, pure digital `#000000`.

---

## 4. Typography
- **Headings & Brand**: `'Kalam', cursive, sans-serif` (casual, confident hand-drawn titles).
- **Body & Component Labels**: `'Patrick Hand', cursive, sans-serif` (clean, highly legible handwriting).
- **Margin Notes & Annotations**: `'Caveat', cursive` (intimate, quick margin scribbles with arrows).
- **Display Alternate**: `'Architects Daughter', cursive`.
- **Tabular Figures & Code**: `'JetBrains Mono', monospace` (for exact mathematical telemetry).

---

## 5. Borders & Geometry (The Core)
- **CSS-Approximated Rough Borders**:
  - `border: 2px solid #1C1917;`
  - `border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;`
  - Alternating organic corner radii: `border-radius: 20px 255px 20px 225px/225px 20px 255px 20px;`
- **Pencil Drop Shadows**:
  - Standard cards: `box-shadow: 3px 4px 0px #1C1917;`
  - Large sections: `box-shadow: 5px 6px 0px #1C1917;`
  - Hover: `box-shadow: 4px 5px 0px #1C1917; transform: rotate(0deg) scale(1.02);`
  - Active press: `box-shadow: 1px 1px 0px #1C1917; transform: translate(2px, 2px);`
- **Dashed Guidelines**: Sketched divider rules (`border-bottom: 1.5px dashed #D6D3CD;`).

---

## 6. Buttons & Inputs
- **Hand-Drawn Buttons**: Slightly uneven border (`border-radius: var(--radius-sketch-1)`), 2px solid `#1C1917`, highlighter fill (`#FEF08A`).
- **Tactile Response**: Slight rotation on hover, physical 2px translation on press.
- **Conversational Badges**: Taped sticky note tags with rotated pins (`📌`, `📐`, `✨`).

---

## 7. Content & Microcopy Tone
- Warm, conversational, transparent, and approachable.
- ✓ *"Because running out of Moonflower during a Royal Festival is terrible business."*
- ✓ *"Here's how it works → (it's pretty straightforward, really)"*
- ✓ *"Operator's Notebook: Select any ingredient card below or trigger a Royal Festival surge."*
- ✗ *"Enterprise inventory optimization paradigm leveraging AI heuristics."*
