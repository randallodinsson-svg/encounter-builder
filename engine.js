/* ========================================================================
   engine.js — APEX ENGINE FAMILY ORCHESTRATOR
   ------------------------------------------------------------------------
   Author: Randy Sellhausen (APEXCORE Platform)
   Module: Engine Loader / Orchestrator
   Version: 3.0.0
   Identity: Industrial, world‑agnostic, platform‑neutral
   Purpose: Unified loader that initializes APEXCORE, registers modules,
            and exposes a clean API for the APEX System Shell.
   ======================================================================== */

import { createApexCore } from './apexcore.js';
import { createApexAI } from './apexai.js';
import { createApexSim, MinimalTestScenarioV1 } from './apexsim.js';
import { createApexOps } from './apexops.js';

/* ========================================================================
   ENGINE ORCHESTRATOR
   ======================================================================== */

export class ApexEngine {
  constructor() {
    /* ------------------------------------------------------------
       CORE INITIALIZATION
       ------------------------------------------------------------ */
    this.core = createApexCore();

    /* ------------------------------------------------------------
       MODULE INITIALIZATION
       ------------------------------------------------------------ */
    this.ai = createApexAI(this.core);

    // Default simFactory for OPS + SIM panels
    this.simFactory = scenario => createApexSim(scenario);

    // OPS is UI‑bound, so we instantiate it lazily
    this.ops = null;

    /* ------------------------------------------------------------
       DEFAULT SCENARIO
       ------------------------------------------------------------ */
    this.core.loadScenario(MinimalTestScenarioV1);

    /* ------------------------------------------------------------
       EVENT LOGGING (for debugging + shell panels)
       ------------------------------------------------------------ */
    this._wireEvents();
  }

  /* ========================================================================
     EVENT BUS WIRING
     ======================================================================== */
  _wireEvents() {
    this.core.on("core:boot", () => this._log("CORE booted."));
    this.core.on("core:shutdown", () => this._log("CORE shutdown."));

    this.core.on("scenario:loaded", sc =>
      this._log(`Scenario loaded: ${sc.id}`)
    );

    this.core.on("simulation:start", () =>
      this._log("Simulation started.")
    );

    this.core.on("simulation:complete", () =>
      this._log("Simulation completed.")
    );

    this.core.on("module:registered", m =>
      this._log(`Module registered: ${m.id}`)
    );
  }

  _log(msg) {
    console.log(`[APEXENGINE] ${msg}`);
  }

  /* ========================================================================
     OPS INITIALIZATION (LAZY)
     ======================================================================== */
  mountOps(rootId) {
    this.ops = createApexOps(rootId, this.simFactory);
    this._log("APEXOPS mounted.");
    return this.ops;
  }

  /* ========================================================================
     SIMULATION HELPERS
     ======================================================================== */
  runSimulation() {
    return this.core.startSimulation(this.simFactory);
  }

  loadScenario(scenario) {
    this.core.loadScenario(scenario);
  }

  /* ========================================================================
     AI HELPERS
     ======================================================================== */
  generateScenario(generatorId, options = {}) {
    return this.ai.generateScenario(generatorId, options);
  }

  generateBatch(generatorId, count = 5, options = {}) {
    return this.ai.generateBatch(generatorId, count, options);
  }

  evaluateScenario(evaluatorId, scenario) {
    return this.ai.evaluateScenario(evaluatorId, scenario);
  }

  evaluateBatch(evaluatorId, scenarios) {
    return this.ai.evaluateBatch(evaluatorId, scenarios);
  }

  /* ========================================================================
     EXPORT API
     ======================================================================== */
  getAPI() {
    return {
      core: this.core,
      ai: this.ai,
      ops: this.ops,
      runSimulation: () => this.runSimulation(),
      loadScenario: s => this.loadScenario(s),
      generateScenario: (id, opt) => this.generateScenario(id, opt),
      generateBatch: (id, n, opt) => this.generateBatch(id, n, opt),
      evaluateScenario: (id, sc) => this.evaluateScenario(id, sc),
      evaluateBatch: (id, list) => this.evaluateBatch(id, list)
    };
  }
}

/* ========================================================================
   FACTORY — Create a fully configured ApexEngine instance
   ======================================================================== */
export function createApexEngine() {
  return new ApexEngine();
}
