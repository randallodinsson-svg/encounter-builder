// phase40-coalition-strategy.js
// APEXCORE v4.4 — Phase 40: Coalition Strategic Intent (Emergent Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalStrategy = (APEX.CoalStrategy = APEX.CoalStrategy || {});

  CoalStrategy.state = {
    intents: [] // { id, intent, horizon, lockUntil }
  };

  CoalStrategy.config = {
    minLockTime: 4.0,
    maxLockTime: 12.0
  };

  const INTENTS = ["EXPAND", "DOMINATE", "STABILIZE", "SURVIVE", "EXPLORE", "CONSOLIDATE"];

  function now() {
    return performance.now() / 1000;
  }

  function findIntentEntry(id) {
    return CoalStrategy.state.intents.find(x => x.id === id);
  }

  function ensureIntentEntry(id) {
    let e = findIntentEntry(id);
    if (!e) {
      e = {
        id,
        intent: "STABILIZE",
        horizon: "mid",
        lockUntil: 0
      };
      CoalStrategy.state.intents.push(e);
    }
    return e;
  }

  function emergentScore(coal, ctx) {
    const m = coal.motives || {};
    const aggression = m.aggression || 0;
    const dominance = m.dominance || 0;
    const stability = m.stability || 0;
    const curiosity = m.curiosity || 0;

    const rivalry = ctx.rivalry || 0;
    const conflict = ctx.conflict || 0;
    const strength = coal.strength || 0;

    return {
      aggression,
      dominance,
      stability,
      curiosity,
      rivalry,
      conflict,
      strength
    };
  }

  function chooseIntent(coal, ctx) {
    const s = emergentScore(coal, ctx);

    if (s.conflict > 0.6 && s.dominance > 0.5) return "DOMINATE";
    if (s.conflict > 0.5 && s.stability < 0.3) return "SURVIVE";
    if (s.rivalry > 0.5 && s.aggression > 0.4) return "EXPAND";
    if (s.stability > 0.6 && s.conflict < 0.3) return "CONSOLIDATE";
    if (s.curiosity > 0.5 && s.conflict < 0.4) return "EXPLORE";
    if (s.conflict < 0.2 && s.rivalry < 0.3) return "STABILIZE";

    const idx = Math.floor(Math.random() * INTENTS.length);
    return INTENTS[idx];
  }

  function chooseHorizon(coal, ctx) {
    const s = emergentScore(coal, ctx);

    if (s.conflict > 0.6 || s.rivalry > 0.6) return "short";
    if (s.stability > 0.6) return "long";
    return "mid";
  }

  function getRivalryForCoalition(coalId) {
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return 0;
    const rivals = APEX.CoalRivalry.state.rivalries || [];
    let max = 0;
    for (let r of rivals) {
      if (r.aId === coalId || r.bId === coalId) {
        if (r.tension > max) max = r.tension;
      }
    }
    return max;
  }

  function getConflictForCoalition(coalId) {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return 0;
    const conflicts = APEX.CoalConflict.state.conflicts || [];
    let max = 0;
    for (let c of conflicts) {
      if (c.aId === coalId || c.bId === coalId) {
        if (c.level > max) max = c.level;
      }
    }
    return max;
  }

  function maybeUpdateIntent(coal, t) {
    const cfg = CoalStrategy.config;
    const entry = ensureIntentEntry(coal.id);

    if (t < entry.lockUntil) return;

    const ctx = {
      rivalry: getRivalryForCoalition(coal.id),
      conflict: getConflictForCoalition(coal.id)
    };

    const newIntent = chooseIntent(coal, ctx);
    const newHorizon = chooseHorizon(coal, ctx);

    if (newIntent !== entry.intent || newHorizon !== entry.horizon) {
      entry.intent = newIntent;
      entry.horizon = newHorizon;

      const lockSpan =
        cfg.minLockTime +
        Math.random() * (cfg.maxLockTime - cfg.minLockTime);
      entry.lockUntil = t + lockSpan;

      if (APEX.ScenarioFeed) {
        let line;
        switch (newIntent) {
          case "EXPAND":
            line = `${coal.id} declares an intent to expand its reach.`;
            break;
          case "DOMINATE":
            line = `${coal.id} hardens its stance, pushing toward dominance.`;
            break;
          case "STABILIZE":
            line = `${coal.id} shifts toward stabilization, seeking to cool rising tensions.`;
            break;
          case "SURVIVE":
            line = `${coal.id} pivots toward survival, pulling back from open confrontation.`;
            break;
          case "EXPLORE":
            line = `${coal.id} turns outward, probing the edges of the field.`;
            break;
          case "CONSOLIDATE":
            line = `${coal.id} consolidates its position, drawing its members inward.`;
            break;
          default:
            line = `${coal.id} adjusts its long-range strategy.`;
        }
        APEX.ScenarioFeed.pushEvent("Strategic Intent", line);
      }
    }
  }

  function applyIntentInfluence(coal, formations) {
    const entry = findIntentEntry(coal.id);
    if (!entry) return;

    const members = coal.members || [];
    for (let i = 0; i < members.length; i++) {
      const id = members[i];
      const f = formations.find(x => x.id === id);
      if (!f) continue;
      if (!f.pendingCommands) f.pendingCommands = [];

      switch (entry.intent) {
        case "EXPAND":
          f.pendingCommands.push({
            type: "SEEK_PRESSURE",
            weight: 0.5,
            source: "coalition-strategy"
          });
          break;
        case "DOMINATE":
          f.pendingCommands.push({
            type: "SEEK_PRESSURE",
            weight: 0.7,
            source: "coalition-strategy"
          });
          f.pendingCommands.push({
            type: "FORM_UP",
            weight: 0.4,
            source: "coalition-strategy"
          });
          break;
        case "STABILIZE":
          f.pendingCommands.push({
            type: "HOLD_LINE",
            weight: 0.6,
            source: "coalition-strategy"
          });
          break;
        case "SURVIVE":
          f.pendingCommands.push({
            type: "AVOID_RIVAL",
            weight: 0.7,
            source: "coalition-strategy"
          });
          break;
        case "EXPLORE":
          f.pendingCommands.push({
            type: "PROBE_RIVAL",
            weight: 0.5,
            source: "coalition-strategy"
          });
          break;
        case "CONSOLIDATE":
          f.pendingCommands.push({
            type: "FORM_UP",
            weight: 0.6,
            source: "coalition-strategy"
          });
          break;
      }
    }
  }

  CoalStrategy.updateGlobalCoalitionStrategy = function (formations, dt) {
    if (!APEX.CoalIntel || !APEX.CoalIntel.state) return;
    const intel = APEX.CoalIntel.state.coalitions || [];
    if (!intel.length) return;

    const t = now();

    for (let i = 0; i < intel.length; i++) {
      const coal = intel[i];
      maybeUpdateIntent(coal, t);
      applyIntentInfluence(coal, formations);
    }
  };

  console.log("PHASE40_COALSTRATEGY — online (Coalition Strategic Intent, Emergent Mode).");
})(this);
