// ------------------------------------------------------------
// APEXSIM v3.6 — SAFE MODE 2D + STEERING + RNG FIX
// Seek, Flee, Wander, Patrol
// Behaviors produce acceleration; physics handles the rest.
// ------------------------------------------------------------

export function createApexSim(scenario) {
  const state = {
    tick: 0,
    maxTicks: scenario.maxTicks ?? 10,
    friction: scenario.friction ?? 0.98,
    maxSpeed: scenario.maxSpeed ?? 2.5,
    actors: scenario.actors.map(a => ({
      id: a.id,
      x: a.x ?? 0,
      y: a.y ?? 0,
      vx: a.vx ?? 0,
      vy: a.vy ?? 0,
      ax: 0,
      ay: 0,
      behavior: a.behavior ?? null,
      target: a.target ?? null,
      wanderAngle: a.wanderAngle ?? 0,
      path: a.path ?? null,
      pathIndex: 0
    })),
    events: []
  };

  // ------------------------------------------------------------
  // Steering Behavior Functions
  // ------------------------------------------------------------

  function steerSeek(actor) {
    if (!actor.target) return { ax: 0, ay: 0 };

    const dx = actor.target.x - actor.x;
    const dy = actor.target.y - actor.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;

    const desiredVx = (dx / dist) * state.maxSpeed;
    const desiredVy = (dy / dist) * state.maxSpeed;

    return {
      ax: desiredVx - actor.vx,
      ay: desiredVy - actor.vy
    };
  }

  function steerFlee(actor) {
    if (!actor.target) return { ax: 0, ay: 0 };

    const dx = actor.x - actor.target.x;
    const dy = actor.y - actor.target.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;

    const desiredVx = (dx / dist) * state.maxSpeed;
    const desiredVy = (dy / dist) * state.maxSpeed;

    return {
      ax: desiredVx - actor.vx,
      ay: desiredVy - actor.vy
    };
  }

  function steerWander(actor, rand) {
    actor.wanderAngle += (rand() - 0.5) * 0.4;

    const desiredVx = Math.cos(actor.wanderAngle) * state.maxSpeed;
    const desiredVy = Math.sin(actor.wanderAngle) * state.maxSpeed;

    return {
      ax: desiredVx - actor.vx,
      ay: desiredVy - actor.vy
    };
  }

  function steerPatrol(actor) {
    if (!actor.path || actor.path.length === 0) return { ax: 0, ay: 0 };

    const target = actor.path[actor.pathIndex];
    const dx = target.x - actor.x;
    const dy = target.y - actor.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;

    if (dist < 0.5) {
      actor.pathIndex = (actor.pathIndex + 1) % actor.path.length;
    }

    const desiredVx = (dx / dist) * state.maxSpeed;
    const desiredVy = (dy / dist) * state.maxSpeed;

    return {
      ax: desiredVx - actor.vx,
      ay: desiredVy - actor.vy
    };
  }

  function applyBehavior(actor, rand) {
    switch (actor.behavior) {
      case "seek": return steerSeek(actor);
      case "flee": return steerFlee(actor);
      case "wander": return steerWander(actor, rand);
      case "patrol": return steerPatrol(actor);
      default: return { ax: 0, ay: 0 };
    }
  }

  // ------------------------------------------------------------
  // Simulation Step
  // ------------------------------------------------------------

  function step(rand) {
    state.tick++;

    // 1. Steering → acceleration
    for (const actor of state.actors) {
      const steer = applyBehavior(actor, rand);
      actor.ax = steer.ax;
      actor.ay = steer.ay;
    }

    // 2. Apply acceleration
    for (const actor of state.actors) {
      actor.vx += actor.ax;
      actor.vy += actor.ay;
    }

    // 3. Apply friction
    for (const actor of state.actors) {
      actor.vx *= state.friction;
      actor.vy *= state.friction;
    }

    // 4. Clamp speed
    for (const actor of state.actors) {
      const speed = Math.sqrt(actor.vx*actor.vx + actor.vy*actor.vy);
      if (speed > state.maxSpeed) {
        const scale = state.maxSpeed / speed;
        actor.vx *= scale;
        actor.vy *= scale;
      }
    }

    // 5. Integrate velocity
    for (const actor of state.actors) {
      actor.x += actor.vx;
      actor.y += actor.vy;
    }

    return state.tick < state.maxTicks;
  }

  // ------------------------------------------------------------
  // RUN — with built‑in RNG fallback
  // ------------------------------------------------------------

  function run(rand) {
    rand = rand || Math.random;   // <— FIX: wander now always works

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
// Minimal Test Scenario V1 — Steering Behaviors
// ------------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  maxTicks: 10,
  friction: 0.96,
  maxSpeed: 2.5,

  actors: [
    { id: "seeker", x: 0, y: 0, behavior: "seek", target: { x: 5, y: 5 } },
    { id: "fleeer", x: 2, y: 2, behavior: "flee", target: { x: 5, y: 5 } },
    { id: "wanderer", x: -2, y: 0, behavior: "wander", wanderAngle: 0 },
    { id: "patroller", x: -4, y: -4, behavior: "patrol",
      path: [ { x: -4, y: -4 }, { x: -1, y: -1 } ] }
  ]
};
