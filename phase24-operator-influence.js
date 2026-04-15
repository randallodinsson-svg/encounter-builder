// phase24-operator-influence.js
// APEXCORE v4.4 — Phase 24: Operator Influence Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Influence = (APEX.Influence = APEX.Influence || {});

  Influence.config = {
    evalInterval: 0.4,
    softBiasFactor: 0.25
  };

  // External hook point: an operator or UI can write hints here.
  // Example shape:
  // APEX.Influence.operatorHints = {
  //   focusFormationId: 3,
  //   boostAggression: true,
  //   preferObjectives: true
  // };
  Influence.operatorHints = Influence.operatorHints || null;

  function applyHintsToFormation(f, hints, cfg) {
    if (!hints) return;
    const cmds = (f.pendingCommands = f.pendingCommands || []);

    if (hints.focusFormationId != null && f.id === hints.focusFormationId) {
      cmds.push({
        type: "OPERATOR_NUDGE",
        channel: "focus",
        strength: cfg.softBiasFactor
      });
    }

    if (hints.boostAggression) {
      cmds.push({
        type: "OPERATOR_NUDGE",
        channel: "aggression",
        strength: cfg.softBiasFactor
      });
    }

    if (hints.preferObjectives) {
      cmds.push({
        type: "OPERATOR_NUDGE",
        channel: "objective_bias",
        strength: cfg.softBiasFactor
      });
    }
  }

  Influence.updateGlobalInfluence = (function () {
    let time = 0;
    let lastEval = 0;

    return function (formations, dt) {
      time += dt;
      const cfg = Influence.config;

      if (time - lastEval < cfg.evalInterval) return;
      lastEval = time;

      const hints = Influence.operatorHints;
      if (!formations || !formations.length || !hints) return;

      for (let i = 0; i < formations.length; i++) {
        applyHintsToFormation(formations[i], hints, cfg);
      }
    };
  })();

  console.log("PHASE24_INFLUENCE — online (Operator Influence Layer).");
})(this);
