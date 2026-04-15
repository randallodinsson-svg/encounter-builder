// phase48-operator-reputation.js
// APEXCORE v4.4 — Phase 48: Operator Reputation Layer (Hybrid, Dynamic Influence)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const OperatorReputation = (APEX.OperatorReputation = APEX.OperatorReputation || {});

  // Reputation dimensions (all 0–1, centered ~0.5)
  // fairness      — perceived evenness of treatment
  // stability     — correlation with peace vs chaos
  // benevolence   — tendency to help vs harm
  // predictability— how patternful vs erratic
  // favoritism    — perceived bias toward specific coalitions

  OperatorReputation.state = {
    coalitions: [
      // { id, fairness, stability, benevolence, predictability, favoritism, lastUpdate, lastEventTime }
    ],
    lastGlobalEventTime: 0
  };

  OperatorReputation.config = {
    minUpdateInterval: 6.0,
    globalEventCooldown: 20.0,
    perCoalitionEventCooldown: 22.0,
    baseDrift: 0.03,
    interventionImpact: 0.6,
    noiseImpact: 0.2
  };

  function now() {
    return performance.now() / 1000;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function pushRepEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getCoalitionRep(id, createIfMissing = true) {
    const s = OperatorReputation.state;
    let rec = s.coalitions.find(c => c.id === id);
    if (!rec && createIfMissing) {
      rec = {
        id,
        fairness: 0.5 + (Math.random() - 0.5) * 0.1,
        stability: 0.5 + (Math.random() - 0.5) * 0.1,
        benevolence: 0.5 + (Math.random() - 0.5) * 0.1,
        predictability: 0.5 + (Math.random() - 0.5) * 0.1,
        favoritism: 0.5 + (Math.random() - 0.5) * 0.1,
        lastUpdate: now(),
        lastEventTime: 0
      };
      s.coalitions.push(rec);
    }
    return rec;
  }

  function estimateInterventionProfile(id) {
    if (!APEX.OperatorIntervention || !APEX.OperatorIntervention.state) {
      return {
        localMagnitude: 0,
        globalMagnitude: 0,
        biasSign: 0
      };
    }

    const st = APEX.OperatorIntervention.state;
    const bias = (st.coalBias || []).find(b => b.id === id);
    const g = st.globalBias || {};

    let localMag = 0;
    let localSign = 0;

    if (bias) {
      const agg = bias.aggressionBias || 0;
      const risk = bias.riskBias || 0;
      const honor = bias.honorBias || 0;
      const open = bias.opennessBias || 0;
      const w = bias.weight || 1;

      localMag =
        (Math.abs(agg) + Math.abs(risk) + Math.abs(honor) + Math.abs(open)) * w;
      localSign = agg + risk - honor - open;
    }

    let globalMag = 0;
    globalMag += Math.abs((g.motiveAmplifier || 1) - 1);
    globalMag += Math.abs((g.rivalryAmplifier || 1) - 1);
    globalMag += Math.abs((g.conflictAmplifier || 1) - 1);
    globalMag += Math.abs((g.diplomacySoftener || 1) - 1);
    globalMag += Math.abs((g.treatyStabilityBoost || 1) - 1);
    globalMag += Math.abs((g.cycleSpeedMultiplier || 1) - 1);

    return {
      localMagnitude: Math.min(1, localMag),
      globalMagnitude: Math.min(1, globalMag),
      biasSign: localSign
    };
  }

  function sampleCoalitionTraits(id) {
    if (!APEX.CoalIdentity || !APEX.CoalIdentity.state) {
      return {
        honor: 0.5,
        risk: 0.5,
        openness: 0.5,
        paranoia: 0.5
      };
    }

    const traits = APEX.CoalIdentity.state.traits || [];
    const tRec = traits.find(t => t.id === id);
    if (!tRec) {
      return {
        honor: 0.5,
        risk: 0.5,
        openness: 0.5,
        paranoia: 0.5
      };
    }

    return {
      honor: clamp01(tRec.honor != null ? tRec.honor : 0.5),
      risk: clamp01(tRec.risk != null ? tRec.risk : 0.5),
      openness: clamp01(tRec.openness != null ? tRec.openness : 0.5),
      paranoia: clamp01(tRec.paranoia != null ? tRec.paranoia : 0.5)
    };
  }

  function updateReputation(rec, id, dt) {
    const cfg = OperatorReputation.config;
    const profile = estimateInterventionProfile(id);
    const traits = sampleCoalitionTraits(id);

    const local = profile.localMagnitude;
    const global = profile.globalMagnitude;
    const sign = profile.biasSign;

    const impact = cfg.interventionImpact * local + cfg.noiseImpact * global;
    const drift = cfg.baseDrift * dt;

    const fairnessWeight = traits.honor * 0.6 + (1 - traits.paranoia) * 0.4;
    const stabilityWeight = (1 - traits.risk) * 0.7 + traits.honor * 0.3;
    const benevolenceWeight = traits.openness * 0.6 + (1 - traits.paranoia) * 0.4;
    const predictabilityWeight = (1 - traits.risk) * 0.5 + traits.honor * 0.5;
    const favoritismWeight = traits.paranoia * 0.7 + traits.risk * 0.3;

    const fairnessDelta =
      (sign < 0 ? -1 : 1) * impact * fairnessWeight * 0.15 +
      (Math.random() * 2 - 1) * drift * 0.5;
    const stabilityDelta =
      (global > 0.2 ? -1 : 1) * impact * stabilityWeight * 0.15 +
      (Math.random() * 2 - 1) * drift * 0.5;
    const benevolenceDelta =
      (sign < 0 ? -1 : 1) * impact * benevolenceWeight * 0.15 +
      (Math.random() * 2 - 1) * drift * 0.5;
    const predictabilityDelta =
      (local > 0.2 ? 1 : -1) * impact * predictabilityWeight * 0.15 +
      (Math.random() * 2 - 1) * drift * 0.5;
    const favoritismDelta =
      (Math.abs(sign) > 0.2 ? 1 : -1) * impact * favoritismWeight * 0.15 +
      (Math.random() * 2 - 1) * drift * 0.5;

    rec.fairness = clamp01(rec.fairness + fairnessDelta * dt);
    rec.stability = clamp01(rec.stability + stabilityDelta * dt);
    rec.benevolence = clamp01(rec.benevolence + benevolenceDelta * dt);
    rec.predictability = clamp01(rec.predictability + predictabilityDelta * dt);
    rec.favoritism = clamp01(rec.favoritism + favoritismDelta * dt);
  }

  function maybeEmitCoalitionEvent(rec) {
    const t = now();
    const cfg = OperatorReputation.config;
    if (t - rec.lastEventTime < cfg.perCoalitionEventCooldown) return;

    rec.lastEventTime = t;

    const f = rec.fairness;
    const s = rec.stability;
    const b = rec.benevolence;
    const p = rec.predictability;
    const fav = rec.favoritism;

    let line = "";

    if (f > 0.7 && b > 0.7 && fav < 0.4) {
      line = `${rec.id} quietly concludes that the external presence tends toward fairness, rarely favoring any single faction.`;
    } else if (fav > 0.7 && f < 0.4) {
      line = `${rec.id} grows convinced that the unseen influence plays favorites, tilting the field toward chosen coalitions.`;
    } else if (s < 0.4 && b < 0.4) {
      line = `${rec.id} reads the Operator as a destabilizing force, one whose touch often precedes turmoil.`;
    } else if (p > 0.7) {
      line = `${rec.id} begins to factor the Operator into long-term plans, trusting that its patterns can be anticipated.`;
    } else if (p < 0.3) {
      line = `${rec.id} treats the Operator as volatile, an unpredictable variable that resists strategic modeling.`;
    } else {
      return;
    }

    pushRepEvent("Operator Reputation", line);
  }

  function maybeEmitGlobalEvent() {
    const t = now();
    const cfg = OperatorReputation.config;
    const s = OperatorReputation.state;
    if (t - s.lastGlobalEventTime < cfg.globalEventCooldown) return;

    if (!s.coalitions.length) return;

    s.lastGlobalEventTime = t;

    const cs = s.coalitions;
    let avgFair = 0,
      avgStab = 0,
      avgBen = 0,
      avgPred = 0,
      avgFav = 0;

    for (let i = 0; i < cs.length; i++) {
      avgFair += cs[i].fairness;
      avgStab += cs[i].stability;
      avgBen += cs[i].benevolence;
      avgPred += cs[i].predictability;
      avgFav += cs[i].favoritism;
    }

    const n = cs.length || 1;
    avgFair /= n;
    avgStab /= n;
    avgBen /= n;
    avgPred /= n;
    avgFav /= n;

    let line = "";

    if (avgFair > 0.65 && avgBen > 0.65 && avgFav < 0.45) {
      line =
        "Across the field, many coalitions quietly accept the Operator as a broadly fair, if distant, presence.";
    } else if (avgFav > 0.65) {
      line =
        "Rumors spread that the Operator has chosen favorites, and strategies begin to account for perceived bias.";
    } else if (avgStab < 0.4 && avgBen < 0.45) {
      line =
        "A growing unease takes hold: the Operator is increasingly seen as a source of volatility rather than order.";
    } else if (avgPred > 0.7) {
      line =
        "Patterns in the Operator’s behavior become a topic of quiet study, feeding long-arc strategic doctrines.";
    } else {
      return;
    }

    pushRepEvent("Operator Reputation Climate", line);
  }

  function applyDynamicInfluence(formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) return;

    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return;
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return;
    if (!APEX.CoalDiplomacy || !APEX.CoalDiplomacy.state) return;
    if (!APEX.CoalTreaties || !APEX.CoalTreaties.state) return;

    const rivalryMatrix = APEX.CoalRivalry.state.matrix || [];
    const tensions = APEX.CoalConflict.state.tensions || [];
    const signals = APEX.CoalDiplomacy.state.signals || [];
    const treaties = APEX.CoalTreaties.state.treaties || [];

    const repMap = {};
    for (let i = 0; i < intel.length; i++) {
      const c = intel[i];
      repMap[c.id] = getCoalitionRep(c.id, false);
    }

    function repFactor(rec) {
      if (!rec) return 1.0;
      const trust =
        (rec.fairness + rec.benevolence + rec.stability + rec.predictability) /
        4;
      const suspicion = rec.favoritism;
      return 0.8 + (trust - suspicion) * 0.4;
    }

    for (let i = 0; i < tensions.length; i++) {
      const tRec = tensions[i];
      const a = tRec.a;
      const b = tRec.b;
      const ra = repMap[a];
      const rb = repMap[b];

      const fa = repFactor(ra);
      const fb = repFactor(rb);
      const f = (fa + fb) * 0.5;

      tRec.level *= f;
    }

    for (let i = 0; i < signals.length; i++) {
      const sRec = signals[i];
      const a = sRec.from;
      const b = sRec.to;
      const ra = repMap[a];
      const rb = repMap[b];

      const fa = repFactor(ra);
      const fb = repFactor(rb);
      const f = (fa + fb) * 0.5;

      if (f > 1.05 && sRec.tone === "hardline") sRec.tone = "firm";
      if (f > 1.1 && sRec.tone === "firm") sRec.tone = "open";
      if (f < 0.95 && sRec.tone === "open") sRec.tone = "firm";
    }

    for (let i = 0; i < treaties.length; i++) {
      const tr = treaties[i];
      const a = tr.a;
      const b = tr.b;
      const ra = repMap[a];
      const rb = repMap[b];

      const fa = repFactor(ra);
      const fb = repFactor(rb);
      const f = (fa + fb) * 0.5;

      tr.trust = clamp01((tr.trust || 0.5) * f);
    }

    for (let i = 0; i < rivalryMatrix.length; i++) {
      const row = rivalryMatrix[i];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        const rVal = row[j];
        if (rVal == null) continue;
        const aId = intel[i] && intel[i].id;
        const bId = intel[j] && intel[j].id;
        const ra = repMap[aId];
        const rb = repMap[bId];
        const fa = repFactor(ra);
        const fb = repFactor(rb);
        const f = (fa + fb) * 0.5;
        row[j] = rVal * f;
      }
    }
  }

  OperatorReputation.updateGlobalOperatorReputation = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    const t = now();
    const cfg = OperatorReputation.config;

    for (let i = 0; i < intel.length; i++) {
      const c = intel[i];
      const rec = getCoalitionRep(c.id, true);
      if (t - rec.lastUpdate < cfg.minUpdateInterval) continue;

      rec.lastUpdate = t;
      updateReputation(rec, c.id, dt);
      maybeEmitCoalitionEvent(rec);
    }

    maybeEmitGlobalEvent();
    applyDynamicInfluence(formations, dt);
  };

  console.log("PHASE48_OPERATOR_REPUTATION — online (Hybrid, Dynamic Influence).");
})(this);
