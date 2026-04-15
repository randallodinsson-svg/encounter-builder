// FILE: formation-renderer.js
// FORMATION_RENDERER v4.4 — Phase 8 (Draw Formation + Facing)

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("FORMATION_RENDERER — online.");

      this.canvas = document.createElement("canvas");
      this.canvas.id = "formationOverlay";
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

      const ai = APEX.getModule("formation-ai");
      if (!ai) return;

      for (const f of ai.formations) {
        // Draw cohesion radius
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.cohesion, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,150,255,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw facing vector
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(f.facing) * 80, f.y + Math.sin(f.facing) * 80);
        ctx.strokeStyle = "rgba(255,255,0,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw formation center
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
      }
    },
  };

  APEX.register("formation-renderer", Renderer);
})();
