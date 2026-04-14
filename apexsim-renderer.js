/*
    APEXCORE v4.4 — APEXSIM Renderer
*/

(function () {
  const sim = window.APEXSIM;

  const SimRenderer = {
    canvas: null,
    ctx: null,
    lastTime: performance.now(),

    start() {
      this.canvas = document.getElementById("apexsim-canvas");
      if (!this.canvas) {
        console.warn("APEXSIM Renderer — canvas #apexsim-canvas not found.");
        return;
      }
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
      console.log("APEXCORE v4.4 — APEXSIM Renderer online.");
      requestAnimationFrame(this.loop.bind(this));
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    loop(now) {
      const delta = now - this.lastTime;
      this.lastTime = now;

      const s = sim._state;
      s.delta = delta;
      s.fps = 1000 / (delta || 1);

      if (!s.paused) {
        this.updateParticles(delta);
      }
      this.renderParticles();

      requestAnimationFrame(this.loop.bind(this));
    },

    updateParticles(delta) {
      const s = sim._state;
      const dt = delta / 16.67;
      const w = this.canvas.width;
      const h = this.canvas.height;

      for (const p of s.particles) {
        p.x += p.vx * s.particleSpeed * dt;
        p.y += p.vy * s.particleSpeed * dt;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    },

    renderParticles() {
      const s = sim._state;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      if (!s.trailsEnabled) {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = "#ffb347";
      for (const p of s.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  APEX.register("apexsim-renderer", SimRenderer);
})();
