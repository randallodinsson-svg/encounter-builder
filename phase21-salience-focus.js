// phase21-salience-focus.js
// APEXCORE v4.4 — Phase 21: Salience & Focus Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Salience = (APEX.Salience = APEX.Salience || {});

  Salience.config = {
    evalInterval: 0.4,
    pressureWeight: 0.5,
    objectiveWeight: 0.3,
    narrativeWeight: 0.2,
    decay: 0.9
  };

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function computeFormationSalience(f) {
    const mem = f.memory || {};
    const p = mem.lastPressure != null ? mem.lastPressure : 0.5;
    const objScore = mem.objectiveEngagement != null ? mem.objectiveEngagement : 0.0;
    const nar = mem.lastNarrativeTension != null ? mem.lastNarrativeTension : 0.5;

    const cfg = Salience.config;

    let s =
      p * cfg.pressureWeight +
      objScore * cfg.objectiveWeight +
      nar * cfg.narrativeWeight;

    return clamp01(s);
  }

  function tagFormation(f, salience, globalMax) {
    const cmds = (f.pendingCommands = f.pendingCommands || []);

    const normalized = globalMax > 0 ? salience / globalMax : 0;
    const tier =
      normalized > 0.85 ? "CRITICAL" :
      normalized > 0.6 ? "HIGH" :
      normalized > 0.35 ? "MEDIUM" :
      "LOW";

    f.salience = salience;
    f.salienceTier = tier;

    cmds.push({
      type: "SALIENCE_TAG",
      tier,
      value: salience
    });

    switch (tier) {
      case "CRITICAL":
        cmds.push({ type: "FOCUS_PRIORITY", level: 3 });
        cmds.push({ type: "AMPLIFY_VISUAL", factor: 1.4 });
        break;
      case "HIGH":
        cmds.push({ type: "FOCUS_PRIORITY", level: 2 });
        cmds.push({ type: "AMPLIFY_VISUAL", factor: 1.2 });
        break;
      case "MEDIUM":
        cmds.push({ type: "FOCUS_PRIORITY", level: 1 });
        break;
      case "LOW":
      default:
        cmds.push({ type: "FOCUS_PRIORITY", level: 0 });
        break;
    }
  }

  Salience.updateGlobalSalience = (function () {
    let time = 0;
    let lastEval = 0;

    return function (formations, dt) {
      time += dt;
      const cfg = Salience.config;

      if (time - lastEval < cfg.evalInterval) return;
      lastEval = time;

      let maxSalience = 0;

      for (let i = 0; i < formations.length; i++) {
        const f = formations[i];
        const prev = f.salience != null ? f.salience : 0;
        const current = computeFormationSalience(f);
        const blended = prev * cfg.decay + current * (1 - cfg.decay);
        f.salience = blended;
        if (blended > maxSalience) maxSalience = blended;
      }

      for (let i = 0; i < formations.length; i++) {
        tagFormation(formations[i], formations[i].salience || 0, maxSalience);
      }
    };
  })();

  console.log("PHASE21_SALIENCE — online (Salience & Focus Layer).");
})(this);
