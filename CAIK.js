// CAIK.js
// VECTORCORE — Tier‑4 Command Intelligence + HUD Expansion
// Full delete‑and‑replace version

(function () {
  "use strict";

  // -----------------------------
  // 1. Core CAIK Namespace
  // -----------------------------
  const CAIK = {
    version: "4.1.0",
    initialized: false,
    lastTickTime: null,
    lastSnapshot: null,

    // Smoothed metrics for HUD
    metrics: {
      tickMs: 0,
      loadPct: 0,
      risk: 0,
      confidence: 1,
      changeRate: 0,
      agentCount: 0,
      formation: "SWARM",
    },

    // HUD element references
    hud: {
      formationEl: null,
      agentsEl: null,
      loadTextEl: null,
      loadBarEl: null,
      riskEl: null,
      confidenceEl: null,
      statusEl: null,
    },
  };

  // -----------------------------
  // 2. Utility Helpers
  // -----------------------------
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function safeGet(obj, path, fallback = null) {
    const parts = path.split(".");
    let cur = obj;
    for (let p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) return fallback;
      cur = cur[p];
    }
    return cur;
  }

  // -----------------------------
  // 3. HUD DOM Binding
  // -----------------------------
  function bindHUD() {
    // These are intentionally generic and non‑destructive.
    // You can wire your HTML to these via data attributes.
    CAIK.hud.formationEl = document.querySelector('[data-hud="formation"]');
    CAIK.hud.agentsEl = document.querySelector('[data-hud="agents"]');
    CAIK.hud.loadTextEl = document.querySelector('[data-hud="load-text"]');
    CAIK.hud.loadBarEl = document.querySelector('[data-hud="load-bar"]');
    CAIK.hud.riskEl = document.querySelector('[data-hud="risk"]');
    CAIK.hud.confidenceEl = document.querySelector('[data-hud="confidence"]');
    CAIK.hud.statusEl = document.querySelector('[data-hud="command-status"]');
  }

  function renderHUD() {
    const m = CAIK.metrics;

    if (CAIK.hud.formationEl) {
      CAIK.hud.formationEl.textContent = m.formation;
    }

    if (CAIK.hud.agentsEl) {
      CAIK.hud.agentsEl.textContent = String(m.agentCount);
    }

    if (CAIK.hud.loadTextEl) {
      CAIK.hud.loadTextEl.textContent = `${m.loadPct.toFixed(0)}%`;
    }

    if (CAIK.hud.loadBarEl) {
      CAIK.hud.loadBarEl.style.width = `${m.loadPct.toFixed(0)}%`;
    }

    if (CAIK.hud.riskEl) {
      CAIK.hud.riskEl.textContent = `${(m.risk * 100).toFixed(0)}%`;
    }

    if (CAIK.hud.confidenceEl) {
      CAIK.hud.confidenceEl.textContent = `${(m.confidence * 100).toFixed(0)}%`;
    }

    if (CAIK.hud.statusEl) {
      let status;
      if (m.risk < 0.25) status = "STABLE";
      else if (m.risk < 0.6) status = "ELEVATED";
      else status = "CRITICAL";
      CAIK.hud.statusEl.textContent = `COMMAND STATE: ${status}`;
    }
  }

  // -----------------------------
  // 4. Metric Extraction from Registry Snapshot
  // -----------------------------
  function updateMetricsFromSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    // Tick duration
    const tickMs = safeGet(snapshot, "profiler.lastTickDuration", 0);
    // Registry change rate (from last timeline event)
    const events = safeGet(snapshot, "timeline.events", []);
    let lastChanged = 0;
    if (Array.isArray(events) && events.length > 0) {
      const last = events[events.length - 1];
      lastChanged = safeGet(last, "registry.changed", 0);
    }

    // Agent count + formation (for now, static SWARM)
    const agentCount = safeGet(snapshot, "halo.agentCount", 0);
    const formation = "SWARM"; // hook for future dynamic formation logic

    // Compute load as % of a soft budget (e.g., 4ms)
    const budgetMs = 4.0;
    const rawLoad = budgetMs > 0 ? tickMs / budgetMs : 0;
    const loadPct = clamp(rawLoad * 100, 0, 100);

    // Risk: blend of load + change rate
    const normChange = clamp(lastChanged / 64, 0, 1); // heuristic
    const rawRisk = clamp(rawLoad * 0.6 + normChange * 0.4, 0, 1);

    // Confidence: inverse of risk, smoothed
    const targetConfidence = 1 - rawRisk;

    // Smooth transitions
    const smoothFactor = 0.25;

    CAIK.metrics.tickMs = lerp(CAIK.metrics.tickMs, tickMs, smoothFactor);
    CAIK.metrics.loadPct = lerp(CAIK.metrics.loadPct, loadPct, smoothFactor);
    CAIK.metrics.risk = lerp(CAIK.metrics.risk, rawRisk, smoothFactor);
    CAIK.metrics.confidence = lerp(
      CAIK.metrics.confidence,
      targetConfidence,
      smoothFactor
    );
    CAIK.metrics.changeRate = lerp(
      CAIK.metrics.changeRate,
      normChange,
      smoothFactor
    );
    CAIK.metrics.agentCount = agentCount;
    CAIK.metrics.formation = formation;
  }

  // -----------------------------
  // 5. Public API — Tick Hook
  // -----------------------------
  function tick(snapshot) {
    CAIK.lastSnapshot = snapshot || CAIK.lastSnapshot;
    if (!CAIK.lastSnapshot) return;

    updateMetricsFromSnapshot(CAIK.lastSnapshot);
    renderHUD();
  }

  // -----------------------------
  // 6. Initialization
  // -----------------------------
  function init() {
    if (CAIK.initialized) return;
    CAIK.initialized = true;

    bindHUD();

    // Optional: passive polling mode if no explicit tick wiring exists.
    // You can remove this if you wire CAIK.tick(...) from your engine.
    let lastPoll = 0;
    const POLL_INTERVAL_MS = 200;

    function loop(ts) {
      if (!CAIK.initialized) return;
      if (!lastPoll || ts - lastPoll >= POLL_INTERVAL_MS) {
        lastPoll = ts;

        // If your engine exposes a global registry snapshot, wire it here.
        // Example (you can adapt this to your actual debug object):
        const globalSnapshot =
          window.__APEXCORE_REGISTRY__ ||
          window.__APEXCORE_DEBUG_STATE__ ||
          null;

        if (globalSnapshot) {
          tick(globalSnapshot);
        } else {
          // Still render HUD with last known metrics
          renderHUD();
        }
      }
      window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);
  }

  // -----------------------------
  // 7. Expose Global
  // -----------------------------
  CAIK.init = init;
  CAIK.tick = tick;

  // Attach to window
  window.CAIK = CAIK;

  // Auto‑init after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
