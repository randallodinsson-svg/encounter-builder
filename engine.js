// engine.js
// Simple tick engine that calls registered modules.

export const ENGINE = (() => {
  let apexcore = null;
  let intervalId = null;
  let tickMs = 1000;
  let lastTick = 0;

  function init(core) {
    apexcore = core;
    console.log("[ENGINE] init()");
  }

  function tickOnce() {
    const now = performance.now();
    const dt = lastTick ? (now - lastTick) : tickMs;
    lastTick = now;

    if (apexcore && apexcore._modules) {
      for (const mod of apexcore._modules) {
        if (mod && typeof mod.tick === "function") {
          const t0 = performance.now();
          mod.tick(dt);
          const t1 = performance.now();

          const prof = apexcore._profiler;
          const id = mod.id || "unknown";
          const cost = t1 - t0;

          if (!prof.modules[id]) {
            prof.modules[id] = { lastMs: 0, minMs: cost, maxMs: cost, totalMs: 0, ticks: 0 };
          }
          const m = prof.modules[id];
          m.lastMs = cost;
          m.minMs = Math.min(m.minMs, cost);
          m.maxMs = Math.max(m.maxMs, cost);
          m.totalMs += cost;
          m.ticks += 1;
        }
      }
    }

    if (apexcore && apexcore.api && apexcore.api.set) {
      apexcore.api.set("engine.lastTick", now.toFixed(0));
      apexcore.api.set("profiler", apexcore._profiler);
    }
  }

  function start() {
    if (intervalId) return;
    intervalId = setInterval(tickOnce, tickMs);
    console.log("[ENGINE] auto-tick started @", tickMs, "ms");
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    console.log("[ENGINE] auto-tick stopped");
  }

  return {
    init,
    start,
    stop,
  };
})();
