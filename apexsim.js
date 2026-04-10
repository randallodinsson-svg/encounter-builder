// ------------------------------------------------------------
// APEXSIM v3.2 — SAFE MODE 2D
// Deterministic 2D movement (x, y, vx, vy)
// Guaranteed to load. Guaranteed to run.
// ------------------------------------------------------------

export function createApexSim(scenario) {
  const state = {
    tick: 0,
    maxTicks: scenario.maxTicks ?? 10,
    actors: scenario.actors.map(a => ({
      id: a.id,
      x: a.x ?? 0,
      y: a.y ?? 0,
      vx: a.vx ?? 0,
      vy: a.vy ?? 0
    })),
    events: []
  };

  function step(rand) {
    state.tick++;

    // Basic 2D movement integration
    for (const actor of state.actors) {
      actor.x += actor.vx;
      actor.y += actor.vy;
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
// Minimal Test Scenario V1 — SAFE MODE 2D
// Two actors moving in 2D so you can see x,y change.
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,

  actors: [
    // Moves to the right and down
    { id: "actor-1", x: 0, y: 0, vx: 0.5, vy: 0.25 },

    // Moves to the right and up
    { id: "actor-2", x: -2, y: 1, vx: 0.25, vy: -0.1 }
  ]
};
