// FILE: apexsim.js
// APEXSIM — NUKE baseline behavior

(function () {
  const TWO_PI = Math.PI * 2;

  const SIM = {
    _state: {
      particles: [],
      particleCount: 512,
      speed: 60, // px/sec
      time: 0,
    },

    start() {
      console.log("APEXSIM — NUKE baseline online.");
      this._buildParticles();
    },

    update(dt) {
      this._state.time += dt;
      // logic is handled in renderer; SIM just tracks time for now
    },

    _buildParticles() {
      const s = this._state;
      s.particles.length = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < s.particleCount; i++) {
        const a = Math.random() * TWO_PI;
        const r = Math.random() * Math.min(w, h) * 0.4;
        const cx = w * 0.5;
        const cy = h * 0.5;
        s.particles.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: (Math.random() - 0.5) * s.speed,
          vy: (Math.random() - 0.5) * s.speed,
          hue: (i / s.particleCount) * 360,
        });
      }
    },
  };

  window.APEXSIM = SIM;
  APEX.register("apexsim", SIM);
})();
