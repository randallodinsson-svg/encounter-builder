// phase33-motive-telemetry.js
// APEXCORE v4.4 — Phase 33: Motive Telemetry Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const MotiveTelemetry = (APEX.MotiveTelemetry = APEX.MotiveTelemetry || {});

  MotiveTelemetry.state = {
    avgDominance: 0,
    avgAggression: 0,
    avgAlliance: 0,
    avgStability: 0,
    avgCuriosity: 0
  };

  function computeAverages(formations) {
    let count = 0;
    let dom = 0, agg = 0, all = 0, stab = 0, cur = 0;

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      if (!f.motives) continue;
      count++;

      dom += f.motives.dominance || 0;
      agg += f.motives.aggression || 0;
      all += f.motives.alliance || 0;
      stab += f.motives.stability || 0;
      cur += f.motives.curiosity || 0;
    }

    if (count === 0) {
      MotiveTelemetry.state.avgDominance = 0;
      MotiveTelemetry.state.avgAggression = 0;
      MotiveTelemetry.state.avgAlliance = 0;
      MotiveTelemetry.state.avgStability = 0;
      MotiveTelemetry.state.avgCuriosity = 0;
      return;
    }

    MotiveTelemetry.state.avgDominance = dom / count;
    MotiveTelemetry.state.avgAggression = agg / count;
    MotiveTelemetry.state.avgAlliance = all / count;
    MotiveTelemetry.state.avgStability = stab / count;
    MotiveTelemetry.state.avgCuriosity = cur / count;
  }

  function updateHUD() {
    const s = MotiveTelemetry.state;

    const d = document.getElementById("hud-motive-dominance");
    const a = document.getElementById("hud-motive-aggression");
    const al = document.getElementById("hud-motive-alliance");
    const st = document.getElementById("hud-motive-stability");
    const c = document.getElementById("hud-motive-curiosity");

    if (!d || !a || !al || !st || !c) return;

    const fmt = v => v.toFixed(2);

    d.textContent = "Dom: " + fmt(s.avgDominance);
    a.textContent = "Agg: " + fmt(s.avgAggression);
    al.textContent = "All: " + fmt(s.avgAlliance);
    st.textContent = "Stab: " + fmt(s.avgStability);
    c.textContent = "Cur: " + fmt(s.avgCuriosity);
  }

  MotiveTelemetry.updateGlobalMotives = function (formations, dt) {
    if (!formations || formations.length === 0) return;
    computeAverages(formations);
    updateHUD();
  };

  console.log("PHASE33_MOTIVE_TELEMETRY — online (Motive Telemetry Layer).");
})(this);
