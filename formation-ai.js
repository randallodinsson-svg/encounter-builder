// formation-ai.js — Hybrid flocking + tactical formation logic

(function () {
  const FormationAI = {
    formations: [],
    time: 0,

    start() {
      console.log("FORMATION_AI — online.");
      this.spawnFormationCluster();
    },

    spawnFormationCluster() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < 3; i++) {
        this.formations.push({
          x: cx + (i - 1) * 160,
          y: cy + (i - 1) * 40,
          vx: 0,
          vy: 0,
          facing: 0,
          speed: 80,
          cohesionRadius: 220,
          separationRadius: 80,
          preferredRadius: 260,
          targetX: cx,
          targetY: cy,
          anchorX: cx,
          anchorY: cy,
          mode: "approach",
        });
      }
    },

    update(dt) {
      this.time += dt;
      if (!this.formations.length) return;

      this.applyHybridSteering(dt);
      this.integrate(dt);
    },

    applyHybridSteering(dt) {
      const formations = this.formations;

      for (let i = 0; i < formations.length; i++) {
        const f = formations[i];

        let steerX = 0;
        let steerY = 0;

        // Tactical: move relative to anchor/target
        const ax = f.anchorX ?? f.targetX;
        const ay = f.anchorY ?? f.targetY;
        const dxA = ax - f.x;
        const dyA = ay - f.y;
        const distA = Math.sqrt(dxA * dxA + dyA * dyA) + 0.001;

        if (f.mode === "approach") {
          const desired = this.setMag(dxA, dyA, f.speed);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        } else if (f.mode === "backoff") {
          const desired = this.setMag(-dxA, -dyA, f.speed);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        } else if (f.mode === "orbit") {
          const tangentX = -dyA / distA;
          const tangentY = dxA / distA;
          const desired = this.setMag(tangentX, tangentY, f.speed * 0.8);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        }

        // Flocking: cohesion + separation + alignment
        let cohX = 0, cohY = 0, cohCount = 0;
        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0, aliCount = 0;

        for (let j = 0; j < formations.length; j++) {
          if (i === j) continue;
          const o = formations[j];
          const dx = o.x - f.x;
          const dy = o.y - f.y;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2) + 0.001;

          if (d < f.cohesionRadius) {
            cohX += o.x;
            cohY += o.y;
            cohCount++;
          }

          if (d < f.separationRadius) {
            sepX -= dx / d;
            sepY -= dy / d;
            sepCount++;
          }

          if (d < f.cohesionRadius) {
            aliX += o.vx;
            aliY += o.vy;
            aliCount++;
          }
        }

        if (cohCount > 0) {
          cohX /= cohCount;
          cohY /= cohCount;
          const desired = this.setMag(cohX - f.x, cohY - f.y, f.speed * 0.4);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        }

        if (sepCount > 0) {
          const desired = this.setMag(sepX, sepY, f.speed * 0.7);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        }

        if (aliCount > 0) {
          aliX /= aliCount;
          aliY /= aliCount;
          const desired = this.setMag(aliX, aliY, f.speed * 0.5);
          steerX += desired.x - f.vx;
          steerY += desired.y - f.vy;
        }

        const maxForce = 80;
        const mag = Math.sqrt(steerX * steerX + steerY * steerY);
        if (mag > maxForce) {
          steerX = (steerX / mag) * maxForce;
          steerY = (steerY / mag) * maxForce;
        }

        f.vx += steerX * dt;
        f.vy += steerY * dt;

        const maxSpeed = 140;
        const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
        if (spd > maxSpeed) {
          f.vx = (f.vx / spd) * maxSpeed;
          f.vy = (f.vy / spd) * maxSpeed;
        }

        if (spd > 1) {
          f.facing = Math.atan2(f.vy, f.vx);
        }
      }
    },

    integrate(dt) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const f of this.formations) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        const margin = 40;
        if (f.x < margin) f.x = margin;
        if (f.x > w - margin) f.x = w - margin;
        if (f.y < margin) f.y = margin;
        if (f.y > h - margin) f.y = h - margin;
      }
    },

    setMag(x, y, mag) {
      const d = Math.sqrt(x * x + y * y) + 0.001;
      return { x: (x / d) * mag, y: (y / d) * mag };
    },
  };

  APEX.register("formation-ai", FormationAI);
})();
