/* ========================================================================
   APEXAI v3 — STANDARD INTELLIGENCE MODULE
   ------------------------------------------------------------------------
   Author: Randy Sellhausen (APEXCORE Platform)
   Module: APEXAI — Intelligence Layer
   Version: 3.0.0 (Standard Edition)
   Identity: Industrial, world‑agnostic, platform‑neutral
   Purpose: Scenario generation, scoring, metadata, and batch evaluation
   ======================================================================== */

export class ApexAI {
  constructor(core) {
    this.core = core;

    // Registry for modular AI pipelines
    this.generators = {};
    this.evaluators = {};

    // Default deterministic RNG seed
    this.seed = 1337;
  }

  /* ========================================================================
     RNG — Deterministic pseudo‑random generator
     ------------------------------------------------------------------------
     Ensures reproducible scenario generation and evaluation.
     ======================================================================== */
  rand() {
    // Linear Congruential Generator (LCG)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /* ========================================================================
     PIPELINE REGISTRATION
     ======================================================================== */

  registerGenerator(id, fn) {
    this.generators[id] = fn;
  }

  registerEvaluator(id, fn) {
    this.evaluators[id] = fn;
  }

  /* ========================================================================
     SCENARIO GENERATION (Single)
     ======================================================================== */

  generateScenario(generatorId, options = {}) {
    const gen = this.generators[generatorId];
    if (!gen) throw new Error(`APEXAI: Unknown generator '${generatorId}'`);

    const scenario = gen({
      rand: () => this.rand(),
      options
    });

    return this._attachMetadata(scenario, generatorId);
  }

  /* ========================================================================
     SCENARIO GENERATION (Batch)
     ======================================================================== */

  generateBatch(generatorId, count = 5, options = {}) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(this.generateScenario(generatorId, options));
    }
    return out;
  }

  /* ========================================================================
     SCENARIO EVALUATION (Single)
     ======================================================================== */

  evaluateScenario(evaluatorId, scenario) {
    const evalFn = this.evaluators[evaluatorId];
    if (!evalFn) throw new Error(`APEXAI: Unknown evaluator '${evaluatorId}'`);

    return evalFn({
      rand: () => this.rand(),
      scenario
    });
  }

  /* ========================================================================
     SCENARIO EVALUATION (Batch)
     ======================================================================== */

  evaluateBatch(evaluatorId, scenarios) {
    return scenarios.map(s => ({
      id: s.id,
      result: this.evaluateScenario(evaluatorId, s)
    }));
  }

  /* ========================================================================
     INTERNAL — METADATA ATTACHMENT
     ======================================================================== */

  _attachMetadata(scenario, generatorId) {
    return {
      ...scenario,
      id: scenario.id || this._generateId(),
      meta: {
        generator: generatorId,
        timestamp: Date.now(),
        seed: this.seed,
        difficulty: scenario.difficulty || "unknown",
        tags: scenario.tags || []
      }
    };
  }

  _generateId() {
    return "sc-" + Math.floor(this.rand() * 1e9).toString(36);
  }
}

/* ========================================================================
   DEFAULT GENERATORS — STANDARD EDITION
   ------------------------------------------------------------------------
   These are world‑agnostic, industrial, and simulation‑ready.
   ======================================================================== */

export const DefaultAIGenerators = {
  "traffic-response": ({ rand }) => {
    const difficulties = ["easy", "medium", "hard"];
    const diff = difficulties[Math.floor(rand() * difficulties.length)];

    return {
      title: "Traffic Response Scenario",
      summary: "Dynamic traffic environment with variable density and event triggers.",
      difficulty: diff,
      tags: ["traffic", "response", "dynamic"]
    };
  },

  "urban-patrol": ({ rand }) => {
    const diff = rand() > 0.6 ? "hard" : rand() > 0.3 ? "medium" : "easy";

    return {
      title: "Urban Patrol Scenario",
      summary: "Grid‑based patrol with intersections, pedestrians, and random events.",
      difficulty: diff,
      tags: ["urban", "patrol", "grid"]
    };
  },

  "closed-course": ({ rand }) => {
    return {
      title: "Closed Course Training",
      summary: "Predictable, controlled environment for baseline testing.",
      difficulty: "easy",
      tags: ["training", "controlled"]
    };
  }
};

/* ========================================================================
   DEFAULT EVALUATORS — STANDARD EDITION
   ------------------------------------------------------------------------
   These evaluators produce structured, world‑agnostic scoring.
   ======================================================================== */

export const DefaultAIEvaluators = {
  "baseline-score": ({ scenario }) => {
    const diffScore =
      scenario.difficulty === "easy" ? 1 :
      scenario.difficulty === "medium" ? 2 :
      scenario.difficulty === "hard" ? 3 : 0;

    return {
      difficultyScore: diffScore,
      tagCount: scenario.tags.length,
      composite: diffScore * 10 + scenario.tags.length
    };
  },

  "risk-profile": ({ scenario }) => {
    const risk =
      scenario.difficulty === "easy" ? "low" :
      scenario.difficulty === "medium" ? "moderate" :
      scenario.difficulty === "hard" ? "high" : "unknown";

    return {
      riskLevel: risk,
      factors: scenario.tags
    };
  }
};

/* ========================================================================
   FACTORY — Create a fully configured APEXAI instance
   ======================================================================== */

export function createApexAI(core) {
  const ai = new ApexAI(core);

  // Register default generators
  for (const id in DefaultAIGenerators) {
    ai.registerGenerator(id, DefaultAIGenerators[id]);
  }

  // Register default evaluators
  for (const id in DefaultAIEvaluators) {
    ai.registerEvaluator(id, DefaultAIEvaluators[id]);
  }

  return ai;
}
