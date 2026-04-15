// phase49-epoch-shift.js
// APEXCORE v4.4 — Phase 49: Operator Epoch Shifts (Adaptive Impact)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});

  const Epoch = (APEX.Epoch = APEX.Epoch || {});

  Epoch.state = {
    current: "ERA_DEFAULT",
    confidence: 0.0,
    lastShiftTime: 0,
    history: []
  };

  Epoch.config = {
    minShiftInterval: 45.0,
    analysisInterval: 8.0,
    baseImpact: 0.15,
    maxImpact: 0.55
  };

  function now() {
    return performance.now() / 1000;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function pushEpochEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function sampleOperatorReputation() {
    if (!APEX.OperatorReputation || !APEX.OperatorReputation.state) {
      return {
        fairness: 0.5,
        stability: 0.5,
        benevolence: 0.5,
        predictability: 0.5,
        favoritism: 0.5
      };
    }

    const cs = APEX.OperatorReputation.state.coalitions || [];
    if (!cs.length) {
      return {
        fairness: 0.5,
        stability: 0.5,
        benevolence: 0.5,
        predictability: 0.5,
        favoritism: 0.5
      };
    }

    let f = 0,
      s = 0,
      b = 0,
      p = 0,
      fav = 0;
    for (let i = 0; i < cs.length; i++) {
      f += cs[i].fairness;
      s += cs[i].stability;
      b += cs[i].benevolence;
      p += cs[i].predictability;
      fav += cs[i].favoritism;
    }
    const n = cs.length || 1;
    return {
      fairness: f / n,
      stability: s / n,
      benevolence: b / n,
      predictability: p / n,
      favoritism: fav / n
    };
  }

  function sampleGlobalStability() {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) {
      return { avgTension: 0.5 };
    }
    const tensions = APEX.CoalConflict.state.tensions || [];
    if (!tensions.length) return { avgTension: 0.5 };

    let sum = 0;
    for (let i = 0; i < tensions.length; i++) {
      sum += tensions[i].level || 0;
    }
    const avg = sum / tensions.length;
    return { avgTension: clamp01(avg) };
  }

  function samplePresenceMode() {
    if (!APEX.OperatorPresence || !APEX.OperatorPresence.state) {
      return { mode: "UNKNOWN", intensity: 0.0 };
    }
    const st = APEX.OperatorPresence.state;
    return {
      mode: st.globalMode || "UNKNOWN",
      intensity: clamp01(st.globalIntensity || 0.0)
    };
  }

  function classifyEpoch(rep, stability, presence) {
    const f = rep.fairness;
    const s = rep.stability;
    const b = rep.benevolence;
    const p = rep.predictability;
    const fav = rep.favoritism;
    const t = stability.avgTension;
    const inten = presence.intensity;

    let label = "ERA_DEFAULT";
    let confidence = 0.3;

    if (f > 0.65 && b > 0.65 && fav < 0.45 && t < 0.45) {
      label = "ERA_QUIET_GUIDANCE";
      confidence = 0.55 + (f + b) * 0.2;
    } else if (fav > 0.7 && f < 0.5) {
      label = "ERA_CHOSEN_FACTIONS";
      confidence = 0.55 + fav * 0.25;
    } else if (t > 0.65 && s < 0.45 && b < 0.5) {
      label = "ERA_TURBULENT_HANDS";
      confidence = 0.55 + t * 0.25;
    } else if (p > 0.7 && inten > 0.4) {
      label = "ERA_UNSEEN_PATTERNS";
      confidence = 0.55 + p * 0.25;
    } else if (t > 0.6 && inten < 0.3 && s < 0.45) {
      label = "ERA_VOLATILE_INFLUENCE";
      confidence = 0.5 + t * 0.25;
    } else if (t < 0.4 && s > 0.6 && f > 0.55) {
      label = "ERA_DISTANT_EQUILIBRIUM";
      confidence = 0.5 + s * 0.25;
    }

    return { label, confidence: clamp01(confidence) };
  }

  function describeEpochShift(oldLabel, newLabel) {
    if (newLabel === "ERA_QUIET_GUIDANCE") {
      return "A slow consensus forms: the Operator’s hand is present but measured, guiding without overt command.";
    }
    if (newLabel === "ERA_CHOSEN_FACTIONS") {
      return "Whispers of favoritism harden into doctrine; many now believe the field bends toward a select few.";
    }
    if (newLabel === "ERA_TURBULENT_HANDS") {
      return "The age turns restless; interventions are remembered less as corrections and more as catalysts of upheaval.";
    }
    if (newLabel === "ERA_UNSEEN_PATTERNS") {
      return "Strategists begin to treat the Operator as a patterned force, mapping its rhythms like a distant tide.";
    }
    if (newLabel === "ERA_VOLATILE_INFLUENCE") {
      return "Coalitions speak of an era of volatility, where unseen impulses jolt the field without warning.";
    }
    if (newLabel === "ERA_DISTANT_EQUILIBRIUM") {
      return "The Operator recedes into a distant equilibrium, its presence felt more in balance than in gesture.";
    }
    if (newLabel === "ERA_DEFAULT") {
      return "The field drifts back toward a nameless era, where no single story of the Operator quite holds.";
    }
    return "The age shifts, and with it, the stories coalitions tell about the presence beyond the field.";
  }

  function computeAdaptiveImpact(rep, stability, presence) {
    const cfg = Epoch.config;

    const fairness = rep.fairness;
    const benevolence = rep.benevolence;
    const favoritism = rep.favoritism;
    const tension = stability.avgTension;
    const intensity = presence.intensity;

    const trust = (fairness + benevolence) * 0.5;
    const suspicion = favoritism;
    const volatility = tension * (0.5 + intensity * 0.5);

    let impact = cfg.baseImpact;

    impact += (trust - suspicion) * 0.2;
    impact += volatility * 0.25;

    impact = Math.max(cfg.baseImpact * 0.5, impact);
    impact = Math.min(cfg.maxImpact, impact);

    return impact;
  }

  function applyEpochEffects(formations, dt) {
    const st = Epoch.state;
    const label = st.current;

    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return;
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return;
    if (!APEX.CoalDiplomacy || !APEX.CoalDiplomacy.state) return;
    if (!APEX.CoalTreaties || !APEX.CoalTreaties.state) return;

    const rivalryMatrix = APEX.CoalRivalry.state.matrix || [];
    const tensions = APEX.CoalConflict.state.tensions || [];
    const signals = APEX.CoalDiplomacy.state.signals || [];
    const treaties = APEX.CoalTreaties.state.treaties || [];

    const rep = sampleOperatorReputation();
    const stability = sampleGlobalStability();
    const presence = samplePresenceMode();
    const impact = computeAdaptiveImpact(rep, stability, presence);

    let rivalryMul = 1.0;
    let tensionMul = 1.0;
    let diplomacySoft = 1.0;
    let treatyStabMul = 1.0;
    let motiveAmp = 1.0;

    if (label === "ERA_QUIET_GUIDANCE") {
      rivalryMul = 1.0 - impact * 0.4;
      tensionMul = 1.0 - impact * 0.35;
      diplomacySoft = 1.0 + impact * 0.4;
      treatyStabMul = 1.0 + impact * 0.35;
      motiveAmp = 1.0 + impact * 0.1;
    } else if (label === "ERA_CHOSEN_FACTIONS") {
      rivalryMul = 1.0 + impact * 0.35;
      tensionMul = 1.0 + impact * 0.25;
      diplomacySoft = 1.0 - impact * 0.2;
      treatyStabMul = 1.0 - impact * 0.15;
      motiveAmp = 1.0 + impact * 0.25;
    } else if (label === "ERA_TURBULENT_HANDS") {
      rivalryMul = 1.0 + impact * 0.45;
      tensionMul = 1.0 + impact * 0.45;
      diplomacySoft = 1.0 - impact * 0.25;
      treatyStabMul = 1.0 - impact * 0.25;
      motiveAmp = 1.0 + impact * 0.3;
    } else if (label === "ERA_UNSEEN_PATTERNS") {
      rivalryMul = 1.0 + impact * 0.15;
      tensionMul = 1.0 + impact * 0.1;
      diplomacySoft = 1.0 + impact * 0.15;
      treatyStabMul = 1.0 + impact * 0.1;
      motiveAmp = 1.0 + impact * 0.2;
    } else if (label === "ERA_VOLATILE_INFLUENCE") {
      rivalryMul = 1.0 + impact * 0.4;
      tensionMul = 1.0 + impact * 0.5;
      diplomacySoft = 1.0 - impact * 0.3;
      treatyStabMul = 1.0 - impact * 0.3;
      motiveAmp = 1.0 + impact * 0.35;
    } else if (label === "ERA_DISTANT_EQUILIBRIUM") {
      rivalryMul = 1.0 - impact * 0.25;
      tensionMul = 1.0 - impact * 0.3;
      diplomacySoft = 1.0 + impact * 0.25;
      treatyStabMul = 1.0 + impact * 0.25;
      motiveAmp = 1.0 + impact * 0.05;
    }

    for (let i = 0; i < tensions.length; i++) {
      tensions[i].level *= tensionMul;
    }

    for (let i = 0; i < treaties.length; i++) {
      const tr = treaties[i];
      tr.trust = clamp01((tr.trust || 0.5) * treatyStabMul);
    }

    for (let i = 0; i < signals.length; i++) {
      const sRec = signals[i];
      if (diplomacySoft > 1.02 && sRec.tone === "hardline") sRec.tone = "firm";
      if (diplomacySoft > 1.08 && sRec.tone === "firm") sRec.tone = "open";
      if (diplomacySoft < 0.98 && sRec.tone === "open") sRec.tone = "firm";
    }

    for (let i = 0; i < rivalryMatrix.length; i++) {
      const row = rivalryMatrix[i];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        if (row[j] == null) continue;
        row[j] *= rivalryMul;
      }
    }

    if (APEX.Motives && APEX.Motives.state && APEX.Motives.state.motives) {
      const motives = APEX.Motives.state.motives;
      for (let i = 0; i < motives.length; i++) {
        motives[i].intensity = clamp01((motives[i].intensity || 0.5) * motiveAmp);
      }
    }
  }

  Epoch.updateGlobalEpoch = (function () {
    let lastAnalysisTime = 0;

    return function updateGlobalEpoch(formations, dt) {
      const t = now();
      const cfg = Epoch.config;
      const st = Epoch.state;

      if (t - lastAnalysisTime < cfg.analysisInterval) {
        applyEpochEffects(formations, dt);
        return;
      }

      lastAnalysisTime = t;

      const rep = sampleOperatorReputation();
      const stability = sampleGlobalStability();
      const presence = samplePresenceMode();

      const classification = classifyEpoch(rep, stability, presence);
      const newLabel = classification.label;
      const newConf = classification.confidence;

      if (newLabel !== st.current && newConf > 0.55) {
        if (t - st.lastShiftTime >= cfg.minShiftInterval) {
          const oldLabel = st.current;
          st.current = newLabel;
          st.confidence = newConf;
          st.lastShiftTime = t;
          st.history.push({
            from: oldLabel,
            to: newLabel,
            time: t,
            confidence: newConf
          });

          const line = describeEpochShift(oldLabel, newLabel);
          pushEpochEvent("Epoch Shift", line);
        }
      } else {
        st.confidence = st.confidence * 0.9 + newConf * 0.1;
      }

      applyEpochEffects(formations, dt);
    };
  })();

  console.log("PHASE49_EPOCH_SHIFT — online (Adaptive Epoch Impact).");
})(this);
