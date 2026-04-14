/*
    APEXCORE v4.4 — Tick Profiler (Updated)
    Measures engine tick delta, rolling average, min/max.
*/

(function () {
  const TickProfiler = {
    lastDelta: 0,
    avgDelta: 0,
    minDelta: Infinity,
    maxDelta: 0,
    sampleCount: 0,

    start() {
      console.log("APEXCORE v4.4 — Tick Profiler attached");
    },

    onTick(delta) {
      this.lastDelta = delta;
      this.sampleCount++;

      // Rolling average
      this.avgDelta += (delta - this.avgDelta) * 0.05;

      // Min / Max
      if (delta < this.minDelta) this.minDelta = delta;
      if (delta > this.maxDelta) this.maxDelta = delta;

      // Optional: expose to window for UI panels
      window.APEX_TICK_PROFILER = {
        last: this.lastDelta,
        avg: this.avgDelta,
        min: this.minDelta,
        max: this.maxDelta,
        samples: this.sampleCount,
      };
    },
  };

  APEX.register("tick-profiler", TickProfiler);
})();
