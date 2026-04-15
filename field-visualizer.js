// FILE: field-visualizer.js
// FIELD_VISUALIZER v4.4 — Phase 5 (Vector Field + Curl + Halo Influence)

(function () {
  const Visualizer = {
    canvas: null,
    ctx: null,

    gridSize: 80, // spacing between vector samples

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

    update(dt) {
      this.render();
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      const env = APEX.getModule("environment-field");
      const halo = APEX.getModule("halo-field");
      if (!env || !halo) return;

      const step = this.gridSize;

      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          const f = env.sample(x, y);
          const hF = halo.sample(x, y);

          const fx = f.fx + hF.fx;
          const fy = f.fy + hF.fy;

          const mag = Math.sqrt(fx * fx + fy * fy);

          // Draw vector arrow
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + fx * 40, y + fy * 40);
          ctx.strokeStyle = `rgba(0,255,255,${0.25 + mag * 0.4})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Curl visualization (simple perpendicular magnitude)
          const curl = Math.abs(fx * fy);
          ctx.fillStyle = `rgba(255,0,150,${Math.min(0.35, curl * 2)})`;
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      }
    },
  };

  APEX.register("field-visualizer", Visualizer);
})();
