// ------------------------------------------------------------
// APEXSIM v3.1 — Deterministic Movement Simulation Engine
// ------------------------------------------------------------

export function createApexSim(scenario) {
  const state = {
    tick: 0,
    maxTicks: scenario.maxTicks ?? 60,
    actors: scenario.actors.map(a => ({
      id: a.id,
      x: a.x ?? 0,
      vx: a.vx ?? 0,
    })),
    events: [],
  };

  function step(rand) {
    state.tick++;

    // Scenario-level per-tick behavior
    if (typeof scenario.onTick === "function") {
      scenario.onTick({ state, rand });
    }

    // Basic movement integration
    for (const actor of state.actors) {
      actor.x += actor.vx;
    }

    // Scenario-level event collection
    if (typeof scenario.collectEvents === "function") {
      const newEvents = scenario.collectEvents({ state, rand }) || [];
      if (newEvents.length > 0) {
        state.events.push(...newEvents);
      }
    }

    return state.tick < state.maxTicks;
  }

  function run(rand) {
    while (step(rand)) {}
    return {
      scenarioId: scenario.id,
      ticks: state.tick,
      events: state.events,
      actors: state.actors.map(a => ({
        id: a.id,
        x: a.x,
        vx: a.vx
      })),
    };
  }

  return { run };
}

// ------------------------------------------------------------
// Minimal Test Scenario V1 — Upgraded for Movement
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,

  actors: [
    { id: "actor-1", x: 0, vx: 0.5 },
    { id: "actor-2", x: -2, vx: 0.25 },
  ],

  onTick({ state, rand }) {
    // Slight random nudge to actor-2’s velocity
    const a2 = state.actors.find(a => a.id === "actor-2");
    if (a2) {
      a2.vx += (rand() - 0.5) * 0.05;
    }
  },

  collectEvents({ state }) {
    const events = [];
    for (const actor of state.actors) {
      if (actor.x >= 5 && !actor._reached5) {
        actor._reached5 = true;
        events.push({
          type: "threshold-reached",
          actorId: actor.id,
          x: actor.x,
          tick: state.tick,
          threshold: 5,
        });
      }
    }
    return events;
  },
};
