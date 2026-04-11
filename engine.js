/* ============================================================
   APEX ENGINE FAMILY — MASTER ORCHESTRATOR (v3 Unified Edition)
   Author: Randy Sellhausen — VECTORCORE INTERACTIVE
   Purpose: Tie together APEXCORE, APEXAI, APEXSIM, APEXOPS
   ============================================================ */

import { APEXCORE } from "./apexcore.js";
import { APEXAI }   from "./apexai.js";
import { APEXSIM }  from "./apexsim.js";
import { APEXOPS }  from "./apexops.js";

/* ------------------------------------------------------------
   ENGINE CLASS
------------------------------------------------------------ */
export class ApexEngine {

    constructor() {
        this.core = APEXCORE;
        this.ai   = APEXAI;
        this.sim  = APEXSIM;
        this.ops  = APEXOPS;

        this.initialized = false;
        this.started     = false;

        this._registerModules();
    }

    /* ------------------------------------------------------------
       MODULE REGISTRATION
    ------------------------------------------------------------ */
    _registerModules() {
        this.core.registerModule("APEXAI",  this.ai);
        this.core.registerModule("APEXSIM", this.sim);
        this.core.registerModule("APEXOPS", this.ops);
    }

    /* ------------------------------------------------------------
       LIFECYCLE
    ------------------------------------------------------------ */
    init(canvas = null) {
        if (this.initialized) return;

        this.core.init();

        if (canvas) {
            this.sim.init(canvas);
        }

        this.initialized = true;
        console.log("[ENGINE] Initialized.");
    }

    start() {
        if (!this.initialized) this.init();
        if (this.started) return;

        this.core.start();
        this.started = true;

        console.log("[ENGINE] Started.");
    }

    reset() {
        this.core.reset();
        this.initialized = false;
        this.started = false;

        console.log("[ENGINE] Reset.");
    }

    /* ------------------------------------------------------------
       UNIFIED ENGINE API
    ------------------------------------------------------------ */

    // AI
    generateScenario() {
        return this.ai.generateScenario();
    }

    evaluateScenario() {
        return this.ai.evaluateScenario();
    }

    setDifficulty(level) {
        this.ai.setDifficulty(level);
    }

    // SIM
    simStep() {
        return this.core.runSimulationStep();
    }

    loadDefaultScenario() {
        return this.sim.loadDefaultScenario();
    }

    // OPS
    opsStep() {
        return this.core.runOpsStep();
    }

    // AI Step (evaluation)
    aiStep() {
        return this.core.runAIStep();
    }

    /* ------------------------------------------------------------
       DEBUG / INTROSPECTION
    ------------------------------------------------------------ */
    getState() {
        return {
            core: "APEXCORE v3",
            ai: this.ai.getState ? this.ai.getState() : "AI state unavailable",
            sim: this.sim.getState(),
            ops: this.ops.getState ? this.ops.getState() : "OPS state unavailable"
        };
    }
}

/* ------------------------------------------------------------
   DEFAULT ENGINE INSTANCE
------------------------------------------------------------ */
export const ENGINE = new ApexEngine();

console.log("[ENGINE] APEX Engine Family v3 loaded.");
