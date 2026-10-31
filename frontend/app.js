/**
 * ==============================================================================
 * GRIM-MORE — FRONTEND CONTROLLER (PERSON C - THE FACE)
 * Implements Phase 1 (Mock Data & Chart) + Phase 2 (Seamless Live API Connector)
 * ==============================================================================
 */

// Global API Endpoint Configuration
const API_BASE = "http://127.0.0.1:8000";
let isBackendLive = false;
let isFestivalActive = false;
let selectedIngredientId = 1; // Default to Moonflower (ID: 1)
let chartInstance = null;

// ==============================================================================
// CONTRACT MOCK DATA (Phase 1 Baseline & Spiked States)
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
  { id: 2, name: "Silver Dew", current_stock: 500, lead_time_days: 3, daily_forecast: 200, days_of_cover: 2.5, status: "watch", order_qty: 730, priority: "medium" },
  { id: 3, name: "Wolfsbane", current_stock: 150, lead_time_days: 1, daily_forecast: 50, days_of_cover: 3.0, status: "ok", order_qty: 60, priority: "low" },
  { id: 4, name: "Dragon Resin", current_stock: 320, lead_time_days: 4, daily_forecast: 80, days_of_cover: 4.0, status: "ok", order_qty: 265, priority: "low" },
  { id: 5, name: "Nightshade", current_stock: 360, lead_time_days: 2, daily_forecast: 120, days_of_cover: 3.0, status: "ok", order_qty: 280, priority: "low" },
  { id: 6, name: "Mandrake Root", current_stock: 240, lead_time_days: 3, daily_forecast: 60, days_of_cover: 4.0, status: "ok", order_qty: 140, priority: "low" }
];

// Festival Spiked state (IDs 1, 2, 3 demand tripled!)
const MOCK_SPIKED_INGREDIENTS = [
  { id: 1, name: "Moonflower", current_stock: 400, lead_time_days: 2, daily_forecast: 300, days_of_cover: 1.3, status: "critical", order_qty: 1170, priority: "high" },
  { id: 2, name: "Silver Dew", current_stock: 500, lead_time_days: 3, daily_forecast: 600, days_of_cover: 0.8, status: "critical", order_qty: 3250, priority: "high" },
  { id: 3, name: "Wolfsbane", current_stock: 150, lead_time_days: 1, daily_forecast: 150, days_of_cover: 1.0, status: "critical", order_qty: 480, priority: "high" },
  { id: 4, name: "Dragon Resin", current_stock: 320, lead_time_days: 4, daily_forecast: 80, days_of_cover: 4.0, status: "ok", order_qty: 265, priority: "low" },
  { id: 5, name: "Nightshade", current_stock: 360, lead_time_days: 2, daily_forecast: 120, days_of_cover: 3.0, status: "ok", order_qty: 280, priority: "low" },
  { id: 6, name: "Mandrake Root", current_stock: 240, lead_time_days: 3, daily_forecast: 60, days_of_cover: 4.0, status: "ok", order_qty: 140, priority: "low" }
];

// Helper to generate 30 days history + 7 days forecast
function generateMockHistoryAndForecast(ingredientId, spiked) {
  const baseAvg = ingredientId === 1 ? 100 : ingredientId === 2 ? 200 : ingredientId === 3 ? 50 : 80;
  const history = [];
  const forecast = [];
  
  // 30 days past history
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const noise = (Math.random() - 0.5) * (baseAvg * 0.15);
    history.push({
      date: dateStr,
      units: Math.max(10, Math.round(baseAvg + noise))
    });
  }

  // 7 days forecast
  const multiplier = (spiked && [1, 2, 3].includes(ingredientId)) ? 3.0 : 1.0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const expected = Math.round(baseAvg * multiplier);
    forecast.push({
      date: dateStr,
      units: expected,
      lower: Math.round(expected * 0.9),
      upper: Math.round(expected * 1.1)
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
const elBtnTriggerSpike = document.getElementById("btnTriggerSpike");
const elBtnReset = document.getElementById("btnReset");
const elDataModeBadge = document.getElementById("dataModeBadge");
const elDataModeText = document.getElementById("dataModeText");
const elForecastCanvas = document.getElementById("forecastChart");

// ==============================================================================
// INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await checkBackendConnection();
  renderApp();
});

function setupEventListeners() {
  elBtnTriggerSpike.addEventListener("click", handleTriggerFestival);
  elBtnReset.addEventListener("click", handleReset);
}

// Check if FastAPI backend is running
async function checkBackendConnection() {
  try {
    const res = await fetch(`${API_BASE}/api/ingredients`, { method: "GET", headers: { "Accept": "application/json" } });
    if (res.ok) {
      isBackendLive = true;
      elDataModeBadge.innerHTML = `<span class="status-dot live-dot"></span><span>Live Backend (FastAPI)</span>`;
      return;
    }
  } catch (e) {
    // Backend offline; default to Mock Data Mode
    isBackendLive = false;
    elDataModeBadge.innerHTML = `<span class="status-dot mock-dot"></span><span>Mock Data Mode</span>`;
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
      ingredients = await res.json();
    } catch (err) {
      console.warn("Backend fetch failed, falling back to mock:", err);
      ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
    }
  } else {
    ingredients = isFestivalActive ? MOCK_SPIKED_INGREDIENTS : MOCK_BASELINE_INGREDIENTS;
  }

  renderCards(ingredients);
  renderReorderTable(ingredients);
  renderAlertBanner(ingredients);
  renderChart(selectedIngredientId);
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

    card.addEventListener("click", () => {
      selectedIngredientId = ing.id;
      document.querySelectorAll(".ingredient-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      renderChart(ing.id);
    });

    elIngredientsGrid.appendChild(card);
  });
}

// Render Reorders Table (Urgency Sorted)
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
          ? `<span style="color: #ff7675; font-weight: 700;">⚠️ Depletes Before Delivery</span>` 
          : `<span style="color: #2ecc71;">✓ Covered</span>`}
      </td>
    `;
    elReordersTableBody.appendChild(row);
  });
}

// Render Top Alert Banner
function renderAlertBanner(ingredients) {
  const criticalItems = ingredients.filter(i => i.status === "critical");
  if (criticalItems.length > 0) {
    const item = criticalItems[0];
    elAlertTitle.textContent = `CRITICAL DEFICIT: ${item.name.toUpperCase()} RUNS OUT IN ${Number(item.days_of_cover).toFixed(1)} DAYS`;
    elAlertMessage.textContent = `Supplier delivery takes ${item.lead_time_days} days! Reorder at least ${item.order_qty.toLocaleString()} units now to avoid an inventory blackout.`;
    elAlertBanner.classList.remove("hidden");
  } else {
    elAlertBanner.classList.add("hidden");
  }
}

// Render Chart.js Forecast Line Chart
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
      console.warn("API forecast fetch failed, using mock:", e);
    }
  }

  // Fallback to mock data generator
  if (historyData.length === 0) {
    const mockRes = generateMockHistoryAndForecast(ingredientId, isFestivalActive);
    historyData = mockRes.history;
    forecastData = mockRes.forecast;
    const ingObj = MOCK_BASELINE_INGREDIENTS.find(i => i.id === ingredientId);
    ingName = ingObj ? ingObj.name : "Ingredient";
  }

  const icon = INGREDIENT_ICONS[ingredientId] || "🌿";
  elChartTitle.textContent = `Demand Trajectory: ${ingName} (${icon})`;

  // Assemble labels & continuous line series
  const labels = [
    ...historyData.map(h => h.date.slice(5)), // MM-DD
    ...forecastData.map(f => f.date.slice(5))
  ];

  // History dataset: values for history, nulls for forecast
  const historySeries = [
    ...historyData.map(h => h.units),
    ...forecastData.map(() => null)
  ];

  // Forecast dataset: connects from the last history point
  const lastHistoryPoint = historyData[historyData.length - 1].units;
  const forecastSeries = [
    ...historyData.slice(0, -1).map(() => null),
    lastHistoryPoint,
    ...forecastData.map(f => f.units)
  ];

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
          borderColor: "#bd0000",
          backgroundColor: "rgba(132, 0, 0, 0.2)",
          borderWidth: 2.5,
          tension: 0.2,
          pointRadius: 2.5,
          pointBackgroundColor: "#840000",
          pointHoverRadius: 5
        },
        {
          label: "Projected Festival Demand",
          data: forecastSeries,
          borderColor: "#ff0000",
          backgroundColor: "rgba(255, 0, 0, 0.22)",
          borderWidth: 3.5,
          borderDash: [6, 4],
          tension: 0.2,
          pointRadius: 4.5,
          pointBackgroundColor: "#ff0000",
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          display: false // Custom styled chips used
        },
        tooltip: {
          backgroundColor: "#0c0202",
          titleColor: "#ff4d4d",
          bodyColor: "#ffffff",
          borderColor: "#840000",
          borderWidth: 1.5,
          padding: 10,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(132, 0, 0, 0.18)"
          },
          ticks: {
            color: "#b09ba0",
            maxTicksLimit: 12,
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          }
        },
        y: {
          grid: {
            color: "rgba(132, 0, 0, 0.18)"
          },
          ticks: {
            color: "#b09ba0",
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          },
          title: {
            display: true,
            text: "Units Sold / Day",
            color: "#b09ba0",
            font: { size: 11 }
          }
        }
      }
    }
  });
}

// ==============================================================================
// BUTTON HANDLERS (Simulate Spike & Reset)
// ==============================================================================

async function handleTriggerFestival() {
  isFestivalActive = true;
  elBtnTriggerSpike.innerHTML = `🌕 Festival Active!`;
  elBtnTriggerSpike.style.background = `linear-gradient(135deg, #ff0000, #840000)`;
  elBtnTriggerSpike.style.boxShadow = `0 0 25px rgba(255, 0, 0, 0.8)`;

  if (isBackendLive) {
    try {
      await fetch(`${API_BASE}/api/simulate-spike`, { method: "POST" });
    } catch (e) {
      console.warn("POST /api/simulate-spike failed, using mock:", e);
    }
  }

  await renderApp();
}

async function handleReset() {
  isFestivalActive = false;
  elBtnTriggerSpike.innerHTML = `🌕 Trigger Full Moon Festival`;
  elBtnTriggerSpike.style.background = "";

  if (isBackendLive) {
    try {
      await fetch(`${API_BASE}/api/reset`, { method: "POST" });
    } catch (e) {
      console.warn("POST /api/reset failed, using mock:", e);
    }
  }

  await renderApp();
}

