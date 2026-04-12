/* ============================================================
   APEXCORE — TIER‑4 COMMAND INTELLIGENCE KERNEL (CAIK)
   Batch 1 — Core Kernel + Evaluator Framework + Plan Scaffold
   ============================================================ */

window.APEXCORE = window.APEXCORE || {};
APEXCORE.CommandAI = {};

/* ------------------------------------------------------------
   1. COMMAND PLAN OBJECT
------------------------------------------------------------ */
class CommandPlan {
    constructor() {
        this.targetPositions = [];
        this.formationTransitions = [];
        this.movementVectors = [];
        this.engagementRules = [];
        this.timing = { start: 0, end: 0 };
        this.confidence = 0;
        this.contingencies = [];
    }
}

/* ------------------------------------------------------------
   2. EVALUATOR FRAMEWORK
------------------------------------------------------------ */
class BaseEvaluator {
    evaluate(intent, worldState) {
        return { score: 0, data: {} };
    }
}

class ThreatEvaluator extends BaseEvaluator {
    evaluate(intent, worldState) {
        const threats = worldState.threats || [];
        let score = 1;

        threats.forEach(t => {
            if (t.distance < 150) score -= 0.2;
            if (t.isFlanking) score -= 0.3;
        });

        return { score: Math.max(0, score), data: { threats } };
    }
}

class TerrainEvaluator extends BaseEvaluator {
    evaluate(intent, worldState) {
        const terrain = worldState.terrain || {};
        let score = 1;

        if (terrain.cover < 0.3) score -= 0.2;
        if (terrain.elevation < -5) score -= 0.1;
        if (terrain.isChokePoint) score -= 0.3;

        return { score: Math.max(0, score), data: { terrain } };
    }
}

class FormationEvaluator extends BaseEvaluator {
    evaluate(intent, worldState) {
        const formation = worldState.formation || {};
        let score = 1;

        if (!formation.isStable) score -= 0.3;
        if (formation.cohesion < 0.5) score -= 0.2;

        return { score: Math.max(0, score), data: { formation } };
    }
}

class RiskEvaluator extends BaseEvaluator {
    evaluate(intent, worldState) {
        let score = 1;

        if (intent.risk === "high") score += 0.2;
        if (intent.risk === "low") score -= 0.2;

        return { score: Math.max(0, Math.min(1, score)), data: {} };
    }
}

class OpportunityEvaluator extends BaseEvaluator {
    evaluate(intent, worldState) {
        const opportunities = worldState.opportunities || [];
        let score = 0;

        opportunities.forEach(o => {
            if (o.window < 3) score += 0.3;
            if (o.exposedFlank) score += 0.4;
        });

        return { score: Math.min(1, score), data: { opportunities } };
    }
}

/* ------------------------------------------------------------
   3. COMMAND AI KERNEL (CAIK)
------------------------------------------------------------ */
class CommandAIKernel {
    constructor() {
        this.evaluators = [
            new ThreatEvaluator(),
            new TerrainEvaluator(),
            new FormationEvaluator(),
            new RiskEvaluator(),
            new OpportunityEvaluator()
        ];
    }

    processIntent(intentPacket, worldState) {
        const plan = new CommandPlan();
        let totalScore = 0;

        const evalResults = this.evaluators.map(ev => ev.evaluate(intentPacket, worldState));
        evalResults.forEach(r => totalScore += r.score);

        plan.confidence = totalScore / this.evaluators.length;

        plan.movementVectors = this.generateMovement(intentPacket, worldState);
        plan.formationTransitions = this.generateFormation(intentPacket, worldState);
        plan.engagementRules = this.generateEngagement(intentPacket, worldState);
        plan.timing = this.generateTiming(intentPacket, worldState);

        plan.contingencies = this.generateContingencies(intentPacket, worldState);

        return plan;
    }

    generateMovement(intent, worldState) {
        return [{
            from: worldState.position,
            to: intent.target,
            speed: intent.priority === "high" ? "fast" : "normal"
        }];
    }

    generateFormation(intent, worldState) {
        return [{
            from: worldState.formation?.current || "default",
            to: intent.formation || "line"
        }];
    }

    generateEngagement(intent, worldState) {
        return [{
            mode: intent.objective === "attack" ? "aggressive" : "hold",
            fire: intent.objective === "attack"
        }];
    }

    generateTiming(intent, worldState) {
        return {
            start: worldState.time,
            end: worldState.time + (intent.priority === "high" ? 2 : 5)
        };
    }

    generateContingencies(intent, worldState) {
        return [
            { condition: "threatSpike", action: "fallback" },
            { condition: "opportunityWindow", action: "advance" }
        ];
    }
}

/* ------------------------------------------------------------
   4. EXPORT TO APEXCORE
------------------------------------------------------------ */
APEXCORE.CommandAI.Kernel = new CommandAIKernel();
