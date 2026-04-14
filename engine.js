/*
    APEXCORE v4.4 — Engine Loop (Enhanced Diagnostics Edition)
*/

(function () {
  const Engine = {
    lastTime: performance.now(),
    tick: 0,
    fps: 0,

    start() {
      console.log("APEXCORE v4.4 — Engine online.");
      requestAnimationFrame(this.loop.bind(this));
    },

    loop(now) {
      const delta = now - this.lastTime;
      this.lastTime = now;
      this.tick++;

      // Compute FPS
      this.fps = 1000 / (delta || 1);

      // Entity count (HALO + SIM)
      let entityCount = 0;
      const entities = APEX.get("entities");
      if (entities && typeof entities.count === "function") {
        entityCount = entities.count();
      }

      // Timeline event count
      let eventCount = 0;
      const timeline = APEX.get("event-timeline");
      if (timeline && Array.isArray(timeline.events)) {
        eventCount = timeline.events.length;
      }

      // Broadcast tick to all modules
      const modules = APEX.all();
      for (const key in modules) {
        const m = modules[key];
        if (m && typeof m.onTick === "function") {
          m.onTick(delta, this.fps, entityCount, eventCount);
        }
      }

      // UI update
      const ui = APEX.get("ui");
      if (ui && typeof ui.onTick === "function") {
        ui.onTick(delta, this.fps, entityCount, eventCount);
      }

      // FPS Graph update
      const graph = APEX.get("fps-graph");
      if (graph && typeof graph.onTick === "function") {
        graph.onTick(delta);
      }

      requestAnimationFrame(this.loop.bind(this));
    },
  };

  APEX.register("engine", Engine);
})();
