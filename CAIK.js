/* ============================================================
   APEXCORE — TIER‑4 COMMAND INTELLIGENCE KERNEL (CAIK)
   Batch 3 — Full Plan Synthesis + Multi‑Branch Command Logic
   ============================================================ */

window.APEXCORE = window.APEXCORE || {};
APEXCORE.CommandAI = {};

/* ------------------------------------------------------------
   1. COMMAND PLAN OBJECT
------------------------------------------------------------ */
class CommandPlan {
    constructor(label = "primary") {
        this.label = label;                 // e.g., "aggressive", "cautious", "flank"
        this.targetPositions = [];
        this.formationTransitions = [];
        this.movementVectors = [];
        this.engagementRules = [];
        this.timing = { start: 0, end: 0 };
        this.confidence = 0;
        this.score = 0;                     // internal plan score
        this.contingencies = [];
        this.ghostPaths = [];               // for Tier‑4 HUD previews
        this.analysis = {
            threat: null,
            terrain: null,
            formation: null,
            risk: null,
            opportunity: null,
            pathing: null
        };
        this.branches = [];                 // alternative plans (CommandPlan[])
        this.selected = true;               // this plan is the chosen one
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

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpPoint(a, b, t) {
    return {
        x: lerp(a.x || 0, b.x || 0, t),
        y: lerp(a.y || 0, b.y || 0, t)
    };
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

/* ---------------- ThreatEvaluator ---------------- */
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

/* ---------------- TerrainEvaluator ---------------- */
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

        if (cover > 0.7) base += 0.15;
        if (cover < 0.3) base -= 0.2;

        if (elevation > 5) base += 0.15;
        if (elevation < -5) base -= 0.1;

        if (isChoke) {
            if (intent.objective === "hold") {
                base += 0.1;
            } else {
                base -= 0.25;
            }
        }

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

/* ---------------- FormationEvaluator ---------------- */
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

/* ---------------- RiskEvaluator ---------------- */
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

/* ---------------- OpportunityEvaluator ---------------- */
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

/* ---------------- PathingEvaluator ---------------- */
class PathingEvaluator extends BaseEvaluator {
    constructor() {
        super("pathing", 1.0);
    }

    evaluate(intent, worldState) {
        const origin = worldState.position || { x: 0, y: 0 };
        const target = intent.target || origin;

        const dist = distance2D(origin, target);

        let base = 1;
        if (dist > 1000) base -= 0.4;
        else if (dist > 500) base -= 0.25;
        else if (dist > 250) base -= 0.1;

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
   5. COMMAND AI KERNEL (CAIK) — FULL PLAN SYNTHESIS
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

    /* ---------------- Public API ---------------- */
    processIntent(intentPacket, worldState) {
        const evalResults = this.evaluators.map(ev => ev.evaluate(intentPacket, worldState));

        const baseConfidence = this.computeBaseConfidence(evalResults);
        const analysisMap = this.buildAnalysisMap(evalResults);

        const candidatePlans = this.buildCandidatePlans(intentPacket, worldState, baseConfidence, analysisMap);

        const scoredPlans = this.scoreCandidatePlans(candidatePlans, analysisMap, intentPacket, worldState);

        const bestPlan = this.selectBestPlan(scoredPlans);

        bestPlan.branches = scoredPlans.filter(p => p !== bestPlan);
        bestPlan.selected = true;

        return bestPlan;
    }

    /* ---------------- Confidence & Analysis ---------------- */
    computeBaseConfidence(evalResults) {
        let weightedSum = 0;
        let weightTotal = 0;

        evalResults.forEach(r => {
            weightedSum += r.score * r.weight;
            weightTotal += r.weight;
        });

        return weightTotal > 0 ? clamp01(weightedSum / weightTotal) : 0;
    }

    buildAnalysisMap(evalResults) {
        const map = {
            threat: null,
            terrain: null,
            formation: null,
            risk: null,
            opportunity: null,
            pathing: null
        };

        evalResults.forEach(r => {
            if (map.hasOwnProperty(r.name)) {
                map[r.name] = r;
            }
        });

        return map;
    }

    /* ---------------- Candidate Plan Generation ---------------- */
    buildCandidatePlans(intent, worldState, baseConfidence, analysis) {
        const plans = [];

        // Primary: baseline aligned with intent
        const primary = this.createPlan("primary", intent, worldState, baseConfidence, analysis, {
            aggressionBias: 0,
            flankBias: 0,
            cautionBias: 0
        });
        plans.push(primary);

        // Aggressive branch (if risk allows)
        if ((analysis.risk?.data?.risk || "medium") !== "low") {
            const aggressive = this.createPlan("aggressive", intent, worldState, baseConfidence, analysis, {
                aggressionBias: 0.3,
                flankBias: 0.1,
                cautionBias: -0.2
            });
            plans.push(aggressive);
        }

        // Cautious branch
        const cautious = this.createPlan("cautious", intent, worldState, baseConfidence, analysis, {
            aggressionBias: -0.2,
            flankBias: 0,
            cautionBias: 0.3
        });
        plans.push(cautious);

        // Flanking branch (if opportunities exist)
        if (analysis.opportunity && analysis.opportunity.data.highValue > 0) {
            const flank = this.createPlan("flank", intent, worldState, baseConfidence, analysis, {
                aggressionBias: 0.1,
                flankBias: 0.4,
                cautionBias: 0
            });
            plans.push(flank);
        }

        // Fallback branch (if threat is high or confidence low)
        const threatScore = analysis.threat ? analysis.threat.score : 1;
        if (threatScore < 0.5 || baseConfidence < 0.4) {
            const fallback = this.createPlan("fallback", intent, worldState, baseConfidence, analysis, {
                aggressionBias: -0.4,
                flankBias: 0,
                cautionBias: 0.5,
                forceRetreat: true
            });
            plans.push(fallback);
        }

        return plans;
    }

    createPlan(label, intent, worldState, baseConfidence, analysis, behavior) {
        const plan = new CommandPlan(label);

        plan.analysis = analysis;
        plan.confidence = baseConfidence;

        plan.movementVectors = this.generateMovement(intent, worldState, plan, behavior);
        plan.formationTransitions = this.generateFormation(intent, worldState, plan, behavior);
        plan.engagementRules = this.generateEngagement(intent, worldState, plan, behavior);
        plan.timing = this.generateTiming(intent, worldState, plan, behavior);
        plan.contingencies = this.generateContingencies(intent, worldState, plan, behavior);
        plan.ghostPaths = this.generateGhostPaths(plan, worldState);

        return plan;
    }

    /* ---------------- Movement Generation ---------------- */
    generateMovement(intent, worldState, plan, behavior) {
        const origin = worldState.position || { x: 0, y: 0 };
        const targetBase = intent.target || origin;

        let target = { ...targetBase };

        if (behavior.flankBias > 0 && plan.analysis.opportunity) {
            const opps = plan.analysis.opportunity.data.opportunities || [];
            const flankOpp = opps.find(o => o.exposedFlank) || opps[0];
            if (flankOpp && flankOpp.position) {
                target = flankOpp.position;
            }
        }

        const priority = intent.priority || "medium";
        let speedMode =
            priority === "high" ? "fast" :
            priority === "low" ? "slow" :
            "normal";

        if (behavior.cautionBias > 0.3) {
            speedMode = "slow";
        }
        if (behavior.aggressionBias > 0.2 && priority !== "low") {
            speedMode = "fast";
        }

        return [{
            from: origin,
            to: target,
            speed: speedMode,
            pathPreference: {
                avoidHighExposure: behavior.cautionBias > 0,
                preferCover: true
            }
        }];
    }

    /* ---------------- Formation Transitions ---------------- */
    generateFormation(intent, worldState, plan, behavior) {
        const current = worldState.formation?.current || "default";
        let desired = intent.formation || "line";

        const objective = intent.objective || "hold";
        const risk = intent.risk || "medium";

        if (labelIs(plan, "aggressive") || (objective === "attack" && risk === "high")) {
            desired = intent.formation || "wedge";
        }

        if (labelIs(plan, "cautious") || objective === "hold") {
            desired = intent.formation || "shield";
        }

        if (labelIs(plan, "flank")) {
            desired = intent.formation || "column";
        }

        if (labelIs(plan, "fallback")) {
            desired = intent.formation || "echelon";
        }

        return [{
            from: current,
            to: desired
        }];
    }

    /* ---------------- Engagement Rules ---------------- */
    generateEngagement(intent, worldState, plan, behavior) {
        const objective = intent.objective || "hold";

        let mode = "hold";
        let fire = false;
        let pursuit = false;

        if (objective === "attack") {
            mode = "aggressive";
            fire = true;
            pursuit = intent.risk === "high" || behavior.aggressionBias > 0.2;
        } else if (objective === "retreat" || behavior.forceRetreat) {
            mode = "evasive";
            fire = intent.risk === "high" && !behavior.cautionBias;
        } else if (objective === "scout" || objective === "recon") {
            mode = "stealth";
            fire = false;
        }

        if (labelIs(plan, "cautious")) {
            fire = fire && intent.risk !== "low";
            pursuit = false;
        }

        if (labelIs(plan, "flank")) {
            mode = "aggressive";
            fire = true;
        }

        if (labelIs(plan, "fallback")) {
            mode = "evasive";
            fire = false;
            pursuit = false;
        }

        return [{
            mode,
            fire,
            pursuit
        }];
    }

    /* ---------------- Timing Windows ---------------- */
    generateTiming(intent, worldState, plan, behavior) {
        const now = worldState.time || 0;

        let duration;
        const priority = intent.priority || "medium";

        if (priority === "high") duration = 2;
        else if (priority === "low") duration = 6;
        else duration = 4;

        if (plan.confidence > 0.8) duration *= 0.8;
        if (plan.confidence < 0.4) duration *= 1.2;

        if (labelIs(plan, "aggressive")) {
            duration *= 0.9;
        }
        if (labelIs(plan, "cautious") || labelIs(plan, "fallback")) {
            duration *= 1.1;
        }

        return {
            start: now,
            end: now + duration
        };
    }

    /* ---------------- Contingency Branches ---------------- */
    generateContingencies(intent, worldState, plan, behavior) {
        const contingencies = [];

        contingencies.push({
            condition: "threatSpike",
            action: behavior.forceRetreat ? "fallback" :
                    intent.risk === "low" ? "fallback" :
                    "holdAndCounter"
        });

        contingencies.push({
            condition: "opportunityWindow",
            action: labelIs(plan, "aggressive") || labelIs(plan, "flank") ? "advance" : "probe"
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

    /* ---------------- Ghost Paths (Tier‑4 HUD) ---------------- */
    generateGhostPaths(plan, worldState) {
        const origin = (plan.movementVectors[0] && plan.movementVectors[0].from) || worldState.position || { x: 0, y: 0 };
        const target = (plan.movementVectors[0] && plan.movementVectors[0].to) || origin;

        const segments = [];
        const steps = 5;

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            segments.push(lerpPoint(origin, target, t));
        }

        return segments;
    }

    /* ---------------- Plan Scoring & Selection ---------------- */
    scoreCandidatePlans(plans, analysis, intent, worldState) {
        const threatScore = analysis.threat ? analysis.threat.score : 1;
        const oppScore = analysis.opportunity ? analysis.opportunity.score : 0;
        const risk = analysis.risk ? analysis.risk.data.risk : (intent.risk || "medium");

        return plans.map(plan => {
            let score = plan.confidence;

            if (labelIs(plan, "aggressive")) {
                score += oppScore * 0.3;
                score -= (1 - threatScore) * 0.2;
                if (risk === "high") score += 0.1;
                if (risk === "low") score -= 0.2;
            }

            if (labelIs(plan, "cautious")) {
                score += (1 - threatScore) * 0.3;
                if (risk === "low") score += 0.1;
            }

            if (labelIs(plan, "flank")) {
                score += oppScore * 0.4;
                score -= (1 - threatScore) * 0.1;
            }

            if (labelIs(plan, "fallback")) {
                score += (1 - threatScore) * 0.4;
                if (plan.confidence < 0.4) score += 0.1;
                if (risk === "high") score -= 0.1;
            }

            if (intent.objective === "hold" && labelIs(plan, "aggressive")) {
                score -= 0.2;
            }

            plan.score = clamp01(score);
            return plan;
        });
    }

    selectBestPlan(plans) {
        let best = plans[0];
        let bestScore = plans[0].score;

        for (let i = 1; i < plans.length; i++) {
            if (plans[i].score > bestScore) {
                best = plans[i];
                bestScore = plans[i].score;
            }
        }

        return best;
    }
}

/* ------------------------------------------------------------
   6. UTIL
------------------------------------------------------------ */
function labelIs(plan, label) {
    return plan.label === label;
}

/* ------------------------------------------------------------
   7. EXPORT TO APEXCORE
------------------------------------------------------------ */
APEXCORE.CommandAI.Kernel = new CommandAIKernel();
