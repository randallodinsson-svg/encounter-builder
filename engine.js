/*
    APEXCORE v4.4 — Engine Loop
*/

(function () {
  const Engine = {
    lastTime: performance.now(),
    tick: 0,
    start() {
      console.log("APEXCORE v4.4 — Engine online.");
      requestAnimationFrame(this.loop.bind(this));
    },
    loop(now) {
      const delta = now - this.lastTime;
      this.lastTime = now;
      this.tick++;

      // Broadcast simple tick event to interested modules (if they expose onTick)
      const modules = APEX.all();
      for (const key in modules) {
        const m = modules[key];
        if (m && typeof m.onTick === "function") {
          m.onTick(delta, this.tick);
        }
      }

      requestAnimationFrame(this.loop.bind(this));
    },
  };

  APEX.register("engine", Engine);
})();
