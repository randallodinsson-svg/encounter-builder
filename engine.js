/*
    APEXCORE v4.2 — Engine Loop (FULLNUKE Edition)
    Handles timing, updates, and rendering.
*/

(function () {

    let lastTime = performance.now();
    let running = false;

    function engineLoop(time) {
        if (!running) return;

        const delta = time - lastTime;
        lastTime = time;

        const state = { time, delta };

        const modules = APEX.all();

        // === UPDATE PHASE ===
        for (const key in modules) {
            const m = modules[key];
            if (typeof m.update === "function") {
                try {
                    m.update(state);
                } catch (err) {
                    console.error(`APEXCORE v4.2 — Error in update() of module: ${key}`, err);
                }
            }
        }

        // === RENDER PHASE ===
        const renderer = APEX.get("renderer");
        if (renderer && typeof renderer.render === "function") {
            try {
                renderer.render(state);
            } catch (err) {
                console.error("APEXCORE v4.2 — Error in renderer.render()", err);
            }
        }

        requestAnimationFrame(engineLoop);
    }

    function startEngine() {
        if (running) return;
        running = true;

        console.log("APEXCORE v4.2 — Engine Online");

        // Start all modules AFTER engine is online
        console.log("APEXCORE v4.2 — Starting all modules from engine.js");
        APEX.startAll();

        requestAnimationFrame(engineLoop);
    }

    // Register engine module
    const EngineModule = {
        type: "engine",
        start: startEngine
    };

    APEX.register("engine", EngineModule);

    // ===================================================================================
    // FORCE ENGINE START FROM ENGINE.JS (SAFETY NET)
    // ===================================================================================
    window.addEventListener("load", () => {
        const engine = APEX.get("engine");
        if (engine && typeof engine.start === "function") {
            console.log("APEXCORE v4.2 — Forcing engine start from window.load");
            engine.start();
        } else {
            console.warn("Engine module not found during window.load startup.");
        }
    });

})();
