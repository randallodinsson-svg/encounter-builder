// phase59-pressure-lensing.js
// APEXCORE v4.4 — Phase 59: Systemic Pressure Lensing Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const PressureLensing = (APEX.PressureLensing = APEX.PressureLensing || {});

  const state = {
    tick: 0,
    globalCurvature: 0,
    factionLenses: [],
    coalitionLenses: []
  };

  const cfg = {
    ampThreshold: 0.65,
    invertThreshold: 0.9,
    diffuseThreshold: 0.35,
    maxCurvature: 1,
    minCurvature: -1
  };

  PressureLensing.getGlobalCurvature = function () {
    return state.globalCurvature;
  };

  PressureLensing.getFactionLenses = function () {
    return state.factionLenses;
  };

  PressureLensing.getCoalitionLenses = function () {
    return state.coalitionLenses;
  };

  PressureLensing.updateGlobalPressure = function (formations, dt) {
    state.tick++;

    const factions = formations || [];
    const coalitions = (APEX.Coalitions && APEX.Coalitions.list) || [];
    const convergence = (APEX.Convergence && APEX.Convergence.getGlobalIndex && APEX.Convergence.getGlobalIndex()) || 0;

    state.factionLenses = factions.map(f => buildFactionLens(f, convergence));
    state.coalitionLenses = coalitions.map(c => buildCoalitionLens(c, convergence));
    state.globalCurvature = computeGlobalCurvature(convergence, state.factionLenses, state.coalitionLenses);

    APEX.PressureCurvature = state.globalCurvature;
  };

  function buildFactionLens(f, convergence) {
    const trauma = clamp01(f.traumaScore || 0);
    const propaganda = avgPropaganda(f);
    const mythDensity = clamp01((f.myths && f.myths.length) ? f.myths.length / 10 : 0);
    const epochTension = clamp01(f.epochTension || 0);
    const conv = clamp01(convergence);

    let base =
      trauma * 0.3 +
      propaganda * 0.25 +
      mythDensity * 0.2 +
      epochTension * 0.25;

    base = clamp01(base);

    const mode = determineMode(base, conv);

    return {
      id: f.id,
      base,
      mode,
      factor: modeToFactor(mode)
    };
  }

  function buildCoalitionLens(c, convergence) {
    const rivalry = clamp01(c.rivalryPressure || 0);
    const conflict = clamp01(c.conflictIntensity || 0);
    const treatyStability = clamp01(c.treatyStability || 0);
    const ideologicalVariance = clamp01(c.ideologicalVariance || 0);
    const conv = clamp01(convergence);

    let base =
      rivalry * 0.3 +
      conflict * 0.3 +
      (1 - treatyStability) * 0.2 +
      ideologicalVariance * 0.2;

    base = clamp01(base);

    const mode = determineMode(base, conv);

    return {
      id: c.id,
      base,
      mode,
      factor: modeToFactor(mode)
    };
  }

  function computeGlobalCurvature(convergence, factionLenses, coalitionLenses) {
    const conv = clamp01(convergence);

    const all = [
      ...factionLenses.map(l => l.base),
      ...coalitionLenses.map(l => l.base)
    ];

    if (!all.length) return 0;

    const avg = all.reduce((s, v) => s + v, 0) / all.length;

    let curvature = (avg - 0.5) * 2; // -1 to 1
    curvature *= 0.5 + conv * 0.5;

    if (avg > cfg.invertThreshold) curvature *= -1;
    curvature = clamp(curvature, cfg.minCurvature, cfg.maxCurvature);

    return curvature;
  }

  function determineMode(base, conv) {
    if (base >= cfg.invertThreshold && conv >= cfg.ampThreshold) return "invert";
    if (base >= cfg.ampThreshold) return "amplify";
    if (base <= cfg.diffuseThreshold) return "diffuse";
    return "refract";
  }

  function modeToFactor(mode) {
    switch (mode) {
      case "amplify": return 1.5;
      case "diffuse": return 0.6;
      case "invert": return -1.0;
      case "refract": return 1.0;
      default: return 1.0;
    }
  }

  function avgPropaganda(f) {
    const layers = f.propagandaLayers || [];
    if (!layers.length) return 0;
    const sum = layers.reduce((s, l) => s + (l.intensity || 0), 0);
    return clamp01(sum / Math.max(1, layers.length));
  }

  function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  console.log("PHASE 59 — Systemic Pressure Lensing Layer online.");
})(this);
