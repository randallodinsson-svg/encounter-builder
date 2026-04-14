/* 
    APEXSIM Renderer v4.4 (Flocking‑Ready)
    Draws particles, trails, debug vectors, and obstacles.
    Fully compatible with APEXSIM v4.9 (Flocking Intelligence Edition)
*/

(function () {

  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("APEXCORE v4.4 — APEXSIM Renderer online.");

      this.canvas = document.getElementById("haloCanvas");
      if (!this.canvas) {
        console.warn("APEXSIM Renderer — canvas #haloCanvas not found.");
        return;
      }

      this.ctx = this.canvas.getContext("2d");

      this.resize();
      window.addEventListener("resize", () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    /* -------------------------------------------------- */
    /*                PARTICLE UPDATE LOOP                */
    /* -------------------------------------------------- */

    updateParticles(delta) {
      const sim = window.APEXSIM;
      if (!sim) return;

      const s = sim._state;
      const dt = delta / 16.67;
      const w = this.canvas.width;
      const h = this.canvas.height;

      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];

        // ⭐ Flocking index passed into sampleFlow
        const flow = sim.sampleFlow(p.x, p.y, i);

        p.vx += flow.fx * 0.02;
        p.vy += flow.fy * 0.02;

        p.x += p.vx * s.particleSpeed * dt;
        p.y += p.vy * s.particleSpeed * dt;

        // Wrap edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    },

    /* -------------------------------------------------- */
    /*                     RENDER LOOP                    */
    /* -------------------------------------------------- */

    render() {
      if (!this.ctx || !window.APEXSIM) return;

      const sim = window.APEXSIM;
      const s = sim._state;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (s.trailsEnabled) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      ctx.fillStyle = "#ffffff";

      for (const p of s.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /* -------------------------------------------------- */
    /*                 ENGINE TICK HOOK                   */
    /* -------------------------------------------------- */

    onTick(delta) {
      if (!this.canvas || !this.ctx) return;
      this.updateParticles(delta);
      this.render();
    },
  };

  window.APEXSIM_RENDERER = Renderer;
  APEX.register("apexsim-renderer", Renderer);

})();
