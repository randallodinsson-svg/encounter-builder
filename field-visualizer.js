// field-visualizer.js — debug field vectors

(function () {
  const Visualizer = {
    canvas: null,
    ctx: null,
    density: 64,

    start() {
      console.log("FIELD_VISUALIZER — online.");
      this.canvas = document.createElement("canvas");
      this.canvas.id = "fieldOverlay";
      Object.assign(this.canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      });
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    update(dt) {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      const env = APEX.getModule("environment-field");
      const haloSystem = APEX.getModule("halo-system");
      const haloField = APEX.getModule("halo-field");
      if (!env) return;

      const step = this.density;
      ctx.lineWidth = 1;
      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          let f = env.sample(x, y);
          if (haloSystem && haloSystem.halos.length > 0) {
            const hf = haloSystem.sample(x, y);
            f.fx += hf.fx;
            f.fy += hf.fy;
          } else if (haloField) {
            const hf = haloField.sample(x, y);
            f.fx += hf.fx;
            f.fy += hf.fy;
          }

          const len = Math.sqrt(f.fx * f.fx + f.fy * f.fy);
          if (len < 1) continue;

          const scale = 0.08;
          const tx = x + f.fx * scale;
          const ty = y + f.fy * scale;

          ctx.strokeStyle = "rgba(0,180,255,0.35)";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }
    },
  };

  APEX.register("field-visualizer", Visualizer);
})();
