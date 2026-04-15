// formation-ai.js
// APEXCORE v4.4 — Formation AI (Phase 9–47 Integrated)

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

    if (APEX.FormationCommands) APEX.FormationCommands.update(formation, dt);
    if (APEX.FormationMemory) APEX.FormationMemory.update(formation, dt);
    if (APEX.Motives) APEX.Motives.updateMotives(formation, formations, dt);
    if (APEX.Coalitions) APEX.Coalitions.updateFormationCoalitionState(formation, formations, dt);
    if (APEX.CoalIntel) APEX.CoalIntel.applyCoalitionInfluence(formation, formations, dt);
    if (APEX.Strategy) APEX.Strategy.updateFormationStrategy(formation, formations, dt);
    if (APEX.Evolution) APEX.Evolution.updateFormationEvolution(formation, dt);
    if (APEX.Meta) APEX.Meta.updateFormationMetaState(formation, formations, dt);

    if (cmds.length && APEX.FormationCommands)
      APEX.FormationCommands.execute(formation, cmds, dt);
  }

  FormAI.update = function (dt) {
    for (let i = 0; i < formations.length; i++) updateFormation(formations[i], dt);

    if (APEX.Meta) APEX.Meta.updateGlobalMeta(formations, dt);
    if (APEX.Scenario) APEX.Scenario.updateGlobalScenario(formations, dt);
    if (APEX.Adaptive) APEX.Adaptive.updateGlobalDifficulty(formations, dt);
    if (APEX.Objectives) APEX.Objectives.updateGlobalObjectives(formations, dt);
    if (APEX.Narrative) APEX.Narrative.updateNarrativeState(formations, dt);
    if (APEX.Salience) APEX.Salience.updateGlobalSalience(formations, dt);
    if (APEX.Cues) APEX.Cues.updateGlobalCues(formations, dt);
    if (APEX.Telemetry) APEX.Telemetry.updateGlobalTelemetry(formations, dt);
    if (APEX.Influence) APEX.Influence.updateGlobalInfluence(formations, dt);
    if (APEX.Relations) APEX.Relations.updateGlobalRelations(formations, dt);
    if (APEX.AutoScenario) APEX.AutoScenario.updateScenario(formations, dt);
    if (APEX.ScenarioMemory) APEX.ScenarioMemory.updateMemory(formations, dt);
    if (APEX.ScenarioFeed) APEX.ScenarioFeed.updateFeed(dt);
    if (APEX.RelViz) APEX.RelViz.updateVisualization(formations, dt);
    if (APEX.MotiveTelemetry) APEX.MotiveTelemetry.updateGlobalMotives(formations, dt);
    if (APEX.Coalitions) APEX.Coalitions.updateGlobalCoalitions(formations, dt);
    if (APEX.CoalIntel) APEX.CoalIntel.updateGlobalCoalitionIntelligence(formations, dt);
    if (APEX.CoalRivalry) APEX.CoalRivalry.updateGlobalCoalitionRivalry(formations, dt);
    if (APEX.CoalConflict) APEX.CoalConflict.updateGlobalCoalitionConflict(formations, dt);
    if (APEX.CoalEvents) APEX.CoalEvents.updateGlobalCoalitionEvents(formations, dt);
    if (APEX.CoalStrategy) APEX.CoalStrategy.updateGlobalCoalitionStrategy(formations, dt);
    if (APEX.CoalDiplomacy) APEX.CoalDiplomacy.updateGlobalCoalitionDiplomacy(formations, dt);
    if (APEX.CoalTreaties) APEX.CoalTreaties.updateGlobalCoalitionTreaties(formations, dt);
    if (APEX.CoalCulture) APEX.CoalCulture.updateGlobalCoalitionCulture(formations, dt);
    if (APEX.CoalIdentity) APEX.CoalIdentity.updateGlobalCoalitionIdentity(formations, dt);
    if (APEX.CoalEvo) APEX.CoalEvo.updateGlobalCoalitionEvolution(formations, dt);
    if (APEX.OperatorIntervention) APEX.OperatorIntervention.updateGlobalOperatorBias(formations, dt);
    if (APEX.OperatorPresence) APEX.OperatorPresence.updateGlobalOperatorPresence(formations, dt);
    if (APEX.CoalViz) APEX.CoalViz.updateCoalitionVisualization(formations, dt);
  };

  console.log("FORMATION_AI — online (Phase 9–47).");
})(this);
