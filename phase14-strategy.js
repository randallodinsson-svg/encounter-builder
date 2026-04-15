// phase14-strategy.js
// APEXCORE v4.4 — Phase 14: Emergent Strategy Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Strategy = (APEX.Strategy = APEX.Strategy || {});

  Strategy.config = {
    predictionHorizon: 2.0,      // seconds into the future
    minGroupSize: 6,             // formations below this ignore complex tactics
    cooperationRadius: 260,      // world units
    retreatThreshold: 0.65,      // pressure ratio
    aggressionThreshold: 0.35,   // pressure ratio
    personalityDriftRate: 0.02   // how fast personalities evolve
  };

  // Simple personality model per formation
  // aggression: 0..1  (0 = defensive, 1 = hyper‑aggressive)
  // cohesion:   0..1  (0 = lone wolf, 1 = group‑oriented)
  // cunning:    0..1  (0 = direct, 1 = flanking / indirect)
  function ensurePersonality(formation) {
    if (!formation.personality) {
      formation.personality = {
        aggression: Math.random() * 0.4 + 0.3,
        cohesion: Math.random() * 0.4 + 0.3,
        cunning: Math.random() * 0.4 + 0.3
      };
    }
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  // Predict future pressure using influence maps + memory
  function predictPressure(formation, dt) {
    const mem = formation.memory || {};
    const lastPressure = mem.lastPressure || 0;
    const trend = mem.pressureTrend || 0;
    const horizon = Strategy.config.predictionHorizon;

    // crude forecast: current + trend * horizon
    let predicted = lastPressure + trend * horizon;
    return clamp01(predicted);
  }

  // Decide high‑level intent based on predicted pressure + personality
  function decideIntent(formation, predictedPressure) {
    ensurePersonality(formation);
    const p = formation.personality;

    const retreatT = Strategy.config.retreatThreshold * (1.0 - p.aggression * 0.3);
    const attackT = Strategy.config.aggressionThreshold * (1.0 + p.aggression * 0.3);

    if (predictedPressure > retreatT) {
      return "RETREAT";
    }
    if (predictedPressure < attackT) {
      return "ATTACK";
    }
    return "POSITION";
  }

  // Find nearby formations for cooperation
  function findNeighbors(formation, allFormations) {
    const radius = Strategy.config.cooperationRadius;
    const r2 = radius * radius;
    const out = [];
    for (let i = 0; i < allFormations.length; i++) {
      const other = allFormations[i];
      if (other === formation) continue;
      const dx = other.center.x - formation.center.x;
      const dy = other.center.y - formation.center.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) out.push(other);
    }
    return out;
  }

  // Simple cooperative tactic: align intents and share “target zones”
  function coordinateIntent(formation, neighbors, intent) {
    if (!neighbors.length) return intent;

    // If most neighbors are retreating, bias toward retreat
    let retreatCount = 0;
    let attackCount = 0;
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      const ni = n.strategyIntent || "POSITION";
      if (ni === "RETREAT") retreatCount++;
      else if (ni === "ATTACK") attackCount++;
    }

    if (retreatCount > attackCount * 1.5) return "RETREAT";
    if (attackCount > retreatCount * 1.5) return "ATTACK";
    return intent;
  }

  // Map high‑level intent to command tags the existing AI/commands layer can use
  function pushIntentToCommands(formation, intent) {
    formation.strategyIntent = intent;

    const cmds = (formation.pendingCommands = formation.pendingCommands || []);

    switch (intent) {
      case "RETREAT":
        cmds.push({ type: "SET_MODE", mode: "defensive" });
        cmds.push({ type: "MOVE_TO_SAFE_ZONE" });
        break;

      case "ATTACK":
        cmds.push({ type: "SET_MODE", mode: "aggressive" });
        cmds.push({ type: "SEEK_PRESSURE_MINIMA" }); // move toward weak spots
        break;

      case "POSITION":
      default:
        cmds.push({ type: "SET_MODE", mode: "neutral" });
        cmds.push({ type: "MAINTAIN_FORMATION" });
        break;
    }
  }

  // Personality drift over time based on experienced pressure
  function updatePersonalityFromMemory(formation, dt) {
    ensurePersonality(formation);
    const mem = formation.memory || {};
    const p = formation.personality;
    const drift = Strategy.config.personalityDriftRate * dt;

    const avgPressure = mem.avgPressure || mem.lastPressure || 0.5;

    // high pressure → more cautious, more cohesive
    // low pressure → more aggressive, more independent
    if (avgPressure > 0.6) {
      p.aggression = clamp01(p.aggression - drift * 0.7);
      p.cohesion = clamp01(p.cohesion + drift * 0.5);
      p.cunning = clamp01(p.cunning + drift * 0.3);
    } else if (avgPressure < 0.4) {
      p.aggression = clamp01(p.aggression + drift * 0.7);
      p.cohesion = clamp01(p.cohesion - drift * 0.3);
      p.cunning = clamp01(p.cunning + drift * 0.2);
    } else {
      // mid‑pressure → subtle random walk
      p.aggression = clamp01(p.aggression + (Math.random() - 0.5) * drift * 0.3);
      p.cohesion = clamp01(p.cohesion + (Math.random() - 0.5) * drift * 0.3);
      p.cunning = clamp01(p.cunning + (Math.random() - 0.5) * drift * 0.3);
    }
  }

  // Main Phase 14 update — called once per frame from formation‑AI
  Strategy.updateFormationStrategy = function (formation, allFormations, dt) {
    if (!formation.memory) return;

    updatePersonalityFromMemory(formation, dt);

    const predictedPressure = predictPressure(formation, dt);
    let intent = decideIntent(formation, predictedPressure);

    const neighbors = findNeighbors(formation, allFormations);
    if (neighbors.length && formation.personality.cohesion > 0.4) {
      intent = coordinateIntent(formation, neighbors, intent);
    }

    pushIntentToCommands(formation, intent);
  };

  console.log("PHASE14_STRATEGY — online (Emergent Strategy Layer).");
})(this);
