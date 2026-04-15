// phase20-narrative-state.js
// APEXCORE v4.4 — Phase 20: Narrative State Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Narrative = (APEX.Narrative = APEX.Narrative || {});

  Narrative.config = {
    evalInterval: 3.0,
    momentumWindow: 10.0
  };

  const STATES = [
    "STABLE_TENSION",
    "RISING_THREAT",
    "CRITICAL_POINT",
    "AFTERMATH"
  ];

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function computeGlobalTension(formations) {
    let pressureSum = 0;
    let integritySum = 0;
    let count = 0;

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      const mem = f.memory || {};
      const p = mem.lastPressure != null ? mem.lastPressure : 0.5;
      const integrity = f.integrity != null ? f.integrity : 1.0;

      pressureSum += p;
      integritySum += integrity;
      count++;
    }

    if (!count) return 0.5;

    const avgP = pressureSum / count;
    const avgI = integritySum / count;

    const tension = clamp01(avgP * 0.7 + (1 - avgI) * 0.3);
    return tension;
  }

  function pickNarrativeState(tension, momentum) {
    if (tension < 0.35 && momentum <= 0.1) return "STABLE_TENSION";
    if (tension < 0.6 && momentum > 0.1) return "RISING_THREAT";
    if (tension >= 0.6 && momentum >= 0.0) return "CRITICAL_POINT";
    return "AFTERMATH";
  }

  function applyNarrativeToFormation(formation, state, tension, momentum) {
    const cmds = (formation.pendingCommands = formation.pendingCommands || []);

    cmds.push({
      type: "NARRATIVE_TAG",
      state,
      tension,
      momentum
    });

    switch (state) {
      case "STABLE_TENSION":
        cmds.push({ type: "NARRATIVE_MOD", channel: "motion", factor: 0.9 });
        cmds.push({ type: "NARRATIVE_MOD", channel: "cohesion", factor: 1.05 });
        break;

      case "RISING_THREAT":
        cmds.push({ type: "NARRATIVE_MOD", channel: "motion", factor: 1.1 });
        cmds.push({ type: "NARRATIVE_MOD", channel: "aggression", factor: 1.1 });
        break;

      case "CRITICAL_POINT":
        cmds.push({ type: "NARRATIVE_MOD", channel: "motion", factor: 1.2 });
        cmds.push({ type: "NARRATIVE_MOD", channel: "aggression", factor: 1.25 });
        cmds.push({ type: "NARRATIVE_MOD", channel: "spread", factor: 1.15 });
        break;

      case "AFTERMATH":
        cmds.push({ type: "NARRATIVE_MOD", channel: "motion", factor: 0.85 });
        cmds.push({ type: "NARRATIVE_MOD", channel: "cohesion", factor: 0.95 });
        break;
    }
  }

  Narrative.updateNarrativeState = (function () {
    let time = 0;
    let lastEval = 0;
    let lastTension = 0.5;
    let momentum = 0.0;

    return function (formations, dt) {
      time += dt;

      if (time - lastEval >= Narrative.config.evalInterval) {
        lastEval = time;

        const tension = computeGlobalTension(formations);
        const delta = tension - lastTension;

        const alpha = dt / Narrative.config.momentumWindow;
        momentum = (1 - alpha) * momentum + alpha * delta;

        lastTension = tension;

        const state = pickNarrativeState(tension, momentum);

        for (let i = 0; i < formations.length; i++) {
          applyNarrativeToFormation(formations[i], state, tension, momentum);
        }
      }
    };
  })();

  console.log("PHASE20_NARRATIVE — online (Narrative State Layer).");
})(this);
