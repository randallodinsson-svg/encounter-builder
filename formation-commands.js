// formation-commands.js — Phase 10 (Influence‑Driven Decisions)

(function () {
  const Commands = {
    start() {
      console.log("FORMATION_COMMANDS — online.");
    },

    update(dt) {
      const ai = APEX.getModule("formation-ai");
      const halos = APEX.getModule("halo-system")?.halos || [];
      const influence = APEX.getModule("influence-maps");

      if (!ai || !influence) return;

      for (const f of ai.formations) {
        // 1. Identify nearest halo (still relevant tactically)
        let nearest = null;
        let bestDist = Infinity;

        for (const h of halos) {
          const dx = h.x - f.x;
          const dy = h.y - f.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            nearest = h;
          }
        }

        if (nearest) {
          f.anchorX = nearest.x;
          f.anchorY = nearest.y;
        }

        // 2. Sample coarse influence to detect danger or stability
        const localPressure = influence.sampleCoarse(f.x, f.y);

        // 3. Find a safe pocket nearby
        const safe = influence.getSafePocket(f);

        // 4. Decide mode based on pressure + distance to anchor
        const dxA = f.anchorX - f.x;
        const dyA = f.anchorY - f.y;
        const distA = Math.sqrt(dxA * dxA + dyA * dyA);

        if (localPressure > 250) {
          f.mode = "evade";
          f.targetX = safe.x;
          f.targetY = safe.y;
        } else if (distA > f.preferredRadius * 1.4) {
          f.mode = "approach";
          f.targetX = f.anchorX;
          f.targetY = f.anchorY;
        } else if (distA < f.preferredRadius * 0.7) {
          f.mode = "backoff";
          f.targetX = safe.x;
          f.targetY = safe.y;
        } else {
          f.mode = "orbit";
          f.targetX = f.anchorX;
          f.targetY = f.anchorY;
        }
      }
    },
  };

  APEX.register("formation-commands", Commands);
})();
