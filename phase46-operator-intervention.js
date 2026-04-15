// phase46-operator-intervention.js
// APEXCORE v4.4 — Phase 46: Operator Intervention Layer (Cinematic)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const OperatorIntervention = (APEX.OperatorIntervention = APEX.OperatorIntervention || {});

  OperatorIntervention.state = {
    // per-coalition operator bias
    coalBias: [
      // { id, aggressionBias, riskBias, honorBias, opennessBias, weight, expiresAt }
    ],
    // global knobs
    globalBias: {
      motiveAmplifier: 1.0,
      rivalryAmplifier: 1.0,
      conflictAmplifier: 1.0,
      diplomacySoftener: 1.0,
      treatyStabilityBoost: 1.0,
      cycleSpeedMultiplier: 1.0
    },
    lastEventTime: 0
  };

  OperatorIntervention.config = {
    defaultDuration: 30.0,
    eventCooldown: 8.0
  };

  function now() {
    return performance.now() / 1000;
  }

  function pushOpEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getCoalBias(id, createIfMissing = true) {
    const s = OperatorIntervention.state;
    let b = s.coalBias.find(x => x.id === id);
    if (!b && createIfMissing) {
      b = {
        id,
        aggressionBias: 0,
        riskBias: 0,
        honorBias: 0,
        opennessBias: 0,
        weight: 1.0,
        expiresAt: 0
      };
      s.coalBias.push(b);
    }
    return b;
  }

  function cleanupExpired() {
    const t = now();
    const s = OperatorIntervention.state;
    s.coalBias = s.coalBias.filter(b => !b.expiresAt || b.expiresAt > t);
  }

  // PUBLIC API — can be called from UI / console

  OperatorIntervention.setGlobalBias = function (partial) {
    Object.assign(OperatorIntervention.state.globalBias, partial || {});
    pushOpEvent("Operator Bias", "Global operator bias updated.");
  };

  OperatorIntervention.nudgeCoalition = function (id, partial, durationSec) {
    const b = getCoalBias(id, true);
    const dur = durationSec || OperatorIntervention.config.defaultDuration;
    const t = now();

    if (typeof partial.aggressionBias === "number") b.aggressionBias = partial.aggressionBias;
    if (typeof partial.riskBias === "number") b.riskBias = partial.riskBias;
    if (typeof partial.honorBias === "number") b.honorBias = partial.honorBias;
    if (typeof partial.opennessBias === "number") b.opennessBias = partial.opennessBias;
    if (typeof partial.weight === "number") b.weight = partial.weight;

    b.expiresAt = t + dur;

    pushOpEvent(
      "Operator Nudge",
      `Operator biases ${id} for ${dur.toFixed(0)}s (agg:${b.aggressionBias.toFixed(
        2
      )}, risk:${b.riskBias.toFixed(2)}, honor:${b.honorBias.toFixed(
        2
      )}, open:${b.opennessBias.toFixed(2)}).`
    );
  };

  OperatorIntervention.clearCoalitionBias = function (id) {
    const s = OperatorIntervention.state;
    s.coalBias = s.coalBias.filter(b => b.id !== id);
    pushOpEvent("Operator Nudge", `Operator clears bias on ${id}.`);
  };

  // INTERNAL HELPERS

  function applyIdentityBias() {
    if (!APEX.CoalIdentity || !APEX.CoalIdentity.state) return;
    const traits = APEX.CoalIdentity.state.traits || [];
    const s = OperatorIntervention.state;

    for (let i = 0; i < traits.length; i++) {
      const tRec = traits[i];
      const b = getCoalBias(tRec.id, false);
      if (!b) continue;

      const w = b.weight || 1.0;

      tRec.aggression = clamp01(tRec.aggression + b.aggressionBias * w);
      tRec.risk = clamp01(tRec.risk + b.riskBias * w);
      tRec.honor = clamp01(tRec.honor + b.honorBias * w);
      tRec.openness = clamp01(tRec.openness + b.opennessBias * w);
    }

    function clamp01(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }

  function applyGlobalAmplifiers() {
    const g = OperatorIntervention.state.globalBias;

    // Motives
    if (APEX.Motives && APEX.Motives.state && APEX.Motives.state.motives) {
      const ms = APEX.Motives.state.motives;
      for (let i = 0; i < ms.length; i++) {
        ms[i].intensity *= g.motiveAmplifier;
      }
    }

    // Rivalry
    if (APEX.CoalRivalry && APEX.CoalRivalry.state && APEX.CoalRivalry.state.matrix) {
      const m = APEX.CoalRivalry.state.matrix;
      for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[i].length; j++) {
          m[i][j] *= g.rivalryAmplifier;
        }
      }
    }

    // Conflict
    if (APEX.CoalConflict && APEX.CoalConflict.state && APEX.CoalConflict.state.tensions) {
      const ts = APEX.CoalConflict.state.tensions;
      for (let i = 0; i < ts.length; i++) {
        ts[i].level *= g.conflictAmplifier;
      }
    }

    // Diplomacy softener
    if (APEX.CoalDiplomacy && APEX.CoalDiplomacy.state && APEX.CoalDiplomacy.state.signals) {
      const sigs = APEX.CoalDiplomacy.state.signals;
      for (let i = 0; i < sigs.length; i++) {
        const sRec = sigs[i];
        if (g.diplomacySoftener > 1.0) {
          if (sRec.tone === "hardline") sRec.tone = "firm";
        }
      }
    }

    // Treaties stability
    if (APEX.CoalTreaties && APEX.CoalTreaties.state && APEX.CoalTreaties.state.treaties) {
      const trs = APEX.CoalTreaties.state.treaties;
      for (let i = 0; i < trs.length; i++) {
        trs[i].trust = Math.min(1, (trs[i].trust || 0.5) * g.treatyStabilityBoost);
      }
    }

    // Long-arc cycle speed
    if (APEX.CoalEvo && APEX.CoalEvo.config) {
      APEX.CoalEvo.config.cycleSpeed = (APEX.CoalEvo._baseCycleSpeed || 0.05) * g.cycleSpeedMultiplier;
    }
  }

  // Initialize base cycle speed if not set
  (function initBaseCycleSpeed() {
    if (APEX.CoalEvo && APEX.CoalEvo.config) {
      if (!APEX.CoalEvo._baseCycleSpeed) {
        APEX.CoalEvo._baseCycleSpeed = APEX.CoalEvo.config.cycleSpeed || 0.05;
      }
    }
  })();

  function maybeEmitOpEvent() {
    const t = now();
    const cfg = OperatorIntervention.config;
    const s = OperatorIntervention.state;
    if (t - s.lastEventTime < cfg.eventCooldown) return;

    s.lastEventTime = t;

    const g = s.globalBias;
    let line = "";

    if (g.motiveAmplifier > 1.05) {
      line = "Operator quietly amplifies underlying motives across the field.";
    } else if (g.conflictAmplifier > 1.05) {
      line = "Operator leans into conflict, sharpening the edges of every dispute.";
    } else if (g.diplomacySoftener > 1.05) {
      line = "Operator softens the diplomatic climate, making compromise slightly easier to reach.";
    } else if (g.treatyStabilityBoost > 1.05) {
      line = "Operator steadies existing treaties, giving them a little more resilience.";
    } else if (g.cycleSpeedMultiplier > 1.05) {
      line = "Operator accelerates political cycles, pushing coalitions through eras more quickly.";
    } else if (g.cycleSpeedMultiplier < 0.95) {
      line = "Operator slows the turning of political eras, stretching each moment into a longer season.";
    } else {
      return;
    }

    pushOpEvent("Operator Presence", line);
  }

  OperatorIntervention.updateGlobalOperatorBias = function (formations, dt) {
    cleanupExpired();
    applyIdentityBias();
    applyGlobalAmplifiers();
    maybeEmitOpEvent();
  };

  console.log("PHASE46_OPERATOR — online (Operator Intervention Layer, Cinematic Mode).");
})(this);
