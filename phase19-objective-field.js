// phase19-objective-field.js
// APEXCORE v4.4 — Phase 19: Objective Field Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Objectives = (APEX.Objectives = APEX.Objectives || {});

  Objectives.config = {
    cycleDuration: 24.0,
    radius: 260,
    contestRadius: 320,
    maxObjectives: 3
  };

  const TYPES = ["CAPTURE", "DEFEND", "CONTEST"];

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function distance2(a, b) {
    const dx = a.center.x - b.x;
    const dy = a.center.y - b.y;
    return dx * dx + dy * dy;
  }

  function buildObjective(t, index) {
    const angle = (index / Objectives.config.maxObjectives) * Math.PI * 2;
    const r = 420;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    const type = TYPES[index % TYPES.length];

    return {
      id: index,
      type,
      x,
      y,
      radius: Objectives.config.radius
    };
  }

  function getObjectivesForTime(t) {
    const objs = [];
    for (let i = 0; i < Objectives.config.maxObjectives; i++) {
      objs.push(buildObjective(t, i));
    }
    return objs;
  }

  function assignObjectiveCommands(formations, objectives) {
    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      if (!f.center) continue;

      let bestObj = null;
      let bestD2 = Infinity;

      for (let j = 0; j < objectives.length; j++) {
        const obj = objectives[j];
        const d2 = distance2(f, { x: obj.x, y: obj.y });
        if (d2 < bestD2) {
          bestD2 = d2;
          bestObj = obj;
        }
      }

      if (!bestObj) continue;

      const cmds = (f.pendingCommands = f.pendingCommands || []);
      const dist = Math.sqrt(bestD2);

      switch (bestObj.type) {
        case "CAPTURE":
          cmds.push({
            type: "OBJECTIVE_MOVE_TO",
            x: bestObj.x,
            y: bestObj.y,
            mode: "capture"
          });
          if (dist < bestObj.radius) {
            cmds.push({ type: "OBJECTIVE_HOLD", mode: "capture" });
          }
          break;

        case "DEFEND":
          cmds.push({
            type: "OBJECTIVE_MOVE_TO",
            x: bestObj.x,
            y: bestObj.y,
            mode: "defend"
          });
          if (dist < bestObj.radius) {
            cmds.push({ type: "OBJECTIVE_HOLD", mode: "defend" });
          }
          break;

        case "CONTEST":
          cmds.push({
            type: "OBJECTIVE_MOVE_TO",
            x: bestObj.x,
            y: bestObj.y,
            mode: "contest"
          });
          if (dist < Objectives.config.contestRadius) {
            cmds.push({ type: "OBJECTIVE_CONTEST", mode: "contest" });
          }
          break;
      }
    }
  }

  Objectives.updateGlobalObjectives = (function () {
    let time = 0;
    return function (formations, dt) {
      time += dt;
      const objs = getObjectivesForTime(time);
      assignObjectiveCommands(formations, objs);
    };
  })();

  console.log("PHASE19_OBJECTIVES — online (Objective Field Layer).");
})(this);
