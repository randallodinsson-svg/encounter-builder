// phase60-threshold-breaker.js
// APEXCORE v4.4 — Phase 60: Systemic Threshold Breaker Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Thresholds = (APEX.Thresholds = APEX.Thresholds || {});

  const state = {
    tick: 0,
    factionStates: {},
    coalitionStates: {},
    globalState: "stable"
  };

  const cfg = {
    faction: {
      trauma: 0.7,
      propaganda: 0.75,
      myth: 0.6,
      convergence: 0.8,
      stagnation: 0.65
    },
    coalition: {
      rivalry: 0.7,
      conflict: 0.75,
      treatyBreak: 0.4,
      ideologyVariance: 0.65,
      epochTension: 0.8
    },
    global: {
      cascade: 0.75,
      rupture: 0.9,
      inversion: 0.95
    }
  };

  Thresholds.getFactionStates = () => state.factionStates;
  Thresholds.getCoalitionStates = () => state.coalitionStates;
  Thresholds.getGlobalState = () => state.globalState;

  Thresholds.updateGlobalThresholds = function (formations, dt) {
    state.tick++;

    const factions = formations || [];
    const coalitions = (APEX.Coalitions && APEX.Coalitions.list) || [];
    const convergence = (APEX.Convergence && APEX.Convergence.getGlobalIndex && APEX.Convergence.getGlobalIndex()) || 0;
    const curvature = APEX.PressureCurvature || 0;

    factions.forEach(f => updateFactionThresholds(f, convergence));
    coalitions.forEach(c => updateCoalitionThresholds(c, convergence));

    updateGlobalMatrix(convergence, curvature);
  };

  function updateFactionThresholds(f, convergence) {
    const trauma = clamp01(f.traumaScore || 0);
    const propaganda = avgPropaganda(f);
    const myth = clamp01((f.myths && f.myths.length) ? f.myths.length / 10 : 0);
    const stagnation = clamp01(f.stagnationScore || 0);
    const conv = clamp01(convergence);

    let stateName = "stable";

    if (trauma > cfg.faction.trauma) stateName = "fracture";
    if (propaganda > cfg.faction.propaganda) stateName = "radicalized";
    if (myth > cfg.faction.myth) stateName = "mythbound";
    if (conv > cfg.faction.convergence) stateName = "convergence-lock";
    if (stagnation > cfg.faction.stagnation) stateName = "stagnant";

    state.factionStates[f.id] = stateName;
  }

  function updateCoalitionThresholds(c, convergence) {
    const rivalry = clamp01(c.rivalryPressure || 0);
    const conflict = clamp01(c.conflictIntensity || 0);
    const treaty = clamp01(c.treatyStability || 0);
    const ideology = clamp01(c.ideologicalVariance || 0);
    const epoch = clamp01(c.epochTension || 0);
    const conv = clamp01(convergence);

    let stateName = "stable";

    if (rivalry > cfg.coalition.rivalry) stateName = "rivalry-ignition";
    if (conflict > cfg.coalition.conflict) stateName = "conflict-cascade";
    if (treaty < cfg.coalition.treatyBreak) stateName = "treaty-fracture";
    if (ideology > cfg.coalition.ideologyVariance) stateName = "schism";
    if (epoch > cfg.coalition.epochTension) stateName = "epoch-crisis";

    state.coalitionStates[c.id] = stateName;
  }

  function updateGlobalMatrix(convergence, curvature) {
    const conv = clamp01(convergence);
    const curv = clamp(curvature, -1, 1);

    let globalState = "stable";

    if (conv > cfg.global.cascade) globalState = "cascade";
    if (conv > cfg.global.rupture) globalState = "rupture";
    if (conv > cfg.global.inversion && curv < 0) globalState = "inversion";

    state.globalState = globalState;
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

  console.log("PHASE 60 — Systemic Threshold Breaker Layer online.");
})(this);
