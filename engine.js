/*
    APEXCORE v4.4 — Engine Loop (Stable HALO Crew)
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

        // UPDATE
        for (const key in modules) {
            const m = modules[key];
            if (typeof m.update === "function") {
                try {
                    m.update(state);
                } catch (err) {
                    console.error(`APEXCORE v4.4 — Error in update() of ${key}`, err);
                }
            }
        }

        // RENDER
        const renderer = APEX.get("renderer");
        if (renderer && typeof renderer.render === "function") {
            try {
                renderer.render(state);
            } catch (err) {
                console.error("APEXCORE v4.4 — Error in renderer.render()", err);
            }
        }

        requestAnimationFrame(engineLoop);
    }

    function startEngine() {
        if (running) return;
        running = true;

        console.log("APEXCORE v4.4 — Engine Online");
        APEX.startAll();
        requestAnimationFrame(engineLoop);
    }

    APEX.register("engine", { type: "engine", start: startEngine });

    window.addEventListener("load", () => {
        const engine = APEX.get("engine");
        if (engine && typeof engine.start === "function") {
            console.log("APEXCORE v4.4 — Forcing engine start from window.load");
            engine.start();
        }
    });

})();
