// apexsim_v1.js
// APEXSIM v1 — Deterministic Simulation Engine + Minimal Test Scenario

export class ApexSim {
  constructor(scenario) {
    this.scenario = structuredClone(scenario);
    this.tick = 0;
    this.running = false;

    this.state = {
      global: { ...(this.scenario.state || {}), ticksElapsed: 0 },
      actors: this.indexActors(this.scenario.actors || []),
      logs: [],
      outcome: null
    };
  }

  indexActors(actorsArray) {
    const map = {};
    for (const actor of actorsArray) {
      map[actor.id] = { ...actor };
    }
    return map;
  }

  start() {
    this.running = true;
    this.log("Simulation started");
    while (this.running) {
      this.step();
    }
    return this.buildResult();
  }

  step() {
    this.tick++;
    this.state.global.ticksElapsed = this.tick;

    this.processTimeline();
    this.evaluateTriggers();
    this.updateActors();
    this.checkOutcomes();
  }

  processTimeline() {
    const entries = this.scenario.timeline || [];
    for (const entry of entries) {
      if (entry.time === this.tick) {
        this.fireEventById(entry.eventId);
      }
    }
  }

  evaluateTriggers() {
    const triggers = this.scenario.triggers || [];
    for (const trigger of triggers) {
      if (trigger.consumed) continue;
      if (this.evaluateCondition(trigger.condition)) {
        for (const eventId of trigger.events) {
          this.fireEventById(eventId);
        }
        if (trigger.oneShot) trigger.consumed = true;
      }
    }
  }

  updateActors() {
    // v1 placeholder for future behavior logic
    for (const actorId in this.state.actors) {
      const actor = this.state.actors[actorId];
      // status, cooldowns, etc. in later versions
    }
  }

  fireEventById(eventId) {
    const event = (this.scenario.events || []).find(e => e.id === eventId);
    if (!event) return;
    this.applyEventEffects(event);
    this.log(`Event fired: ${event.id}`);
  }

  applyEventEffects(event) {
    if (event.effects?.global) {
      Object.assign(this.state.global, event.effects.global);
    }
    if (event.effects?.actors) {
      for (const change of event.effects.actors) {
        const actor = this.state.actors[change.id];
        if (!actor) continue;
        Object.assign(actor, change.patch || {});
      }
    }
  }

  evaluateCondition(condition) {
    if (!condition) return false;
    switch (condition.type) {
      case "tickEquals":
        return this.tick === condition.value;
      case "globalEquals":
        return this.state.global[condition.key] === condition.value;
      case "actorPositionGte": {
        const actor = this.state.actors[condition.actorId];
        return actor && actor.position >= condition.value;
      }
      default:
        return false;
    }
  }

  checkOutcomes() {
    const outcomes = this.scenario.outcomes || [];
    for (const outcome of outcomes) {
      if (this.evaluateCondition(outcome.condition)) {
        this.state.outcome = outcome;
        this.running = false;
        this.log(`Outcome reached: ${outcome.id} (${outcome.type})`);
        break;
      }
    }
  }

  log(message) {
    this.state.logs.push({
      tick: this.tick,
      message
    });
  }

  buildResult() {
    return {
      finalState: this.state,
      outcome: this.state.outcome,
      ticks: this.tick,
      logs: this.state.logs
    };
  }
}

// -----------------------------
// Minimal Test Scenario (v1)
// -----------------------------

export const MinimalTestScenarioV1 = {
  id: "minimal_test_scenario_v1",
  metadata: {
    name: "Room Evacuation — Basic",
    description: "Simple deterministic scenario to validate the APEXSIM v1 loop.",
    version: "1.0"
  },

  settings: {
    timeMode: "tick",
    maxTicks: 10
  },

  environment: {
    id: "room_1",
    type: "room",
    description: "A single room with one exit door."
  },

  actors: [
    {
      id: "civilian",
      type: "human",
      position: 0,
      state: {},
      attributes: {
        speed: 1
      }
    },
    {
      id: "helper",
      type: "human",
      position: 0,
      state: {}
    }
  ],

  state: {
    doorOpen: false,
    ticksElapsed: 0
  },

  events: [
    {
      id: "openDoor",
      effects: {
        global: {
          doorOpen: true
        }
      }
    },
    {
      id: "moveCivilian",
      effects: {
        actors: [
          {
            id: "civilian",
            patch: {
              // v1: simple increment-by-1 model; engine just overwrites
              position: 0 // placeholder; logic is driven by scenario design
            }
          }
        ]
      }
    }
  ],

  triggers: [
    {
      id: "trigger_open_door",
      condition: {
        type: "tickEquals",
        value: 2
      },
      events: ["openDoor"],
      oneShot: true
    },
    {
      id: "trigger_move_civilian",
      condition: {
        type: "globalEquals",
        key: "doorOpen",
        value: true
      },
      events: ["moveCivilian"],
      oneShot: false
    }
  ],

  outcomes: [
    {
      id: "success",
      type: "success",
      condition: {
        type: "actorPositionGte",
        actorId: "civilian",
        value: 5
      }
    },
    {
      id: "failure",
      type: "failure",
      condition: {
        type: "globalEquals",
        key: "ticksElapsed",
        value: 10
      }
    }
  ],

  timeline: [
    {
      time: 2,
      eventId: "openDoor"
    }
  ]
};

// -----------------------------
// Example Runner / APEXOPS Hook
// -----------------------------

export function runMinimalTestScenario() {
  const sim = new ApexSim(MinimalTestScenarioV1);
  const result = sim.start();

  // This is the conceptual APEXOPS hook:
  // APEXOPS.loadSimulationResult(result);

  console.log("APEXSIM v1 — Minimal Test Scenario Result:", result);
  return result;
}
