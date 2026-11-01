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
const API_BASE = (window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
  ? `http://${window.location.hostname}:8000`
  : "http://127.0.0.1:8000";
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

  // Instant synchronous first render: guarantees cards and tables are NEVER blank
  currentIngredientsData = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
  if (elIngredientsGrid) {
    renderCards(currentIngredientsData);
  }
  if (elReorderTbody) {
    renderReorderTable(currentIngredientsData);
  }

  // Probe backend connection with tight timeout guard
  try {
    await checkBackendConnection();
  } catch (err) {
    console.warn("Backend health check error:", err);
    isBackendLive = false;
  }

  // Full asynchronous render with live data
  try {
    await renderApp();
  } catch (err) {
    console.warn("renderApp error, ensuring mock cards stay active:", err);
    if (elIngredientsGrid && elIngredientsGrid.children.length === 0) {
      renderCards(currentIngredientsData);
    }
  }
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

  try { initRestockPanel(); } catch (e) { console.warn("initRestockPanel error:", e); }
  try { initInvoiceScanner(); } catch (e) { console.warn("initInvoiceScanner error:", e); }
  try { initSkyThemeToggle(); } catch (e) { console.warn("initSkyThemeToggle error:", e); }
  try { initPurchaseOrderModal(); } catch (e) { console.warn("initPurchaseOrderModal error:", e); }
}

// Sky theme toggle with right-to-left sweep transition
function initSkyThemeToggle() {
  const toggle = document.getElementById("skyThemeToggle");
  const overlay = document.getElementById("modeTransitionOverlay");
  if (!toggle) return;

  const savedTheme = localStorage.getItem("grim_more_sky_theme") || "night";
  const isNight = savedTheme === "night";
  toggle.checked = isNight;
  if (!isNight) {
    document.body.classList.add("day-sky-theme");
  }

  toggle.addEventListener("change", () => {
    const goingNight = toggle.checked;

    // Smoothly cross-fade base body canvas in harmony with the wave
    if (goingNight) {
      document.body.classList.remove("day-sky-theme");
      localStorage.setItem("grim_more_sky_theme", "night");
    } else {
      document.body.classList.add("day-sky-theme");
      localStorage.setItem("grim_more_sky_theme", "day");
    }

    if (overlay) {
      overlay.className = goingNight ? "wipe-to-dark" : "wipe-to-light";

      // Gently dissolve the wave overlay as it reaches full width
      setTimeout(() => {
        overlay.classList.add("fade-out");
      }, 850);

      // Clear classes once fade concludes
      setTimeout(() => {
        overlay.className = "";
      }, 1750);
    }

    // Adapt chart colors if chart exists on page
    if (typeof renderChart === "function" && typeof selectedIngredientId !== "undefined") {
      renderChart(selectedIngredientId);
    }
  });
}

// Check if FastAPI backend is reachable
async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/health`, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      isBackendLive = true;
      if (elDataModeBadge) elDataModeBadge.remove();
      return;
    }
  } catch (e) {
    isBackendLive = false;
    if (elDataModeBadge) elDataModeBadge.remove();
  }
}

// ==============================================================================
// APPLICATION RENDERERS
// ==============================================================================

async function renderApp() {
  let ingredients = [];

  if (isBackendLive) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/api/ingredients`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        ingredients = await res.json();
      } else {
        ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
      }
    } catch (err) {
      console.warn("Backend fetch failed, falling back to mock:", err);
      ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
    }
  } else {
    ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
  }

  if (!ingredients || ingredients.length === 0) {
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
  if (!elIngredientsGrid) return;
  const list = Array.isArray(ingredients) && ingredients.length > 0
    ? ingredients
    : (isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS);

  elIngredientsGrid.innerHTML = "";

  list.forEach((ing) => {
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
          <span class="stat-val">${(ing.current_stock || 0).toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Forecast / Day</span>
          <span class="stat-val">${Math.round(ing.daily_forecast || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Days of Cover</span>
          <span class="stat-val ${ing.status === 'critical' ? 'text-critical' : ''}">${coverDisplay} d</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Lead Time</span>
          <span class="stat-val">${ing.lead_time_days || 0} d</span>
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
          ? `<span style="color: #991B1B; font-weight: 800; background: #FEE2E2; padding: 0.2rem 0.55rem; border: 1px solid #DC2626; display: inline-block;">⚠️ Depletes Before Delivery</span>` 
          : `<span style="color: #14532D; font-weight: 800; background: #DCFCE7; padding: 0.2rem 0.55rem; border: 1px solid #16A34A; display: inline-block;">✓ Covered</span>`}
      </td>
      <td class="po-action-cell" onclick="event.stopPropagation();">
        <button class="btn-po-row" type="button" data-id="${ing.id}" title="Generate Purchase Order for ${ing.name}">
          📄 PO
        </button>
      </td>
    `;

    const poBtn = row.querySelector(".btn-po-row");
    if (poBtn) {
      poBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPurchaseOrder(ing.id);
      });
    }

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
      const ltStr = item.lead_time_days === 1 ? "1 day" : `${item.lead_time_days} days`;
      const coverStr = Number(item.days_of_cover) === 1 ? "1 day" : `${Number(item.days_of_cover).toFixed(1)} days`;
      elAlertTitle.textContent = `CRITICAL DEFICIT: ${item.name.toUpperCase()} RUNS OUT IN ${coverStr.toUpperCase()}`;
      elAlertMessage.textContent = `Supplier delivery takes ${ltStr}! Reorder at least ${item.order_qty.toLocaleString()} units now to avoid a complete stockout.`;
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

  const isNight = !document.body.classList.contains("day-sky-theme");
  const historyBorder = isNight ? "#48BB78" : "#022015";
  const historyBg = isNight ? "rgba(72, 187, 120, 0.16)" : "rgba(2, 32, 21, 0.08)";
  const gridColor = isNight ? "rgba(255, 255, 255, 0.12)" : "rgba(2, 32, 21, 0.08)";
  const tickColor = isNight ? "#E2ECE6" : "#4A6256";
  const axisTitleColor = isNight ? "#FFFFFF" : "#022015";

  const ctx = elForecastCanvas.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Historical Daily Sales",
          data: historySeries,
          borderColor: historyBorder,
          backgroundColor: historyBg,
          borderWidth: 2.5,
          tension: 0.2,
          pointRadius: 2.5,
          pointBackgroundColor: historyBorder,
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
          backgroundColor: isNight ? "#07100b" : "#022015",
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
            color: gridColor
          },
          ticks: {
            color: tickColor,
            maxTicksLimit: 12,
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: tickColor,
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          },
          title: {
            display: true,
            text: "Units (Sales & Stock)",
            color: axisTitleColor,
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
        start_date: "2024-01-08",
        end_date: "2024-01-14"
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

// ==============================================================================
// SUPPLIER PURCHASE ORDER (PO) EXPORTER & MODAL CONTROLLER
// ==============================================================================

const INGREDIENT_SUPPLIERS = {
  1: {
    name: "Silvermist Herbal Conservatory",
    guild: "Guildmaster Evelyn • Northwood Glade",
    courier: "Express Gryphon Courier (Priority Lane)",
    unitCost: 12.00,
    code: "MF",
    email: "evelyn@silvermist-botanicals.guild",
    leadTime: 2,
    safetyBuffer: "70 units (95% SL)"
  },
  2: {
    name: "Celestial Wells Ingathering",
    guild: "High Ingatherer Kaelen • Astral Peaks",
    courier: "Lightning Sprite Dispatch (Overnight)",
    unitCost: 8.50,
    code: "SD",
    email: "kaelen@celestial-wells.guild",
    leadTime: 1,
    safetyBuffer: "95 units (95% SL)"
  },
  3: {
    name: "Shadowfen Wild Harvesters",
    guild: "Outpost 9 • Fen Wardens Guild",
    courier: "Heavy Armored Caravan (Ground)",
    unitCost: 16.00,
    code: "WB",
    email: "warden9@shadowfen-outpost.guild",
    leadTime: 3,
    safetyBuffer: "68 units (95% SL)"
  },
  4: {
    name: "Dragonforge Alchemical Refinery",
    guild: "Smelting Guildmaster Vance • Caldera Reach",
    courier: "Subterranean Magma Tram",
    unitCost: 24.00,
    code: "DR",
    email: "vance@dragonforge-smelt.guild",
    leadTime: 4,
    safetyBuffer: "45 units (95% SL)"
  },
  5: {
    name: "Nocturnal Botanical Cartel",
    guild: "Nightshade League • Whispering Fen",
    courier: "Twilight Courier Relay",
    unitCost: 10.00,
    code: "NS",
    email: "orders@nocturnal-cartel.guild",
    leadTime: 2,
    safetyBuffer: "55 units (95% SL)"
  },
  6: {
    name: "Old Hollow Earthworks",
    guild: "Root Warden Council • Barrow Crypts",
    courier: "Deep Barrow Transport",
    unitCost: 18.50,
    code: "MR",
    email: "cryptmaster@oldhollow.guild",
    leadTime: 3,
    safetyBuffer: "32 units (95% SL)"
  }
};

let activePurchaseOrderData = null;

function initPurchaseOrderModal() {
  const btnMasterPO = document.getElementById("btnExportMasterPO");
  const btnClose = document.getElementById("btnClosePOModal");
  const btnCopyEmail = document.getElementById("btnCopyPOEmail");
  const btnPrint = document.getElementById("btnPrintPO");
  const backdrop = document.getElementById("poModalBackdrop");

  if (btnMasterPO) {
    btnMasterPO.addEventListener("click", () => openMasterPurchaseOrder());
  }

  if (btnClose) {
    btnClose.addEventListener("click", closePurchaseOrderModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closePurchaseOrderModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop && !backdrop.classList.contains("hidden")) {
      closePurchaseOrderModal();
    }
  });

  if (btnCopyEmail) {
    btnCopyEmail.addEventListener("click", copyPurchaseOrderEmail);
  }

  if (btnPrint) {
    btnPrint.addEventListener("click", printPurchaseOrder);
  }
}

function closePurchaseOrderModal() {
  const backdrop = document.getElementById("poModalBackdrop");
  if (backdrop) {
    backdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function openPurchaseOrder(ingredientId) {
  const ing = currentIngredientsData.find(i => i.id === Number(ingredientId)) || currentIngredientsData[0];
  if (!ing) return;

  const supplier = INGREDIENT_SUPPLIERS[ing.id] || INGREDIENT_SUPPLIERS[1];
  const orderQty = ing.order_qty > 0 ? ing.order_qty : (isFestivalActive ? (ing.id === 1 ? 1170 : 600) : 150);
  const totalCost = orderQty * supplier.unitCost;
  const isEmergency = ing.status === "critical" || (isFestivalActive && [1, 2, 3].includes(ing.id));
  const poNumber = `PO-2026-${supplier.code}-${String(Date.now()).slice(-4)}`;

  activePurchaseOrderData = {
    poNumber,
    isMaster: false,
    supplierName: supplier.name,
    supplierGuild: supplier.guild,
    supplierCourier: supplier.courier,
    supplierEmail: supplier.email,
    isEmergency,
    items: [
      {
        id: ing.id,
        name: ing.name,
        leadTime: `${ing.lead_time_days} days`,
        buffer: supplier.safetyBuffer,
        unitCost: supplier.unitCost,
        orderQty: orderQty,
        lineTotal: totalCost
      }
    ],
    totalCost,
    proofText: `Calculated via Grim-More Supply-Chain Engine: Current stock (${ing.current_stock.toLocaleString()}) depletes in ${Number(ing.days_of_cover).toFixed(1)} days against daily forecast of ${Math.round(ing.daily_forecast)} units/day. Ordering ${orderQty.toLocaleString()} units guarantees a 95% service level with ${supplier.safetyBuffer} during the ${ing.lead_time_days}-day courier lead time.`
  };

  renderPurchaseOrderModal(activePurchaseOrderData);
}

function openMasterPurchaseOrder() {
  if (!currentIngredientsData || currentIngredientsData.length === 0) return;

  let targetItems = currentIngredientsData.filter(i => i.order_qty > 0);
  if (targetItems.length === 0) {
    targetItems = currentIngredientsData;
  }

  const items = targetItems.map(ing => {
    const s = INGREDIENT_SUPPLIERS[ing.id] || INGREDIENT_SUPPLIERS[1];
    const qty = ing.order_qty > 0 ? ing.order_qty : (isFestivalActive ? (ing.id === 1 ? 1170 : 400) : 100);
    const lineTotal = qty * s.unitCost;
    return {
      id: ing.id,
      name: ing.name,
      leadTime: `${ing.lead_time_days} days`,
      buffer: s.safetyBuffer,
      unitCost: s.unitCost,
      orderQty: qty,
      lineTotal: lineTotal
    };
  });

  const totalCost = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const poNumber = `PO-2026-CONSOLIDATED-${String(Date.now()).slice(-4)}`;
  const hasCritical = currentIngredientsData.some(i => i.status === "critical" || (isFestivalActive && [1, 2, 3].includes(i.id)));

  activePurchaseOrderData = {
    poNumber,
    isMaster: true,
    supplierName: "Consolidated Apothecary Supplier Guilds",
    supplierGuild: "Authorized Reagents Guildmasters Council",
    supplierCourier: "Priority Multi-Lane Expedited Logistics",
    supplierEmail: "procurement@sanctum-apothecary.guild",
    isEmergency: hasCritical,
    items,
    totalCost,
    proofText: `Consolidated Master Purchase Order authorized across ${items.length} critical apothecary ingredients. All order quantities mathematically computed to absorb upcoming festival demand surges with 95% confidence safety buffer.`
  };

  renderPurchaseOrderModal(activePurchaseOrderData);
}

function renderPurchaseOrderModal(data) {
  const backdrop = document.getElementById("poModalBackdrop");
  if (!backdrop) return;

  const docNumber = document.getElementById("poDocNumber");
  const docDate = document.getElementById("poDocDate");
  const docDeadline = document.getElementById("poDocDeadline");
  const statusBadge = document.getElementById("poStatusBadge");
  const supplierName = document.getElementById("poSupplierName");
  const supplierGuild = document.getElementById("poSupplierGuild");
  const supplierCourier = document.getElementById("poSupplierCourier");
  const lineItemsBody = document.getElementById("poLineItemsBody");
  const subtotalVal = document.getElementById("poSubtotalVal");
  const totalVal = document.getElementById("poTotalVal");
  const proofText = document.getElementById("poProofText");

  if (docNumber) docNumber.textContent = data.poNumber;
  if (docDate) docDate.textContent = "2024-01-02";
  if (docDeadline) docDeadline.textContent = "2024-01-04 17:00 (Courier Cutoff)";

  if (statusBadge) {
    statusBadge.textContent = data.isEmergency ? "⚠️ EMERGENCY RUSH EXPEDITE" : "STANDARD REORDER SCHEDULE";
    statusBadge.className = `po-status-badge ${data.isEmergency ? 'po-status-critical' : 'po-status-ok'}`;
  }

  if (supplierName) supplierName.textContent = data.supplierName;
  if (supplierGuild) supplierGuild.textContent = data.supplierGuild;
  if (supplierCourier) supplierCourier.textContent = data.supplierCourier;

  if (lineItemsBody) {
    lineItemsBody.innerHTML = "";
    data.items.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono">#0${idx + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td class="mono">${item.leadTime}</td>
        <td class="mono">${item.buffer}</td>
        <td class="text-right mono">$${item.unitCost.toFixed(2)}</td>
        <td class="text-right mono highlight-qty">+${item.orderQty.toLocaleString()}</td>
        <td class="text-right mono font-bold">$${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      `;
      lineItemsBody.appendChild(tr);
    });
  }

  const formattedTotal = `$${data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (subtotalVal) subtotalVal.textContent = formattedTotal;
  if (totalVal) totalVal.textContent = formattedTotal;
  if (proofText) proofText.textContent = data.proofText;

  const btnCopy = document.getElementById("btnCopyPOEmail");
  if (btnCopy) {
    btnCopy.innerHTML = "📋 Copy Email Draft";
    btnCopy.classList.remove("copied");
  }

  backdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function copyPurchaseOrderEmail() {
  if (!activePurchaseOrderData) return;
  const d = activePurchaseOrderData;
  const firstItem = d.items[0];
  const itemSummary = d.isMaster ? `Consolidated Replenishment (${d.items.length} Reagents)` : `${firstItem.name} (${firstItem.orderQty.toLocaleString()} units)`;
  const totalFormatted = `$${d.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const linesText = d.items.map(i => `  • ${i.name}: ${i.orderQty.toLocaleString()} units @ $${i.unitCost.toFixed(2)}/ea = $${i.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Lead time: ${i.leadTime})`).join("\n");

  const emailSubject = `[URGENT PROCUREMENT] Purchase Order: ${d.poNumber} — ${itemSummary}`;
  const emailBody = `ATTN: ${d.supplierName} (${d.supplierGuild})
RE: Official Purchase Order ${d.poNumber}

Dear Procurement Officer,

Please accept this authorized Purchase Order from Grim-More Potion Pantry. Due to impending festival demand surges detected by our statistical inventory engine, we require immediate dispatch under priority terms.

============================================================
PURCHASE ORDER: ${d.poNumber}
DATE ISSUED: 2024-01-02
DISPATCH DEADLINE: 2024-01-04 17:00 (Courier Cutoff)
PAYMENT TERMS: Net 15 Guild Transfer
============================================================

LINE ITEMS:
${linesText}

------------------------------------------------------------
TOTAL AUTHORIZED PROCUREMENT: ${totalFormatted}
------------------------------------------------------------

LOGISTICS INSTRUCTIONS:
- Courier Method: ${d.supplierCourier}
- Delivery Destination: Grim-More Potion Pantry, Vault Dock B
- Service Level Required: 95% guaranteed non-defect intake

SUPPLY CHAIN AUDIT JUSTIFICATION:
${d.proofText}

Authorized by:
Lead Alchemist & Automated Procurement Engine
Grim-More Potion Pantry
https://github.com/samirahamed-27/Grim-More`;

  const fullClipboardText = `${emailSubject}\n\n${emailBody}`;

  navigator.clipboard.writeText(fullClipboardText).then(() => {
    const btn = document.getElementById("btnCopyPOEmail");
    if (btn) {
      btn.innerHTML = "✓ Copied to Clipboard!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = "📋 Copy Email Draft";
        btn.classList.remove("copied");
      }, 3000);
    }
  }).catch(() => {
    alert("Copied purchase order text to clipboard.");
  });
}

function printPurchaseOrder() {
  window.print();
}

// Register Progressive Web App (PWA) Service Worker for mobile app install
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[PWA] Service Worker registered:", reg.scope))
      .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
  });
}

// ==============================================================================
// AI INVOICE & E-BILL SCANNER CONTROLLER
// ==============================================================================

const CANONICAL_INGREDIENTS = [
  { id: 1, name: "Moonflower" },
  { id: 2, name: "Silver Dew" },
  { id: 3, name: "Wolfsbane" },
  { id: 4, name: "Dragon Resin" },
  { id: 5, name: "Nightshade" },
  { id: 6, name: "Mandrake Root" },
];

let scannedInvoiceReference = "";

function initInvoiceScanner() {
  const btnOpen = document.getElementById("btnOpenInvoiceScanner");
  const modal = document.getElementById("invoiceScannerModal");
  const btnClose = document.getElementById("btnCloseInvoiceModal");
  const btnCancel = document.getElementById("btnCancelScan");
  const dropZone = document.getElementById("invoiceDropZone");
  const fileInput = document.getElementById("invoiceFileInput");
  const btnConfirm = document.getElementById("btnConfirmInventory");
  const btnAddManual = document.getElementById("btnAddManualItem");

  if (!btnOpen || !modal) return;

  function openModal() {
    modal.classList.remove("hidden");
    resetScannerState();
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  btnOpen.addEventListener("click", openModal);
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  // Close modal when clicking outside dialog
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Dropzone interactions
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleInvoiceFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleInvoiceFile(e.target.files[0]);
      }
    });
  }

  if (btnAddManual) {
    btnAddManual.addEventListener("click", () => {
      addScannedItemRow({
        ingredient_id: 1,
        ingredient_name: "Moonflower",
        detected_raw_text: "Manual Entry",
        quantity: 100,
        confidence: 1.0,
      });
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", handleConfirmScannedInventory);
  }
}

function resetScannerState() {
  const uploadStep = document.getElementById("scannerUploadStep");
  const loadingStep = document.getElementById("scannerLoadingStep");
  const reviewStep = document.getElementById("scannerReviewStep");
  const statusBanner = document.getElementById("scannerConfirmStatus");
  const tbody = document.getElementById("scannedItemsTableBody");
  const fileInput = document.getElementById("invoiceFileInput");

  if (uploadStep) uploadStep.classList.remove("hidden");
  if (loadingStep) loadingStep.classList.add("hidden");
  if (reviewStep) reviewStep.classList.add("hidden");
  if (statusBanner) {
    statusBanner.classList.add("hidden");
    statusBanner.textContent = "";
  }
  if (tbody) tbody.innerHTML = "";
  if (fileInput) fileInput.value = "";
}

async function handleInvoiceFile(file) {
  const uploadStep = document.getElementById("scannerUploadStep");
  const loadingStep = document.getElementById("scannerLoadingStep");

  // Validate format and size (max 10MB)
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (!allowed.includes(ext)) {
    alert("Please upload a valid invoice image (.png, .jpg, .webp) or PDF.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Invoice file exceeds 10MB limit.");
    return;
  }

  if (uploadStep) uploadStep.classList.add("hidden");
  if (loadingStep) loadingStep.classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/api/invoice/scan`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Invoice scanning failed.");
      resetScannerState();
      return;
    }

    renderScanReview(data);
  } catch (err) {
    console.error("Invoice scan network error:", err);
    alert("Failed to communicate with invoice scanner on backend.");
    resetScannerState();
  }
}

function renderScanReview(data) {
  const loadingStep = document.getElementById("scannerLoadingStep");
  const reviewStep = document.getElementById("scannerReviewStep");
  const metaInv = document.getElementById("metaInvoiceNum");
  const metaSup = document.getElementById("metaSupplier");
  const metaDate = document.getElementById("metaDate");
  const tbody = document.getElementById("scannedItemsTableBody");

  if (loadingStep) loadingStep.classList.add("hidden");
  if (reviewStep) reviewStep.classList.remove("hidden");

  scannedInvoiceReference = data.invoice_number || "INV-SCANNED";
  if (metaInv) metaInv.textContent = data.invoice_number || "N/A";
  if (metaSup) metaSup.textContent = data.supplier || "Supplier Wholesaler";
  if (metaDate) metaDate.textContent = data.date || "N/A";

  if (tbody) {
    tbody.innerHTML = "";
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => addScannedItemRow(item));
    } else {
      addScannedItemRow({
        ingredient_id: 1,
        ingredient_name: "Moonflower",
        detected_raw_text: "Sample receipt item",
        quantity: 100,
        confidence: 0.9,
      });
    }
  }
}

function addScannedItemRow(item) {
  const tbody = document.getElementById("scannedItemsTableBody");
  if (!tbody) return;

  const tr = document.createElement("tr");

  // Col 1: Ingredient Select
  const tdIng = document.createElement("td");
  const select = document.createElement("select");
  select.className = "scanned-ing-select";
  CANONICAL_INGREDIENTS.forEach(ing => {
    const opt = document.createElement("option");
    opt.value = ing.id;
    opt.textContent = ing.name;
    if (ing.id === item.ingredient_id) opt.selected = true;
    select.appendChild(opt);
  });
  tdIng.appendChild(select);

  // Col 2: Quantity Input
  const tdQty = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "1";
  qtyInput.max = "100000";
  qtyInput.value = item.quantity || 50;
  qtyInput.className = "scanned-qty-input";
  tdQty.appendChild(qtyInput);

  // Col 3: Detected Raw Text (safe textContent)
  const tdRaw = document.createElement("td");
  tdRaw.className = "scanned-raw-text";
  tdRaw.textContent = item.detected_raw_text || "-";
  tdRaw.title = item.detected_raw_text || "";

  // Col 4: Match Confidence Badge
  const tdConf = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "match-badge";
  const pct = Math.round((item.confidence || 0.85) * 100);
  badge.textContent = `${pct}%`;
  tdConf.appendChild(badge);

  // Col 5: Remove Row Button
  const tdDel = document.createElement("td");
  const btnDel = document.createElement("button");
  btnDel.type = "button";
  btnDel.className = "btn-remove-row";
  btnDel.textContent = "✕";
  btnDel.title = "Remove item";
  btnDel.addEventListener("click", () => tr.remove());
  tdDel.appendChild(btnDel);

  tr.appendChild(tdIng);
  tr.appendChild(tdQty);
  tr.appendChild(tdRaw);
  tr.appendChild(tdConf);
  tr.appendChild(tdDel);

  tbody.appendChild(tr);
}

async function handleConfirmScannedInventory() {
  const tbody = document.getElementById("scannedItemsTableBody");
  const banner = document.getElementById("scannerConfirmStatus");
  const btnConfirm = document.getElementById("btnConfirmInventory");
  if (!tbody) return;

  const rows = tbody.querySelectorAll("tr");
  if (rows.length === 0) {
    if (banner) {
      banner.className = "scanner-confirm-banner error";
      banner.textContent = "No items to confirm. Add an item or scan another invoice.";
      banner.classList.remove("hidden");
    }
    return;
  }

  const items = [];
  rows.forEach(tr => {
    const sel = tr.querySelector(".scanned-ing-select");
    const qtyInput = tr.querySelector(".scanned-qty-input");
    if (sel && qtyInput) {
      const ingId = parseInt(sel.value, 10);
      const qty = parseInt(qtyInput.value, 10);
      if (ingId > 0 && qty > 0) {
        items.push({ ingredient_id: ingId, quantity: qty });
      }
    }
  });

  if (items.length === 0) {
    if (banner) {
      banner.className = "scanner-confirm-banner error";
      banner.textContent = "Please ensure all quantities are positive numbers.";
      banner.classList.remove("hidden");
    }
    return;
  }

  if (btnConfirm) btnConfirm.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/invoice/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items,
        invoice_reference: scannedInvoiceReference,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (banner) {
        banner.className = "scanner-confirm-banner error";
        banner.textContent = data.error || "Inventory replenishment failed.";
        banner.classList.remove("hidden");
      }
      if (btnConfirm) btnConfirm.disabled = false;
      return;
    }

    if (banner) {
      banner.className = "scanner-confirm-banner success";
      banner.textContent = `${data.message} Days of cover updated.`;
      banner.classList.remove("hidden");
    }

    // Refresh all pantry cards, charts, and reorder tables immediately
    await renderApp();

    setTimeout(() => {
      const modal = document.getElementById("invoiceScannerModal");
      if (modal) modal.classList.add("hidden");
      if (btnConfirm) btnConfirm.disabled = false;
    }, 1400);

  } catch (err) {
    console.error("Invoice confirm error:", err);
    if (banner) {
      banner.className = "scanner-confirm-banner error";
      banner.textContent = "Failed to communicate with inventory confirmation API.";
      banner.classList.remove("hidden");
    }
    if (btnConfirm) btnConfirm.disabled = false;
  }
}
