/*
    APEXCORE v4.4 — Engine (Tick-Enabled)
    - Adds tick(dt) support for all modules
    - Ensures consistent timing across HALO + APEXSIM
    - Stable render order
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

        // UPDATE + TICK PHASE
        for (const key in modules) {
            const mod = modules[key];

            if (!mod) continue;

            if (typeof mod.update === "function") {
                mod.update(dt);
            }

            if (typeof mod.tick === "function") {
                mod.tick(dt);
            }
        }

        // RENDER PHASE (strict order)
        const halo = APEX.get("renderer");
        const sim  = APEX.get("apexsim-renderer");
        const hud  = APEX.get("overlay");

        if (halo && typeof halo.render === "function") halo.render();
        if (sim  && typeof sim.render  === "function") sim.render();
        if (hud  && typeof hud.render  === "function") hud.render();

        requestAnimationFrame(loop);
    }

    function getDelta() {
        return state.delta * 1000;
    }

    APEX.register("engine", {
        type: "engine",
        start,
        getDelta
    });

})();
