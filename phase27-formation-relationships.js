// phase27-formation-relationships.js
// APEXCORE v4.4 — Phase 27: Formation Relationship Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Relations = (APEX.Relations = APEX.Relations || {});

  Relations.config = {
    evalInterval: 0.5,
    decayRate: 0.02,
    threatIncrease: 0.15,
    trustIncrease: 0.10
  };

  function ensureMemory(f) {
    if (!f.relationships) f.relationships = {};
    return f.relationships;
  }

  function adjustRelation(rel, key, delta) {
    rel[key] = (rel[key] || 0) + delta;
    if (rel[key] > 1) rel[key] = 1;
    if (rel[key] < -1) rel[key] = -1;
  }

  function decayRelations(rel, cfg) {
    for (const k in rel) {
      rel[k] *= (1 - cfg.decayRate);
    }
  }

  function evaluatePair(a, b, cfg) {
    const relA = ensureMemory(a);
    const relB = ensureMemory(b);

    const dist = Math.hypot(a.x - b.x, a.y - b.y);

    if (dist < 80) {
      adjustRelation(relA, b.id, -cfg.threatIncrease);
      adjustRelation(relB, a.id, -cfg.threatIncrease);
    } else if (dist > 200) {
      adjustRelation(relA, b.id, cfg.trustIncrease);
      adjustRelation(relB, a.id, cfg.trustIncrease);
    }
  }

  Relations.updateGlobalRelations = (function () {
    let time = 0;
    let lastEval = 0;

    return function (formations, dt) {
      time += dt;
      const cfg = Relations.config;

      if (time - lastEval < cfg.evalInterval) return;
      lastEval = time;

      if (!formations || formations.length < 2) return;

      for (let i = 0; i < formations.length; i++) {
        const rel = ensureMemory(formations[i]);
        decayRelations(rel, cfg);
      }

      for (let i = 0; i < formations.length; i++) {
        for (let j = i + 1; j < formations.length; j++) {
          evaluatePair(formations[i], formations[j], cfg);
        }
      }
    };
  })();

  console.log("PHASE27_RELATIONS — online (Formation Relationship Layer).");
})(this);
