/*
    APEXCORE — Tick Profiler
    Measures per-module update cost on each tick.
*/

(function () {
    if (typeof APEXCORE === "undefined") {
        console.warn("APEXCORE Tick Profiler: APEXCORE not found.");
        return;
    }

    const samples = {};
    const SAMPLE_WINDOW = 60; // frames

    function recordSample(name, duration) {
        if (!samples[name]) {
            samples[name] = [];
        }
        samples[name].push(duration);
        if (samples[name].length > SAMPLE_WINDOW) {
            samples[name].shift();
        }
    }

    function summarize() {
        const rows = Object.keys(samples).map((name) => {
            const arr = samples[name];
            const sum = arr.reduce((a, b) => a + b, 0);
            const avg = arr.length ? sum / arr.length : 0;
            const max = arr.length ? Math.max(...arr) : 0;
            return {
                module: name,
                avgMs: +avg.toFixed(3),
                maxMs: +max.toFixed(3),
                samples: arr.length
            };
        });

        console.group("APEXCORE — Tick Profiler");
        console.table(rows);
        console.groupEnd();
    }

    APEXCORE.onTick(() => {
        const snapshot = APEXCORE.snapshot();
        const modules = snapshot.modules;

        for (const name of modules) {
            const mod = APEXCORE.get(name);
            if (!mod || typeof mod.update !== "function") continue;

            const start = performance.now();
            try {
                mod.update({}); // profiling call with dummy state
            } catch (err) {
                console.error(`APEXCORE Tick Profiler: error in "${name}"`, err);
            }
            const end = performance.now();
            recordSample(name, end - start);
        }

        // Occasionally print summary
        if (snapshot.frame % 120 === 0) {
            summarize();
        }
    });

    console.log("APEXCORE — Tick Profiler attached");
})();
