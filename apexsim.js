// ------------------------------------------------------------
// APEXSIM v3.4 — SAFE MODE 2D + ACCELERATION + FRICTION + MAX SPEED
// Deterministic 2D movement with velocity, acceleration,
// friction/drag, and speed clamping.
// Guaranteed to load. Guaranteed to run.
// ------------------------------------------------------------

export function createApexSim(scenario) {
  const state = {
    tick: 0,
    maxTicks: scenario.maxTicks ?? 10,
    friction: scenario.friction ?? 0.98,
    maxSpeed: scenario.maxSpeed ?? 3.0,
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

    // 1. Apply acceleration
    for (const actor of state.actors) {
      actor.vx += actor.ax;
      actor.vy += actor.ay;
    }

    // 2. Apply friction/drag
    for (const actor of state.actors) {
      actor.vx *= state.friction;
      actor.vy *= state.friction;
    }

    // 3. Clamp to maxSpeed
    for (const actor of state.actors) {
      const speed = Math.sqrt(actor.vx * actor.vx + actor.vy * actor.vy);
      if (speed > state.maxSpeed) {
        const scale = state.maxSpeed / speed;
        actor.vx *= scale;
        actor.vy *= scale;
      }
    }

    // 4. Integrate velocity into position
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
// Minimal Test Scenario V3 — SAFE MODE 2D + ACCEL + FRICTION
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,
  friction: 0.96,
  maxSpeed: 2.5,

  actors: [
    // Accelerates diagonally, slowed by friction
    { id: "actor-1", x: 0, y: 0, vx: 0.2, vy: 0.1, ax: 0.05, ay: 0.02 },

    // Accelerates upward/right, slowed by friction
    { id: "actor-2", x: -2, y: 1, vx: 0.1, vy: -0.05, ax: 0.03, ay: -0.01 }
  ]
};
