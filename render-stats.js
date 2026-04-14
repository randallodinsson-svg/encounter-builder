/*
    APEXCORE v4.4 — Render Stats Panel (HALO-Compatible)
    Tracks renderer performance each frame without hooking nonexistent methods.
*/

(function () {
  const RenderStats = {
    clears: 0,
    nodeDraws: 0,
    linkDraws: 0,
    frameStart: 0,
    frameCost: 0,

    start() {
      console.log("APEXCORE v4.4 — Render Stats online.");
      this.hookHaloRenderer();
    },

    hookHaloRenderer() {
      const renderer = APEX.get("renderer");
      if (!renderer) {
        console.warn("RenderStats: HALO renderer not found.");
        return;
      }

      // Wrap renderer.render()
      const originalRender = renderer.render.bind(renderer);

      renderer.render = () => {
        this.frameStart = performance.now();

        // Reset counters for this frame
        this.clears = 0;
        this.nodeDraws = 0;
        this.linkDraws = 0;

        // Wrap ctx calls
        const ctx = renderer.ctx;
        if (ctx) this.hookContext(ctx);

        // Run original render
        originalRender();

        // Compute frame cost
        this.frameCost = performance.now() - this.frameStart;

        // Update UI
        this.updateUI();
      };
    },

    hookContext(ctx) {
      // ClearRect → canvas clear
      const originalClearRect = ctx.clearRect.bind(ctx);
      ctx.clearRect = (...args) => {
        this.clears++;
        return originalClearRect(...args);
      };

      // Stroke → link draw
      const originalStroke = ctx.stroke.bind(ctx);
      ctx.stroke = (...args) => {
        this.linkDraws++;
        return originalStroke(...args);
      };

      // Fill → node draw
      const originalFill = ctx.fill.bind(ctx);
      ctx.fill = (...args) => {
        this.nodeDraws++;
        return originalFill(...args);
      };
    },

    updateUI() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pr = window.devicePixelRatio || 1;

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      set("rs-drawcalls", this.nodeDraws + this.linkDraws);
      set("rs-batches", this.linkDraws); // links = strokes
      set("rs-clears", this.clears);
      set("rs-framecost", this.frameCost.toFixed(2) + " ms");
      set("rs-resolution", `${w}×${h}`);
      set("rs-pixelratio", pr.toFixed(2));
    },
  };

  APEX.register("render-stats", RenderStats);
})();
