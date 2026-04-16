// phase58-cognitive-convergence.js
// APEXCORE v4.4 — Phase 58: Cognitive Convergence Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Convergence = (APEX.Convergence = APEX.Convergence || {});

  const state = {
    tick: 0,
    globalIndex: 0,
    factionVectors: [],
    coalitionVectors: []
  };

  const cfg = {
    traumaWeight: 0.25,
    stagnationWeight: 0.15,
    propagandaWeight: 0.2,
    mythWeight: 0.15,
    rivalryWeight: 0.15,
    conflictWeight: 0.1,
    epochTensionWeight: 0.2,
    clampMin: 0,
    clampMax: 1
  };

  Convergence.getGlobalIndex = function () {
    return state.globalIndex;
  };

  Convergence.getFactionVectors = function () {
    return state.factionVectors;
  };

  Convergence.getCoalitionVectors = function () {
    return state.coalitionVectors;
  };

  Convergence.updateGlobalConvergence = function (formations, dt) {
    state.tick++;

    const factions = formations || [];
    const coalitions = (APEX.Coalitions && APEX.Coalitions.list) || [];

    state.factionVectors = factions.map(buildFactionVector);
    state.coalitionVectors = coalitions.map(buildCoalitionVector);

    state.globalIndex = computeGlobalIndex(
      state.factionVectors,
      state.coalitionVectors
    );

    // Optional: expose to other systems
    APEX.ConvergenceIndex = state.globalIndex;

    // Debug log (can be muted later)
    // console.log("PHASE 58 — Convergence index:", state.globalIndex.toFixed(3));
  };

  function buildFactionVector(f) {
    const trauma = clamp01(f.traumaScore || 0);
    const stagnation = clamp01(f.stagnationScore || 0);
    const propaganda = clamp01(sumPropaganda(f));
    const mythDensity = clamp01((f.myths && f.myths.length) ? f.myths.length / 10 : 0);
    const rivalry = clamp01(f.rivalryPressure || 0);
    const conflict = clamp01(f.conflictPressure || 0);
    const epochTension = clamp01(f.epochTension || 0);

    const value =
      trauma * cfg.traumaWeight +
      stagnation * cfg.stagnationWeight +
      propaganda * cfg.propagandaWeight +
      mythDensity * cfg.mythWeight +
      rivalry * cfg.rivalryWeight +
      conflict * cfg.conflictWeight +
      epochTension * cfg.epochTensionWeight;

    return {
      id: f.id,
      value: clamp01(value),
      trauma,
      stagnation,
      propaganda,
      mythDensity,
      rivalry,
      conflict,
      epochTension
    };
  }

  function buildCoalitionVector(c) {
    const ideologicalVariance = clamp01(c.ideologicalVariance || 0);
    const mythCoherence = clamp01(c.mythCoherence || 0);
    const rivalry = clamp01(c.rivalryPressure || 0);
    const conflict = clamp01(c.conflictIntensity || 0);
    const treatyStability = clamp01(c.treatyStability || 0);
    const epochTension = clamp01(c.epochTension || 0);

    const value = clamp01(
      ideologicalVariance * 0.2 +
      (1 - mythCoherence) * 0.15 +
      rivalry * 0.2 +
      conflict * 0.2 +
      (1 - treatyStability) * 0.15 +
      epochTension * 0.2
    );

    return {
      id: c.id,
      value,
      ideologicalVariance,
      mythCoherence,
      rivalry,
      conflict,
      treatyStability,
      epochTension
    };
  }

  function computeGlobalIndex(factionVectors, coalitionVectors) {
    const all = [
      ...factionVectors.map(v => v.value),
      ...coalitionVectors.map(v => v.value)
    ];
    if (!all.length) return 0;
    const sum = all.reduce((s, v) => s + v, 0);
    return clamp01(sum / all.length);
  }

  function sumPropaganda(f) {
    const layers = f.propagandaLayers || [];
    if (!layers.length) return 0;
    const sum = layers.reduce((s, l) => s + (l.intensity || 0), 0);
    return sum / Math.max(1, layers.length);
  }

  function clamp01(v) {
    if (v < cfg.clampMin) return cfg.clampMin;
    if (v > cfg.clampMax) return cfg.clampMax;
    return v;
  }

  console.log("PHASE 58 — Cognitive Convergence Layer online.");
})(this);
