// phase57-myth-fusion.js
// APEXCORE v4.4 — Phase 57: Myth Fusion Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const MythFusion = (APEX.MythFusion = APEX.MythFusion || {});

  const world = {
    tick: 0,
    myths: [],
    factions: [],
    coalitions: []
  };

  const cfg = {
    fusionRate: 0.015,
    driftRate: 0.005,
    propagationRate: 0.02,
    traumaMultiplier: 0.4,
    propagandaMultiplier: 0.3,
    coalitionIdentityMultiplier: 0.5,
  };

  MythFusion.injectFactionState = function (factions) {
    world.factions = factions;
  };

  MythFusion.injectCoalitions = function (coalitions) {
    world.coalitions = coalitions;
  };

  MythFusion.updateGlobalMythFusion = function (formations, dt) {
    world.tick++;
    fuseMyths();
    driftMyths();
    propagateMyths();
  };

  function fuseMyths() {
    const factions = world.factions;

    factions.forEach((f) => {
      const trauma =
