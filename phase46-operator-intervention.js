// phase46-operator-intervention.js
// APEXCORE v4.4 — Phase 46: Operator Intervention Layer (Cinematic Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});

  const Intervention = (APEX.OperatorIntervention = APEX.OperatorIntervention || {});

  Intervention.state = {
    globalBias: 0.0,          // -1..1 (negative = restraint, positive = assertive)
    lastNudgeTime: 0,
    nudges: []                // queued operator nudges
  };

  Intervention.config = {
    decayRate: 0.05,          // bias decays over time
    nudgeImpact: 0.25,        // how strong each nudge is
    minInterval: 3.0          // seconds between nudges
  };

  function now() {
    return performance.now() / 1000;
  }

  Intervention.nudge = function (type, strength) {
    const t = now();
    const st = Intervention.state;
    const cfg = Intervention.config;

    if (t - st.lastNudgeTime < cfg.minInterval) return;

    st.lastNudgeTime = t;

    st.nudges.push({
      type,
      strength: strength || 1.0,
      time: t
    });

    // Apply immediate global bias shift
    if (type === "assert") st.globalBias += cfg.nudgeImpact * strength;
    if (type === "restrain") st.globalBias -= cfg.nudgeImpact * strength;

    st.globalBias = Math.max(-1, Math.min(1, st.globalBias));
  };

  function applyNudges(formations, dt) {
    const st = Intervention.state;
    const nudges = st.nudges;

    if (!nudges.length) return;

    for (let i = nudges.length - 1; i >= 0; i--) {
      const n = nudges[i];

      // Apply nudge effects to coalitions
      if (APEX.CoalConflict && APEX.CoalConflict.state) {
        const tensions = APEX.CoalConflict.state.tensions || [];
        for (let j = 0; j < tensions.length; j++) {
          if (n.type === "assert") tensions[j].level *= 1.0 + 0.1 * n.strength;
          if (n.type === "restrain") tensions[j].level *= 1.0 - 0.1 * n.strength;
        }
      }

      // Remove old nudges
      if (now() - n.time > 5.0) nudges.splice(i, 1);
    }
  }

  function decayBias(dt) {
    const st = Intervention.state;
    const cfg = Intervention.config;

    if (st.globalBias > 0) {
      st.globalBias = Math.max(0, st.globalBias - cfg.decayRate * dt);
    } else if (st.globalBias < 0) {
      st.globalBias = Math.min(0, st.globalBias + cfg.decayRate * dt);
    }
  }

  Intervention.updateGlobalOperatorBias = function (formations, dt) {
    applyNudges(formations, dt);
    decayBias(dt);
  };

  console.log("PHASE46_OPERATOR — online (Operator Intervention Layer, Cinematic Mode).");
})(this);
