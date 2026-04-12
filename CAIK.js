/* ============================================================
   APEXCORE — TIER‑4 COMMAND INTELLIGENCE KERNEL (CAIK)
   Batch 2 — Advanced Evaluators + Weighted Plan Confidence
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
        this.analysis = {
            threat: null,
            terrain: null,
            formation: null,
            risk: null,
            opportunity: null,
            pathing: null
        };
    }
}

/* ------------------------------------------------------------
   2. HELPER FUNCTIONS
------------------------------------------------------------ */
function clamp01(v) {
    return Math.max(0, Math.min(1, v));
}

function distance2D(a, b) {
    if (!a || !b) return Infinity;
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
}

/* ------------------------------------------------------------
   3. BASE EVALUATOR
------------------------------------------------------------ */
class BaseEvaluator {
    constructor(name, weight = 1.0) {
        this.name = name;
        this.weight = weight;
    }

    evaluate(intent, worldState) {
        return {
            name: this.name,
            score: 0,
            weight: this.weight,
            data: {}
        };
    }
}

/* ------------------------------------------------------------
   4. ADVANCED EVALUATORS
------------------------------------------------------------ */

/* ---------------- ThreatEvaluator ----------------
   Multi‑vector threat forecasting:
   - Considers distance, flanking, aggression, LOS, and count
---------------------------------------------------- */
class ThreatEvaluator extends BaseEvaluator {
    constructor() {
        super("threat", 1.3);
    }

    evaluate(intent, worldState) {
        const threats = worldState.threats || [];
        if (!threats.length) {
            return {
                name: this.name,
                score: 1,
                weight: this.weight,
                data: { threats, summary: "noThreats" }
            };
        }

        let base = 1;
        let closeCount = 0;
        let flankCount = 0;
        let highAggro = 0;

        threats.forEach(t => {
            const distPenalty = t.distance < 100 ? 0.35 :
                                t.distance < 200 ? 0.2 : 0.05;
            base -= distPenalty;

            if (t.distance < 150) closeCount++;
            if (t.isFlanking) {
                base -= 0.25;
                flankCount++;
            }
            if (t.aggression && t.aggression > 0.7) {
                base -= 0.2;
                highAggro++;
            }
            if (t.hasLOS) {
                base -= 0.1;
            }
        });

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                threats,
                closeCount,
                flankCount,
                highAggro
            }
        };
    }
}

/* ---------------- TerrainEvaluator ----------------
   Terrain corridor scoring:
   - Cover, elevation, choke points, openness
---------------------------------------------------- */
class TerrainEvaluator extends BaseEvaluator {
    constructor() {
        super("terrain", 1.1);
    }

    evaluate(intent, worldState) {
        const terrain = worldState.terrain || {};
        let base = 0.8;

        const cover = terrain.cover ?? 0.5;
        const elevation = terrain.elevation ?? 0;
        const isChoke = !!terrain.isChokePoint;
        const openness = terrain.openness ?? 0.5;

        // Good cover boosts, low cover penalizes
        if (cover > 0.7) base += 0.15;
        if (cover < 0.3) base -= 0.2;

        // High ground advantage
        if (elevation > 5) base += 0.15;
        if (elevation < -5) base -= 0.1;

        // Choke points are risky unless intent is "hold"
        if (isChoke) {
            if (intent.objective === "hold") {
                base += 0.1;
            } else {
                base -= 0.25;
            }
        }

        // Too open is risky for low‑risk intents
        if (openness > 0.8 && intent.risk !== "high") {
            base -= 0.15;
        }

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                terrain,
                cover,
                elevation,
                isChoke,
                openness
            }
        };
    }
}

/* ---------------- FormationEvaluator ----------------
   Formation feasibility:
   - Cohesion, stability, distance to target, formation type
------------------------------------------------------- */
class FormationEvaluator extends BaseEvaluator {
    constructor() {
        super("formation", 1.0);
    }

    evaluate(intent, worldState) {
        const formation = worldState.formation || {};
        let base = 1;

        const cohesion = formation.cohesion ?? 1;
        const isStable = formation.isStable ?? true;
        const currentType = formation.current || "default";

        if (!isStable) base -= 0.3;
        if (cohesion < 0.5) base -= 0.25;
        if (cohesion < 0.25) base -= 0.25;

        // Penalize aggressive objectives with weak formations
        if (intent.objective === "attack" && cohesion < 0.5) {
            base -= 0.2;
        }

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                formation,
                cohesion,
                isStable,
                currentType
            }
        };
    }
}

/* ---------------- RiskEvaluator ----------------
   Risk‑adjusted weighting:
   - Aligns plan aggressiveness with commander risk tolerance
-------------------------------------------------- */
class RiskEvaluator extends BaseEvaluator {
    constructor() {
        super("risk", 0.9);
    }

    evaluate(intent, worldState) {
        let base = 0.5;

        const risk = intent.risk || "medium";
        const objective = intent.objective || "hold";

        if (risk === "high") base += 0.25;
        if (risk === "low") base -= 0.15;

        if (objective === "attack" && risk === "low") {
            base -= 0.2;
        }
        if (objective === "retreat" && risk === "high") {
            base -= 0.1;
        }

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                risk,
                objective
            }
        };
    }
}

/* ---------------- OpportunityEvaluator ----------------
   Opportunity window prediction:
   - Short windows, exposed flanks, isolated targets
-------------------------------------------------------- */
class OpportunityEvaluator extends BaseEvaluator {
    constructor() {
        super("opportunity", 1.2);
    }

    evaluate(intent, worldState) {
        const opportunities = worldState.opportunities || [];
        if (!opportunities.length) {
            return {
                name: this.name,
                score: 0,
                weight: this.weight,
                data: { opportunities, summary: "noOpportunities" }
            };
        }

        let base = 0;
        let highValue = 0;

        opportunities.forEach(o => {
            const window = o.window ?? 5;
            const exposedFlank = !!o.exposedFlank;
            const isolated = !!o.isolated;

            if (window <= 2) base += 0.35;
            else if (window <= 5) base += 0.2;

            if (exposedFlank) {
                base += 0.3;
                highValue++;
            }

            if (isolated) {
                base += 0.2;
            }
        });

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                opportunities,
                highValue
            }
        };
    }
}

/* ---------------- PathingEvaluator ----------------
   Predictive pathing:
   - Distance, exposure along path, terrain quality along route
----------------------------------------------------- */
class PathingEvaluator extends BaseEvaluator {
    constructor() {
        super("pathing", 1.0);
    }

    evaluate(intent, worldState) {
        const origin = worldState.position || { x: 0, y: 0 };
        const target = intent.target || origin;

        const dist = distance2D(origin, target);

        // Heuristic: shorter paths are better, but we normalize
        let base = 1;
        if (dist > 1000) base -= 0.4;
        else if (dist > 500) base -= 0.25;
        else if (dist > 250) base -= 0.1;

        // If worldState has pathExposure metric (0‑1), use it
        const pathExposure = worldState.pathExposure ?? 0.5;
        if (pathExposure > 0.7) base -= 0.25;
        if (pathExposure < 0.3) base += 0.15;

        const score = clamp01(base);

        return {
            name: this.name,
            score,
            weight: this.weight,
            data: {
                origin,
                target,
                distance: dist,
                pathExposure
            }
        };
    }
}

/* ------------------------------------------------------------
   5. COMMAND AI KERNEL (CAIK)
------------------------------------------------------------ */
class CommandAIKernel {
    constructor() {
        this.evaluators = [
            new ThreatEvaluator(),
            new TerrainEvaluator(),
            new FormationEvaluator(),
            new RiskEvaluator(),
            new OpportunityEvaluator(),
            new PathingEvaluator()
        ];
    }

    processIntent(intentPacket, worldState) {
        const plan = new CommandPlan();

        const evalResults = this.evaluators.map(ev => ev.evaluate(intentPacket, worldState));

        let weightedSum = 0;
        let weightTotal = 0;

        evalResults.forEach(r => {
            weightedSum += r.score * r.weight;
            weightTotal += r.weight;

            // Attach analysis by name
            if (plan.analysis.hasOwnProperty(r.name)) {
                plan.analysis[r.name] = r;
            }
        });

        plan.confidence = weightTotal > 0 ? clamp01(weightedSum / weightTotal) : 0;

        plan.movementVectors = this.generateMovement(intentPacket, worldState, plan);
        plan.formationTransitions = this.generateFormation(intentPacket, worldState, plan);
        plan.engagementRules = this.generateEngagement(intentPacket, worldState, plan);
        plan.timing = this.generateTiming(intentPacket, worldState, plan);
        plan.contingencies = this.generateContingencies(intentPacket, worldState, plan);

        return plan;
    }

    /* ---------------- Movement Generation ---------------- */
    generateMovement(intent, worldState, plan) {
        const origin = worldState.position || { x: 0, y: 0 };
        const target = intent.target || origin;

        const speedMode =
            intent.priority === "high" ? "fast" :
            intent.priority === "low" ? "slow" :
            "normal";

        return [{
            from: origin,
            to: target,
            speed: speedMode,
            pathPreference: {
                avoidHighExposure: true,
                preferCover: true
            }
        }];
    }

    /* ---------------- Formation Transitions ---------------- */
    generateFormation(intent, worldState, plan) {
        const current = worldState.formation?.current || "default";
        let desired = intent.formation || "line";

        if (intent.objective === "attack" && intent.risk === "high") {
            desired = intent.formation || "wedge";
        }

        if (intent.objective === "hold") {
            desired = intent.formation || "shield";
        }

        return [{
            from: current,
            to: desired
        }];
    }

    /* ---------------- Engagement Rules ---------------- */
    generateEngagement(intent, worldState, plan) {
        const objective = intent.objective || "hold";

        let mode = "hold";
        let fire = false;
        let pursuit = false;

        if (objective === "attack") {
            mode = "aggressive";
            fire = true;
            pursuit = intent.risk === "high";
        } else if (objective === "retreat") {
            mode = "evasive";
            fire = intent.risk === "high";
        } else if (objective === "scout" || objective === "recon") {
            mode = "stealth";
            fire = false;
        }

        return [{
            mode,
            fire,
            pursuit
        }];
    }

    /* ---------------- Timing Windows ---------------- */
    generateTiming(intent, worldState, plan) {
        const now = worldState.time || 0;

        let duration;
        if (intent.priority === "high") duration = 2;
        else if (intent.priority === "low") duration = 6;
        else duration = 4;

        // Slightly compress timing if confidence is high
        if (plan.confidence > 0.8) duration *= 0.8;
        if (plan.confidence < 0.4) duration *= 1.2;

        return {
            start: now,
            end: now + duration
        };
    }

    /* ---------------- Contingency Branches ---------------- */
    generateContingencies(intent, worldState, plan) {
        const contingencies = [];

        contingencies.push({
            condition: "threatSpike",
            action: intent.risk === "low" ? "fallback" : "holdAndCounter"
        });

        contingencies.push({
            condition: "opportunityWindow",
            action: intent.objective === "attack" ? "advance" : "probe"
        });

        contingencies.push({
            condition: "formationBreak",
            action: "regroup"
        });

        if (plan.confidence < 0.4) {
            contingencies.push({
                condition: "lowConfidence",
                action: "requestNewIntent"
            });
        }

        return contingencies;
    }
}

/* ------------------------------------------------------------
   6. EXPORT TO APEXCORE
------------------------------------------------------------ */
APEXCORE.CommandAI.Kernel = new CommandAIKernel();
