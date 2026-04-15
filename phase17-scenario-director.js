// phase17-scenario-director.js
// APEXCORE v4.4 — Phase 17: Scenario Director Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Scenario = (APEX.Scenario = APEX.Scenario || {});

  Scenario.config = {
    cycleDuration: 18.0,       // seconds per scenario phase
    rampDuration: 4.0,         // seconds to ramp in/out
    maxIntensity: 1.0,
    minIntensity: 0.2
  };

  const PHASES = [
    "CALM_FIELD",
    "PRESSURE_WAVE",
    "PINCH_POINT",
    "CHAOTIC_SWARM"
  ];

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function getScenarioPhase(t) {
    const cycle = Scenario.config.cycleDuration;
    const idx = Math.floor((t % (cycle * PHASES.length)) / cycle);
    return PHASES[idx] || PHASES[0];
  }

  function getPhaseIntensity(t) {
    const cycle = Scenario.config.cycleDuration;
    const local = t % cycle;
    const ramp = Scenario.config.rampDuration;

    let k = 1.0;
    if (local < ramp) {
      k = local / ramp;
    } else if (local > cycle - ramp) {
      k = (cycle - local) / ramp;
    }

    k = clamp01(k);
    const minI = Scenario.config.minIntensity;
    const maxI = Scenario.config.maxIntensity;
    return minI + (maxI - minI) * k;
  }

  function applyScenarioToFormation(formation, phase, intensity) {
    const cmds = (formation.pendingCommands = formation.pendingCommands || []);

    switch (phase) {
      case "CALM_FIELD":
        cmds.push({ type: "SCENARIO_TAG", tag: "CALM" });
        cmds.push({ type: "DAMPEN_MOVEMENT", factor: 1.0 - 0.4 * intensity });
        break;

      case "PRESSURE_WAVE":
        cmds.push({ type: "SCENARIO_TAG", tag: "WAVE" });
        cmds.push({ type: "BIAS_TOWARD_CENTER", strength: 0.3 * intensity });
        cmds.push({ type: "AMPLIFY_PRESSURE_RESPONSE", factor: 1.0 + 0.5 * intensity });
        break;

      case "PINCH_POINT":
        cmds.push({ type: "SCENARIO_TAG", tag: "PINCH" });
        cmds.push({ type: "BIAS_TOWARD_AXIS", axis: "x", strength: 0.4 * intensity });
        cmds.push({ type: "CONSTRICT_FORMATION", factor: 0.7 + 0.3 * intensity });
        break;

      case "CHAOTIC_SWARM":
        cmds.push({ type: "SCENARIO_TAG", tag: "CHAOS" });
        cmds.push({ type: "ADD_NOISE_VECTOR", strength: 0.5 * intensity });
        cmds.push({ type: "LOOSEN_FORMATION", factor: 1.0 + 0.4 * intensity });
        break;
    }
  }

  Scenario.updateGlobalScenario = (function () {
    let time = 0;
    return function (formations, dt) {
      time += dt;

      const phase = getScenarioPhase(time);
      const intensity = getPhaseIntensity(time);

      for (let i = 0; i < formations.length; i++) {
        applyScenarioToFormation(formations[i], phase, intensity);
      }
    };
  })();

  console.log("PHASE17_SCENARIO — online (Scenario Director Layer).");
})(this);
