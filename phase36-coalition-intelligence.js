// phase36-coalition-intelligence.js
// APEXCORE v4.4 — Phase 36: Coalition Intelligence Layer (Directive Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalIntel = (APEX.CoalIntel = APEX.CoalIntel || {});

  CoalIntel.state = {
    coalitions: [], // mirrors APEX.Coalitions.state.coalitions with enriched intel
    lastPosture: "neutral"
  };

  CoalIntel.config = {
    dominanceAggressionThreshold: 0.6,
    stabilityAllianceThreshold: 0.6,
    curiosityThreshold: 0.55,
    influenceWeight: 0.7
  };

  function ensureCoalitionIntel() {
    if (!APEX.Coalitions || !APEX.Coalitions.state) return [];
    const base = APEX.Coalitions.state.coalitions || [];
    const intel = CoalIntel.state.coalitions;

    // sync list length/ids
    for (let i = 0; i < base.length; i++) {
      const b = base[i];
      let c = intel.find(x => x.id === b.id);
      if (!c) {
        c = {
          id: b.id,
          members: b.members.slice(),
          strength: b.strength || 0,
          motives: {
            dominance: 0,
            aggression: 0,
            alliance: 0,
            stability: 0,
            curiosity: 0
          },
          posture: "neutral"
        };
        intel.push(c);
      } else {
        c.members = b.members.slice();
        c.strength = b.strength || 0;
      }
    }

    // remove stale
    for (let i = intel.length - 1; i >= 0; i--) {
      const c = intel[i];
      if (!base.find(b => b.id === c.id)) intel.splice(i, 1);
    }

    return intel;
  }

  function computeCoalitionMotives(coalition, formations) {
    let dom = 0, agg = 0, all = 0, stab = 0, cur = 0;
    let count = 0;

    for (let i = 0; i < coalition.members.length; i++) {
      const id = coalition.members[i];
      const f = formations.find(x => x.id === id);
      if (!f || !f.motives) continue;
      dom += f.motives.dominance || 0;
      agg += f.motives.aggression || 0;
      all += f.motives.alliance || 0;
      stab += f.motives.stability || 0;
      cur += f.motives.curiosity || 0;
      count++;
    }

    if (count === 0) {
      coalition.motives.dominance = 0;
      coalition.motives.aggression = 0;
      coalition.motives.alliance = 0;
      coalition.motives.stability = 0;
      coalition.motives.curiosity = 0;
      return;
    }

    coalition.motives.dominance = dom / count;
    coalition.motives.aggression = agg / count;
    coalition.motives.alliance = all / count;
    coalition.motives.stability = stab / count;
    coalition.motives.curiosity = cur / count;
  }

  function determinePosture(coalition, cfg) {
    const m = coalition.motives;
    let posture = "neutral";

    if (m.dominance > cfg.dominanceAggressionThreshold && m.aggression > cfg.dominanceAggressionThreshold) {
      posture = "offensive";
    } else if (m.stability > cfg.stabilityAllianceThreshold && m.alliance > cfg.stabilityAllianceThreshold) {
      posture = "defensive";
    } else if (m.curiosity > cfg.curiosityThreshold) {
      posture = "exploratory";
    }

    coalition.posture = posture;
    return posture;
  }

  function injectCommandsForPosture(coalition, formations, dt, cfg) {
    const posture = coalition.posture;
    const weight = cfg.influenceWeight * (0.5 + coalition.strength * 0.5);

    for (let i = 0; i < coalition.members.length; i++) {
      const id = coalition.members[i];
      const f = formations.find(x => x.id === id);
      if (!f) continue;
      if (!f.pendingCommands) f.pendingCommands = [];

      if (posture === "offensive") {
        f.pendingCommands.push({
          type: "SEEK_CONFLICT",
          weight,
          source: "coalition"
        });
      } else if (posture === "defensive") {
        f.pendingCommands.push({
          type: "SEEK_STABILITY",
          weight,
          source: "coalition"
        });
        f.pendingCommands.push({
          type: "COHERE_GROUP",
          weight: weight * 0.8,
          source: "coalition"
        });
      } else if (posture === "exploratory") {
        f.pendingCommands.push({
          type: "SEEK_NOVELTY",
          weight,
          source: "coalition"
        });
      }
    }
  }

  function updateHUD() {
    const coalitions = CoalIntel.state.coalitions;
    const count = coalitions.length;

    let strongest = null;
    let maxStrength = 0;

    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      if (c.strength > maxStrength) {
        maxStrength = c.strength;
        strongest = c;
      }
    }

    const elCount = document.getElementById("hud-coal-count");
    const elStrong = document.getElementById("hud-coal-strongest");
    const elPosture = document.getElementById("hud-coal-posture");

    if (!elCount || !elStrong || !elPosture) return;

    elCount.textContent = "Count: " + count;
    elStrong.textContent = strongest ? ("Strongest: " + strongest.id + " (" + maxStrength.toFixed(2) + ")") : "Strongest: --";

    const posture = strongest ? strongest.posture : "neutral";
    CoalIntel.state.lastPosture = posture;
    elPosture.textContent = "Posture: " + posture;
  }

  CoalIntel.applyCoalitionInfluence = function (formation, formations, dt) {
    if (!APEX.Coalitions || !APEX.Coalitions.state) return;
    if (!formation.coalition || !formation.coalition.id) return;

    const intel = ensureCoalitionIntel();
    const coalition = intel.find(c => c.id === formation.coalition.id);
    if (!coalition) return;

    // influence is injected in bulk in updateGlobalCoalitionIntelligence
    // this hook exists for future per-formation refinements if needed
  };

  CoalIntel.updateGlobalCoalitionIntelligence = function (formations, dt) {
    if (!APEX.Coalitions || !APEX.Coalitions.state) return;

    const cfg = CoalIntel.config;
    const intel = ensureCoalitionIntel();

    for (let i = 0; i < intel.length; i++) {
      const c = intel[i];
      computeCoalitionMotives(c, formations);
      determinePosture(c, cfg);
      injectCommandsForPosture(c, formations, dt, cfg);
    }

    updateHUD();
  };

  console.log("PHASE36_COALINTEL — online (Coalition Intelligence Layer, Directive Mode).");
})(this);
