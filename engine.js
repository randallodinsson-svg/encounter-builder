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
        const now = performance.now();
        const tickData = {
            time: now,
            count: ++tickCount,
            random: Math.random()
        };
        core.runTick(tickData);
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
