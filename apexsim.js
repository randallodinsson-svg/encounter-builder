// apexsim.js
// APEXSIM v2 — 1D Movement + Behavior Engine

export class ApexSim {
  constructor(scenario) {
    this.scenario = scenario;
    this.maxTicks = scenario.maxTicks ?? 20;
    this.currentTick = 0;
    this.logs = [];
    this.state = this._initializeState(scenario);
    this.outcome = null;
  }

  _initializeState(scenario) {
    const global = {
      ...scenario.initialGlobalState,
      ticksElapsed: 0
    };

    const actors = {};
    for (const actorDef of scenario.actors) {
      actors[actorDef.id] = {
        id: actorDef.id,
        type: actorDef.type ?? "actor",
        position: actorDef.position ?? 0,
        velocity: actorDef.velocity ?? 0,
        speed: actorDef.speed ?? 1,
        acceleration: actorDef.acceleration ?? 0,
        direction: actorDef.direction ?? 1, // +1 or -1
        state: actorDef.state ?? {},
        attributes: actorDef.attributes ?? {},
        behavior: actorDef.behavior ?? null
      };
    }

    return { global, actors };
  }

  log(message) {
    this.logs.push({ tick: this.currentTick, message });
  }

  start() {
    this.currentTick = 0;
    this.log("Simulation started");

    while (this.currentTick < this.maxTicks && !this.outcome) {
      this._tick();
      this.currentTick++;
    }

    if (!this.outcome) {
      // If no explicit outcome, let scenario decide or mark as failure
      this.outcome =
        this.scenario.checkOutcome?.(this.state, this.currentTick, this.logs) ||
        { id: "failure", label: "failure", reason: "Max ticks reached without success." };
      this.log(`Outcome reached: ${this.outcome.id} (${this.outcome.label || this.outcome.id})`);
    }

    return {
      ticks: this.currentTick,
      finalState: this.state,
      logs: this.logs,
      outcome: this.outcome
    };
  }

  _tick() {
    const { global, actors } = this.state;

    // Tick start hook
    if (this.scenario.onTickStart) {
      this.scenario.onTickStart(this.state, this.currentTick, this.logs);
    }

    // 1) Run behaviors → produce events
    const events = [];
    for (const id in actors) {
      const actor = actors[id];
      if (typeof actor.behavior === "function") {
        const result = actor.behavior(actor, this.state, this.currentTick);
        if (result && result.event) {
          events.push({
            actorId: id,
            id: result.event,
            params: result.params ?? {}
          });
        }
      }
    }

    // 2) Apply movement (1D)
    for (const id in actors) {
      const actor = actors[id];

      // Basic 1D movement model
      actor.velocity += actor.acceleration;
      if (actor.velocity < 0) actor.velocity = 0;
      if (actor.velocity > actor.speed) actor.velocity = actor.speed;

      actor.position += actor.velocity * actor.direction;
    }

    // 3) Process events
    for (const evt of events) {
      this._processEvent(evt, this.state);
    }

    // 4) Update global tick count
    global.ticksElapsed = this.currentTick;

    // 5) Check outcome
    if (this.scenario.checkOutcome) {
      const outcome = this.scenario.checkOutcome(this.state, this.currentTick, this.logs);
      if (outcome) {
        this.outcome = outcome;
      }
    }

    // Tick end hook
    if (this.scenario.onTickEnd) {
      this.scenario.onTickEnd(this.state, this.currentTick, this.logs);
    }
  }

  _processEvent(event, state) {
    const { id, params, actorId } = event;
    const actor = state.actors[actorId];

    switch (id) {
      case "move":
        if (!actor) return;
        // Direct position adjustment in addition to movement model
        actor.position += (params.distance ?? 1) * (params.direction ?? actor.direction ?? 1);
        this.log(
          `Event fired: move (actor=${actorId}, distance=${params.distance ?? 1}, dir=${params.direction ?? actor.direction ?? 1})`
        );
        break;

      case "changeDirection":
        if (!actor) return;
        actor.direction = params.direction ?? actor.direction;
        this.log(`Event fired: changeDirection (actor=${actorId}, dir=${actor.direction})`);
        break;

      case "accelerate":
        if (!actor) return;
        actor.acceleration = params.acceleration ?? actor.acceleration;
        this.log(`Event fired: accelerate (actor=${actorId}, accel=${actor.acceleration})`);
        break;

      case "openDoor":
        state.global.doorOpen = true;
        this.log("Event fired: openDoor");
        break;

      default:
        this.log(`Event fired: ${id}`);
        break;
    }
  }
}

// ------------------------------------------------------
// Minimal Test Scenario v1 (upgraded for v2 movement)
// ------------------------------------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal_v2_1d",
  label: "Minimal 1D Movement Scenario",

  maxTicks: 20,

  initialGlobalState: {
    doorOpen: false
  },

  actors: [
    {
      id: "civilian",
      type: "human",
      position: 0,
      velocity: 0,
      speed: 1,
      acceleration: 1,
      direction: 1,
      state: {},
      attributes: { role: "civilian" },
      behavior: (actor, state, tick) => {
        // Civilian tries to move toward position >= 5
        if (!state.global.doorOpen && tick === 1) {
          return { event: "openDoor" };
        }

        if (state.global.doorOpen && actor.position < 5) {
          return { event: "move", params: { distance: 1 } };
        }

        return null;
      }
    },
    {
      id: "helper",
      type: "human",
      position: 0,
      velocity: 0,
      speed: 1,
      acceleration: 0,
      direction: 1,
      state: {},
      attributes: { role: "helper" },
      behavior: (actor, state, tick) => {
        // Helper is idle in v2 minimal scenario
        return null;
      }
    }
  ],

  checkOutcome(state, tick, logs) {
    const civilian = state.actors["civilian"];

    if (civilian && civilian.position >= 5) {
      return {
        id: "success",
        label: "success",
        reason: "Civilian reached safe position."
      };
    }

    if (tick >= 19) {
      return {
        id: "failure",
        label: "failure",
        reason: "Civilian did not reach safe position in time."
      };
    }

    return null;
  },

  onTickStart(state, tick, logs) {
    // Optional: could log or mutate state here
  },

  onTickEnd(state, tick, logs) {
    // Optional: could log or mutate state here
  }
};
