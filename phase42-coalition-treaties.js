// phase42-coalition-treaties.js
// APEXCORE v4.4 — Phase 42: Coalition Treaties (Cinematic Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalTreaties = (APEX.CoalTreaties = APEX.CoalTreaties || {});

  CoalTreaties.state = {
    treaties: [] // { id, aId, bId, type, trust, strain, expiresAt, broken, formedAt }
  };

  CoalTreaties.config = {
    minDuration: 8.0,
    maxDuration: 20.0,
    baseTrust: 0.55,
    baseStrain: 0.1,
    strainPerConflict: 0.25,
    strainPerRivalry: 0.15,
    betrayalThreshold: 0.75,
    strainDecay: 0.05,
    cooldown: 4.0
  };

  CoalTreaties._lastUpdateTime = 0;

  const TREATY_TYPES = [
    "CEASEFIRE",
    "NON_AGGRESSION",
    "TEMP_ALLIANCE",
    "MUTUAL_DEFENSE",
    "SHARED_THREAT"
  ];

  function now() {
    return performance.now() / 1000;
  }

  function pushTreatyEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getRivalries() {
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return [];
    return APEX.CoalRivalry.state.rivalries || [];
  }

  function getConflicts() {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return [];
    return APEX.CoalConflict.state.conflicts || [];
  }

  function getIntentForCoalition(coalId) {
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return null;
    const intents = APEX.CoalStrategy.state.intents || [];
    return intents.find(x => x.id === coalId) || null;
  }

  function treatyId(aId, bId) {
    return aId < bId ? `${aId}::${bId}` : `${bId}::${aId}`;
  }

  function findTreaty(aId, bId) {
    const id = treatyId(aId, bId);
    return CoalTreaties.state.treaties.find(t => t.id === id) || null;
  }

  function createTreaty(a, b, type, t) {
    const cfg = CoalTreaties.config;
    const duration =
      cfg.minDuration + Math.random() * (cfg.maxDuration - cfg.minDuration);

    const treaty = {
      id: treatyId(a.id, b.id),
      aId: a.id,
      bId: b.id,
      type,
      trust: cfg.baseTrust,
      strain: cfg.baseStrain,
      expiresAt: t + duration,
      broken: false,
      formedAt: t
    };

    CoalTreaties.state.treaties.push(treaty);

    let line;
    switch (type) {
      case "CEASEFIRE":
        line = `${a.id} and ${b.id} enter a fragile ceasefire, tension held at arm's length.`;
        break;
      case "NON_AGGRESSION":
        line = `${a.id} and ${b.id} agree to a wary non-aggression pact, each watching the other closely.`;
        break;
      case "TEMP_ALLIANCE":
        line = `${a.id} and ${b.id} form a temporary alliance, their interests briefly aligned.`;
        break;
      case "MUTUAL_DEFENSE":
        line = `${a.id} and ${b.id} bind themselves to mutual defense, promising to answer each other's calls.`;
        break;
      case "SHARED_THREAT":
        line = `${a.id} and ${b.id} unite against a shared threat, setting aside their differences—for now.`;
        break;
      default:
        line = `${a.id} and ${b.id} enter into a cautious agreement.`;
    }

    pushTreatyEvent("Treaty Formed", line);
  }

  function strainTreaty(treaty, rivalry, conflict, dt) {
    const cfg = CoalTreaties.config;

    treaty.strain += rivalry * cfg.strainPerRivalry * dt;
    treaty.strain += conflict * cfg.strainPerConflict * dt;

    treaty.strain -= cfg.strainDecay * dt;
    if (treaty.strain < 0) treaty.strain = 0;
    if (treaty.strain > 1) treaty.strain = 1;

    treaty.trust -= treaty.strain * 0.15 * dt;
    if (treaty.trust < 0) treaty.trust = 0;
  }

  function maybeBreakTreaty(treaty, rivalry, conflict, t) {
    const cfg = CoalTreaties.config;
    if (treaty.broken) return;

    const pressure = Math.max(rivalry, conflict);
    const risk = treaty.strain * pressure;

    if (risk > cfg.betrayalThreshold) {
      treaty.broken = true;

      let line;
      switch (treaty.type) {
        case "CEASEFIRE":
          line = `${treaty.aId} shatters the ceasefire with ${treaty.bId}, tension erupting back into open hostility.`;
          break;
        case "NON_AGGRESSION":
          line = `${treaty.aId} breaks the non-aggression pact with ${treaty.bId}, revealing its true intentions.`;
          break;
        case "TEMP_ALLIANCE":
          line = `${treaty.aId} turns on its temporary ally ${treaty.bId}, the alliance collapsing in an instant.`;
          break;
        case "MUTUAL_DEFENSE":
          line = `${treaty.aId} abandons its mutual defense promise to ${treaty.bId}, leaving it exposed.`;
          break;
        case "SHARED_THREAT":
          line = `${treaty.aId} walks away from the shared threat pact with ${treaty.bId}, priorities abruptly shifting.`;
          break;
        default:
          line = `${treaty.aId} betrays its agreement with ${treaty.bId}.`;
      }

      pushTreatyEvent("Treaty Broken", line);
    }
  }

  function cleanupExpired(t) {
    const before = CoalTreaties.state.treaties.length;
    CoalTreaties.state.treaties = CoalTreaties.state.treaties.filter(tr => {
      if (tr.expiresAt && t > tr.expiresAt && !tr.broken) {
        pushTreatyEvent(
          "Treaty Expires",
          `${tr.aId} and ${tr.bId} quietly let their agreement lapse, its terms fading into the background.`
        );
        return false;
      }
      return true;
    });
    return before !== CoalTreaties.state.treaties.length;
  }

  function pickTreatyType(a, b, rivalry, conflict) {
    const intentA = getIntentForCoalition(a.id);
    const intentB = getIntentForCoalition(b.id);
    const iA = intentA ? intentA.intent : "STABILIZE";
    const iB = intentB ? intentB.intent : "STABILIZE";

    if (conflict > 0.5) return "CEASEFIRE";
    if (rivalry < 0.3 && (iA === "STABILIZE" || iB === "STABILIZE"))
      return "NON_AGGRESSION";
    if (iA === "SURVIVE" || iB === "SURVIVE") return "MUTUAL_DEFENSE";
    if (iA === "EXPAND" || iB === "EXPAND") return "TEMP_ALLIANCE";

    return "SHARED_THREAT";
  }

  function tryFormTreaty(intel, t) {
    const cfg = CoalTreaties.config;
    if (t - CoalTreaties._lastUpdateTime < cfg.cooldown) return;
    CoalTreaties._lastUpdateTime = t;

    if (!intel.length) return;

    const rivals = getRivalries();
    const conflicts = getConflicts();

    let bestPair = null;
    let bestScore = 0;

    for (let r of rivals) {
      const a = intel.find(c => c.id === r.aId);
      const b = intel.find(c => c.id === r.bId);
      if (!a || !b) continue;
      if (findTreaty(a.id, b.id)) continue;
      const score = r.tension;
      if (score > bestScore) {
        bestScore = score;
        bestPair = { a, b, rivalry: r.tension, conflict: 0 };
      }
    }

    for (let c of conflicts) {
      const a = intel.find(x => x.id === c.aId);
      const b = intel.find(x => x.id === c.bId);
      if (!a || !b) continue;
      if (findTreaty(a.id, b.id)) continue;
      const score = c.level * 1.1;
      if (score > bestScore) {
        bestScore = score;
        bestPair = { a, b, rivalry: 0, conflict: c.level };
      }
    }

    if (!bestPair) return;

    const { a, b, rivalry, conflict } = bestPair;
    const type = pickTreatyType(a, b, rivalry, conflict);
    createTreaty(a, b, type, t);
  }

  function getRivalryBetween(aId, bId) {
    const rivals = getRivalries();
    let max = 0;
    for (let r of rivals) {
      if (
        (r.aId === aId && r.bId === bId) ||
        (r.aId === bId && r.bId === aId)
      ) {
        if (r.tension > max) max = r.tension;
      }
    }
    return max;
  }

  function getConflictBetween(aId, bId) {
    const conflicts = getConflicts();
    let max = 0;
    for (let c of conflicts) {
      if (
        (c.aId === aId && c.bId === bId) ||
        (c.aId === bId && c.bId === aId)
      ) {
        if (c.level > max) max = c.level;
      }
    }
    return max;
  }

  CoalTreaties.updateGlobalCoalitionTreaties = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) return;

    const t = now();
    const cfg = CoalTreaties.config;

    // Maintain existing treaties
    for (let i = 0; i < CoalTreaties.state.treaties.length; i++) {
      const tr = CoalTreaties.state.treaties[i];
      const rivalry = getRivalryBetween(tr.aId, tr.bId);
      const conflict = getConflictBetween(tr.aId, tr.bId);

      strainTreaty(tr, rivalry, conflict, dt);
      maybeBreakTreaty(tr, rivalry, conflict, t);
    }

    cleanupExpired(t);

    // Chance to form a new treaty
    tryFormTreaty(intel, t);
  };

  console.log("PHASE42_COALTREATIES — online (Coalition Treaties, Cinematic Mode).");
})(this);
