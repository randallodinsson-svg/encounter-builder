/*
    APEXCORE v4.4 — Engine
    Corrected Render Order:
    1. HALO Renderer
    2. APEXSIM Renderer
    3. Overlay
*/

(function () {

    const state = {
        lastTime: performance.now(),
        delta: 0,
        running: false
    };

    function start() {
        if (state.running) return;
        state.running = true;

        console.log("APEXCORE v4.4 — Engine Online");

        const modules = APEX.all();

        // Start all modules that have a start() function
        console.log("APEXCORE v4.4 — Starting all modules...");
        for (const key in modules) {
            const mod = modules[key];
            if (mod && typeof mod.start === "function") {
                console.log("APEXCORE v4.4 — Starting module:", key);
                mod.start();
            }
        }

        requestAnimationFrame(loop);
    }

    function loop(now) {
        if (!state.running) return;

        state.delta = (now - state.lastTime) / 1000;
        state.lastTime = now;

        const dt = state.delta;

        const modules = APEX.all();

        // UPDATE PHASE (order does not matter)
        for (const key in modules) {
            const mod = modules[key];
            if (mod && typeof mod.update === "function") {
                mod.update(dt);
            }
        }

        // RENDER PHASE (order DOES matter)
        const halo = APEX.get("renderer");            // HALO renderer
        const sim = APEX.get("apexsim-renderer");    // APEXSIM renderer
        const overlay = APEX.get("overlay");         // HUD overlay

        // 1. HALO (background)
        if (halo && typeof halo.render === "function") {
            halo.render();
        }

        // 2. APEXSIM (draws on top of HALO)
        if (sim && typeof sim.render === "function") {
            sim.render();
        }

        // 3. Overlay (HUD text)
        if (overlay && typeof overlay.render === "function") {
            overlay.render();
        }

        requestAnimationFrame(loop);
    }

    function getDelta() {
        return state.delta * 1000; // ms
    }

    APEX.register("engine", {
        type: "engine",
        start,
        getDelta
    });

})();
