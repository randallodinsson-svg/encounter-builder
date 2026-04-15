// formation-ai.js
// APEXCORE v4.4 — Formation AI (Phase 9–15 Integrated)

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

    // Phase 9–12 AI logic
    if (APEX.FormationCommands) {
      APEX.FormationCommands.update(formation, dt);
    }

    // Phase 13 Memory
    if (APEX.FormationMemory) {
      APEX.FormationMemory.update(formation, dt);
    }

    // Phase 14 Strategy
    if (APEX.Strategy && APEX.Strategy.updateFormationStrategy) {
      APEX.Strategy.updateFormationStrategy(formation, formations, dt);
    }

    // Phase 15 Evolution
    if (APEX.Evolution && APEX.Evolution.updateFormationEvolution) {
      APEX.Evolution.updateFormationEvolution(formation, dt);
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

  console.log("FORMATION_AI — online (Phase 9–15).");
})(this);
