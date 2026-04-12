// ENGINE — tick driver for APEXCORE

export const ENGINE = (() => {
    let core = null;
    let intervalId = null;
    let intervalMs = 1000;
    let tickCount = 0;

    function init(coreRef) {
        core = coreRef;
        console.log("[ENGINE] init()");
    }

    function setIntervalMs(ms) {
        intervalMs = ms;
        if (intervalId) {
            stop();
            start();
        }
    }
    function runSingleTick() {
        if (!core) return;

        const start = performance.now();

        const tickData = {
            time: start,
            count: ++tickCount,
            random: Math.random()
        };

        core.runTick(tickData);

        const end = performance.now();
        const duration = end - start;

        // CRITICAL: Feed duration to TickProfiler
        core.set("profiler.lastTickDuration", duration);

        // ⭐ NEW: Export live snapshot for APEXOPS UI
        // This makes apexops.html update automatically.
        if (typeof window !== "undefined") {
            window.APEXCORE_SNAPSHOT = core.getSnapshot();
        }
    }
    function start() {
        if (!core) return;
        if (intervalId) return;
        intervalId = setInterval(runSingleTick, intervalMs);
        console.log("[ENGINE] auto‑tick started @", intervalMs, "ms");
    }

    function stop() {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;
        console.log("[ENGINE] auto‑tick stopped");
    }

    function isRunning() {
        return !!intervalId;
    }

    return {
        init,
        setIntervalMs,
        runSingleTick,
        start,
        stop,
        isRunning
    };
})();
