/* ========================================================================
   APEXCORE v3 — SYSTEM SHELL & LIFECYCLE MANAGER
   ------------------------------------------------------------------------
   Author: Randy Sellhausen (APEXCORE Platform)
   Module: APEXCORE — System Layer
   Version: 3.0.0
   Identity: Industrial, world‑agnostic, platform‑neutral
   Purpose: Unified module registry, lifecycle manager, event bus,
            deterministic simulation pipeline, and scenario loader.
   ======================================================================== */

export class ApexCore {
  constructor() {
    /* ------------------------------------------------------------
       MODULE REGISTRY
       ------------------------------------------------------------ */
    this.modules = {};

    /* ------------------------------------------------------------
       ACTIVE SCENARIO
       ------------------------------------------------------------ */
    this.activeScenario = null;

    /* ------------------------------------------------------------
       EVENT BUS
       ------------------------------------------------------------ */
    this.listeners = {};

    /* ------------------------------------------------------------
       DETERMINISTIC RNG SEED
       ------------------------------------------------------------ */
    this.seed = 20240601;
  }

  /* ========================================================================
     RNG — Deterministic pseudo‑random generator
     ======================================================================== */
  rand() {
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  /* ========================================================================
     MODULE REGISTRATION
     ======================================================================== */
  registerModule(id, instance) {
    this.modules[id] = instance;
    this.emit("module:registered", { id, instance });
  }

  getModule(id) {
    return this.modules[id] || null;
  }

  /* ========================================================================
     EVENT BUS
     ======================================================================== */
  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  emit(event, payload) {
    const handlers = this.listeners[event];
    if (!handlers) return;
    for (const fn of handlers) fn(payload);
  }

  /* ========================================================================
     SCENARIO LOADING
     ======================================================================== */
  loadScenario(scenarioDef) {
    if (!scenarioDef) throw new Error("APEXCORE: scenarioDef is null");

    this.activeScenario = {
      ...scenarioDef,
      id: scenarioDef.id || this._generateScenarioId(),
      loadedAt: Date.now()
    };

    this.emit("scenario:loaded", this.activeScenario);
  }

  _generateScenarioId() {
    return "scenario-" + Math.floor(this.rand() * 1e9).toString(36);
  }

  /* ========================================================================
     SIMULATION PIPELINE
     ------------------------------------------------------------------------
     startSimulation(simFactory)
     - simFactory: (scenario) => new ApexSim(scenario)
     ======================================================================== */
  startSimulation(simFactory) {
    if (!this.activeScenario)
      throw new Error("APEXCORE: No scenario loaded before simulation.");

    if (typeof simFactory !== "function")
      throw new Error("APEXCORE: simFactory must be a function.");

    this.emit("simulation:start", { scenario: this.activeScenario });

    const sim = simFactory(this.activeScenario);
    if (!sim || typeof sim.run !== "function")
      throw new Error("APEXCORE: simFactory must return an object with run().");

    const result = sim.run({
      rand: () => this.rand(),
      emit: (evt, data) => this.emit(evt, data)
    });

    const wrapped = {
      scenarioId: this.activeScenario.id,
      timestamp: Date.now(),
      result
    };

    this.emit("simulation:complete", wrapped);
    return wrapped;
  }

  /* ========================================================================
     LIFECYCLE HOOKS
     ======================================================================== */
  boot() {
    this.emit("core:boot", { timestamp: Date.now() });
  }

  shutdown() {
    this.emit("core:shutdown", { timestamp: Date.now() });
  }
}

/* ========================================================================
   FACTORY — Create a fully configured APEXCORE instance
   ======================================================================== */
export function createApexCore() {
  const core = new ApexCore();
  core.boot();
  return core;
}
