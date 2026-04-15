// phase25-operator-dashboard.js
// APEXCORE v4.4 — Phase 25: Operator Dashboard Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Dashboard = (APEX.Dashboard = APEX.Dashboard || {});

  Dashboard.config = {
    refreshInterval: 0.2
  };

  let rootEl = null;
  let sysPanel, tensionPanel, saliencePanel;

  function createRow(label, value) {
    const row = document.createElement("div");
    row.className = "dash-row";

    const l = document.createElement("div");
    l.className = "dash-label";
    l.textContent = label;

    const v = document.createElement("div");
    v.className = "dash-value";
    v.textContent = value;

    row.appendChild(l);
    row.appendChild(v);
    return { row, v };
  }

  function initUI() {
    const overlay = document.getElementById("overlay-root");
    if (!overlay) return;

    rootEl = document.createElement("div");
    rootEl.className = "dash-root";

    // System panel
    const pSys = document.createElement("div");
    pSys.className = "dash-panel";
    const tSys = document.createElement("div");
    tSys.className = "dash-title";
    tSys.textContent = "SYSTEM OVERVIEW";
    pSys.appendChild(tSys);

    const sysRows = {};
    ["formations", "avgPressure", "avgIntegrity", "avgTension", "avgSalience"].forEach(
      (key) => {
        const label =
          key === "avgPressure" ? "Pressure" :
          key === "avgIntegrity" ? "Integrity" :
          key === "avgTension" ? "Tension" :
          key === "avgSalience" ? "Salience" :
          "Formations";
        const { row, v } = createRow(label, "--");
        sysRows[key] = v;
        pSys.appendChild(row);
      }
    );

    sysPanel = sysRows;
    rootEl.appendChild(pSys);

    // Tension panel
    const pTension = document.createElement("div");
    pTension.className = "dash-panel";
    const tTension = document.createElement("div");
    tTension.className = "dash-title";
    tTension.textContent = "NARRATIVE & LOAD";
    pTension.appendChild(tTension);

    const tRows = {};
    ["criticalCount", "highCount", "mediumCount", "lowCount"].forEach((key) => {
      const label =
        key === "criticalCount" ? "Critical" :
        key === "highCount" ? "High" :
        key === "mediumCount" ? "Medium" :
        "Low";
      const { row, v } = createRow(label, "--");
      tRows[key] = v;
      pTension.appendChild(row);
    });

    tensionPanel = tRows;
    rootEl.appendChild(pTension);

    // Salience / focus panel (simple top tier readout)
    const pSal = document.createElement("div");
    pSal.className = "dash-panel";
    const tSal = document.createElement("div");
    tSal.className = "dash-title";
    tSal.textContent = "FOCUS SNAPSHOT";
    pSal.appendChild(tSal);

    const { row: rTier, v: vTier } = createRow("Top Tier", "--");
    const { row: rTime, v: vTime } = createRow("Sim Time", "0.0s");
    pSal.appendChild(rTier);
    pSal.appendChild(rTime);

    saliencePanel = { tier: vTier, time: vTime };
    rootEl.appendChild(pSal);

    overlay.appendChild(rootEl);
  }

  function formatFloat(v) {
    return v.toFixed(2);
  }

  function findTopTier(formations) {
    if (!formations || !formations.length) return "--";
    let best = null;
    let bestScore = -Infinity;
    const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      const tier = f.salienceTier || "LOW";
      const s = f.salience != null ? f.salience : 0;
      const score = (order[tier] || 0) * 2 + s;
      if (score > bestScore) {
        bestScore = score;
        best = tier;
      }
    }
    return best || "--";
  }

  Dashboard.start = function () {
    if (rootEl) return;
    initUI();

    let lastTime = 0;
    function loop() {
      requestAnimationFrame(loop);

      if (!APEX.Telemetry || !APEX.Telemetry.lastSnapshot) return;
      const snap = APEX.Telemetry.lastSnapshot;

      const now = snap.time || 0;
      if (now - lastTime < Dashboard.config.refreshInterval) return;
      lastTime = now;

      if (sysPanel) {
        sysPanel.formations.textContent = snap.formations;
        sysPanel.avgPressure.textContent = formatFloat(snap.avgPressure || 0);
        sysPanel.avgIntegrity.textContent = formatFloat(snap.avgIntegrity || 0);
        sysPanel.avgTension.textContent = formatFloat(snap.avgTension || 0);
        sysPanel.avgSalience.textContent = formatFloat(snap.avgSalience || 0);
      }

      if (tensionPanel) {
        tensionPanel.criticalCount.textContent = snap.criticalCount || 0;
        tensionPanel.highCount.textContent = snap.highCount || 0;
        tensionPanel.mediumCount.textContent = snap.mediumCount || 0;
        tensionPanel.lowCount.textContent = snap.lowCount || 0;
      }

      if (saliencePanel) {
        const formations = (APEX.FormAI && APEX.FormAI.list) || [];
        saliencePanel.tier.textContent = findTopTier(formations);
        saliencePanel.time.textContent = formatFloat(now) + "s";
      }
    }

    loop();
  };

  // Auto‑start once DOM is ready and APEX exists
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(() => Dashboard.start(), 0);
  } else {
    window.addEventListener("DOMContentLoaded", () => Dashboard.start());
  }

  console.log("PHASE25_DASHBOARD — online (Operator Dashboard Layer).");
})(this);
