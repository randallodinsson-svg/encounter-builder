// phase28-scenario-autogen.js
// APEXCORE v4.4 — Phase 28: Autonomous Scenario Generation Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Auto = (APEX.AutoScenario = APEX.AutoScenario || {});

  Auto.config = {
    evalInterval: 1.2,
    tensionThreshold: 0.55,
    salienceThreshold: 0.6,
    relationshipThreshold: -0.4,
    eventCooldown: 4.0
  };

  let lastEventTime = 0;
  let time = 0;

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spawnObjective(formations) {
    if (!APEX.Objectives) return;

    const f = pickRandom(formations);
    if (!f) return;

    APEX.Objectives.forceObjective({
      x: f.x + (Math.random() * 200 - 100),
      y: f.y + (Math.random() * 200 - 100),
      weight: 1.0 + Math.random()
    });
  }

  function escalateTension() {
    if (!APEX.Narrative) return;
    APEX.Narrative.forceSpike(0.15 + Math.random() * 0.2);
  }

  function triggerConflict(formations) {
    const hostilePairs = [];

    for (let i = 0; i < formations.length; i++) {
      const a = formations[i];
      if (!a.relationships) continue;

      for (const id in a.relationships) {
        if (a.relationships[id] < Auto.config.relationshipThreshold) {
          hostilePairs.push([a, id]);
        }
      }
    }

    if (hostilePairs.length === 0) return;

    const [a, id] = pickRandom(hostilePairs);
    const b = formations.find(f => f.id == id);
    if (!b) return;

    if (APEX.FormationCommands) {
      APEX.FormationCommands.injectCommand(a, {
        type: "ENGAGE_TARGET",
        targetId: b.id,
        aggression: 0.8
      });
      APEX.FormationCommands.injectCommand(b, {
        type: "ENGAGE_TARGET",
        targetId: a.id,
        aggression: 0.8
      });
    }
  }

  Auto.updateScenario = function (formations, dt) {
    time += dt;
    const cfg = Auto.config;

    if (time - lastEventTime < cfg.eventCooldown) return;
    if (time < cfg.evalInterval) return;

    const snap = APEX.Telemetry ? APEX.Telemetry.lastSnapshot : null;
    if (!snap) return;

    const tension = snap.avgTension || 0;
    const salience = snap.avgSalience || 0;

    const shouldEscalate =
      tension > cfg.tensionThreshold ||
      salience > cfg.salienceThreshold;

    if (shouldEscalate) {
      escalateTension();
      spawnObjective(formations);
      triggerConflict(formations);
      lastEventTime = time;
    }
  };

  console.log("PHASE28_AUTOSCENARIO — online (Autonomous Scenario Generation Layer).");
})(this);
