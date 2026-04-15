// formation-commands.js — autonomous decision dispatcher (Hybrid)

(function () {
  const Commands = {
    start() {
      console.log("FORMATION_COMMANDS — online.");
    },

    update(dt) {
      const ai = APEX.getModule("formation-ai");
      const haloSystem = APEX.getModule("halo-system");
      if (!ai || !haloSystem) return;

      const halos = haloSystem.halos;
      if (!halos.length) return;

      // Simple heuristic: each formation picks a halo to relate to
      for (const f of ai.formations) {
        let best = null;
        let bestDist = Infinity;

        for (const h of halos) {
          const dx = h.x - f.x;
          const dy = h.y - f.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            best = h;
          }
        }

        if (!best) continue;

        const dist = Math.sqrt(bestDist);
        f.targetX = best.x;
        f.targetY = best.y;

        // Hybrid behavior:
        // - If far: seek/arrive toward halo
        // - If near: orbit/offset and maintain spacing
        if (dist > f.preferredRadius * 1.4) {
          f.mode = "approach";
        } else if (dist < f.preferredRadius * 0.7) {
          f.mode = "backoff";
        } else {
          f.mode = "orbit";
        }

        f.anchorX = best.x;
        f.anchorY = best.y;
      }
    },
  };

  APEX.register("formation-commands", Commands);
})();
