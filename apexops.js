// FILE: apexops.js
// APEXOPS v4.4 — NUKE Rebuild (Command Layer)

(function () {
  const OPS = {
    start() {
      console.log("APEXOPS — online.");
    },

    update(dt) {
      // No per-frame ops yet; placeholder for future commands.
    },

    resetSim() {
      const sim = APEX.getModule("apexsim");
      if (sim && sim._buildParticles) {
        sim._buildParticles();
      }
    },

    burst(n = 64) {
      const sim = APEX.getModule("apexsim");
      if (!sim || !sim._state) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 80;
        sim._state.particles.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          hue: Math.random() * 360
        });
      }
    },
  };

  APEX.register("apexops", OPS);
})();
