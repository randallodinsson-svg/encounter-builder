// FILE: apexsim.js
// APEXSIM v4.4 — Phase 3 (Field‑Driven Simulation)

(function () {
  const TWO_PI = Math.PI * 2;

  const SIM = {
    _state: {
      particles: [],
      particleCount: 512,
      baseSpeed: 60, // px/sec
      time: 0,
    },

    start() {
      console.log("APEXSIM — Phase 3 online (Field‑Driven).");
      this._buildParticles();
    },

    update(dt) {
      this._state.time += dt;
      this._step(dt);
    },

    _buildParticles() {
      const s = this._state;
      s.particles.length = 0;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < s.particleCount; i++) {
        const a = Math.random() * TWO_PI;
        const r = Math.random() * Math.min(w, h) * 0.4;

        s.particles.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: (Math.random() - 0.5) * s.baseSpeed,
          vy: (Math.random() - 0.5) * s.baseSpeed,
          hue: (i / s.particleCount) * 360,
        });
      }
    },

    _step(dt) {
      const s = this._state;
      const env = APEX.getModule("environment-field");
      const halo = APEX.getModule("halo-field");

      const w = window.innerWidth;
      const h = window.innerHeight;

      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];

        // Sample environment field
        let fx = 0;
        let fy = 0;

        if (env && env.sample) {
          const f = env.sample(p.x, p.y);
          fx += f.fx;
          fy += f.fy;
        }

        // Sample halo field
        if (halo && halo.sample) {
          const hF = halo.sample(p.x, p.y);
          fx += hF.fx;
          fy += hF.fy;
        }

        // Apply field forces
        p.vx += fx * dt * 120;
        p.vy += fy * dt * 120;

        // Move particle
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around screen
        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;
      }
    },
  };

  window.APEXSIM = SIM;
  APEX.register("apexsim", SIM);
})();
