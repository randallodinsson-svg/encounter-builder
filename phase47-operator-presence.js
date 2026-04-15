// phase47-operator-presence.js
// APEXCORE v4.4 — Phase 47: Operator Presence Layer (Adaptive Belief, Cinematic)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const OperatorPresence = (APEX.OperatorPresence = APEX.OperatorPresence || {});

  // Belief modes:
  // "DENIAL"   — operator is noise / coincidence
  // "SKEPTIC"  — patterns noticed, but not trusted
  // "MYTHIC"   — operator as hidden hand / fate
  // "DIRECT"   — operator as real, intentional actor
  const BELIEF_MODES = ["DENIAL", "SKEPTIC", "MYTHIC", "DIRECT"];

  OperatorPresence.state = {
    coalitions: [
      // { id, beliefMode, confidence, lastUpdate, lastEventTime }
    ],
    lastGlobalEventTime: 0
  };

  OperatorPresence.config = {
    minUpdateInterval: 5.0,
    globalEventCooldown: 14.0,
    perCoalitionEventCooldown: 18.0,
    interventionWeight: 0.6,
    noiseWeight: 0.4
  };

  function now() {
    return performance.now() / 1000;
  }

  function pushPresenceEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getCoalitionPresence(id, createIfMissing = true) {
    const s = OperatorPresence.state;
    let rec = s.coalitions.find(c => c.id === id);
    if (!rec && createIfMissing) {
      rec = {
        id,
        beliefMode: BELIEF_MODES[Math.floor(Math.random() * BELIEF_MODES.length)],
        confidence: Math.random() * 0.3 + 0.1,
        lastUpdate: now(),
        lastEventTime: 0
      };
      s.coalitions.push(rec);
    }
    return rec;
  }

  function estimateInterventionIntensityFor(id) {
    if (!APEX.OperatorIntervention || !APEX.OperatorIntervention.state) return 0;
    const st = APEX.OperatorIntervention.state;
    const bias = (st.coalBias || []).find(b => b.id === id);
    const g = st.globalBias || {};

    let localMag = 0;
    if (bias) {
      localMag += Math.abs(bias.aggressionBias || 0);
      localMag += Math.abs(bias.riskBias || 0);
      localMag += Math.abs(bias.honorBias || 0);
      localMag += Math.abs(bias.opennessBias || 0);
      localMag *= (bias.weight || 1);
    }

    let globalMag = 0;
    globalMag += Math.abs((g.motiveAmplifier || 1) - 1);
    globalMag += Math.abs((g.rivalryAmplifier || 1) - 1);
    globalMag += Math.abs((g.conflictAmplifier || 1) - 1);
    globalMag += Math.abs((g.diplomacySoftener || 1) - 1);
    globalMag += Math.abs((g.treatyStabilityBoost || 1) - 1);
    globalMag += Math.abs((g.cycleSpeedMultiplier || 1) - 1);

    const cfg = OperatorPresence.config;
    const score =
      cfg.interventionWeight * localMag + cfg.noiseWeight * globalMag;

    return Math.min(1, score);
  }

  function updateBelief(rec, intensity, dt) {
    const drift = (Math.random() * 2 - 1) * 0.05 * dt;
    let conf = rec.confidence + intensity * 0.8 * dt + drift;
    conf = conf < 0 ? 0 : conf > 1 ? 1 : conf;
    rec.confidence = conf;

    let modeIndex = BELIEF_MODES.indexOf(rec.beliefMode);
    if (modeIndex < 0) modeIndex = 0;

    if (conf > 0.75 && modeIndex < BELIEF_MODES.length - 1) {
      modeIndex++;
      rec.confidence = 0.55 + Math.random() * 0.2;
    } else if (conf < 0.25 && modeIndex > 0) {
      modeIndex--;
      rec.confidence = 0.45 + Math.random() * 0.2;
    }

    rec.beliefMode = BELIEF_MODES[modeIndex];
  }

  function maybeEmitCoalitionEvent(rec) {
    const t = now();
    const cfg = OperatorPresence.config;
    if (t - rec.lastEventTime < cfg.perCoalitionEventCooldown) return;

    rec.lastEventTime = t;

    let line = "";
    switch (rec.beliefMode) {
      case "DENIAL":
        line = `${rec.id} dismisses patterns in the field as coincidence, refusing to see any guiding hand.`;
        break;
      case "SKEPTIC":
        line = `${rec.id} quietly tracks strange correlations, unsure whether a hidden influence truly exists.`;
        break;
      case "MYTHIC":
        line = `${rec.id} whispers of an unseen force, weaving operator interventions into its political myths.`;
        break;
      case "DIRECT":
        line = `${rec.id} plans with the Operator in mind, treating external nudges as a real strategic actor.`;
        break;
      default:
        return;
    }

    pushPresenceEvent("Operator Presence", line);
  }

  function maybeEmitGlobalEvent() {
    const t = now();
    const cfg = OperatorPresence.config;
    const s = OperatorPresence.state;
    if (t - s.lastGlobalEventTime < cfg.globalEventCooldown) return;

    if (!s.coalitions.length) return;

    s.lastGlobalEventTime = t;

    const believers = s.coalitions.filter(c => c.beliefMode === "MYTHIC" || c.beliefMode === "DIRECT");
    const deniers = s.coalitions.filter(c => c.beliefMode === "DENIAL");
    const skeptics = s.coalitions.filter(c => c.beliefMode === "SKEPTIC");

    let line = "";

    if (believers.length && deniers.length) {
      line =
        "Across the field, factions quietly divide over the question of an unseen influence shaping events.";
    } else if (believers.length && !deniers.length && skeptics.length) {
      line =
        "Whispers of a guiding presence spread, while a few still insist the patterns are nothing but chance.";
    } else if (!believers.length && deniers.length) {
      line =
        "Most coalitions treat the field as self-contained, rejecting any notion of a higher guiding force.";
    } else if (believers.length > 2) {
      line =
        "A growing number of coalitions now factor an external presence into their long-term strategies.";
    } else {
      return;
    }

    pushPresenceEvent("Operator Question", line);
  }

  OperatorPresence.updateGlobalOperatorPresence = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    const t = now();
    const cfg = OperatorPresence.config;

    for (let i = 0; i < intel.length; i++) {
      const c = intel[i];
      const rec = getCoalitionPresence(c.id, true);
      if (t - rec.lastUpdate < cfg.minUpdateInterval) continue;

      rec.lastUpdate = t;

      const intensity = estimateInterventionIntensityFor(c.id);
      updateBelief(rec, intensity, dt);
      maybeEmitCoalitionEvent(rec);
    }

    maybeEmitGlobalEvent();
  };

  console.log("PHASE47_OPERATOR_PRESENCE — online (Adaptive Operator Presence, Cinematic Mode).");
})(this);
