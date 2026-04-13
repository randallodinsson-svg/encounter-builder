/*
    APEXCORE v4.2 — Engine Loop
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
                m.update(state);
            }
        }

        // === RENDER PHASE ===
        const renderer = APEX.get("renderer");
        if (renderer && typeof renderer.render === "function") {
            renderer.render(state);
        }

        requestAnimationFrame(engineLoop);
    }

    function startEngine() {
        if (running) return;
        running = true;

        console.log("APEXCORE v4.2 — Engine Online");

        // NEW: Start all modules BEFORE the loop begins
        APEX.startAll();

        requestAnimationFrame(engineLoop);
    }

    // Register engine module
    const EngineModule = {
        type: "engine",
        start: startEngine
    };

    APEX.register("engine", EngineModule);

})();
