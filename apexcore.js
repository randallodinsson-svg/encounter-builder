/* ============================================================
   APEXCORE v3 — Modular System Core
   Central orchestrator for APEXAI, APEXSIM, APEXOPS, and engines
   Clean, deterministic, browser-native
   ============================================================ */

export const APEXCORE = (() => {

    /* ------------------------------------------------------------
       INTERNAL STATE
    ------------------------------------------------------------ */
    let modules = {};
    let lifecycle = {
        initialized: false,
        started: false
    };

    let eventBus = {};
    let seed = Date.now();

    /* ------------------------------------------------------------
       UTILITY FUNCTIONS
    ------------------------------------------------------------ */

    function log(msg) {
        console.log("[APEXCORE]", msg);
    }

    function generateSeed() {
        seed = Date.now();
        return seed;
    }

    function on(event, handler) {
        if (!eventBus[event]) eventBus[event] = [];
        eventBus[event].push(handler);
    }

    function emit(event, data) {
        if (eventBus[event]) {
            for (const handler of eventBus[event]) {
                handler(data);
            }
        }
    }

    /* ------------------------------------------------------------
       MODULE REGISTRATION
    ------------------------------------------------------------ */

    function registerModule(name, instance) {
        modules[name] = instance;
        log(`Module registered: ${name}`);
    }

    function getModule(name) {
        return modules[name] || null;
    }

    /* ------------------------------------------------------------
       LIFECYCLE MANAGEMENT
    ------------------------------------------------------------ */

    function init() {
        if (lifecycle.initialized) return;
        lifecycle.initialized = true;

        generateSeed();
        emit("core:init", { seed });

        log("APEXCORE initialized.");
    }

    function start() {
        if (!lifecycle.initialized) init();
        if (lifecycle.started) return;

        lifecycle.started = true;
        emit("core:start");

        log("APEXCORE started.");
    }

    function reset() {
        lifecycle = { initialized: false, started: false };
        modules = {};
        eventBus = {};
        seed = Date.now();

        log("APEXCORE reset.");
    }

    /* ------------------------------------------------------------
       STANDARDIZED SIMULATION PIPELINE
    ------------------------------------------------------------ */

    function runSimulationStep() {
        const sim = modules["APEXSIM"];
        if (!sim || !sim.step) return;

        const result = sim.step();
        emit("sim:step", result);
        return result;
    }

    function runOpsStep() {
        const ops = modules["APEXOPS"];
        if (!ops || !ops.update) return;

        const result = ops.update();
        emit("ops:update", result);
        return result;
    }

    function runAIStep() {
        const ai = modules["APEXAI"];
        if (!ai || !ai.evaluateScenario) return;

        const result = ai.evaluateScenario();
        emit("ai:evaluate", result);
        return result;
    }

    /* ------------------------------------------------------------
       PUBLIC API
    ------------------------------------------------------------ */

    return {
        // lifecycle
        init,
        start,
        reset,

        // modules
        registerModule,
        getModule,

        // events
        on,
        emit,

        // seed
        generateSeed,

        // pipeline
        runSimulationStep,
        runOpsStep,
        runAIStep
    };

})();
