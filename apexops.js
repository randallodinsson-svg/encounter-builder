/* ============================================================
   STEP 17.4 — TICK‑TIME PROFILER (OPS‑SIDE, OPTION A)
   Complete, drop‑in module
============================================================ */

export const TickTimeProfiler = (() => {

    // name -> { totalMs, count, avgMs, lastMs }
    const moduleStats = new Map();

    // total tick time for last tick
    let lastTickTotalMs = 0;

    // internal temp store
    const activeTimers = new Map();

    function beginModuleTick(name) {
        activeTimers.set(name, performance.now());
    }

    function endModuleTick(name) {
        const start = activeTimers.get(name);
        if (start == null) return;

        const duration = performance.now() - start;
        activeTimers.delete(name);

        let entry = moduleStats.get(name);
        if (!entry) {
            entry = { totalMs: 0, count: 0, avgMs: 0, lastMs: 0 };
            moduleStats.set(name, entry);
        }

        entry.totalMs += duration;
        entry.count++;
        entry.lastMs = duration;
        entry.avgMs = entry.totalMs / entry.count;

        return duration;
    }

    function beginTick() {
        lastTickTotalMs = performance.now();
    }

    function endTick() {
        lastTickTotalMs = performance.now() - lastTickTotalMs;
    }

    function getSnapshot() {
        const out = {};
        for (const [name, data] of moduleStats.entries()) {
            out[name] = {
                lastMs: Number(data.lastMs.toFixed(3)),
                avgMs: Number(data.avgMs.toFixed(3)),
                count: data.count
            };
        }
        return {
            modules: out,
            totalTickMs: Number(lastTickTotalMs.toFixed(3))
        };
    }

    return {
        beginModuleTick,
        endModuleTick,
        beginTick,
        endTick,
        getSnapshot
    };

})();
