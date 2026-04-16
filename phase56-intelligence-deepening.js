// phase56-intelligence-deepening.js
// APEXCORE v4.4 — Phase 56: Intelligence Deepening Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const IntelDeep = (APEX.IntelDeep = APEX.IntelDeep || {});

  // WORLD STATE (Phase 56)
  const world = {
    tick: 0,
    factions: [],
    history: [],
    era: {
      id: "era-0",
      age: 0,
      tension: 0,
      saturation: 0,
    },
  };

  // CONFIG
  const cfg = {
    ideologicalDriftRate: 0.01,
    propagandaEffectRate: 0.02,
    memoryDecayRate: 0.0005,
    traumaImpactMultiplier: 0.5,
    stagnationThreshold: 0.7,
    saturationThreshold: 0.8,
    eraShiftTensionThreshold: 0.85,
  };

  // ---------------------------------------
  // PUBLIC API
  // ---------------------------------------

  IntelDeep.injectFactionState = function (factionState) {
    world.factions = factionState;
  };

  IntelDeep.injectHistory = function (events) {
    world.history = events;
  };

  IntelDeep.updateGlobalIntelligence = function (formations, dt) {
    world.tick++;

    applyMemoryDecay();
    updateFactionTraumaAndStagnation();
    applyPropagandaInfluence();
    applyIdeologicalDrift();
    updateEraTensionAndSaturation();
    checkEraShift();
  };

  // ---------------------------------------
  // MEMORY DECAY
  // ---------------------------------------

  function applyMemoryDecay() {
    const now = world.tick;
    const rate = cfg.memoryDecayRate;

    world.history = world.history
      .map((e) => {
        const age = now - e.timestamp;
        const decay = Math.max(0, 1 - age * rate);
        return { ...e, impact: e.impact * decay };
      })
      .filter((e) => e.impact > 0.001);
  }

  // ---------------------------------------
  // TRAUMA + STAGNATION
  // ---------------------------------------

  function updateFactionTraumaAndStagnation() {
    world.factions.forEach((f) => {
      const events = world.history.filter((e) =>
        e.factionsInvolved.includes(f.id)
      );

      f.traumaScore = computeTrauma(events);
      f.stagnationScore = computeStagnation(f);
    });
  }

  function computeTrauma(events) {
    if (!events.length) return 0;
    const total = events.reduce((s, e) => s + e.impact, 0);
    return Math.min(1, total / events.length);
  }

  function computeStagnation(f) {
    const avgStability =
      f.ideologies.reduce((s, i) => s + i.stability, 0) /
      Math.max(1, f.ideologies.length);

    const variance =
      f.ideologies.reduce((s, i) => {
        const d = i.weight - 0.5;
        return s + d * d;
      }, 0) / Math.max(1, f.ideologies.length);

    const lowVar = 1 - Math.min(1, variance * 4);
    return Math.min(1, avgStability * 0.6 + lowVar * 0.4);
  }

  // ---------------------------------------
  // PROPAGANDA INFLUENCE
  // ---------------------------------------

  function applyPropagandaInfluence() {
    const rate = cfg.propagandaEffectRate;

    world.factions.forEach((f) => {
      const internal = f.propagandaLayers.filter((l) => l.internal);
      const external = f.propagandaLayers.filter((l) => !l.internal);

      const internalInfluence = internal.reduce(
        (s, l) => s + l.intensity * (0.5 + l.identityAnchoring * 0.5),
        0
      );

      const mythReinforce = internal.reduce(
        (s, l) => s + l.mythReinforcement * l.intensity,
        0
      );

      const externalInfluence = external.reduce(
        (s, l) => s + l.intensity * (0.5 + l.distortion * 0.5),
        0
      );

      f.ideologies.forEach((i) => {
        i.weight += rate * internalInfluence * (i.weight - 0.5);
        i.stability = Math.min(1, i.stability + mythReinforce * 0.1);
        i.weight += rate * externalInfluence * (Math.random() - 0.5);
        i.weight = Math.min(1, Math.max(0, i.weight));
      });
    });
  }

  // ---------------------------------------
  // IDEOLOGICAL DRIFT
  // ---------------------------------------

  function applyIdeologicalDrift() {
    const base = cfg.ideologicalDriftRate;

    world.factions.forEach((f) => {
      const trauma = f.traumaScore;

      f.ideologies.forEach((i) => {
        const drift =
          base *
          (1 + trauma * cfg.traumaImpactMultiplier) *
          (i.driftTendency + 0.1) *
          (1 - i.stability + 0.1);

        const dir = Math.random() < 0.5 ? -1 : 1;
        i.weight = Math.min(1, Math.max(0, i.weight + dir * drift));
        i.stability = Math.min(1, Math.max(0, i.stability - drift * 0.5));
      });
    });
  }

  // ---------------------------------------
  // ERA TENSION + SATURATION
  // ---------------------------------------

  function updateEraTensionAndSaturation() {
    const avgStag =
      world.factions.reduce((s, f) => s + f.stagnationScore, 0) /
      Math.max(1, world.factions.length);

    const avgPol = computePolarization();

    world.era.age++;
    world.era.tension = Math.min(1, avgStag * 0.5 + avgPol * 0.5);
    world.era.saturation = Math.min(
      1,
      (avgStag / cfg.stagnationThreshold +
        avgPol / cfg.saturationThreshold) /
        2
    );
  }

  function computePolarization() {
    const all = [];
    world.factions.forEach((f) => all.push(...f.ideologies));
    if (!all.length) return 0;

    const avg =
      all.reduce((s, i) => s + i.weight, 0) / Math.max(1, all.length);

    const variance =
      all.reduce((s, i) => {
        const d = i.weight - avg;
        return s + d * d;
      }, 0) / all.length;

    return Math.min(1, variance * 4);
  }

  // ---------------------------------------
  // ERA SHIFT
  // ---------------------------------------

  function checkEraShift() {
    const e = world.era;
    const t = cfg.eraShiftTensionThreshold;

    if (e.tension >= t && e.saturation >= t) triggerEraShift();
  }

  function triggerEraShift() {
    const newId = `era-${Date.now()}`;

    world.era = {
      id: newId,
      name: `Era ${newId}`,
      age: 0,
      tension: 0,
      saturation: 0,
    };

    world.factions.forEach((f) => {
      f.stagnationScore = 0;
      f.traumaScore *= 0.7;
    });

    world.history.push({
      id: `era-shift-${newId}`,
      timestamp: world.tick,
      type: "ERA_SHIFT",
      factionsInvolved: world.factions.map((f) => f.id),
      ideologiesInvolved: [],
      impact: 1,
      tags: ["era_shift", "systemic_transition"],
    });
  }

  console.log("PHASE 56 — Intelligence Deepening Layer online.");
})(this);
