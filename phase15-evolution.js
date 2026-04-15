// phase15-evolution.js
// APEXCORE v4.4 — Phase 15: Adaptive Tactical Evolution

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Evolution = (APEX.Evolution = APEX.Evolution || {});

  Evolution.config = {
    outcomeWindow: 6.0,        // seconds of history to judge success
    mutationRate: 0.08,        // how strong each adjustment is
    minSamples: 30,            // minimum events before strong changes
    successWeight: 1.0,
    failureWeight: 1.4
  };

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  // Ensure evolution state on formation
  function ensureEvolutionState(formation) {
    if (!formation.evolution) {
      formation.evolution = {
        scoreHistory: [],   // { t, scoreDelta }
        lastScore: 0,
        samples: 0
      };
    }
  }

  // Simple “score” model:
  // lower pressure + stable formation = good
  // high pressure + collapse = bad
  function computeInstantScore(formation) {
    const mem = formation.memory || {};
    const pressure = mem.lastPressure != null ? mem.lastPressure : 0.5;
    const collapsed = formation.collapsed ? 1 : 0;
    const integrity = formation.integrity != null ? formation.integrity : 1.0;

    // base: prefer low pressure, high integrity
    let score = (1.0 - pressure) * 0.6 + integrity * 0.4;

    // penalize collapse
    if (collapsed) score -= 0.4;

    return score;
  }

  function recordOutcome(formation, dt, now) {
    ensureEvolutionState(formation);
    const evo = formation.evolution;

    const score = computeInstantScore(formation);
    const delta = score - evo.lastScore;
    evo.lastScore = score;

    evo.scoreHistory.push({ t: now, d: delta });
    evo.samples++;

    // trim old history
    const windowSize = Evolution.config.outcomeWindow;
    while (evo.scoreHistory.length && now - evo.scoreHistory[0].t > windowSize) {
      evo.scoreHistory.shift();
    }
  }

  function summarizeOutcome(formation) {
    const evo = formation.evolution;
    if (!evo || !evo.scoreHistory.length) return 0;

    let sum = 0;
    for (let i = 0; i < evo.scoreHistory.length; i++) {
      sum += evo.scoreHistory[i].d;
    }
    return sum;
  }

  // Adjust personality + strategy thresholds based on outcomes
  function applyEvolution(formation, dt) {
    if (!formation.personality) return;
    ensureEvolutionState(formation);

    const evo = formation.evolution;
    const outcome = summarizeOutcome(formation);
    const cfg = Evolution.config;

    if (evo.samples < cfg.minSamples) return;

    const p = formation.personality;
    const m = cfg.mutationRate * dt;

    if (outcome > 0) {
      // success → reinforce current style, slight sharpening
      const factor = cfg.successWeight * m;
      p.aggression = clamp01(p.aggression + (p.aggression - 0.5) * factor);
      p.cohesion = clamp01(p.cohesion + (p.cohesion - 0.5) * factor);
      p.cunning = clamp01(p.cunning + (p.cunning - 0.5) * factor);
    } else if (outcome < 0) {
      // failure → push away from current extremes
      const factor = cfg.failureWeight * m;
      p.aggression = clamp01(p.aggression - (p.aggression - 0.5) * factor);
      p.cohesion = clamp01(p.cohesion - (p.cohesion - 0.5) * factor);
      p.cunning = clamp01(p.cunning - (p.cunning - 0.5) * factor);
    }

    // light random mutation to avoid stagnation
    p.aggression = clamp01(p.aggression + (Math.random() - 0.5) * m * 0.5);
    p.cohesion   = clamp01(p.cohesion   + (Math.random() - 0.5) * m * 0.5);
    p.cunning    = clamp01(p.cunning    + (Math.random() - 0.5) * m * 0.5);
  }

  Evolution.updateFormationEvolution = (function () {
    let time = 0;
    return function (formation, dt) {
      time += dt;
      recordOutcome(formation, dt, time);
      applyEvolution(formation, dt);
    };
  })();

  console.log("PHASE15_EVOLUTION — online (Adaptive Tactical Evolution).");
})(this);
