// apexai.js
// APEXAI v1 — Scenario Generation + Outcome Evaluation for APEXSIM/APEXCORE

export class ApexAI {
  constructor(core = null) {
    this.core = core || null;
  }

  attachCore(core) {
    this.core = core;
  }

  // ------------------------------------------------------
  // Scenario Generation (1D Evacuation Template)
  // ------------------------------------------------------
  generateEvacScenario(config = {}) {
    const {
      id = "ai_evac_1d",
      label = "AI-Generated 1D Evacuation Scenario",
      distanceToSafety = 5,
      civilianSpeed = 1,
      civilianAcceleration = 1,
      maxTicks = 20
    } = config;

    return {
      id,
      label,
      maxTicks,
      initialGlobalState: {
        doorOpen: false
      },
      actors: [
        {
          id: "civilian",
          type: "human",
          position: 0,
          velocity: 0,
          speed: civilianSpeed,
          acceleration: civilianAcceleration,
          direction: 1,
          state: {},
          attributes: {
            role: "civilian",
            targetPosition: distanceToSafety
          },
          behavior: (actor, state, tick) => {
            if (!state.global.doorOpen && tick === 1) {
              return { event: "openDoor" };
            }

            const target = actor.attributes.targetPosition ?? distanceToSafety;
            if (state.global.doorOpen && actor.position < target) {
              return { event: "move", params: { distance: 1 } };
            }

            return null;
          }
        },
        {
          id: "helper",
          type: "human",
          position: 0,
          velocity: 0,
          speed: 1,
          acceleration: 0,
          direction: 1,
          state: {},
          attributes: {
            role: "helper"
          },
          behavior: () => null
        }
      ],
      checkOutcome(state, tick) {
        const civilian = state.actors["civilian"];
        const target = civilian?.attributes?.targetPosition ?? distanceToSafety;

        if (civilian && civilian.position >= target) {
          return {
            id: "success",
            label: "success",
            reason: "Civilian reached safe position."
          };
        }

        if (tick >= maxTicks - 1) {
          return {
            id: "failure",
            label: "failure",
            reason: "Civilian did not reach safe position in time."
          };
        }

        return null;
      }
    };
  }

  // ------------------------------------------------------
  // Result Evaluation
  // ------------------------------------------------------
  evaluateResult(result) {
    if (!result || !result.outcome) {
      return {
        verdict: "invalid",
        score: 0,
        notes: ["No outcome present in result."]
      };
    }

    const { outcome, ticks } = result;
    const notes = [];
    let score = 0;

    if (outcome.id === "success") {
      score = 100;
      notes.push("Scenario succeeded.");
      if (ticks <= 5) {
        notes.push("Evacuation was fast.");
      } else if (ticks <= 10) {
        notes.push("Evacuation was acceptable.");
      } else {
        notes.push("Evacuation was slow but successful.");
      }
    } else {
      score = 20;
      notes.push("Scenario failed.");
    }

    return {
      verdict: outcome.id,
      score,
      notes
    };
  }

  // ------------------------------------------------------
  // Core-Orchestrated Run (Optional Helper)
  // ------------------------------------------------------
  runEvacScenarioWithCore(simFactory, config = {}) {
    if (!this.core) {
      console.error("APEXAI: No APEXCORE instance attached.");
      return null;
    }

    const scenario = this.generateEvacScenario(config);
    this.core.loadScenario(scenario);

    const result = this.core.startSimulation((loadedScenario) =>
      simFactory(loadedScenario)
    );

    const analysis = this.evaluateResult(result);

    return { scenario, result, analysis };
  }
}
