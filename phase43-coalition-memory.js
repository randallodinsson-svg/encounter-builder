// phase43-coalition-memory.js
// APEXCORE v4.4 — Phase 43: Coalition Cultural Memory (Cinematic)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalCulture = (APEX.CoalCulture = APEX.CoalCulture || {});

  CoalCulture.state = {
    memories: [] // { id, coalId, targetId, score, lastUpdate }
  };

  CoalCulture.config = {
    decayRate: 0.01,
    rewardHonor: 0.25,
    punishBetrayal: 0.5,
    maxAbsScore: 2.0,
    eventCooldown: 6.0
  };

  CoalCulture._lastEventTime = 0;

  function now() {
    return performance.now() / 1000;
  }

  function pushCultureEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function getOrCreateMemory(coalId, targetId) {
    const id = `${coalId}::${targetId}`;
    let m = CoalCulture.state.memories.find(x => x.id === id);
    if (!m) {
      m = { id, coalId, targetId, score: 0, lastUpdate: now() };
      CoalCulture.state.memories.push(m);
    }
    return m;
  }

  function applyDelta(coalId, targetId, delta) {
    const m = getOrCreateMemory(coalId, targetId);
    m.score += delta;
    const maxAbs = CoalCulture.config.maxAbsScore;
    if (m.score > maxAbs) m.score = maxAbs;
    if (m.score < -maxAbs) m.score = -maxAbs;
    m.lastUpdate = now();
  }

  function decayMemories(dt) {
    const cfg = CoalCulture.config;
    for (let i = 0; i < CoalCulture.state.memories.length; i++) {
      const m = CoalCulture.state.memories[i];
      if (m.score === 0) continue;
      const sign = m.score > 0 ? 1 : -1;
      const mag = Math.abs(m.score);
      const dec = cfg.decayRate * dt;
      const newMag = mag - dec;
      m.score = newMag > 0 ? newMag * sign : 0;
    }
  }

  function scanTreatiesForCulture() {
    if (!APEX.CoalTreaties || !APEX.CoalTreaties.state) return;
    const treaties = APEX.CoalTreaties.state.treaties || [];
    const t = now();
    const cfg = CoalCulture.config;

    for (let i = 0; i < treaties.length; i++) {
      const tr = treaties[i];

      // Broken → punishment memory
      if (tr.broken && !tr._cultureProcessedBroken) {
        const breaker = tr.brokenBy || tr.aId;
        const victim = breaker === tr.aId ? tr.bId : tr.bId;
        applyDelta(victim, breaker, -cfg.punishBetrayal);
        tr._cultureProcessedBroken = true;

        if (t - CoalCulture._lastEventTime > cfg.eventCooldown) {
          CoalCulture._lastEventTime = t;
          pushCultureEvent(
            "Long Memory",
            `${victim} will not soon forget ${breaker}'s betrayal.`
          );
        }
      }

      // Honored near expiry → reward both
      if (!tr.broken && !tr._cultureProcessedHonor && tr.expiresAt && t > tr.expiresAt - 0.5) {
        applyDelta(tr.aId, tr.bId, cfg.rewardHonor);
        applyDelta(tr.bId, tr.aId, cfg.rewardHonor);
        tr._cultureProcessedHonor = true;

        if (t - CoalCulture._lastEventTime > cfg.eventCooldown) {
          CoalCulture._lastEventTime = t;
          pushCultureEvent(
            "Earned Trust",
            `${tr.aId} and ${tr.bId} carry forward a quiet memory of restraint.`
          );
        }
      }
    }
  }

  function biasStrategyFromCulture() {
    if (!APEX.CoalStrategy || !APEX.CoalStrategy.state) return;
    const intents = APEX.CoalStrategy.state.intents || [];
    if (!intents.length) return;

    for (let i = 0; i < intents.length; i++) {
      const intent = intents[i];
      const coalId = intent.id;

      const mems = CoalCulture.state.memories.filter(m => m.coalId === coalId);
      if (!mems.length) continue;

      let hostility = 0;
      let trust = 0;
      for (let m of mems) {
        if (m.score < 0) hostility += -m.score;
        if (m.score > 0) trust += m.score;
      }

      if (hostility > 0.5) {
        if (intent.intent === "STABILIZE") intent.intent = "CONSOLIDATE";
        else if (intent.intent === "CONSOLIDATE") intent.intent = "EXPAND";
        else if (intent.intent === "EXPAND") intent.intent = "DOMINATE";
      }

      if (trust > 0.5) {
        if (intent.intent === "DOMINATE") intent.intent = "EXPAND";
        else if (intent.intent === "EXPAND") intent.intent = "CONSOLIDATE";
        else if (intent.intent === "CONSOLIDATE") intent.intent = "STABILIZE";
      }
    }
  }

  CoalCulture.updateGlobalCoalitionCulture = function (formations, dt) {
    decayMemories(dt);
    scanTreatiesForCulture();
    biasStrategyFromCulture();
  };

  console.log("PHASE43_COALCULTURE — online (Coalition Cultural Memory, Cinematic Mode).");
})(this);
