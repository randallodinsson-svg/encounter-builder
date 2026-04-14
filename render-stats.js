/*
    APEXCORE v4.4 — Render Stats Panel
    Tracks renderer performance each frame.
*/

(function () {
  const RenderStats = {
    drawCalls: 0,
    batches: 0,
    clears: 0,
    frameStart: 0,
    frameCost: 0,

    start() {
      console.log("APEXCORE v4.4 — Render Stats online.");
      this.hookRenderer();
      this.hookRAF();
    },

    hookRenderer() {
      const renderer = APEX.get("renderer");
      if (!renderer) return console.warn("RenderStats: renderer not found.");

      // Wrap renderer.clear()
      const originalClear = renderer.clear.bind(renderer);
      renderer.clear = (...args) => {
        this.clears++;
        return originalClear(...args);
      };

      // Wrap renderer.draw()
      const originalDraw = renderer.draw.bind(renderer);
      renderer.draw = (...args) => {
        this.drawCalls++;
        return originalDraw(...args);
      };

      // Wrap renderer.batch() if present
      if (renderer.batch) {
        const originalBatch = renderer.batch.bind(renderer);
        renderer.batch = (...args) => {
          this.batches++;
          return originalBatch(...args);
        };
      }
    },

    hookRAF() {
      const originalRAF = window.requestAnimationFrame;

      window.requestAnimationFrame = (cb) => {
        return originalRAF((ts) => {
          this.frameStart = performance.now();

          cb(ts);

          this.frameCost = performance.now() - this.frameStart;

          this.updateUI();
          this.resetCounters();
        });
      };
    },

    resetCounters() {
      this.drawCalls = 0;
      this.batches = 0;
      this.clears = 0;
    },

    updateUI() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pr = window.devicePixelRatio || 1;

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      set("rs-drawcalls", this.drawCalls);
      set("rs-batches", this.batches);
      set("rs-clears", this.clears);
      set("rs-framecost", this.frameCost.toFixed(2) + " ms");
      set("rs-resolution", `${w}×${h}`);
      set("rs-pixelratio", pr.toFixed(2));
    },
  };

  APEX.register("render-stats", RenderStats);
})();
