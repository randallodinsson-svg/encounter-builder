// apexsim.js — particle simulation (field-driven)

(function () {
  const APEXSIM = {
    particles: [],
    maxParticles: 1024,

    start() {
      console.log("APEXSIM — Phase 3 online (Field‑Driven).");
      this.reset();
    },

    reset() {
      this.particles.length = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < 512; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          life: 1 + Math.random() * 2,
        });
      }
    },

    burst(count = 64) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        this.particles.push({
          x: w * 0.5,
          y: h * 0.5,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 1 + Math.random() * 2,
        });
      }
    },

    update(dt) {
      const env = APEX.getModule("environment-field");
      const haloField = APEX.getModule("halo-field");
      const haloSystem = APEX.getModule("halo-system");

      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const p of this.particles) {
        let fx = 0;
        let fy = 0;

        if (env) {
          const f = env.sample(p.x, p.y);
          fx += f.fx;
          fy += f.fy;
        }

        if (haloSystem) {
          const hf = haloSystem.sample(p.x, p.y);
          fx += hf.fx;
          fy += hf.fy;
        } else if (haloField) {
          const hf = haloField.sample(p.x, p.y);
          fx += hf.fx;
          fy += hf.fy;
        }

        p.vx += fx * dt;
        p.vy += fy * dt;

        const drag = 0.96;
        p.vx *= drag;
        p.vy *= drag;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;

        p.life -= dt * 0.1;
        if (p.life <= 0) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.vx = 0;
          p.vy = 0;
          p.life = 1 + Math.random() * 2;
        }
      }
    },
  };

  APEX.register("apexsim", APEXSIM);
})();
