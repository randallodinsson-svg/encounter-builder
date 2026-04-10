// ------------------------------------------------------------
// APEXSIM v3.3 — SAFE MODE 2D + ACCELERATION
// Deterministic 2D movement with velocity + acceleration.
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
      vy: a.vy ?? 0,
      ax: a.ax ?? 0,
      ay: a.ay ?? 0
    })),
    events: []
  };

  function step(rand) {
    state.tick++;

    // Apply acceleration first
    for (const actor of state.actors) {
      actor.vx += actor.ax;
      actor.vy += actor.ay;
    }

    // Then integrate velocity into position
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
// Minimal Test Scenario V2 — SAFE MODE 2D + ACCELERATION
// Two actors with acceleration so you can see smooth motion.
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,

  actors: [
    // Accelerates diagonally (speed increases each tick)
    { id: "actor-1", x: 0, y: 0, vx: 0.2, vy: 0.1, ax: 0.05, ay: 0.02 },

    // Accelerates upward and right
    { id: "actor-2", x: -2, y: 1, vx: 0.1, vy: -0.05, ax: 0.03, ay: -0.01 }
  ]
};
