// phase38-coalition-conflict.js
// APEXCORE v4.4 — Phase 38: Coalition Conflict Engine (Assertive Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalConflict = (APEX.CoalConflict = APEX.CoalConflict || {});

  CoalConflict.state = {
    conflicts: [] // { key, aId, bId, level }
  };

  CoalConflict.config = {
    escalationRate: 0.25,
    decayRate: 0.08,
    maxLevel: 1.0,
    minLevel: 0.0,
    rivalryThreshold: 0.3,
    dominanceBias: 0.2
  };

  function keyFor(aId, bId) {
    return aId < bId ? aId + "|" + bId : bId + "|" + aId;
  }

  function ensureConflict(aId, bId) {
    const k = keyFor(aId, bId);
    let c = CoalConflict.state.conflicts.find(x => x.key === k);
    if (!c) {
      c = { key: k, aId, bId, level: 0 };
      CoalConflict.state.conflicts.push(c);
    }
    return c;
  }

  function computeConflictTarget(cA, cB, rivalry, cfg) {
    if (!cA.motives || !cB.motives) return 0;

    const domA = cA.motives.dominance || 0;
    const domB = cB.motives.dominance || 0;
    const aggA = cA.motives.aggression || 0;
    const aggB = cB.motives.aggression || 0;

    const offensiveBias =
      (cA.posture === "offensive" ? 0.2 : 0) +
      (cB.posture === "offensive" ? 0.1 : 0);

    const dominanceDiff = Math.abs(domA - domB);
    const aggressionAvg = (aggA + aggB) * 0.5;

    let target =
      rivalry * 0.5 +
      aggressionAvg * 0.3 +
      dominanceDiff * cfg.dominanceBias +
      offensiveBias;

    if (target < 0) target = 0;
    if (target > 1) target = 1;
    return target;
  }

  function findRivalryForPair(aId, bId) {
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return 0;
    const rivals = APEX.CoalRivalry.state.rivalries || [];
    const k = keyFor(aId, bId);
    const r = rivals.find(x => x.key === k);
    return r ? r.tension : 0;
  }

  function updateConflicts(intel, dt) {
    const cfg = CoalConflict.config;
    const conflicts = CoalConflict.state.conflicts;

    for (let i = 0; i < intel.length; i++) {
      for (let j = i + 1; j < intel.length; j++) {
        const cA = intel[i];
        const cB = intel[j];
        const rivalry = findRivalryForPair(cA.id, cB.id);

        const conflict = ensureConflict(cA.id, cB.id);
        const target = computeConflictTarget(cA, cB, rivalry, cfg);

        const delta = target > conflict.level ? cfg.escalationRate : -cfg.decayRate;
        conflict.level += delta * dt;

        if (conflict.level < cfg.minLevel) conflict.level = cfg.minLevel;
        if (conflict.level > cfg.maxLevel) conflict.level = cfg.maxLevel;
      }
    }

    // prune conflicts whose coalitions no longer exist
    for (let i = conflicts.length - 1; i >= 0; i--) {
      const c = conflicts[i];
      if (!intel.find(x => x.id === c.aId) || !intel.find(x => x.id === c.bId)) {
        conflicts.splice(i, 1);
      }
    }
  }

  function injectConflictInfluence(intel, formations, dt) {
    const cfg = CoalConflict.config;
    const conflicts = CoalConflict.state.conflicts;

    for (let i = 0; i < conflicts.length; i++) {
      const c = conflicts[i];
      if (c.level <= 0) continue;

      const cA = intel.find(x => x.id === c.aId);
      const cB = intel.find(x => x.id === c.bId);
      if (!cA || !cB) continue;

      const strongA = (cA.strength || 0) >= (cB.strength || 0);
      const attacker = strongA ? cA : cB;
      const defender = strongA ? cB : cA;

      const attackWeight = 0.4 + c.level * 0.6;
      const defendWeight = 0.2 + c.level * 0.4;

      // attacker pushes aggressive behavior
      for (let j = 0; j < attacker.members.length; j++) {
        const id = attacker.members[j];
        const f = formations.find(x => x.id === id);
        if (!f) continue;
        if (!f.pendingCommands) f.pendingCommands = [];

        f.pendingCommands.push({
          type: "SEEK_PRESSURE",
          weight: attackWeight,
          source: "coalition-conflict"
        });
        f.pendingCommands.push({
          type: "FORM_UP",
          weight: attackWeight * 0.7,
          source: "coalition-conflict"
        });
      }

      // defender chooses between holding or avoiding
      for (let j = 0; j < defender.members.length; j++) {
        const id = defender.members[j];
        const f = formations.find(x => x.id === id);
        if (!f) continue;
        if (!f.pendingCommands) f.pendingCommands = [];

        const defensiveBias = (defender.motives && defender.motives.stability || 0);
        const avoid = defensiveBias > 0.5;

        if (avoid) {
          f.pendingCommands.push({
            type: "AVOID_RIVAL",
            weight: defendWeight,
            source: "coalition-conflict"
          });
        } else {
          f.pendingCommands.push({
            type: "HOLD_LINE",
            weight: defendWeight,
            source: "coalition-conflict"
          });
        }
      }
    }
  }

  function updateHUD() {
    const conflicts = CoalConflict.state.conflicts;
    const elMax = document.getElementById("hud-conf-max");
    const elAvg = document.getElementById("hud-conf-avg");

    if (!elMax || !elAvg) return;

    if (!conflicts.length) {
      elMax.textContent = "Max: --";
      elAvg.textContent = "Avg: --";
      return;
    }

    let max = 0;
    let sum = 0;

    for (let i = 0; i < conflicts.length; i++) {
      const lvl = conflicts[i].level;
      if (lvl > max) max = lvl;
      sum += lvl;
    }

    const avg = sum / conflicts.length;

    elMax.textContent = "Max: " + max.toFixed(2);
    elAvg.textContent = "Avg: " + avg.toFixed(2);
  }

  CoalConflict.updateGlobalCoalitionConflict = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) {
      updateHUD();
      return;
    }

    updateConflicts(intel, dt);
    injectConflictInfluence(intel, formations, dt);
    updateHUD();
  };

  console.log("PHASE38_COALCONFLICT — online (Coalition Conflict Engine, Assertive Mode).");
})(this);
