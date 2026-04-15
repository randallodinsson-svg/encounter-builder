// formation-memory.js — Phase 13 (Hybrid Memory + Intent Persistence)

(function () {
  const FormationMemory = {
    start() {
      console.log("FORMATION_MEMORY — online (Phase 13).");
    },

    update(dt) {
      const ai = APEX.getModule("formation-ai");
      const influence = APEX.getModule("influence-maps");
      if (!ai || !ai.formations.length || !influence) return;

      const now = performance.now() / 1000;

      for (const f of ai.formations) {
        // Init memory containers once
        if (!f._mem) {
          f._mem = {
            shortPressures: [],   // ~5–10s window
            longPressures: [],    // ~30–60s window
            lastSafe: null,       // { x, y, t, p }
            lastMode: f.mode,
            modeSince: now,
          };
        }

        const mem = f._mem;

        // --- Pressure sampling ---
        const p = influence.sampleCoarse(f.x, f.y);

        mem.shortPressures.push({ t: now, p });
        mem.longPressures.push({ t: now, p });

        // Short-term: keep ~10s
        while (mem.shortPressures.length && now - mem.shortPressures[0].t > 10) {
          mem.shortPressures.shift();
        }

        // Long-term: keep ~60s
        while (mem.longPressures.length && now - mem.longPressures[0].t > 60) {
          mem.longPressures.shift();
        }

        // --- Safe-zone memory (low pressure snapshot) ---
        if (p < 80) {
          mem.lastSafe = {
            x: f.x,
            y: f.y,
            t: now,
            p,
          };
        }

        // --- Intent persistence (mode memory) ---
        if (f.mode !== mem.lastMode) {
          // Mode changed — only commit if previous mode lived long enough
          const lived = now - mem.modeSince;
          if (lived < 0.5) {
            // Too twitchy — revert to previous mode
            f.mode = mem.lastMode;
          } else {
            // Accept new mode
            mem.lastMode = f.mode;
            mem.modeSince = now;
          }
        }

        // (Optional hook for future habits: derive preferences from longPressures + lastSafe)
        // e.g., f.habitBias = ...
      }
    },
  };

  APEX.register("formation-memory", FormationMemory);
})();
