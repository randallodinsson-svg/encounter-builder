// formation-ai.js
// APEXCORE v4.4 — Formation AI (Phase 9–14 Integrated)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const FormAI = (APEX.FormAI = APEX.FormAI || {});

  const formations = [];
  FormAI.list = formations;

  FormAI.register = function (formation) {
    formations.push(formation);
  };

  function updateFormation(formation, dt) {
    const cmds = (formation.pendingCommands = []);

    // Phase 9–12 AI logic (existing)
    if (APEX.FormationCommands) {
      APEX.FormationCommands.update(formation, dt);
    }

    // Phase 13 Memory
    if (APEX.FormationMemory) {
      APEX.FormationMemory.update(formation, dt);
    }

    // Phase 14 Strategy (NEW)
    if (APEX.Strategy && APEX.Strategy.updateFormationStrategy) {
      APEX.Strategy.updateFormationStrategy(formation, formations, dt);
    }

    // Execute commands
    if (cmds.length && APEX.FormationCommands) {
      APEX.FormationCommands.execute(formation, cmds, dt);
    }
  }

  FormAI.update = function (dt) {
    for (let i = 0; i < formations.length; i++) {
      updateFormation(formations[i], dt);
    }
  };

  console.log("FORMATION_AI — online (Phase 9–14).");
})(this);
