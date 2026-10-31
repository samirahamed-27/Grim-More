/**
 * ==============================================================================
 * GRIM-MORE: THE ALCHEMIST COPILOT (frontend/copilot.js)
 * Assistant for inventory queries, full-moon simulations, and safe confirmation.
 * ==============================================================================
 */

(function () {
  "use strict";

  // Configurable base URL: reuses existing API_BASE or defaults to localhost
  const API_ROOT =
    (typeof API_BASE !== "undefined" && API_BASE)
      ? API_BASE
      : (window.API_BASE || "http://127.0.0.1:8000");

  // In-memory conversation state (never persisted across sessions, max 12 turns)
  const conversationHistory = [];
  let currentDemoDate = "2024-01-02";
  let copilotMode = "offline";
  let isOpen = false;

  // Exact Working Suggestion Chips (User requirement)
  const SUGGESTIONS = [
    { label: "🌸 Shop Status", text: "What is the status of my shop?" },
    { label: "🚨 Runout Before Friday", text: "Which ingredients will run out before Friday?" },
    { label: "📦 Courier Delay (+3d)", text: "What happens if the Wolfsbane courier is delayed by 3 days?" },
    { label: "🌕 Full Moon Festival", text: "Is there a festival coming up and when should I order?" },
    { label: "⚡ Simulate Surge", text: "Simulate a surge" },
  ];

  // Helper: Secure text escaping to prevent XSS from model or tool strings
  function escapeText(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Create DOM Elements dynamically
  function buildCopilotUI() {
    // 1. Floating Launcher Button
    const launcher = document.createElement("button");
    launcher.id = "copilotLauncherBtn";
    launcher.className = "copilot-launcher";
    launcher.setAttribute("aria-label", "Open Alchemist Copilot");
    launcher.innerHTML = `
      <span class="copilot-launcher-icon">🧙‍♂️</span>
      <span>Alchemist Copilot</span>
      <span class="copilot-launcher-badge"></span>
    `;
    launcher.addEventListener("click", togglePanel);
    document.body.appendChild(launcher);

    // 2. Chat Panel
    const panel = document.createElement("div");
    panel.id = "copilotPanel";
    panel.className = "copilot-panel";

    // Header
    const header = document.createElement("div");
    header.className = "copilot-header";
    header.innerHTML = `
      <div class="copilot-title-group">
        <span style="font-size: 18px;">🔮</span>
        <div>
          <span class="copilot-title-text">Alchemist Copilot</span>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
            <span id="copilotModeBadge" class="copilot-mode-badge offline">Offline mode</span>
            <span id="copilotDatePill" class="copilot-date-pill">Demo: 2024-01-02</span>
          </div>
        </div>
      </div>
      <button id="copilotCloseBtn" class="copilot-close-btn" aria-label="Close Chat">✕</button>
    `;

    // Suggestion Chips Bar
    const chipsBar = document.createElement("div");
    chipsBar.className = "copilot-chips-bar";
    SUGGESTIONS.forEach((sugg) => {
      const chip = document.createElement("button");
      chip.className = "copilot-chip";
      chip.textContent = sugg.label;
      chip.title = sugg.text;
      chip.addEventListener("click", () => {
        sendUserMessage(sugg.text);
      });
      chipsBar.appendChild(chip);
    });

    // Messages Container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "copilotMessages";
    messagesContainer.className = "copilot-messages";

    // Welcome message
    const welcome = document.createElement("div");
    welcome.className = "copilot-msg assistant";
    welcome.textContent =
      "Greetings, Potion Master! I am the Alchemist Copilot. Ask me about your ingredient levels, supplier lead times, astronomical full moons, or test a what-if delivery delay.";
    messagesContainer.appendChild(welcome);

    // Input Footer
    const inputArea = document.createElement("div");
    inputArea.className = "copilot-input-area";
    inputArea.innerHTML = `
      <input id="copilotInput" class="copilot-input" type="text" placeholder="Ask the Alchemist Copilot..." maxlength="500" />
      <button id="copilotSendBtn" class="copilot-send-btn" aria-label="Send Message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    `;

    panel.appendChild(header);
    panel.appendChild(chipsBar);
    panel.appendChild(messagesContainer);
    panel.appendChild(inputArea);
    document.body.appendChild(panel);

    // Attach Event Handlers
    document.getElementById("copilotCloseBtn").addEventListener("click", togglePanel);
    const input = document.getElementById("copilotInput");
    const sendBtn = document.getElementById("copilotSendBtn");

    sendBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val) {
        sendUserMessage(val);
        input.value = "";
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          sendUserMessage(val);
          input.value = "";
        }
      }
    });
  }

  // Toggle Panel open/close
  function togglePanel() {
    const panel = document.getElementById("copilotPanel");
    if (!panel) return;
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add("open");
      fetchCopilotStatus();
      const input = document.getElementById("copilotInput");
      if (input) setTimeout(() => input.focus(), 150);
    } else {
      panel.classList.remove("open");
    }
  }

  // Query /api/copilot/status
  async function fetchCopilotStatus() {
    try {
      const res = await fetch(`${API_ROOT}/api/copilot/status`);
      if (res.ok) {
        const data = await res.json();
        copilotMode = data.mode || (data.llm_available ? "llm" : "offline");
        currentDemoDate = data.demo_today || "2024-01-02";

        const badge = document.getElementById("copilotModeBadge");
        if (badge) {
          badge.className = `copilot-mode-badge ${copilotMode}`;
          badge.textContent = copilotMode === "llm" ? "● AI mode" : "● Offline mode";
        }

        const datePill = document.getElementById("copilotDatePill");
        if (datePill) {
          datePill.textContent = `Demo: ${currentDemoDate}`;
        }
      }
    } catch (err) {
      console.warn("Copilot status fetch failed:", err);
    }
  }

  // Render a message in the chat
  function appendMessage(role, text, sources = null) {
    const container = document.getElementById("copilotMessages");
    if (!container) return;

    const msgEl = document.createElement("div");
    msgEl.className = `copilot-msg ${role}`;
    msgEl.textContent = text;

    if (role === "assistant" && Array.isArray(sources) && sources.length > 0) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "copilot-sources";
      sourcesDiv.textContent = "Based on: ";
      sources.forEach((src) => {
        const tag = document.createElement("span");
        tag.className = "copilot-source-tag";
        tag.textContent = src;
        sourcesDiv.appendChild(tag);
      });
      msgEl.appendChild(sourcesDiv);
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  }

  // Render Action Confirmation Card
  function appendActionCard(actionData) {
    const container = document.getElementById("copilotMessages");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "copilot-action-card";

    const header = document.createElement("div");
    header.className = "copilot-action-header";
    header.textContent = "⚠️ Action Requires Confirmation";

    const summary = document.createElement("div");
    summary.className = "copilot-action-summary";
    summary.textContent = actionData.summary || `Execute ${actionData.tool}?`;

    const btnsDiv = document.createElement("div");
    btnsDiv.className = "copilot-action-buttons";

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "copilot-btn-confirm";
    confirmBtn.textContent = "Confirm Action";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "copilot-btn-cancel";
    cancelBtn.textContent = "Cancel";

    confirmBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      confirmBtn.textContent = "Executing...";
      await submitConfirmation(actionData.token, true, card);
    });

    cancelBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      await submitConfirmation(actionData.token, false, card);
    });

    btnsDiv.appendChild(confirmBtn);
    btnsDiv.appendChild(cancelBtn);

    card.appendChild(header);
    card.appendChild(summary);
    card.appendChild(btnsDiv);
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }

  // Submit action confirmation to backend
  async function submitConfirmation(token, approve, cardElement) {
    try {
      const res = await fetch(`${API_ROOT}/api/copilot/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, approve: approve }),
      });

      const data = await res.json();
      if (res.ok) {
        cardElement.remove();
        appendMessage("assistant", data.reply || (approve ? "Action confirmed and executed." : "Action cancelled."));
        
        // Refresh the main dashboard cards and charts immediately!
        if (approve && typeof window.renderApp === "function") {
          window.renderApp();
        }
      } else {
        appendMessage("assistant", `Error: ${data.error || "Confirmation failed"}`);
      }
    } catch (err) {
      appendMessage("assistant", `Network error during confirmation: ${err.message}`);
    }
  }

  // Send message to Copilot backend
  async function sendUserMessage(text) {
    const container = document.getElementById("copilotMessages");
    const sendBtn = document.getElementById("copilotSendBtn");
    const input = document.getElementById("copilotInput");

    // 1. Append user message
    appendMessage("user", text);
    conversationHistory.push({ role: "user", content: text });

    // Keep max 12 items in memory
    while (conversationHistory.length > 12) {
      conversationHistory.shift();
    }

    // 2. Render typing indicator
    const typing = document.createElement("div");
    typing.id = "copilotTyping";
    typing.className = "copilot-typing";
    typing.innerHTML = `
      <span class="copilot-typing-dot"></span>
      <span class="copilot-typing-dot"></span>
      <span class="copilot-typing-dot"></span>
      <span style="font-size: 11.5px; color: #7ba391; margin-left: 6px;">Alchemist is analyzing...</span>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    if (sendBtn) sendBtn.disabled = true;
    if (input) input.disabled = true;

    try {
      // Strictly enforce max 500 characters per message in outgoing payload
      const payloadMessages = conversationHistory.map((m) => ({
        role: m.role,
        content: m.content && m.content.length > 500 ? m.content.slice(0, 500) : m.content,
      }));

      const res = await fetch(`${API_ROOT}/api/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const typingEl = document.getElementById("copilotTyping");
      if (typingEl) typingEl.remove();

      if (res.ok) {
        const data = await res.json();
        copilotMode = data.mode || "offline";
        const badge = document.getElementById("copilotModeBadge");
        if (badge) {
          badge.className = `copilot-mode-badge ${copilotMode}`;
          badge.textContent = copilotMode === "llm" ? "● AI mode" : "● Offline mode";
        }

        // Append assistant reply to UI (full reply shown to user)
        appendMessage("assistant", data.reply, data.sources);

        // Cap stored history reply to 500 chars to respect conversational context limit
        const cappedReply = data.reply && data.reply.length > 500 ? data.reply.slice(0, 500) : (data.reply || "");
        conversationHistory.push({ role: "assistant", content: cappedReply });

        // If mutating action proposed, show confirmation card
        if (data.pending_action) {
          appendActionCard(data.pending_action);
        }
      } else {

        const errData = await res.json().catch(() => ({}));
        appendMessage("assistant", `I encountered an issue: ${errData.error || "Unable to reach potion intelligence."}`);
      }
    } catch (err) {
      const typingEl = document.getElementById("copilotTyping");
      if (typingEl) typingEl.remove();
      appendMessage("assistant", `Communication failure: ${err.message}. Please verify the server is running.`);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (input) {
        input.disabled = false;
        input.focus();
      }
    }
  }

  // Initialize UI on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildCopilotUI);
  } else {
    buildCopilotUI();
  }
})();

