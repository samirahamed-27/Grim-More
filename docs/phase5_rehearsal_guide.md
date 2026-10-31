# Grim-More: Phase 5 Rehearsal, Backup & Judging Guide

**Total Presentation Window**: 5 minutes (4 minutes 15 seconds presentation + 45 seconds buffer)  
**Slide Deck Link**: [http://localhost:3000/slides.html](http://localhost:3000/slides.html)  
**Live App Link**: [http://localhost:3000](http://localhost:3000)

---

## ⏱️ Pitch Choreography & Speaker Transitions

| Time | Slide | Speaker | Core Message to Deliver |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:45** | **Slide 1: The Potion Shop Dilemma** | **Person A** | Open with the crisis: apothecary runs on steady sales; Full Moon Festival triples demand. Doing nothing = 1.3d stockout before 2.0d delivery; over-ordering = cash locked in dead stock. |
| **0:45 - 1:15** | **Slide 2: Dual-Path Spike Intelligence** | **Person A** | Distinguish our system from naive `x3` multipliers. Pathway 1: Surprise surge caught automatically via z-score ($z > 3.0$). Pathway 2: 7-day advance announcement allowing buffer delivery. |
| **1:15 - 1:45** | **Slide 3: Architecture & Math Engine** | **Person A** | Explain statistical forecasting and safety stock formulas: 90 days transactional history, anomaly detection, and $\text{SS} = 1.65 \times \sigma \times \sqrt{L}$ (95% service level) ensuring zero stockouts. |
| **1:45 - 3:00** | **Slide 4: The Live Demonstration** | **Person A** | **Live Demo Flow**: (1) Baseline calm green state $\rightarrow$ (2) Click `[SIMULATE SURGE]` $\rightarrow$ (3) Chart jumps from 100 to 300 $\rightarrow$ (4) Moonflower flashes red alert (stockout in 1.3d) $\rightarrow$ (5) Reorder table prescribes +1,170 units $\rightarrow$ (6) Show green simulation curve maintaining stock above 0. |
| **3:00 - 3:45** | **Slide 5: Quantified Impact** | **Person A** | Highlight zero stockouts, low forecast error on test partitions, and automatic contraction back to baseline holding costs after the festival. |
| **3:45 - 4:25** | **Slide 6: Honest Limits & Next Steps** | **Person A** | Acknowledge edge cases (perishability dates, supplier MOQs) and outline ML roadmap (Prophet, multi-supplier RFQ webhooks). Hand over to judges for Q&A. |

---

## 🛡️ Emergency Recovery Protocol (Fail-Safe)

1. **If localhost or browser glitches during the live demo**:
   - **Do NOT panic or reload repeatedly**.
   - Person C says: *"While localhost reconnects, let me show you our pre-recorded test run of this exact scenario."*
   - Person B or C switches to the 2-minute clean backup screen video in **under 3 seconds** and continues narrating the exact same 6 steps without missing a beat.
2. **Offline Resilience**:
   - The frontend automatically falls back to internal mock datasets if the backend is down, meaning the UI never shows a white screen of death.

---

## 🎤 Top 5 Judge Defense Q&As (Memorize These)

1. **"Is this really AI?"**
   > *"It is statistical forecasting using exponential smoothing and z-score anomaly detection. We chose this deliberately because in retail demand spikes with sparse data, transparent statistical models are explainable, robust, and don't hallucinate. A learned ML model (like Prophet or LSTM) is our planned next step."*

2. **"Why not just multiply baseline sales by 3?"**
   > *"A hard-coded multiplier only works if you're told beforehand. Our spike detector catches unannounced surprises from transaction variance ($z > 3$), and our reorder engine factors in lead-time volatility and safety stock so you don't overorder."*

3. **"What data did you use?"**
   > *"We synthesized 90 days of realistic daily transactions featuring day-of-week seasonality (weekend surges) and stochastic variance (~10% Gaussian noise) to test both steady-state and festival stress scenarios."*

4. **"How did you arrive at the order quantity?"**
   > *"$\text{Target Stock} = \text{Daily Forecast} \times (\text{Lead Time} + \text{Cover Days}) + 1.65 \times \sigma \times \sqrt{\text{Lead Time}}$. Then we subtract current stock. The 1.65 factor ensures a 95% cycle service level."*

5. **"What does it not handle?"**
   > *"Supplier delivery delays, minimum order quantities (MOQs), ingredient perishability dates, and substitution effects between potions."*

---

## ✅ Pre-Pitch Equipment Checklist
- [ ] Laptops plugged into power chargers.
- [ ] Slide deck loaded in browser at `http://localhost:3000/slides.html`.
- [ ] Live dashboard loaded in browser at `http://localhost:3000`.
- [ ] Slide deck PDF and backup MP4 demo video copied to:
  - Laptop 1 (Person C)
  - Laptop 2 (Person B)
  - USB thumb drive / phone storage.
- [ ] 2x timed out-loud dry-runs completed.

