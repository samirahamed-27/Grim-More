# Custom Fonts Directory (Halloween 2026 at The Cause Typography)

This project is styled around the typography of **Halloween 2026 at The Cause**:
1. **OVR Demorny** (Overtype Foundry) — Flared Art Nouveau / incised Parisian tombstone display serif.
2. **Archetype** (Gábor Kóthay / T-26) — Experimental medieval/early-renaissance display serif.

### Local Font Files
If you own or download the commercial desktop/web fonts (`.woff2`, `.woff`, `.otf`), you can drop them right into this `fonts/` folder:
- `OVR-Demorny.woff2` or `OVR-Demorny.otf`
- `Archetype.woff2` or `Archetype.otf`

The CSS automatically includes `@font-face` rules for `local('OVR Demorny')` and these file paths.
If local files are absent, the UI seamlessly falls back to high-fidelity Google Fonts matching this aesthetic:
- **Marcellus** (for OVR Demorny's flared incised elegance)
- **Grenze Gotisch** & **Instrument Serif** (for Archetype's experimental medieval gothic sharpness)
- **Syne** (for contemporary festival/rave poster accents)

