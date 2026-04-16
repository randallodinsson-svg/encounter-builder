// phase61-predictive-tension.js
// APEXCORE v4.4 — Phase 61: Predictive Tension Forecasting Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Predictive = (APEX.Predictive = APEX.Predictive || {});

  const state = {
    tick: 0,
    factionForecasts: {},
    coalitionForecasts: {},
    globalForecast: {
      tension: 0,
      cascadeRisk: 0,
      ruptureRisk: 0,
      inversionRisk: 0
    }
  };

  const cfg = {
    horizon: 240, // frames to project forward
    factionWeights: {
      trauma: 0.25,
      propaganda: 0.25,
      myth: 0.2,
      stagnation: 0.15,
      convergence: 0.15
    },
    coalitionWeights: {
      rivalry: 0.3,
      conflict: 0.3,
      treaty: 0.15,
      ideology: 0.15,
      epoch: 0.1
    },
    globalWeights: {
      convergence: 0.35,
      curvature: 0.25,
      myth: 0.15,
      propaganda: 0.15,
      rivalry: 0.1
    }
  };

  Predictive.getFactionForecasts = () => state.factionForecasts;
  Predictive.getCoalitionForecasts = () => state.coalitionForecasts;
  Predictive.getGlobalForecast = () => state.globalForecast;

  Predictive.updateGlobalForecast = function (formations, dt) {
    state.tick++;

    const factions = formations || [];
    const coalitions = (APEX.Coalitions && APEX.Coalitions.list) || [];

    const convergence =
      (APEX.Convergence &&
        APEX.Convergence.getGlobalIndex &&
        APEX.Convergence.getGlobalIndex()) ||
      0;

    const curvature = APEX.PressureCurvature || 0;

    factions.forEach(f => forecastFaction(f, convergence));
    coalitions.forEach(c => forecastCoalition(c, convergence));

    forecastGlobal(convergence, curvature);
  };

  function forecastFaction(f, convergence) {
    const trauma = clamp01(f.traumaScore || 0);
    const propaganda = avgPropaganda(f);
    const myth = clamp01((f.myths && f.myths.length) ? f.myths.length / 10 : 0);
    const stagnation = clamp01(f.stagnationScore || 0);
    const conv = clamp01(convergence);

    const w = cfg.factionWeights;

    const tension =
      trauma * w.trauma +
      propaganda * w.propaganda +
      myth * w.myth +
      stagnation * w.stagnation +
      conv * w.convergence;

    const projected = clamp01(tension + (tension - 0.5) * 0.25);

    state.factionForecasts[f.id] = {
      tension,
      projected,
      risk: projected > 0.7 ? "high" : projected > 0.45 ? "medium" : "low"
    };
  }

  function forecastCoalition(c, convergence) {
    const rivalry = clamp01(c.rivalryPressure || 0);
    const conflict = clamp01(c.conflictIntensity || 0);
    const treaty = clamp01(c.treatyStability || 0);
    const ideology = clamp01(c.ideologicalVariance || 0);
    const epoch = clamp01(c.epochTension || 0);
    const conv = clamp01(convergence);

    const w = cfg.coalitionWeights;

    const tension =
      rivalry * w.rivalry +
      conflict * w.conflict +
      (1 - treaty) * w.treaty +
      ideology * w.ideology +
      epoch * w.epoch;

    const projected = clamp01(tension + (conv - 0.5) * 0.2);

    state.coalitionForecasts[c.id] = {
      tension,
      projected,
      risk: projected > 0.7 ? "high" : projected > 0.45 ? "medium" : "low"
    };
  }

  function forecastGlobal(convergence, curvature) {
    const conv = clamp01(convergence);
    const curv = clamp(curvature, -1, 1);

    const myth =
      (APEX.MythFusion && APEX.MythFusion.getGlobalMythDensity
        ? APEX.MythFusion.getGlobalMythDensity()
        : 0) || 0;

    const propaganda =
      (APEX.Propaganda && APEX.Propaganda.getGlobalPropaganda
        ? APEX.Propaganda.getGlobalPropaganda()
        : 0) || 0;

    const rivalry =
      (APEX.CoalRivalry && APEX.CoalRivalry.getGlobalRivalry
        ? APEX.CoalRivalry.getGlobalRivalry()
        : 0) || 0;

    const w = cfg.globalWeights;

    const tension =
      conv * w.convergence +
      Math.abs(curv) * w.curvature +
      myth * w.myth +
      propaganda * w.propaganda +
      rivalry * w.rivalry;

    const cascadeRisk = clamp01(tension * 0.8);
    const ruptureRisk = clamp01(tension * 1.1);
    const inversionRisk = clamp01(tension * (curv < 0 ? 1.3 : 0.6));

    state.globalForecast = {
      tension,
      cascadeRisk,
      ruptureRisk,
      inversionRisk
    };
  }

  function avgPropaganda(f) {
    const layers = f.propagandaLayers || [];
    if (!layers.length) return 0;
    const sum = layers.reduce((s, l) => s + (l.intensity || 0), 0);
    return clamp01(sum / Math.max(1, layers.length));
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  console.log("PHASE 61 — Predictive Tension Forecasting Layer online.");
})(this);
