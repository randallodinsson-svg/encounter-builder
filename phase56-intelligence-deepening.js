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
    update
