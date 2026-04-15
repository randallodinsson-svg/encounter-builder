// phase41-coalition-diplomacy.js
// APEXCORE v4.4 — Phase 41: Coalition Diplomacy (Cinematic Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalDiplomacy = (APEX.CoalDiplomacy = APEX.CoalDiplomacy || {});

  CoalDiplomacy.state = {
    lastSignalTime: 0,
    cooldown: 3.0 // seconds between diplomatic signals
  };

  function now() {
    return performance.now() / 1000;
  }

  function pushDiplomaticEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getIntentForCoalition(coalId) {
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return null;
    const intents = APEX.CoalStrategy.state.intents || [];
    return intents.find(x => x.id === coalId) || null;
  }

  function getRivalries() {
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return [];
    return APEX.CoalRivalry.state.rivalries || [];
  }

  function getConflicts() {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return [];
    return APEX.CoalConflict.state.conflicts || [];
  }

  function pickPair(intel) {
    const rivals = getRivalries();
    const conflicts = getConflicts();

    let best = null;
    let bestScore = 0;

    for (let r of rivals) {
      const a = intel.find(c => c.id === r.aId);
      const b = intel.find(c => c.id === r.bId);
      if (!a || !b) continue;
      const score = r.tension;
      if (score > bestScore) {
        bestScore = score;
        best = { a, b, rivalry: r.tension, conflict: 0 };
      }
    }

    for (let c of conflicts) {
      const a = intel.find(x => x.id === c.aId);
      const b = intel.find(x => x.id === c.bId);
      if (!a || !b) continue;
      const score = c.level * 1.1;
      if (score > bestScore) {
        bestScore = score;
        best = { a, b, rivalry: 0, conflict: c.level };
      }
    }

    return best;
  }

  function cinematicDiplomaticLine(a, b, ctx) {
    const intentA = getIntentForCoalition(a.id);
    const intentB = getIntentForCoalition(b.id);
    const intentStrA = intentA ? intentA.intent : "STABILIZE";
    const intentStrB = intentB ? intentB.intent : "STABILIZE";

    const rivalry = ctx.rivalry || 0;
    const conflict = ctx.conflict || 0;

    if (conflict > 0.6) {
      return `${a.id} issues a stark warning to ${b.id}, demanding a halt to open confrontation.`;
    }

    if (rivalry > 0.6 && intentStrA === "DOMINATE") {
      return `${a.id} delivers a veiled ultimatum to ${b.id}, hinting at a decisive clash to come.`;
    }

    if (rivalry > 0.4 && intentStrA === "EXPAND") {
      return `${a.id} signals its advance toward ${b.id}, offering no guarantees of restraint.`;
    }

    if (intentStrA === "STABILIZE" && conflict > 0.3) {
      return `${a.id} calls for de-escalation with ${b.id}, seeking a fragile pause in rising tensions.`;
    }

    if (intentStrA === "CONSOLIDATE" && rivalry < 0.4) {
      return `${a.id} quietly reaches out to ${b.id}, exploring the possibility of a cautious alignment.`;
    }

    if (intentStrA === "SURVIVE" && conflict > 0.3) {
      return `${a.id} appeals to ${b.id} for space to regroup, hinting at the cost of pressing further.`;
    }

    if (intentStrA === "EXPLORE" && rivalry < 0.5) {
      return `${a.id} probes ${b.id} with tentative signals, testing how far it can push without provoking a response.`;
    }

    return `${a.id} and ${b.id} exchange ambiguous signals, neither fully committing to peace nor conflict.`;
  }

  function tryDiplomaticSignal(intel) {
    const t = now();
    if (t - CoalDiplomacy.state.lastSignalTime < CoalDiplomacy.state.cooldown) return;
    CoalDiplomacy.state.lastSignalTime = t;

    if (!intel.length) return;

    const pair = pickPair(intel);
    if (!pair) return;

    const { a, b, rivalry, conflict } = pair;
    const line = cinematicDiplomaticLine(a, b, { rivalry, conflict });

    pushDiplomaticEvent("Diplomatic Signal", line);
  }

  CoalDiplomacy.updateGlobalCoalitionDiplomacy = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) return;

    tryDiplomaticSignal(intel);
  };

  console.log("PHASE41_COALDIPLOMACY — online (Coalition Diplomacy, Cinematic Mode).");
})(this);
