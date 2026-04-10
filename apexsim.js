// ------------------------------------------------------------
// APEXSIM v3.1 — SAFE MODE VERSION
// Guaranteed to load. Guaranteed to run.
// ------------------------------------------------------------

export function createApexSim(scenario) {
  const state = {
    tick: 0,
    maxTicks: scenario.maxTicks ?? 10,
    actors: scenario.actors.map(a => ({
      id: a.id,
      x: a.x ?? 0,
      vx: a.vx ?? 0
    })),
    events: []
  };

  function step(rand) {
    state.tick++;

    // Basic movement only
    for (const actor of state.actors) {
      actor.x += actor.vx;
    }

    return state.tick < state.maxTicks;
  }

  function run(rand) {
    while (step(rand)) {}

    return {
      scenarioId: scenario.id,
      ticks: state.tick,
      events: state.events,
      actors: state.actors
    };
  }

  return { run };
}

// ------------------------------------------------------------
// Minimal Test Scenario — SAFE MODE
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,

  actors: [
    { id: "actor-1", x: 0, vx: 0.5 },
    { id: "actor-2", x: -2, vx: 0.25 }
  ]
};
