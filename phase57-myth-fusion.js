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

  // ---------------------------------------
  // PUBLIC API
  // ---------------------------------------

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

  // ---------------------------------------
  // MYTH FUSION
  // ---------------------------------------

  function fuseMyths() {
    const factions = world.factions;

    factions.forEach((f) => {
      const trauma = f.traumaScore || 0;
      const propaganda = (f.propagandaLayers || []).reduce(
        (s, l) => s + l.intensity,
        0
      );

      const fusionChance =
        cfg.fusionRate +
        trauma * cfg.traumaMultiplier +
        propaganda * cfg.propagandaMultiplier;

      if (Math.random() < fusionChance) {
        const mythA = pickMyth(f);
        const mythB = pickMyth(f);

        if (mythA && mythB && mythA !== mythB) {
          const fused = {
            id: `myth-${Date.now()}-${Math.random()}`,
            components: [...mythA.components, ...mythB.components],
            weight: (mythA.weight + mythB.weight) / 2,
            origin: f.id,
          };

          world.myths.push(fused);
          f.myths.push(fused);
        }
      }
    });
  }

  function pickMyth(faction) {
    if (!faction.myths || faction.myths.length === 0) return null;
    return faction.myths[Math.floor(Math.random() * faction.myths.length)];
  }

  // ---------------------------------------
  // MYTH DRIFT
 // ---------------------------------------

  function driftMyths() {
    world.myths.forEach((m) => {
      if (Math.random() < cfg.driftRate && m.components.length > 0) {
        const idx = Math.floor(Math.random() * m.components.length);
        m.components[idx] = mutateComponent(m.components[idx]);
      }
    });
  }

  function mutateComponent(component) {
    return component + "*" + Math.floor(Math.random() * 9);
  }

  // ---------------------------------------
  // MYTH PROPAGATION
  // ---------------------------------------

  function propagateMyths() {
    const factions = world.factions;
    const coalitions = world.coalitions;

    factions.forEach((f) => {
      const coalition = coalitions.find((c) => c.members.includes(f.id));
      const identityStrength = coalition ? coalition.identityStrength || 0 : 0;

      const propagationChance =
        cfg.propagationRate +
        identityStrength * cfg.coalitionIdentityMultiplier;

      if (Math.random() < propagationChance) {
        const source = pickRandomFaction(factions, f.id);
        if (!source || !source.myths || source.myths.length === 0) return;

        const myth = source.myths[Math.floor(Math.random() * source.myths.length)];

        if (!f.myths.includes(myth)) {
          f.myths.push(myth);
        }
      }
    });
  }

  function pickRandomFaction(factions, excludeId) {
    const pool = factions.filter((f) => f.id !== excludeId);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  console.log("PHASE 57 — Myth Fusion Layer online.");
})(this);
