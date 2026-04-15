// phase37-coalition-rivalry.js
// APEXCORE v4.4 — Phase 37: Coalition Rivalry Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalRivalry = (APEX.CoalRivalry = APEX.CoalRivalry || {});

  CoalRivalry.state = {
    rivalries: [] // entries: { aId, bId, tension }
  };

  CoalRivalry.config = {
    baseIncrease: 0.15,
    baseDecay: 0.05,
    maxTension: 1.0,
    minTension: 0.0
  };

  function keyFor(aId, bId) {
    return aId < bId ? aId + "|" + bId : bId + "|" + aId;
  }

  function ensureRivalry(aId, bId) {
    const k = keyFor(aId, bId);
    let r = CoalRivalry.state.rivalries.find(x => x.key === k);
    if (!r) {
      r = { key: k, aId, bId, tension: 0 };
      CoalRivalry.state.rivalries.push(r);
    }
    return r;
  }

  function computePairTension(cA, cB) {
    if (!cA.motives || !cB.motives) return 0;

    const domAggA = (cA.motives.dominance + cA.motives.aggression) * 0.5;
    const domAggB = (cB.motives.dominance + cB.motives.aggression) * 0.5;

    const stabAllA = (cA.motives.stability + cA.motives.alliance) * 0.5;
    const stabAllB = (cB.motives.stability + cB.motives.alliance) * 0.5;

    const offensiveBias =
      (cA.posture === "offensive" ? 0.2 : 0) +
      (cB.posture === "offensive" ? 0.2 : 0);

    const aggressionComponent = (domAggA + domAggB) * 0.5;
    const stabilityComponent = (stabAllA + stabAllB) * 0.5;

    let tension = aggressionComponent - stabilityComponent + offensiveBias;
    if (tension < 0) tension = 0;
    if (tension > 1) tension = 1;
    return tension;
  }

  function updateRivalries(intel, dt) {
    const cfg = CoalRivalry.config;
    const rivals = CoalRivalry.state.rivalries;

    for (let i = 0; i < intel.length; i++) {
      for (let j = i + 1; j < intel.length; j++) {
        const cA = intel[i];
        const cB = intel[j];
        const r = ensureRivalry(cA.id, cB.id);

        const target = computePairTension(cA, cB);
        const delta = target > r.tension ? cfg.baseIncrease : -cfg.baseDecay;
        r.tension += delta * dt;
        if (r.tension < cfg.minTension) r.tension = cfg.minTension;
        if (r.tension > cfg.maxTension) r.tension = cfg.maxTension;
      }
    }

    // prune rivalries whose coalitions no longer exist
    for (let i = rivals.length - 1; i >= 0; i--) {
      const r = rivals[i];
      if (!intel.find(c => c.id === r.aId) || !intel.find(c => c.id === r.bId)) {
        rivals.splice(i, 1);
      }
    }
  }

  function updateHUD() {
    const rivals = CoalRivalry.state.rivalries;
    if (!rivals.length) {
      const elMax = document.getElementById("hud-rival-max");
      const elAvg = document.getElementById("hud-rival-avg");
      if (elMax) elMax.textContent = "Max: --";
      if (elAvg) elAvg.textContent = "Avg: --";
      return;
    }

    let max = 0;
    let sum = 0;

    for (let i = 0; i < rivals.length; i++) {
      const t = rivals[i].tension;
      if (t > max) max = t;
      sum += t;
    }

    const avg = sum / rivals.length;

    const elMax = document.getElementById("hud-rival-max");
    const elAvg = document.getElementById("hud-rival-avg");
    if (elMax) elMax.textContent = "Max: " + max.toFixed(2);
    if (elAvg) elAvg.textContent = "Avg: " + avg.toFixed(2);
  }

  CoalRivalry.updateGlobalCoalitionRivalry = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) {
      updateHUD();
      return;
    }

    updateRivalries(intel, dt);
    updateHUD();
  };

  console.log("PHASE37_COALRIVALRY — online (Coalition Rivalry Layer).");
})(this);
