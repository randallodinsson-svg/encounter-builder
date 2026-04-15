// apexsim-renderer.js — NUKE baseline renderer

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("APEXSIM Renderer — NUKE baseline online.");
      this.canvas = document.getElementById("haloCanvas");
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

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, w, h);

      const sim = APEX.getModule("apexsim");
      if (!sim) return;

      ctx.globalCompositeOperation = "lighter";

      for (const p of sim.particles) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const t = Math.min(speed / 200, 1);
        const r = Math.floor(100 + 155 * t);
        const g = Math.floor(180 + 75 * (1 - t));
        const b = 255;

        ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };

  APEX.register("apexsim-renderer", Renderer);
})();
