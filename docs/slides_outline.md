# Potion Pantry: 6-Slide Pitch Deck Outline

**Target Duration**: 4 minutes 30 seconds (leaving 30 seconds buffer for judges)  
**Track**: Track 01 — Inventory Prediction for Sudden Festival Demand Spike  
**Presenters**:
- **Person C (The Face)**: Opening, Live Demo walkthrough, Closing
- **Person A (The Brain)**: Spike detection math, statistical forecasting, error analysis
- **Person B (The Engine)**: Reorder calculations, safety stock logic, API/DB pipeline

---

## Slide 1: The Potion Shop Dilemma (0:00 - 0:45)
**Speaker**: Person C (The Face)
- **The Hook**: Running an apothecary shop is profitable until the kingdom announces the surprise Full Moon Festival.
- **The Problem**: Overnight, demand for 3 sacred ingredients (*Moonflower*, *Silver Dew*, *Wolfsbane*) triples (300%).
- **The Double Risk**:
  - *If we do nothing*: Stockouts happen in 1.3 days, while delivery takes 2 days. Lost sales, furious witches and wizards.
  - *If we panic-order blindly*: Thousands of gold coins locked up in dead stock after the festival passes.
- **Our Goal**: Automated, mathematically sound inventory protection that acts before the stock hits zero.

---

## Slide 2: Two Ways to Learn About a Spike (0:45 - 1:15)
**Speaker**: Person C (The Face)
- **Why Naive Systems Fail**: Most hackathon solutions hard-code `sales * 3`. That fails in real life.
- **Pathway 1 (Surprise Spike)**: Nobody warned us, but transactions jumped. Our z-score anomaly detector catches it automatically from transactions ($z > 3.0$).
- **Pathway 2 (Advance Announcement)**: The festival is announced 7 days prior. The shopkeeper sets the multiplier, and the model schedules an advance order so shipments arrive *before* the festival starts.

---

## Slide 3: Architecture: From Data to Decision (1:15 - 2:00)
**Speaker**: Person A (The Brain) & Person B (The Engine)
- **Person A (The Brain)**:
  - 90 days of synthetic transactional history with weekday variance and noise.
  - Moving average with seasonality + exponential smoothing.
  - Spike detection formula: $z = \frac{\text{recent avg} - \text{baseline avg}}{\text{baseline std}}$.
- **Person B (The Engine)**:
  - Safety Stock formula: $\text{SS} = 1.65 \times \sigma \times \sqrt{\text{Lead Time}}$ (guarantees ~95% service level).
  - Target Stock: $\text{Forecast} \times (\text{Lead Time} + \text{Cover Days}) + \text{Safety Stock}$.
  - Net Reorder Quantity: $\max(0, \text{Target Stock} - \text{Current Stock})$.

---

## Slide 4: Live Demonstration (2:00 - 3:15)
**Speaker**: Person C (The Face)
- Switch to live screen running `Potion Pantry`.
- *Step 1*: Point to calm baseline. Moonflower has 400 in stock, selling 100/day = 4.0 days of cover. Status is healthy green (`ok`).
- *Step 2*: Click **"Trigger Full Moon Festival"**.
- *Step 3*: Visual reaction — Moonflower forecast leaps to 300 units/day.
- *Step 4*: The Alarm: Days of cover plummets to 1.3 days. Delivery takes 2.0 days. Card turns glowing red (`critical`), top alert banner sounds the alarm.
- *Step 5*: The Automated Prescription: Reorder table prescribes ordering **1,170 units** right now.
- *Step 6*: The Proof: Show that this exact order bridges the 2-day delivery gap and cushions 3 days of post-delivery demand.

---

## Slide 5: Results & Quantifiable Impact (3:15 - 3:55)
**Speaker**: Person A & Person C
- **Zero Stockouts**: Simulated stock trajectory demonstrates inventory stays strictly above 0 throughout the festival rush.
- **Accuracy**: Forecast mean absolute percentage error (MAPE) within ~8-10% on test partitions.
- **Capital Efficiency**: Reorder quantities dynamically contract back to baseline once festival dates conclude.

---

## Slide 6: Real-World Limitations & Next Steps (3:55 - 4:30)
**Speaker**: Person C (The Face)
- **Honest Limitations**:
  - Does not model supplier delivery delays or batch order MOQs (minimum order quantities).
  - Assumes non-perishable ingredients (no spoilage shelf-life).
  - Does not account for cannibalization/substitutions between potion components.
- **Next Steps with More Time**:
  - Deep learning demand forecasting (Prophet / Temporal Fusion Transformers).
  - Multi-supplier automated RFQ purchase order webhooks.
  - Automated WhatsApp / SMS alerts for shop managers.
