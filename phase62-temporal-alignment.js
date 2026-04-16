// phase62-temporal-alignment.js
// APEXCORE v4.4 — Phase 62: Temporal Alignment & Drift Correction Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Temporal = (APEX.Temporal = APEX.Temporal || {});

  const state = {
    tick: 0,
    driftEvents: [],
    tsi: 1.0 // Temporal Stability Index (0 = chaotic, 1 = stable)
  };

  const cfg = {
    driftSensitivity: 0.15,
    correctionStrength: 0.1,
    smoothing: 0.05
  };

  Temporal.getTSI = () => state.tsi;
  Temporal.getDriftEvents = () => state.driftEvents;

  Temporal.updateTemporalAlignment = function (formations, dt) {
    state.tick++;

    const predictive =
      (APEX.Predictive && APEX.Predictive.getGlobalForecast
        ? APEX.Predictive.getGlobalForecast()
        : null);

    if (!predictive) return;

    const actual = computeActualState(formations);
    const drift = computeDrift(predictive, actual);

    applyCorrections(formations, drift);
    updateTSI(drift);
    recordDriftEvent(drift);
  };

  function computeActualState(formations) {
    let rivalry = 0;
    let conflict = 0;
    let convergence = 0;

    if (APEX.CoalRivalry && APEX.CoalRivalry.getGlobalRivalry)
      rivalry = APEX.CoalRivalry.getGlobalRivalry();

    if (APEX.CoalConflict && APEX.CoalConflict.getGlobalConflict)
      conflict = APEX.CoalConflict.getGlobalConflict();

    if (APEX.Convergence && APEX.Convergence.getGlobalIndex)
      convergence = APEX.Convergence.getGlobalIndex();

    return {
      rivalry,
      conflict,
      convergence
    };
  }

  function computeDrift(pred, actual) {
    const dR = actual.rivalry - pred.tension;
    const dC = actual.conflict - pred.cascadeRisk;
    const dV = actual.convergence - pred.ruptureRisk;

    const driftMagnitude = Math.abs(dR) + Math.abs(dC) + Math.abs(dV);

    return {
      dR,
      dC,
      dV,
      magnitude: driftMagnitude
    };
  }

  function applyCorrections(formations, drift) {
    if (drift.magnitude < cfg.driftSensitivity) return;

    const strength = cfg.correctionStrength;

    formations.forEach(f => {
      if (f.motives) {
        f.motives.aggression = clamp01(f.motives.aggression - drift.dC * strength);
        f.motives.fear = clamp01(f.motives.fear - drift.dR * strength);
        f.motives.cooperation = clamp01(f.motives.cooperation + drift.dV * strength);
      }

      if (f.salience) {
        f.salience = clamp01(f.salience - drift.magnitude * 0.05);
      }
    });

    if (APEX.CoalRivalry) {
      APEX.CoalRivalry.globalRivalry =
        clamp01(APEX.CoalRivalry.globalRivalry - drift.dR * strength);
    }

    if (APEX.CoalConflict) {
      APEX.CoalConflict.globalConflict =
        clamp01(APEX.CoalConflict.globalConflict - drift.dC * strength);
    }

    if (APEX.Convergence) {
      APEX.Convergence.globalConvergence =
        clamp01(APEX.Convergence.globalConvergence - drift.dV * strength);
    }
  }

  function updateTSI(drift) {
    const target = 1 - clamp01(drift.magnitude);
    state.tsi = lerp(state.tsi, target, cfg.smoothing);
  }

  function recordDriftEvent(drift) {
    if (drift.magnitude < cfg.driftSensitivity) return;

    state.driftEvents.push({
      tick: state.tick,
      magnitude: drift.magnitude,
      dR: drift.dR,
      dC: drift.dC,
      dV: drift.dV
    });

    if (state.driftEvents.length > 50) state.driftEvents.shift();
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  console.log("PHASE 62 — Temporal Alignment & Drift Correction Layer online.");
})(this);
