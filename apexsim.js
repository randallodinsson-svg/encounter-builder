/* ========================================================================
   APEXSIM v3 — DETERMINISTIC SIMULATION ENGINE
   ------------------------------------------------------------------------
   Author: Randy Sellhausen (APEXCORE Platform)
   Module: APEXSIM — Simulation Layer
   Version: 3.0.0 (Standard Edition)
   Identity: Industrial, world‑agnostic, platform‑neutral
   Purpose: Deterministic tick‑based simulation engine compatible with
            APEXCORE v3 and APEXOPS v3.
   ======================================================================== */

export class ApexSim {
  constructor(scenario) {
    this.scenario = scenario;

    // Simulation state container
    this.state = {
      tick: 0,
      actors: [],
      events: [],
      done: false
    };

    // Deterministic seed (inherited from APEXCORE)
    this.rand = null;
    this.emit = null;
  }

  /* ========================================================================
     INITIALIZE SIMULATION
     ======================================================================== */
  _init(context) {
    this.rand = context.rand;
    this.emit = context.emit;

    // Initialize actors if scenario defines them
    if (this.scenario.actors) {
      this.state.actors = JSON.parse(JSON.stringify(this.scenario.actors));
    }

    this.emit("sim:init", { scenarioId: this.scenario.id });
  }

  /* ========================================================================
     SINGLE TICK
     ======================================================================== */
  _tick() {
    this.state.tick++;

    // Example deterministic event
    const r = this.rand();
    if (r > 0.95) {
      const evt = {
        tick: this.state.tick,
        type: "random-spike",
        value: r
      };
      this.state.events.push(evt);
      this.emit("sim:event", evt);
    }

    // Example actor update
    for (const actor of this.state.actors) {
      if (typeof actor.update === "function") {
        actor.update({ rand: this.rand });
      }
    }

    // Example termination condition
    if (this.state.tick >= (this.scenario.maxTicks || 20)) {
      this.state.done = true;
    }
  }

  /* ========================================================================
     RUN SIMULATION (MAIN ENTRY POINT)
     ======================================================================== */
  run(context) {
    this._init(context);

    while (!this.state.done) {
      this._tick();
    }

    const result = {
      scenarioId: this.scenario.id,
      ticks: this.state.tick,
      events: this.state.events,
      actors: this.state.actors
    };

    this.emit("sim:complete", result);
    return result;
  }
}

/* ========================================================================
   MINIMAL TEST SCENARIO (BUILT-IN)
   ------------------------------------------------------------------------
   Used by APEXOPS and APEXSIM panels for quick validation.
   ======================================================================== */

export const MinimalTestScenarioV1 = {
  id: "minimal-test-v1",
  title: "Minimal Test Scenario",
  summary: "A deterministic test scenario for validating APEXSIM.",
  maxTicks: 10,

  actors: [
    {
      id: "actor-1",
      x: 0,
      update({ rand }) {
        // Simple deterministic movement
        this.x += rand() * 0.5;
      }
    }
  ]
};

/* ========================================================================
   FACTORY — Create a new APEXSIM instance
   ======================================================================== */
export function createApexSim(scenario) {
  return new ApexSim(scenario);
}
