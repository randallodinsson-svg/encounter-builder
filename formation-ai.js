// FILE: formation-ai.js
// FORMATION_AI v4.4 — Phase 8 (Cohesion, Facing, Targeting)

(function () {
  const FormationAI = {
    formations: [],
    time: 0,

    start() {
      console.log("FORMATION_AI — online.");
      this.spawnFormation();
    },

    update(dt) {
      this.time += dt;

      for (const f of this.formations) {
        this._evaluate(f, dt);
        this._move(f, dt);
      }
    },

    // -----------------------------------
    // SPAWN A SIMPLE FORMATION
    // -----------------------------------
    spawnFormation() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.formations.push({
        x: w * 0.5,
        y: h * 0.5,
        facing: 0,
        speed: 80,
        cohesion: 140,
        targetX: w * 0.5,
        targetY: h * 0.5,
      });
    },

    // -----------------------------------
    // SET TARGET
    // -----------------------------------
    setTarget(x, y) {
      for (const f of this.formations) {
        f.targetX = x;
        f.targetY = y;
      }
    },

    // -----------------------------------
    // EVALUATION LOGIC
    // -----------------------------------
    _evaluate(f, dt) {
      const dx = f.targetX - f.x;
      const dy = f.targetY - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Facing rotation
      const desiredAngle = Math.atan2(dy, dx);
      const angleDiff = this._angleDiff(f.facing, desiredAngle);
      f.facing += angleDiff * dt * 2.5;

      // Cohesion tightening/loosening
      if (dist > f.cohesion) {
        f.speed = 120;
      } else {
        f.speed = 60;
      }
    },

    // -----------------------------------
    // MOVEMENT
    // -----------------------------------
    _move(f, dt) {
      f.x += Math.cos(f.facing) * f.speed * dt;
      f.y += Math.sin(f.facing) * f.speed * dt;
    },

    // -----------------------------------
    // ANGLE DIFF
    // -----------------------------------
    _angleDiff(a, b) {
      let d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    },
  };

  APEX.register("formation-ai", FormationAI);
})();
