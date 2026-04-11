// APEX ENGINE FAMILY — MASTER ORCHESTRATOR
// Clean, stable, world‑agnostic, and dependency‑safe.

import { APEXCORE } from "./apexcore.js";
import { APEXAI } from "./apexai.js";
import { APEXSIM } from "./apexsim.js";
import { APEXOPS } from "./apexops.js";

export class ApexEngine {

    constructor() {
        this.version = "3.0.0";

        // Register modules into APEXCORE
        APEXCORE.register("APEXAI", APEXAI);
        APEXCORE.register("APEXSIM", APEXSIM);
        APEXCORE.register("APEXOPS", APEXOPS);

        this.core = APEXCORE;
        this.ai = APEXAI;
        this.sim = APEXSIM;
        this.ops = APEXOPS;

        this.log("ApexEngine initialized.");
    }

    // Core logging passthrough
    log(msg) {
        this.core.log(`[ENGINE] ${msg}`);
    }

    // Generate a scenario via AI module
    generateScenario() {
        const scenario = this.ai.generateScenario();
        this.log("Scenario generated.");
        return scenario;
    }

    // Evaluate a scenario via AI module
    evaluateScenario() {
        const result = this.ai.evaluateScenario();
        this.log("Scenario evaluated.");
        return result;
    }

    // Run a simulation tick
    tickSimulation() {
        const tick = this.sim.tick();
        this.log("Simulation tick executed.");
        return tick;
    }

    // Inspect a simulation tick via OPS module
    inspectTick(tickData) {
        const report = this.ops.inspect(tickData);
        this.log("OPS inspection completed.");
        return report;
    }

    // System heartbeat
    ping() {
        return this.core.ping();
    }
}

// Default engine instance for convenience
export const ENGINE = new ApexEngine();
