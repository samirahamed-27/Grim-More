/**
 * ==============================================================================
 * GRIM-MORE — FRONTEND CONTROLLER (PERSON C - THE FACE)
 * Implements:
 * - Phase 1: Mock Data Fallback
 * - Phase 2: Live Backend Integration (FastAPI: /api/ingredients, /api/forecast, /api/reorders)
 * - Phase 3: Advanced Visuals (Uncertainty Envelope, Stock Depletion Simulation, Shaded Window)
 * ==============================================================================
 */

// Global Configuration & State
const API_BASE = "http://127.0.0.1:8000";
let isBackendLive = false;
let isFestivalActive = false;
let isAnnouncementActive = false;
let selectedIngredientId = 1; // Default to Moonflower (ID: 1)
let chartInstance = null;
let currentIngredientsData = [];

// ==============================================================================
// CONTRACT MOCK DATA (Fallback if backend is offline)
// ==============================================================================

const INGREDIENT_ICONS = {
  1: "🌸", // Moonflower
  2: "💧", // Silver Dew
  3: "🌿", // Wolfsbane
  4: "🐉", // Dragon Resin
  5: "🫐", // Nightshade
  6: "🪴"  // Mandrake Root
};

// Baseline normal state
const MOCK_BASELINE_INGREDIENTS = [
  { id: 1, name: "Moonflower", current_stock: 400, lead_time_days: 2, daily_forecast: 100, days_of_cover: 4.0, status: "ok", order_qty: 123, priority: "low" },
  { id: 2, name: "Silver Dew", current_stock: 800, lead_time_days: 1, daily_forecast: 200, days_of_cover: 4.0, status: "ok", order_qty: 146, priority: "low" },
  { id: 3, name: "Wolfsbane", current_stock: 200, lead_time_days: 3, daily_forecast: 50, days_of_cover: 4.0, status: "ok", order_qty: 123, priority: "low" },
  { id: 4, name: "Dragon Resin", current_stock: 300, lead_time_days: 4, daily_forecast: 60, days_of_cover: 5.0, status: "ok", order_qty: 208, priority: "low" },
  { id: 5, name: "Nightshade", current_stock: 500, lead_time_days: 2, daily_forecast: 120, days_of_cover: 4.2, status: "ok", order_qty: 130, priority: "low" },
  { id: 6, name: "Mandrake Root", current_stock: 150, lead_time_days: 3, daily_forecast: 40, days_of_cover: 3.75, status: "ok", order_qty: 102, priority: "low" }
];

// Festival Spiked state (IDs 1, 2, 3 demand tripled)
const MOCK_SPIKED_INGREDIENTS = [
  { id: 1, name: "Moonflower", current_stock: 400, lead_time_days: 2, daily_forecast: 300, days_of_cover: 1.3, status: "critical", order_qty: 1170, priority: "high" },
  { id: 2, name: "Silver Dew", current_stock: 800, lead_time_days: 1, daily_forecast: 600, days_of_cover: 1.3, status: "watch", order_qty: 1700, priority: "high" },
  { id: 3, name: "Wolfsbane", current_stock: 200, lead_time_days: 3, daily_forecast: 150, days_of_cover: 1.3, status: "critical", order_qty: 780, priority: "high" },
  { id: 4, name: "Dragon Resin", current_stock: 300, lead_time_days: 4, daily_forecast: 60, days_of_cover: 5.0, status: "ok", order_qty: 208, priority: "low" },
  { id: 5, name: "Nightshade", current_stock: 500, lead_time_days: 2, daily_forecast: 120, days_of_cover: 4.2, status: "ok", order_qty: 130, priority: "low" },
  { id: 6, name: "Mandrake Root", current_stock: 150, lead_time_days: 3, daily_forecast: 40, days_of_cover: 3.75, status: "ok", order_qty: 102, priority: "low" }
];

// Helper to generate 30 days history + 7 days forecast
function generateMockHistoryAndForecast(ingredientId, spiked) {
  const baseAvg = ingredientId === 1 ? 100 : ingredientId === 2 ? 200 : (ingredientId === 3 ? 50 : 60);
  const history = [];
  const forecast = [];
  
  // 30 days past history
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const noise = ((i % 5) - 2) * 4;
    let units = Math.max(10, Math.round(baseAvg + noise));
    if (spiked && [1, 2, 3].includes(ingredientId) && i <= 2) {
      units = units * 3; // Recent spike detected
    }
    history.push({ date: dateStr, units });
  }

  // 7 days forecast with uncertainty envelope
  const multiplier = (spiked && [1, 2, 3].includes(ingredientId)) ? 3.0 : 1.0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const dateStr = d.toISOString().split('T')[0];
    const expected = Math.round(baseAvg * multiplier);
    const std = Math.round(10 * multiplier);
    forecast.push({
      date: dateStr,
      units: expected,
      lower: Math.max(0, expected - std),
      upper: expected + std
    });
  }

  return { history, forecast, isSpike: spiked && [1, 2, 3].includes(ingredientId) };
}

// ==============================================================================
// DOM ELEMENTS
// ==============================================================================

const elIngredientsGrid = document.getElementById("ingredientsGrid");
const elReordersTableBody = document.getElementById("reordersTableBody");
const elAlertBanner = document.getElementById("alertBanner");
const elAlertTitle = document.getElementById("alertTitle");
const elAlertMessage = document.getElementById("alertMessage");
const elChartTitle = document.getElementById("chartTitle");
const elAlertQuickJump = document.getElementById("alertQuickJump");
const elBtnTriggerSpike = document.getElementById("btnTriggerSpike");
const elBtnAnnounceEvent = document.getElementById("btnAnnounceEvent");
const elBtnReset = document.getElementById("btnReset");
const elDataModeBadge = document.getElementById("dataModeBadge");
const elForecastCanvas = document.getElementById("forecastChart");
const elWorkedExampleBox = document.getElementById("workedExampleBox");

// ==============================================================================
// INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await checkBackendConnection();
  await renderApp();
});

function setupEventListeners() {
  // Fluid response: trigger on click and add tactile pointer-down feedback
  const buttons = [elBtnTriggerSpike, elBtnAnnounceEvent, elBtnReset].filter(Boolean);
  buttons.forEach(btn => {
    btn.addEventListener("pointerdown", () => btn.classList.add("pointer-active"));
    btn.addEventListener("pointerup", () => btn.classList.remove("pointer-active"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("pointer-active"));
    btn.addEventListener("pointercancel", () => btn.classList.remove("pointer-active"));
  });

  if (elBtnTriggerSpike) elBtnTriggerSpike.addEventListener("click", handleTriggerFestival);
  if (elBtnAnnounceEvent) elBtnAnnounceEvent.addEventListener("click", handleAnnounceEvent);
  if (elBtnReset) elBtnReset.addEventListener("click", handleReset);
  initRestockPanel();
}

// Check if FastAPI backend is reachable
async function checkBackendConnection() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (res.ok) {
      isBackendLive = true;
      elDataModeBadge.innerHTML = `<span class="status-dot live-dot"></span><span>Live Backend (FastAPI :8000)</span>`;
      return;
    }
  } catch (e) {
    isBackendLive = false;
    elDataModeBadge.innerHTML = `<span class="status-dot mock-dot"></span><span>Mock Standalone Mode</span>`;
  }
}

// ==============================================================================
// APPLICATION RENDERERS
// ==============================================================================

async function renderApp() {
  let ingredients = [];

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/api/ingredients`);
      if (res.ok) {
        ingredients = await res.json();
      }
    } catch (err) {
      console.warn("Backend fetch failed, falling back to mock:", err);
      ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
    }
  } else {
    ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
  }

  currentIngredientsData = ingredients;
  renderCards(ingredients);
  renderReorderTable(ingredients);
  renderAlertBanner(ingredients);
  await renderChart(selectedIngredientId);
  renderWorkedExample(selectedIngredientId);
}

// Render 6 Ingredient Cards
function renderCards(ingredients) {
  elIngredientsGrid.innerHTML = "";

  ingredients.forEach((ing) => {
    const card = document.createElement("div");
    card.className = `ingredient-card ${ing.status === "critical" ? "status-critical" : ""} ${ing.id === selectedIngredientId ? "selected" : ""}`;
    card.dataset.id = ing.id;

    const icon = INGREDIENT_ICONS[ing.id] || "🌿";
    const badgeClass = ing.status === "critical" ? "badge-critical" : (ing.status === "watch" ? "badge-watch" : "badge-ok");
    const coverDisplay = Number(ing.days_of_cover).toFixed(1);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon-name">
          <span class="card-icon">${icon}</span>
          <span class="card-name">${ing.name}</span>
        </div>
        <span class="badge ${badgeClass}">${ing.status}</span>
      </div>
      <div class="card-stats">
        <div class="stat-item">
          <span class="stat-label">Stock On Hand</span>
          <span class="stat-val">${ing.current_stock.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Forecast / Day</span>
          <span class="stat-val">${Math.round(ing.daily_forecast)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Days of Cover</span>
          <span class="stat-val ${ing.status === 'critical' ? 'text-critical' : ''}">${coverDisplay} d</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Lead Time</span>
          <span class="stat-val">${ing.lead_time_days} d</span>
        </div>
      </div>
      ${ing.status === 'critical' ? `<div class="card-footer-alert">🚨 Stockout in ${coverDisplay}d (Lead: ${ing.lead_time_days}d)</div>` : ''}
    `;

    // Direct tactile response on card pointer-down
    card.addEventListener("pointerdown", () => card.classList.add("pointer-active"));
    card.addEventListener("pointerup", () => card.classList.remove("pointer-active"));
    card.addEventListener("pointerleave", () => card.classList.remove("pointer-active"));
    card.addEventListener("pointercancel", () => card.classList.remove("pointer-active"));

    card.addEventListener("click", () => {
      selectIngredient(ing.id);
    });

    elIngredientsGrid.appendChild(card);
  });
}

// Select active ingredient and synchronize all views
function selectIngredient(ingredientId) {
  selectedIngredientId = ingredientId;
  
  // Synchronize card selection
  document.querySelectorAll(".ingredient-card").forEach(c => {
    if (parseInt(c.dataset.id, 10) === ingredientId) {
      c.classList.add("selected");
    } else {
      c.classList.remove("selected");
    }
  });

  // Synchronize chart and proof box
  renderChart(ingredientId);
  renderWorkedExample(ingredientId);

  // Synchronize quick jump tags
  renderAlertQuickJump();
}

// Render Reorders Table (Urgency Ranked)
function renderReorderTable(ingredients) {
  elReordersTableBody.innerHTML = "";

  // Sort: high priority first, then critical status, then lowest days of cover
  const priorityRank = { high: 3, medium: 2, low: 1 };
  const sorted = [...ingredients].sort((a, b) => {
    const pDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return a.days_of_cover - b.days_of_cover;
  });

  sorted.forEach(ing => {
    const row = document.createElement("tr");
    const chipClass = ing.priority === "high" ? "chip-high" : (ing.priority === "medium" ? "chip-medium" : "chip-low");
    const icon = INGREDIENT_ICONS[ing.id] || "🌿";
    const coverDisplay = Number(ing.days_of_cover).toFixed(1);

    row.style.cursor = "pointer";
    row.title = `Click to inspect ${ing.name} trajectory`;

    row.innerHTML = `
      <td><span class="table-priority-chip ${chipClass}">${ing.priority}</span></td>
      <td><strong>${icon} ${ing.name}</strong></td>
      <td class="mono">${ing.current_stock.toLocaleString()}</td>
      <td class="mono">${Math.round(ing.daily_forecast)} / day</td>
      <td class="mono">${coverDisplay} days</td>
      <td class="mono">${ing.lead_time_days} days</td>
      <td class="order-qty-cell">+${ing.order_qty.toLocaleString()}</td>
      <td>
        ${ing.days_of_cover < ing.lead_time_days 
          ? `<span style="color: #ff4d4d; font-weight: 700;">⚠️ Depletes Before Delivery</span>` 
          : `<span style="color: #2ecc71;">✓ Covered</span>`}
      </td>
    `;

    row.addEventListener("pointerdown", () => row.classList.add("pointer-active"));
    row.addEventListener("pointerup", () => row.classList.remove("pointer-active"));
    row.addEventListener("pointerleave", () => row.classList.remove("pointer-active"));
    row.addEventListener("click", () => selectIngredient(ing.id));

    elReordersTableBody.appendChild(row);
  });
}

// Render Top Alert Banner
function renderAlertBanner(ingredients) {
  const alertItems = ingredients.filter(i => i.status === "critical" || i.priority === "high" || (isFestivalActive && [1, 2, 3].includes(i.id)));
  
  if (alertItems.length > 0) {
    if (alertItems.length > 1) {
      elAlertTitle.textContent = `CRITICAL DEFICIT DETECTED ACROSS ${alertItems.length} APOTHECARY INGREDIENTS`;
      elAlertMessage.textContent = `Festival surge demands immediate emergency reorders. Select an ingredient below to inspect its trajectory and lead-time collision:`;
    } else {
      const item = alertItems[0];
      elAlertTitle.textContent = `CRITICAL DEFICIT: ${item.name.toUpperCase()} RUNS OUT IN ${Number(item.days_of_cover).toFixed(1)} DAYS`;
      elAlertMessage.textContent = `Supplier delivery takes ${item.lead_time_days} days! Reorder at least ${item.order_qty.toLocaleString()} units now to avoid a complete stockout.`;
    }
    renderAlertQuickJump(alertItems);
    elAlertBanner.classList.remove("hidden");
  } else {
    if (elAlertQuickJump) elAlertQuickJump.innerHTML = "";
    elAlertBanner.classList.add("hidden");
  }
}

// Render Quick-Jump Buttons for Multi-Deficit Ingredients
function renderAlertQuickJump(alertItems) {
  if (!elAlertQuickJump) return;
  const items = alertItems || currentIngredientsData.filter(i => i.status === "critical" || i.priority === "high" || (isFestivalActive && [1, 2, 3].includes(i.id)));
  if (items.length <= 1) {
    elAlertQuickJump.innerHTML = "";
    return;
  }

  elAlertQuickJump.innerHTML = `<span class="quick-jump-label">QUICK SWITCH TELEMETRY:</span>`;
  items.forEach(item => {
    const icon = INGREDIENT_ICONS[item.id] || "🌿";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `quick-jump-btn ${item.id === selectedIngredientId ? "active" : ""}`;
    btn.innerHTML = `<span>${icon} ${item.name}</span> <span class="tag-cover">(${Number(item.days_of_cover).toFixed(1)}d cover)</span>`;

    btn.addEventListener("pointerdown", () => btn.classList.add("pointer-active"));
    btn.addEventListener("pointerup", () => btn.classList.remove("pointer-active"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("pointer-active"));
    btn.addEventListener("pointercancel", () => btn.classList.remove("pointer-active"));

    btn.addEventListener("click", () => {
      selectIngredient(item.id);
    });

    elAlertQuickJump.appendChild(btn);
  });
}

// Render Dynamic Worked Example for Judges
function renderWorkedExample(ingredientId) {
  const item = currentIngredientsData.find(i => i.id === ingredientId) || currentIngredientsData[0];
  if (!item || !elWorkedExampleBox) return;

  const icon = INGREDIENT_ICONS[item.id] || "🌿";
  const std = Math.round(item.daily_forecast * 0.1);
  const safetyStock = Math.round(1.65 * std * Math.sqrt(item.lead_time_days));
  const coverDays = 3;
  const targetStock = Math.round(item.daily_forecast * (item.lead_time_days + coverDays) + safetyStock);

  elWorkedExampleBox.innerHTML = `
    <h4>Proof Calculation: ${item.name} (${icon})</h4>
    <div class="proof-row"><span>Daily Forecast:</span> <strong>${Math.round(item.daily_forecast)} units/day</strong></div>
    <div class="proof-row"><span>Lead Time:</span> <strong>${item.lead_time_days} days (Buffer: ${coverDays}d)</strong></div>
    <div class="proof-row"><span>Safety Stock (95% SL):</span> <strong>${safetyStock} units</strong></div>
    <div class="proof-row highlight-row"><span>Target Stock:</span> <strong>${targetStock.toLocaleString()} units</strong></div>
    <div class="proof-row highlight-row"><span>Recommended Order:</span> <strong>+${item.order_qty.toLocaleString()} units</strong></div>
  `;
}

// Render Chart.js Forecast Line Chart with Uncertainty Bands & Stock Simulation (Phase 3)
async function renderChart(ingredientId) {
  let historyData = [];
  let forecastData = [];
  let ingName = "Ingredient";

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/api/forecast/${ingredientId}`);
      if (res.ok) {
        const data = await res.json();
        historyData = data.history;
        forecastData = data.forecast;
        ingName = data.name;
      }
    } catch (e) {
      console.warn("API forecast fetch failed, using fallback:", e);
    }
  }

  // Fallback to mock data generator
  if (historyData.length === 0) {
    const mockRes = generateMockHistoryAndForecast(ingredientId, isFestivalActive);
    historyData = mockRes.history;
    forecastData = mockRes.forecast;
    const ingObj = currentIngredientsData.find(i => i.id === ingredientId);
    ingName = ingObj ? ingObj.name : "Ingredient";
  }

  const icon = INGREDIENT_ICONS[ingredientId] || "🌿";
  elChartTitle.textContent = `Demand & Inventory Simulation: ${ingName} (${icon})`;

  // Assemble labels
  const labels = [
    ...historyData.map(h => h.date.slice(5)), // MM-DD
    ...forecastData.map(f => f.date.slice(5))
  ];

  // 1. History series (values for history, null for forecast)
  const historySeries = [
    ...historyData.map(h => h.units),
    ...forecastData.map(() => null)
  ];

  // 2. Forecast series (connects from last history point)
  const lastHistoryPoint = historyData[historyData.length - 1].units;
  const forecastSeries = [
    ...historyData.slice(0, -1).map(() => null),
    lastHistoryPoint,
    ...forecastData.map(f => f.units)
  ];

  // 3. Uncertainty Envelope (Upper & Lower bounds)
  const upperSeries = [
    ...historyData.slice(0, -1).map(() => null),
    lastHistoryPoint,
    ...forecastData.map(f => f.upper || Math.round(f.units * 1.15))
  ];

  const lowerSeries = [
    ...historyData.slice(0, -1).map(() => null),
    lastHistoryPoint,
    ...forecastData.map(f => f.lower || Math.round(f.units * 0.85))
  ];

  // 4. Stock Trajectory Simulation (Phase 3 A6 requirement: What happens if we do nothing?)
  const targetItem = currentIngredientsData.find(i => i.id === ingredientId) || { current_stock: 400, lead_time_days: 2, order_qty: 1170 };
  let stockNoReorder = targetItem.current_stock;
  let stockWithReorder = targetItem.current_stock;
  const simNoReorder = [...historyData.slice(0, -1).map(() => null), targetItem.current_stock];
  const simWithReorder = [...historyData.slice(0, -1).map(() => null), targetItem.current_stock];

  forecastData.forEach((f, idx) => {
    // Depletion without order
    stockNoReorder = Math.max(0, stockNoReorder - f.units);
    simNoReorder.push(stockNoReorder);

    // Replenishment with order (arrives at lead time)
    stockWithReorder -= f.units;
    if (idx + 1 === targetItem.lead_time_days) {
      stockWithReorder += targetItem.order_qty; // Shipment arrived!
    }
    simWithReorder.push(Math.max(0, stockWithReorder));
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = elForecastCanvas.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Historical Daily Sales",
          data: historySeries,
          borderColor: "#022015",
          backgroundColor: "rgba(2, 32, 21, 0.08)",
          borderWidth: 2.5,
          tension: 0.2,
          pointRadius: 2.5,
          pointBackgroundColor: "#022015",
          pointHoverRadius: 5
        },
        {
          label: "Forecast Demand",
          data: forecastSeries,
          borderColor: "#A65600",
          backgroundColor: "transparent",
          borderWidth: 3.5,
          borderDash: [6, 4],
          tension: 0.2,
          pointRadius: 4.5,
          pointBackgroundColor: "#A65600",
          pointHoverRadius: 7
        },
        {
          label: "Uncertainty Upper Bound (+1σ)",
          data: upperSeries,
          borderColor: "rgba(166, 86, 0, 0.35)",
          borderWidth: 1,
          pointRadius: 0,
          fill: "+1",
          backgroundColor: "rgba(243, 211, 177, 0.45)"
        },
        {
          label: "Uncertainty Lower Bound (-1σ)",
          data: lowerSeries,
          borderColor: "rgba(166, 86, 0, 0.35)",
          borderWidth: 1,
          pointRadius: 0,
          fill: false
        },
        {
          label: "Stock Trajectory (No Reorder - CRASH)",
          data: simNoReorder,
          borderColor: "#872200",
          borderWidth: 2,
          borderDash: [3, 3],
          pointRadius: 3,
          pointBackgroundColor: "#872200",
          tension: 0.1
        },
        {
          label: "Stock Trajectory (Protected With Reorder)",
          data: simWithReorder,
          borderColor: "#1B5E20",
          borderWidth: 2.5,
          pointRadius: 3.5,
          pointBackgroundColor: "#1B5E20",
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 240,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          display: false // Custom styled chips used
        },
        tooltip: {
          backgroundColor: "#022015",
          titleColor: "#F3D3B1",
          bodyColor: "#FFFFFF",
          borderColor: "#A65600",
          borderWidth: 1.5,
          padding: 10,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(2, 32, 21, 0.08)"
          },
          ticks: {
            color: "#4A6256",
            maxTicksLimit: 12,
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          }
        },
        y: {
          grid: {
            color: "rgba(2, 32, 21, 0.08)"
          },
          ticks: {
            color: "#4A6256",
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          },
          title: {
            display: true,
            text: "Units (Sales & Stock)",
            color: "#022015",
            font: { size: 11, weight: "bold" }
          }
        }
      }
    }
  });
}

// ==============================================================================
// BUTTON HANDLERS (Live API Connection)
// ==============================================================================

// Trigger Festival Spike (Surprise Path: POST /api/simulate-spike)
async function handleTriggerFestival() {
  isFestivalActive = true;
  elBtnTriggerSpike.innerHTML = `[SURGE ACTIVE]`;
  elBtnTriggerSpike.style.background = `#A65600`;
  elBtnTriggerSpike.style.boxShadow = `3px 3px 0px #022015`;

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/api/simulate-spike`, { method: "POST" });
      if (res.ok) {
        console.log("Festival spike simulated via backend API");
      }
    } catch (e) {
      console.warn("POST /api/simulate-spike failed:", e);
    }
  }

  await renderApp();
}

// Announce Event 7 Days in Advance (Announcement Path: POST /api/event)
async function handleAnnounceEvent() {
  isAnnouncementActive = true;
  isFestivalActive = true;
  if (elBtnAnnounceEvent) {
    elBtnAnnounceEvent.innerHTML = `[EVENT DECLARED (3X)]`;
    elBtnAnnounceEvent.style.borderColor = "#1B5E20";
    elBtnAnnounceEvent.style.color = "#1B5E20";
  }

  if (isBackendLive) {
    try {
      const payload = {
        name: "Full Moon Festival",
        ingredient_ids: [1, 2, 3],
        multiplier: 3.0,
        start_date: "2026-11-08",
        end_date: "2026-11-15"
      };
      await fetch(`${API_BASE}/api/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("POST /api/event failed:", e);
    }
  }

  await renderApp();
}

// Reset Shop Back to Baseline (POST /api/reset)
async function handleReset() {
  isFestivalActive = false;
  isAnnouncementActive = false;
  elBtnTriggerSpike.innerHTML = `[SIMULATE SURGE]`;
  elBtnTriggerSpike.style.background = "";
  elBtnTriggerSpike.style.boxShadow = "";
  if (elBtnAnnounceEvent) {
    elBtnAnnounceEvent.innerHTML = `[ADVANCE EVENT]`;
    elBtnAnnounceEvent.style.borderColor = "";
    elBtnAnnounceEvent.style.color = "";
  }
  elBtnTriggerSpike.style.background = "";
  elBtnTriggerSpike.style.boxShadow = "";

  if (elBtnAnnounceEvent) {
    elBtnAnnounceEvent.innerHTML = `[ADVANCE EVENT]`;
    elBtnAnnounceEvent.style.borderColor = "";
    elBtnAnnounceEvent.style.color = "";
  }

  if (isBackendLive) {
    try {
      await fetch(`${API_BASE}/api/reset`, { method: "POST" });
    } catch (e) {
      console.warn("POST /api/reset failed:", e);
    }
  }

  await renderApp();
}

// ==============================================================================
// RESTOCK PANEL CONTROLLER (STAGE 2)
// ==============================================================================

let restockDebounceTimer = null;
let selectedRestockIngredient = null;

// Connect restock input and button event listeners
function initRestockPanel() {
  const input = document.getElementById("restockSearchInput");
  const btn = document.getElementById("btnConfirmRestock");
  if (input) input.addEventListener("input", handleRestockSearchInput);
  if (btn) btn.addEventListener("click", handleConfirmRestock);
  document.addEventListener("click", (e) => {
    const box = document.getElementById("restockSearchResults");
    if (box && !e.target.closest(".restock-group")) box.classList.add("hidden");
  });
}

// Debounce search input keystrokes for 300ms before calling API
function handleRestockSearchInput(event) {
  clearTimeout(restockDebounceTimer);
  const query = event.target.value.trim();
  const dropdown = document.getElementById("restockSearchResults");
  if (!query) {
    if (dropdown) dropdown.classList.add("hidden");
    return;
  }
  restockDebounceTimer = setTimeout(() => {
    executeRestockSearch(query);
  }, 300);
}

// Query search API and populate results dropdown using textContent
async function executeRestockSearch(query) {
  const dropdown = document.getElementById("restockSearchResults");
  if (!dropdown) return;
  try {
    const res = await fetch(`${API_BASE}/api/ingredients/search?q=${encodeURIComponent(query)}`);
    const results = res.ok ? await res.json() : [];
    renderSearchResults(results);
  } catch (err) {
    renderSearchResults([]);
  }
}

// Populate search dropdown using pure textContent
function renderSearchResults(results) {
  const dropdown = document.getElementById("restockSearchResults");
  if (!dropdown) return;
  dropdown.replaceChildren(); // Safe DOM clear
  dropdown.classList.remove("hidden");
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-result-empty";
    empty.textContent = "No matching ingredients found.";
    dropdown.appendChild(empty);
    return;
  }
  results.forEach((item) => {
    const row = document.createElement("div");
    row.className = "search-result-item";
    row.textContent = `${item.name} (Stock: ${item.current_stock})`;
    row.addEventListener("click", () => selectRestockIngredient(item));
    dropdown.appendChild(row);
  });
}

// Select ingredient from dropdown and display preview with textContent
function selectRestockIngredient(item) {
  selectedRestockIngredient = item;
  const input = document.getElementById("restockSearchInput");
  const preview = document.getElementById("restockSelectedPreview");
  const dropdown = document.getElementById("restockSearchResults");
  if (input) input.value = item.name;
  if (dropdown) dropdown.classList.add("hidden");
  if (preview) {
    preview.textContent = `Selected: ${item.name} (Current Stock: ${item.current_stock} units)`;
  }
}

// Render user feedback banner using textContent
function setRestockStatus(message, isError) {
  const banner = document.getElementById("restockStatusMessage");
  if (!banner) return;
  banner.textContent = message; // Never innerHTML
  banner.className = `restock-status-banner ${isError ? "error" : "success"}`;
  banner.classList.remove("hidden");
}

// Validate quantity, post purchase, and refresh ingredient cards
async function handleConfirmRestock() {
  if (!selectedRestockIngredient) {
    setRestockStatus("Please search and select an ingredient first.", true);
    return;
  }
  const qtyInput = document.getElementById("restockQuantityInput");
  const quantity = parseInt(qtyInput ? qtyInput.value : "0", 10);
  if (!quantity || quantity < 1) {
    setRestockStatus("Quantity must be an integer of at least 1.", true);
    return;
  }
  await submitPurchase(selectedRestockIngredient.id, quantity);
}

// Send POST /api/purchases and refresh dashboard on success
async function submitPurchase(ingredientId, quantity) {
  try {
    const res = await fetch(`${API_BASE}/api/purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredient_id: ingredientId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRestockStatus(data.error || "Restock failed.", true);
      return;
    }
    setRestockStatus(`Successfully restocked ${quantity} units of ${data.name}. New Stock: ${data.current_stock}.`, false);
    resetRestockForm();
    await renderApp(); // Refresh all ingredient cards and charts
  } catch (err) {
    setRestockStatus("Unable to reach backend server.", true);
  }
}

// Reset selection and inputs after successful restock
function resetRestockForm() {
  selectedRestockIngredient = null;
  const input = document.getElementById("restockSearchInput");
  const preview = document.getElementById("restockSelectedPreview");
  if (input) input.value = "";
  if (preview) preview.textContent = "";
}
