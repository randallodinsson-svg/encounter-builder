// formation-coordination.js — Phase 12 (Hybrid Multi‑Formation Coordination)

(function () {
  const Coordination = {
    centroidX: 0,
    centroidY: 0,
    avgSpeed: 0,
    pressure: 0,

    start() {
      console.log("FORMATION_COORDINATION — online (Phase 12).");
    },

    update(dt) {
      const ai = APEX.getModule("formation-ai");
      const influence = APEX.getModule("influence-maps");
      if (!ai || !ai.formations.length) return;

      const forms = ai.formations;
      const n = forms.length;

      // --- Group metrics ---
      let cx = 0, cy = 0, speedSum = 0;
      for (const f of forms) {
        cx += f.x;
        cy += f.y;
        speedSum += Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      }
      cx /= n;
      cy /= n;
      this.centroidX = cx;
      this.centroidY = cy;
      this.avgSpeed = speedSum / n;

      this.pressure = influence ? influence.sampleCoarse(cx, cy) : 0;

      // --- Hybrid leadership selection ---
      let leader = null;
      let bestScore = -Infinity;

      for (const f of forms) {
        const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
        const dx = f.x - cx;
        const dy = f.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;

        // Closer to centroid + higher speed + lower local pressure = better leader
        const localP = influence ? influence.sampleCoarse(f.x, f.y) : this.pressure;
        const score = (80 - dist * 0.4) + spd * 0.6 - localP * 0.05;

        if (score > bestScore) {
          bestScore = score;
          leader = f;
        }
      }

      if (!leader) return;

      // --- Assign roles + lanes ---
      for (const f of forms) {
        f.isLeader = (f === leader);

        const dx = f.x - leader.x;
        const dy = f.y - leader.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;

        // Desired offset ring around leader
        const baseRadius = 220;
        const laneRadius = baseRadius + (f.laneIndex || 0) * 40;

        if (f === leader) {
          f.groupTargetX = leader.x;
          f.groupTargetY = leader.y;
          f.laneIndex = 0;
          continue;
        }

        // Assign lane index if not set
        if (f.laneIndex == null) {
          f.laneIndex = (Math.random() < 0.5 ? -1 : 1);
        }

        const angle = Math.atan2(dy, dx);
        const desiredAngle = angle;
        const tx = leader.x + Math.cos(desiredAngle) * laneRadius;
        const ty = leader.y + Math.sin(desiredAngle) * laneRadius;

        f.groupTargetX = tx;
        f.groupTargetY = ty;
      }
    },
  };

  APEX.register("formation-coordination", Coordination);
})();
