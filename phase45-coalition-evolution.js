// phase45-coalition-evolution.js
// APEXCORE v4.4 — Phase 45: Long-Arc Political Evolution (Cinematic)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalEvo = (APEX.CoalEvo = APEX.CoalEvo || {});

  CoalEvo.state = {
    eras: [], // { id, eraIndex, eraName, eraStart, cyclePhase, ideology, lastShift }
    globalEraIndex: 0,
    globalEraStart: 0
  };

  CoalEvo.config = {
    eraDuration: 60.0,       // seconds per "era"
    minShiftInterval: 15.0,  // min seconds between major shifts
    ideologyDriftRate: 0.02,
    cycleSpeed: 0.05,
    eventCooldown: 12.0
  };

  CoalEvo._lastEventTime = 0;

  const ERA_NAMES = [
    "Age of Expansion",
    "Age of Stagnation",
    "Age of Rivalry",
    "Age of Upheaval",
    "Age of Realignment",
    "Age of Quiet Tension"
  ];

  const CYCLE_PHASES = ["ASCENT", "PEAK", "DECLINE", "FRAGMENT"];

  function now() {
    return performance.now() / 1000;
  }

  function pushEraEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function randomIdeology() {
    // Simple 3D ideology vector: order–chaos, centralization–fragmentation, openness–closure
    return {
      order: Math.random(),
      centralization: Math.random(),
      openness: Math.random()
    };
  }

  function getOrCreateEraState(coalId) {
    let e = CoalEvo.state.eras.find(x => x.id === coalId);
    if (!e) {
      const t = now();
      e = {
        id: coalId,
        eraIndex: 0,
        eraName: ERA_NAMES[0],
        eraStart: t,
        cyclePhase: "ASCENT",
        ideology: randomIdeology(),
        lastShift: t
      };
      CoalEvo.state.eras.push(e);
    }
    return e;
  }

  function maybeAdvanceGlobalEra() {
    const t = now();
    const cfg = CoalEvo.config;
    if (t - CoalEvo.state.globalEraStart < cfg.eraDuration) return;

    CoalEvo.state.globalEraIndex++;
    CoalEvo.state.globalEraStart = t;

    const name = ERA_NAMES[CoalEvo.state.globalEraIndex % ERA_NAMES.length];
    pushEraEvent("Era Shift", `The simulation drifts into a new period: ${name}.`);
  }

  function driftIdeology(dt) {
    const cfg = CoalEvo.config;
    const rate = cfg.ideologyDriftRate * dt;

    for (let i = 0; i < CoalEvo.state.eras.length; i++) {
      const e = CoalEvo.state.eras[i];
      const ideol = e.ideology;

      ideol.order = clamp01(ideol.order + (Math.random() * 2 - 1) * rate);
      ideol.centralization = clamp01(ideol.centralization + (Math.random() * 2 - 1) * rate);
      ideol.openness = clamp01(ideol.openness + (Math.random() * 2 - 1) * rate);
    }
  }

  function advanceCycles(dt) {
    const cfg = CoalEvo.config;
    const t = now();

    for (let i = 0; i < CoalEvo.state.eras.length; i++) {
      const e = CoalEvo.state.eras[i];
      const elapsed = t - e.eraStart;
      const phaseIndex = Math.floor((elapsed * cfg.cycleSpeed) % CYCLE_PHASES.length);
      e.cyclePhase = CYCLE_PHASES[phaseIndex];

      if (elapsed > cfg.eraDuration && t - e.lastShift > cfg.minShiftInterval) {
        e.eraIndex++;
        e.eraName = ERA_NAMES[e.eraIndex % ERA_NAMES.length];
        e.eraStart = t;
        e.lastShift = t;

        pushEraEvent(
          "Coalition Era",
          `${e.id} enters a new political era: ${e.eraName}.`
        );
      }
    }
  }

  function biasFromIdeology() {
    if (!APEX.CoalIdentity || !APEX.CoalIdentity.state) return;
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return;

    const traits = APEX.CoalIdentity.state.traits || [];
    const intents = APEX.CoalStrategy.state.intents || [];

    for (let i = 0; i < intents.length; i++) {
      const intent = intents[i];
      const era = CoalEvo.state.eras.find(e => e.id === intent.id);
      if (!era) continue;

      const ideol = era.ideology;
      const tRec = traits.find(t => t.id === intent.id);
      if (!tRec) continue;

      // High order + centralization → more stabilize / consolidate
      if (ideol.order > 0.7 && ideol.centralization > 0.6) {
        if (intent.intent === "EXPAND") intent.intent = "CONSOLIDATE";
        if (intent.intent === "DOMINATE") intent.intent = "CONSOLIDATE";
      }

      // High openness → less dominance, more expansion / consolidate
      if (ideol.openness > 0.7) {
        if (intent.intent === "DOMINATE") intent.intent = "EXPAND";
      }

      // Low order + low centralization → more rivalry / conflict via aggression
      if (ideol.order < 0.3 && ideol.centralization < 0.4 && tRec.aggression > 0.6) {
        if (intent.intent === "STABILIZE") intent.intent = "EXPAND";
        else if (intent.intent === "CONSOLIDATE") intent.intent = "EXPAND";
      }
    }
  }

  function biasFromCycles() {
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return;
    const intents = APEX.CoalStrategy.state.intents || [];

    for (let i = 0; i < intents.length; i++) {
      const intent = intents[i];
      const era = CoalEvo.state.eras.find(e => e.id === intent.id);
      if (!era) continue;

      switch (era.cyclePhase) {
        case "ASCENT":
          if (intent.intent === "STABILIZE") intent.intent = "CONSOLIDATE";
          break;
        case "PEAK":
          // leave as is, slight bias to hold
          if (intent.intent === "EXPAND") intent.intent = "CONSOLIDATE";
          break;
        case "DECLINE":
          if (intent.intent === "DOMINATE") intent.intent = "EXPAND";
          break;
        case "FRAGMENT":
          if (intent.intent === "EXPAND") intent.intent = "STABILIZE";
          break;
      }
    }
  }

  function maybeEmitLongArcEvent() {
    const t = now();
    const cfg = CoalEvo.config;
    if (t - CoalEvo._lastEventTime < cfg.eventCooldown) return;
    if (!CoalEvo.state.eras.length) return;

    CoalEvo._lastEventTime = t;
    const e = CoalEvo.state.eras[Math.floor(Math.random() * CoalEvo.state.eras.length)];
    if (!e) return;

    let line;
    switch (e.cyclePhase) {
      case "ASCENT":
        line = `${e.id} is in a rising phase, its influence quietly expanding.`;
        break;
      case "PEAK":
        line = `${e.id} stands at a precarious peak, its power widely felt.`;
        break;
      case "DECLINE":
        line = `${e.id} shows signs of decline, its grip beginning to loosen.`;
        break;
      case "FRAGMENT":
        line = `${e.id} begins to fragment, its unity fraying at the edges.`;
        break;
      default:
        line = `${e.id} drifts through an uncertain political season.`;
        break;
    }

    pushEraEvent("Long-Arc Evolution", line);
  }

  CoalEvo.updateGlobalCoalitionEvolution = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    for (let i = 0; i < intel.length; i++) {
      getOrCreateEraState(intel[i].id);
    }

    maybeAdvanceGlobalEra();
    driftIdeology(dt);
    advanceCycles(dt);
    biasFromIdeology();
    biasFromCycles();
    maybeEmitLongArcEvent();
  };

  console.log("PHASE45_COALEVO — online (Long-Arc Political Evolution, Cinematic Mode).");
})(this);
