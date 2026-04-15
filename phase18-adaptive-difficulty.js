// phase18-adaptive-difficulty.js
// APEXCORE v4.4 — Phase 18: Global Adaptive Difficulty

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Adaptive = (APEX.Adaptive = APEX.Adaptive || {});

  Adaptive.config = {
    window: 12.0,
    minIntensity: 0.5,
    maxIntensity: 1.6,
    adjustRate: 0.25
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function computeGlobalScore(formations) {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < formations.length; i++) {
      const mem = formations[i].memory;
      if (!mem) continue;

      const p = mem.lastPressure ?? 0.5;
      const integrity = formations[i].integrity ?? 1.0;

      const score = (1 - p) * 0.6 + integrity * 0.4;
      sum += score;
      count++;
    }

    if (!count) return 0.5;
    return sum / count;
  }

  Adaptive.updateGlobalDifficulty = (function () {
    let time = 0;
    let difficulty = 1.0;

    return function (formations, dt) {
      time += dt;

      const score = computeGlobalScore(formations);
      const cfg = Adaptive.config;

      const target =
        score < 0.45 ? cfg.minIntensity :
        score > 0.65 ? cfg.maxIntensity :
        1.0;

      difficulty += (target - difficulty) * cfg.adjustRate * dt;
      difficulty = clamp(difficulty, cfg.minIntensity, cfg.maxIntensity);

      for (let i = 0; i < formations.length; i++) {
        const cmds = (formations[i].pendingCommands =
          formations[i].pendingCommands || []);

        cmds.push({
          type: "GLOBAL_DIFFICULTY_SCALE",
          factor: difficulty
        });
      }
    };
  })();

  console.log("PHASE18_ADAPTIVE — online (Global Adaptive Difficulty).");
})(this);
