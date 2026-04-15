// phase44-coalition-identity.js
// APEXCORE v4.4 — Phase 44: Coalition Identity & Temperament (Cinematic)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalIdentity = (APEX.CoalIdentity = APEX.CoalIdentity || {});

  CoalIdentity.state = {
    traits: [] // { id, aggression, risk, honor, openness }
  };

  CoalIdentity.config = {
    driftRate: 0.01,
    maxDrift: 0.15,
    eventCooldown: 10.0
  };

  CoalIdentity._lastEventTime = 0;

  function now() {
    return performance.now() / 1000;
  }

  function pushIdentityEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getOrCreateTraits(coalId) {
    let t = CoalIdentity.state.traits.find(x => x.id === coalId);
    if (!t) {
      t = {
        id: coalId,
        aggression: 0.4 + Math.random() * 0.4, // 0–1
        risk: 0.3 + Math.random() * 0.5,
        honor: 0.3 + Math.random() * 0.5,
        openness: 0.3 + Math.random() * 0.5
      };
      CoalIdentity.state.traits.push(t);
    }
    return t;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function driftTraits(dt) {
    const cfg = CoalIdentity.config;
    for (let i = 0; i < CoalIdentity.state.traits.length; i++) {
      const t = CoalIdentity.state.traits[i];
      const drift = cfg.driftRate * dt;

      t.aggression = clamp01(t.aggression + (Math.random() * 2 - 1) * drift);
      t.risk = clamp01(t.risk + (Math.random() * 2 - 1) * drift);
      t.honor = clamp01(t.honor + (Math.random() * 2 - 1) * drift);
      t.openness = clamp01(t.openness + (Math.random() * 2 - 1) * drift);
    }
  }

  function reactToCulture() {
    if (!APEX.CoalCulture || !APEX.CoalCulture.state) return;
    const mems = APEX.CoalCulture.state.memories || [];
    if (!mems.length) return;

    for (let i = 0; i < mems.length; i++) {
      const m = mems[i];
      const traits = getOrCreateTraits(m.coalId);

      if (m.score < -0.5) {
        traits.aggression = clamp01(traits.aggression + 0.02);
        traits.risk = clamp01(traits.risk + 0.01);
        traits.openness = clamp01(traits.openness - 0.02);
      }

      if (m.score > 0.5) {
        traits.honor = clamp01(traits.honor + 0.02);
        traits.openness = clamp01(traits.openness + 0.02);
        traits.aggression = clamp01(traits.aggression - 0.01);
      }
    }
  }

  function biasStrategyFromIdentity() {
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return;
    const intents = APEX.CoalStrategy.state.intents || [];
    if (!intents.length) return;

    for (let i = 0; i < intents.length; i++) {
      const intent = intents[i];
      const traits = getOrCreateTraits(intent.id);

      // Aggression pushes toward more assertive intents
      if (traits.aggression > 0.7) {
        if (intent.intent === "STABILIZE") intent.intent = "CONSOLIDATE";
        else if (intent.intent === "CONSOLIDATE") intent.intent = "EXPAND";
        else if (intent.intent === "EXPAND") intent.intent = "DOMINATE";
      }

      // High honor resists betrayal / extreme dominance
      if (traits.honor > 0.7 && intent.intent === "DOMINATE") {
        intent.intent = "EXPAND";
      }

      // High openness nudges toward stabilize / consolidate
      if (traits.openness > 0.7) {
        if (intent.intent === "DOMINATE") intent.intent = "EXPAND";
        else if (intent.intent === "EXPAND") intent.intent = "CONSOLIDATE";
      }
    }
  }

  function biasDiplomacyFromIdentity() {
    if (!APEX.CoalDiplomacy || !APEX.CoalDiplomacy.state) return;
    const signals = APEX.CoalDiplomacy.state.signals || [];
    if (!signals.length) return;

    for (let i = 0; i < signals.length; i++) {
      const sig = signals[i];
      const traits = getOrCreateTraits(sig.fromId);

      if (traits.openness > 0.7) {
        sig.weight = (sig.weight || 1) * 1.2;
      }

      if (traits.aggression > 0.7) {
        sig.tone = "hardline";
      } else if (traits.openness > 0.7) {
        sig.tone = "conciliatory";
      }
    }
  }

  function biasTreatiesFromIdentity() {
    if (!APEX.CoalTreaties || !APEX.CoalTreaties.state) return;
    const treaties = APEX.CoalTreaties.state.treaties || [];
    if (!treaties.length) return;

    for (let i = 0; i < treaties.length; i++) {
      const tr = treaties[i];
      const aTraits = getOrCreateTraits(tr.aId);
      const bTraits = getOrCreateTraits(tr.bId);

      const avgHonor = (aTraits.honor + bTraits.honor) * 0.5;
      const avgAgg = (aTraits.aggression + bTraits.aggression) * 0.5;

      if (avgHonor > 0.7) {
        tr.trust = clamp01((tr.trust || 0.5) + 0.01);
      }

      if (avgAgg > 0.7) {
        tr.strain = clamp01((tr.strain || 0.1) + 0.01);
      }
    }
  }

  function maybeEmitIdentityEvent() {
    const t = now();
    const cfg = CoalIdentity.config;
    if (t - CoalIdentity._lastEventTime < cfg.eventCooldown) return;

    if (!CoalIdentity.state.traits.length) return;
    CoalIdentity._lastEventTime = t;

    const sample = CoalIdentity.state.traits[Math.floor(Math.random() * CoalIdentity.state.traits.length)];
    if (!sample) return;

    let line;
    if (sample.aggression > 0.7) {
      line = `${sample.id} hardens into a more aggressive posture, its patience wearing thin.`;
    } else if (sample.openness > 0.7) {
      line = `${sample.id} leans toward dialogue, its stance softening at the edges.`;
    } else if (sample.honor > 0.7) {
      line = `${sample.id} clings to its sense of honor, reluctant to cross certain lines.`;
    } else if (sample.risk > 0.7) {
      line = `${sample.id} grows more reckless, increasingly willing to gamble on uncertain outcomes.`;
    } else {
      line = `${sample.id} settles into a cautious, watchful identity.`;
    }

    pushIdentityEvent("Coalition Identity", line);
  }

  CoalIdentity.updateGlobalCoalitionIdentity = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    for (let i = 0; i < intel.length; i++) {
      getOrCreateTraits(intel[i].id);
    }

    driftTraits(dt);
    reactToCulture();
    biasStrategyFromIdentity();
    biasDiplomacyFromIdentity();
    biasTreatiesFromIdentity();
    maybeEmitIdentityEvent();
  };

  console.log("PHASE44_COALIDENTITY — online (Coalition Identity & Temperament, Cinematic Mode).");
})(this);
