// phase32-emergent-motive.js
// APEXCORE v4.4 — Phase 32: Emergent Motive Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Motives = (APEX.Motives = APEX.Motives || {});

  Motives.config = {
    decay: 0.12,
    max: 1.0,
    min: 0.0,
    influenceScale: 0.35
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function ensure(formation) {
    if (!formation.motives) {
      formation.motives = {
        dominance: 0.3,
        stability: 0.3,
        alliance: 0.3,
        aggression: 0.3,
        curiosity: 0.3
      };
    }
  }

  function decayMotives(m, dt, cfg) {
    for (const k in m) {
      m[k] *= (1 - cfg.decay * dt);
    }
  }

  function applyStimuli(formation, formations, dt, cfg) {
    const m = formation.motives;

    const rel = formation.relationships || {};
    let trust = 0;
    let threat = 0;

    for (const id in rel) {
      const v = rel[id];
      if (v > 0) trust += v;
      else threat += Math.abs(v);
    }

    m.alliance += trust * 0.15 * dt;
    m.aggression += threat * 0.18 * dt;

    const snap = APEX.Telemetry ? APEX.Telemetry.lastSnapshot : null;
    if (snap) {
      m.stability += (1 - snap.avgTension) * 0.1 * dt;
      m.dominance += snap.avgTension * 0.12 * dt;
    }

    m.curiosity += 0.05 * dt;
  }

  function clampMotives(m, cfg) {
    for (const k in m) {
      m[k] = clamp(m[k], cfg.min, cfg.max);
    }
  }

  function injectInfluence(formation, cfg) {
    const m = formation.motives;
    const cmds = formation.pendingCommands;

    if (!cmds) return;

    if (m.dominance > 0.65) {
      cmds.push({ type: "SEEK_ADVANTAGE", weight: m.dominance * cfg.influenceScale });
    }

    if (m.aggression > 0.6) {
      cmds.push({ type: "SEEK_CONFLICT", weight: m.aggression * cfg.influenceScale });
    }

    if (m.alliance > 0.6) {
      cmds.push({ type: "SEEK_ALLY", weight: m.alliance * cfg.influenceScale });
    }

    if (m.stability > 0.6) {
      cmds.push({ type: "SEEK_STABILITY", weight: m.stability * cfg.influenceScale });
    }

    if (m.curiosity > 0.6) {
      cmds.push({ type: "EXPLORE", weight: m.curiosity * cfg.influenceScale });
    }
  }

  Motives.updateMotives = function (formation, formations, dt) {
    const cfg = Motives.config;

    ensure(formation);
    decayMotives(formation.motives, dt, cfg);
    applyStimuli(formation, formations, dt, cfg);
    clampMotives(formation.motives, cfg);
    injectInfluence(formation, cfg);
  };

  console.log("PHASE32_MOTIVES — online (Emergent Motive Layer).");
})(this);
