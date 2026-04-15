// phase29-scenario-memory.js
// APEXCORE v4.4 — Phase 29: Scenario Memory & Continuity Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Memory = (APEX.ScenarioMemory = APEX.ScenarioMemory || {});

  Memory.state = {
    events: [],
    lastEventTime: 0,
    continuityScore: 0,
    lastTension: 0,
    lastSalience: 0
  };

  Memory.config = {
    maxEvents: 50,
    decayRate: 0.015,
    continuityBoost: 0.1,
    continuityDrop: 0.08,
    minGap: 3.0
  };

  function recordEvent(type, data) {
    const evt = {
      type,
      data,
      time: performance.now() / 1000
    };

    Memory.state.events.push(evt);

    if (Memory.state.events.length > Memory.config.maxEvents)
      Memory.state.events.shift();

    Memory.state.lastEventTime = evt.time;
  }

  function decayContinuity(dt) {
    Memory.state.continuityScore *= (1 - Memory.config.decayRate * dt);
  }

  function updateContinuity(tension, salience) {
    const s = Memory.state;

    const deltaT = tension - s.lastTension;
    const deltaS = salience - s.lastSalience;

    if (deltaT > 0.1 || deltaS > 0.1) {
      s.continuityScore += Memory.config.continuityBoost;
    } else if (deltaT < -0.1 || deltaS < -0.1) {
      s.continuityScore -= Memory.config.continuityDrop;
    }

    if (s.continuityScore < 0) s.continuityScore = 0;
    if (s.continuityScore > 1) s.continuityScore = 1;

    s.lastTension = tension;
    s.lastSalience = salience;
  }

  Memory.updateMemory = function (formations, dt) {
    const snap = APEX.Telemetry ? APEX.Telemetry.lastSnapshot : null;
    if (!snap) return;

    const tension = snap.avgTension || 0;
    const salience = snap.avgSalience || 0;

    decayContinuity(dt);
    updateContinuity(tension, salience);

    const now = performance.now() / 1000;
    const sinceLast = now - Memory.state.lastEventTime;

    if (APEX.AutoScenario && APEX.AutoScenario.lastEventTriggered) {
      if (sinceLast > Memory.config.minGap) {
        recordEvent("scenario_event", {
          tension,
          salience,
          continuity: Memory.state.continuityScore
        });
      }
      APEX.AutoScenario.lastEventTriggered = false;
    }
  };

  console.log("PHASE29_MEMORY — online (Scenario Memory & Continuity Layer).");
})(this);
