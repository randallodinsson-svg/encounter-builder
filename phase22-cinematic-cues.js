// phase22-cinematic-cues.js
// APEXCORE v4.4 — Phase 22: Cinematic Cue Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Cues = (APEX.Cues = APEX.Cues || {});

  Cues.config = {
    evalInterval: 0.6,
    minCriticalTier: "HIGH",
    minNarrativeStateForClimax: "CRITICAL_POINT",
    minTensionForClimax: 0.65
  };

  const TIER_ORDER = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3
  };

  function pickTopFormation(formations) {
    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      const tier = f.salienceTier || "LOW";
      const tierScore = TIER_ORDER[tier] ?? 0;
      const s = f.salience != null ? f.salience : 0;

      const score = tierScore * 2 + s;
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }

    return best;
  }

  function getGlobalNarrativeSnapshot(formations) {
    // We assume Narrative has been tagging formations with lastNarrativeTension
    let tensionSum = 0;
    let count = 0;

    for (let i = 0; i < formations.length; i++) {
      const mem = formations[i].memory || {};
      if (mem.lastNarrativeTension != null) {
        tensionSum += mem.lastNarrativeTension;
        count++;
      }
    }

    const avgTension = count ? tensionSum / count : 0.5;

    // We don't track global state directly here; callers can infer from tension
    return {
      avgTension
    };
  }

  function pushCue(targetFormation, cueType, payload) {
    if (!targetFormation) return;
    const cmds = (targetFormation.pendingCommands =
      targetFormation.pendingCommands || []);

    cmds.push({
      type: "CINEMATIC_CUE",
      cue: cueType,
      payload: payload || {}
    });
  }

  Cues.updateGlobalCues = (function () {
    let time = 0;
    let lastEval = 0;

    return function (formations, dt) {
      time += dt;
      const cfg = Cues.config;

      if (time - lastEval < cfg.evalInterval) return;
      lastEval = time;

      if (!formations || !formations.length) return;

      const top = pickTopFormation(formations);
      const snapshot = getGlobalNarrativeSnapshot(formations);

      if (!top) return;

      const tier = top.salienceTier || "LOW";
      const tension = snapshot.avgTension;

      // Basic cue taxonomy:
      // - FOCUS: camera / framing
      // - SWELL: music / intensity
      // - BREAK: release / aftermath

      if (TIER_ORDER[tier] >= TIER_ORDER[cfg.minCriticalTier]) {
        if (tension >= cfg.minTensionForClimax) {
          pushCue(top, "FOCUS_CLIMAX", {
            tension,
            tier,
            id: top.id
          });
          pushCue(top, "SWELL_MAX", {
            tension,
            tier
          });
        } else {
          pushCue(top, "FOCUS_HIGH", {
            tension,
            tier,
            id: top.id
          });
          pushCue(top, "SWELL_BUILD", {
            tension,
            tier
          });
        }
      } else if (tension < 0.35) {
        pushCue(top, "FOCUS_DRIFT", {
          tension,
          tier,
          id: top.id
        });
        pushCue(top, "BREAK_SOFT", {
          tension,
          tier
        });
      } else {
        pushCue(top, "FOCUS_TRACK", {
          tension,
          tier,
          id: top.id
        });
      }
    };
  })();

  console.log("PHASE22_CUES — online (Cinematic Cue Layer).");
})(this);
