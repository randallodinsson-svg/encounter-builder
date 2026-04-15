// FILE: apexsim-renderer.js
// APEXSIM Renderer — NUKE baseline

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("APEXSIM Renderer — NUKE baseline online.");
      this.canvas = document.getElementById("haloCanvas");
      if (!this.canvas) {
        console.error("Renderer: #haloCanvas not found.");
        return;
      }
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
    },

    update(dt) {
      if (!this.canvas || !this.ctx || !window.APEXSIM) return;
      this._step(dt);
      this._render();
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    _step(dt) {
      const sim = window.APEXSIM;
      const s = sim._state;
      const w = this.canvas.width;
      const h = this.canvas.height;

      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;
      }
    },

    _render() {
      const sim = window.APEXSIM;
      const s = sim._state;
      const ctx = this.ctx;

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for (const p of s.particles) {
        ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  window.APEXSIM_RENDERER = Renderer;
  APEX.register("apexsim-renderer", Renderer);
})();
