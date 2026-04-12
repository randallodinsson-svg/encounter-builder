/* ============================================================
   APEXCORE — TIER‑4 COMMAND INTELLIGENCE KERNEL (CAIK)
   Batch 5 — Command Feedback Loop (CFL)
   ============================================================ */

window.APEXCORE = window.APEXCORE || {};
APEXCORE.CommandAI = {};

/* ------------------------------------------------------------
   1. COMMAND PLAN OBJECT
------------------------------------------------------------ */
class CommandPlan {
    constructor(label = "primary") {
        this.label = label;
        this.targetPositions = [];
        this.formationTransitions = [];
        this.movementVectors = [];
        this.engagementRules = [];
        this.timing = { start: 0, end: 0 };
        this.confidence = 0;
        this.score = 0;
        this.contingencies = [];
        this.ghostPaths = [];
        this.analysis = {
            threat: null,
            terrain: null,
            formation: null,
            risk: null,
            opportunity: null,
            pathing: null
        };
        this.branches = [];
        this.selected = true;

        // CFL state
        this.lastUpdateTime = 0;
        this.executionDrift = 0;
        this.cohesionDrift = 0;
        this.threatSpike = false;
        this.opportunitySpike = false;
    }
}

/* ------------------------------------------------------------
   2. HELPER FUNCTIONS
------------------------------------------------------------ */
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function distance2D(a, b) {
    if (!a || !b) return Infinity;
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpPoint(a, b, t) {
    return { x: lerp(a.x || 0, b.x || 0, t), y: lerp(a.y || 0, b.y || 0, t) };
}

function labelIs(plan, label) { return plan.label === label; }

/* ------------------------------------------------------------
   3. BASE EVALUATOR
------------------------------------------------------------ */
class BaseEvaluator {
    constructor(name, weight = 1.0) {
        this.name = name;
        this.weight = weight;
    }
    evaluate(intent, worldState) {
        return { name: this.name, score: 0, weight: this.weight, data: {} };
    }
}

/* ------------------------------------------------------------
   4. ADVANCED EVALUATORS (unchanged from Batch 4)
------------------------------------------------------------ */
class ThreatEvaluator extends BaseEvaluator {
    constructor() { super("threat", 1.3); }
    evaluate(intent, worldState) {
        const threats = worldState.threats || [];
        if (!threats.length) {
            return { name: this.name, score: 1, weight: this.weight, data: { threats, summary: "noThreats" } };
        }
        let base = 1, closeCount = 0, flankCount = 0, highAggro = 0;
        threats.forEach(t => {
            const distPenalty = t.distance < 100 ? 0.35 : t.distance < 200 ? 0.2 : 0.05;
            base -= distPenalty;
            if (t.distance < 150) closeCount++;
            if (t.isFlanking) { base -= 0.25; flankCount++; }
            if (t.aggression > 0.7) { base -= 0.2; highAggro++; }
            if (t.hasLOS) base -= 0.1;
        });
        return { name: this.name, score: clamp01(base), weight: this.weight, data: { threats, closeCount, flankCount, highAggro } };
    }
}

class TerrainEvaluator extends BaseEvaluator {
    constructor() { super("terrain", 1.1); }
    evaluate(intent, worldState) {
        const t = worldState.terrain || {};
        let base = 0.8;
        if (t.cover > 0.7) base += 0.15;
        if (t.cover < 0.3) base -= 0.2;
        if (t.elevation > 5) base += 0.15;
        if (t.elevation < -5) base -= 0.1;
        if (t.isChokePoint) base += intent.objective === "hold" ? 0.1 : -0.25;
        if (t.openness > 0.8 && intent.risk !== "high") base -= 0.15;
        return { name: this.name, score: clamp01(base), weight: this.weight, data: t };
    }
}

class FormationEvaluator extends BaseEvaluator {
    constructor() { super("formation", 1.0); }
    evaluate(intent, worldState) {
        const f = worldState.formation || {};
        let base = 1;
        if (!f.isStable) base -= 0.3;
        if (f.cohesion < 0.5) base -= 0.25;
        if (f.cohesion < 0.25) base -= 0.25;
        if (intent.objective === "attack" && f.cohesion < 0.5) base -= 0.2;
        return { name: this.name, score: clamp01(base), weight: this.weight, data: f };
    }
}

class RiskEvaluator extends BaseEvaluator {
    constructor() { super("risk", 0.9); }
    evaluate(intent) {
        let base = 0.5;
        const risk = intent.risk || "medium";
        const obj = intent.objective || "hold";
        if (risk === "high") base += 0.25;
        if (risk === "low") base -= 0.15;
        if (obj === "attack" && risk === "low") base -= 0.2;
        if (obj === "retreat" && risk === "high") base -= 0.1;
        return { name: this.name, score: clamp01(base), weight: this.weight, data: { risk, obj } };
    }
}

class OpportunityEvaluator extends BaseEvaluator {
    constructor() { super("opportunity", 1.2); }
    evaluate(intent, worldState) {
        const opps = worldState.opportunities || [];
        if (!opps.length) return { name: this.name, score: 0, weight: this.weight, data: { opps } };
        let base = 0, hv = 0;
        opps.forEach(o => {
            if (o.window <= 2) base += 0.35;
            else if (o.window <= 5) base += 0.2;
            if (o.exposedFlank) { base += 0.3; hv++; }
            if (o.isolated) base += 0.2;
        });
        return { name: this.name, score: clamp01(base), weight: this.weight, data: { opps, hv } };
    }
}

class PathingEvaluator extends BaseEvaluator {
    constructor() { super("pathing", 1.0); }
    evaluate(intent, worldState) {
        const o = worldState.position || { x: 0, y: 0 };
        const t = intent.target || o;
        const dist = distance2D(o, t);
        let base = 1;
        if (dist > 1000) base -= 0.4;
        else if (dist > 500) base -= 0.25;
        else if (dist > 250) base -= 0.1;
        const exp = worldState.pathExposure ?? 0.5;
        if (exp > 0.7) base -= 0.25;
        if (exp < 0.3) base += 0.15;
        return { name: this.name, score: clamp01(base), weight: this.weight, data: { o, t, dist, exp } };
    }
}

/* ------------------------------------------------------------
   5. COMMAND AI KERNEL — NOW WITH CFL
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

        this.lastPlan = null;
        this.lastIntent = null;
        this.lastWorldState = null;

        this._wireIntegrationLayer();
    }

    /* ---------------- PUBLIC API ---------------- */
    processIntent(intent, worldState) {
        const evals = this.evaluators.map(ev => ev.evaluate(intent, worldState));
        const baseConf = this._computeConfidence(evals);
        const analysis = this._mapAnalysis(evals);

        const candidates = this._buildPlans(intent, worldState, baseConf, analysis);
        const scored = this._scorePlans(candidates, analysis, intent, worldState);
        const best = this._selectBest(scored);

        best.branches = scored.filter(p => p !== best);
        best.selected = true;

        this.lastPlan = best;
        this.lastIntent = intent;
        this.lastWorldState = worldState;

        return best;
    }

    updateFromWorldTick(intent, worldState) {
        const plan = this.processIntent(intent, worldState);
        this._applyFeedbackLoop(plan, worldState);
        this._pushHUD(plan);
        this._pushLeaderAI(plan);
        return plan;
    }

    getLastPlan() { return this.lastPlan; }

    /* ---------------- CONFIDENCE & ANALYSIS ---------------- */
    _computeConfidence(evals) {
        let sum = 0, w = 0;
        evals.forEach(r => { sum += r.score * r.weight; w += r.weight; });
        return w > 0 ? clamp01(sum / w) : 0;
    }

    _mapAnalysis(evals) {
        const map = { threat: null, terrain: null, formation: null, risk: null, opportunity: null, pathing: null };
        evals.forEach(r => { if (map.hasOwnProperty(r.name)) map[r.name] = r; });
        return map;
    }

    /* ---------------- PLAN GENERATION ---------------- */
    _buildPlans(intent, worldState, baseConf, analysis) {
        const plans = [];

        plans.push(this._makePlan("primary", intent, worldState, baseConf, analysis, { aggressionBias: 0, flankBias: 0, cautionBias: 0 }));

        if ((analysis.risk?.data?.risk || "medium") !== "low")
            plans.push(this._makePlan("aggressive", intent, worldState, baseConf, analysis, { aggressionBias: 0.3, flankBias: 0.1, cautionBias: -0.2 }));

        plans.push(this._makePlan("cautious", intent, worldState, baseConf, analysis, { aggressionBias: -0.2, flankBias: 0, cautionBias: 0.3 }));

        if (analysis.opportunity?.data?.hv > 0)
            plans.push(this._makePlan("flank", intent, worldState, baseConf, analysis, { aggressionBias: 0.1, flankBias: 0.4, cautionBias: 0 }));

        const threatScore = analysis.threat ? analysis.threat.score : 1;
        if (threatScore < 0.5 || baseConf < 0.4)
            plans.push(this._makePlan("fallback", intent, worldState, baseConf, analysis, { aggressionBias: -0.4, flankBias: 0, cautionBias: 0.5, forceRetreat: true }));

        return plans;
    }

    _makePlan(label, intent, worldState, baseConf, analysis, behavior) {
        const p = new CommandPlan(label);
        p.analysis = analysis;
        p.confidence = baseConf;

        p.movementVectors = this._genMovement(intent, worldState, p, behavior);
        p.formationTransitions = this._genFormation(intent, worldState, p, behavior);
        p.engagementRules = this._genEngagement(intent, worldState, p, behavior);
        p.timing = this._genTiming(intent, worldState, p, behavior);
        p.contingencies = this._genContingencies(intent, worldState, p, behavior);
        p.ghostPaths = this._genGhostPaths(p, worldState);

        return p;
    }

    /* ---------------- MOVEMENT ---------------- */
    _genMovement(intent, worldState, plan, behavior) {
        const o = worldState.position || { x: 0, y: 0 };
        const baseT = intent.target || o;
        let t = { ...baseT };

        if (behavior.flankBias > 0 && plan.analysis.opportunity) {
            const opps = plan.analysis.opportunity.data.opps || [];
            const flank = opps.find(o => o.exposedFlank) || opps[0];
            if (flank?.position) t = flank.position;
        }

        let speed = intent.priority === "high" ? "fast" : intent.priority === "low" ? "slow" : "normal";
        if (behavior.cautionBias > 0.3) speed = "slow";
        if (behavior.aggressionBias > 0.2 && intent.priority !== "low") speed = "fast";

        return [{ from: o, to: t, speed, pathPreference: { avoidHighExposure: behavior.cautionBias > 0, preferCover: true } }];
    }

    /* ---------------- FORMATION ---------------- */
    _genFormation(intent, worldState, plan, behavior) {
        const cur = worldState.formation?.current || "default";
        let desired = intent.formation || "line";

        const obj = intent.objective || "hold";
        const risk = intent.risk || "medium";

        if (labelIs(plan, "aggressive") || (obj === "attack" && risk === "high")) desired = "wedge";
        if (labelIs(plan, "cautious") || obj === "hold") desired = "shield";
        if (labelIs(plan, "flank")) desired = "column";
        if (labelIs(plan, "fallback")) desired = "echelon";

        return [{ from: cur, to: desired }];
    }

    /* ---------------- ENGAGEMENT ---------------- */
    _genEngagement(intent, worldState, plan, behavior) {
        const obj = intent.objective || "hold";
        let mode = "hold", fire = false, pursuit = false;

        if (obj === "attack") {
            mode = "aggressive"; fire = true;
            pursuit = intent.risk === "high" || behavior.aggressionBias > 0.2;
        } else if (obj === "retreat" || behavior.forceRetreat) {
            mode = "evasive"; fire = intent.risk === "high" && !behavior.cautionBias;
        } else if (obj === "scout" || obj === "recon") {
            mode = "stealth"; fire = false;
        }

        if (labelIs(plan, "cautious")) { fire = fire && intent.risk !== "low"; pursuit = false; }
        if (labelIs(plan, "flank")) { mode = "aggressive"; fire = true; }
        if (labelIs(plan, "fallback")) { mode = "evasive"; fire = false; pursuit = false; }

        return [{ mode, fire, pursuit }];
    }

    /* ---------------- TIMING ---------------- */
    _genTiming(intent, worldState, plan, behavior) {
        const now = worldState.time || 0;
        let dur = intent.priority === "high" ? 2 : intent.priority === "low" ? 6 : 4;

        if (plan.confidence > 0.8) dur *= 0.8;
        if (plan.confidence < 0.4) dur *= 1.2;
        if (labelIs(plan, "aggressive")) dur *= 0.9;
        if (labelIs(plan, "cautious") || labelIs(plan, "fallback")) dur *= 1.1;

        return { start: now, end: now + dur };
    }

    /* ---------------- CONTINGENCIES ---------------- */
    _genContingencies(intent, worldState, plan, behavior) {
        const c = [];
        c.push({ condition: "threatSpike", action: behavior.forceRetreat ? "fallback" : intent.risk === "low" ? "fallback" : "holdAndCounter" });
        c.push({ condition: "opportunityWindow", action: labelIs(plan, "aggressive") || labelIs(plan, "flank") ? "advance" : "probe" });
        c.push({ condition: "formationBreak", action: "regroup" });
        if (plan.confidence < 0.4) c.push({ condition: "lowConfidence", action: "requestNewIntent" });
        return c;
    }

    /* ---------------- GHOST PATHS ---------------- */
    _genGhostPaths(plan, worldState) {
        const o = plan.movementVectors[0]?.from || worldState.position || { x: 0, y: 0 };
        const t = plan.movementVectors[0]?.to || o;
        const segs = [];
        for (let i = 1; i <= 5; i++) segs.push(lerpPoint(o, t, i / 5));
        return segs;
    }

    /* ---------------- PLAN SCORING ---------------- */
    _scorePlans(plans, analysis, intent) {
        const threat = analysis.threat?.score ?? 1;
        const opp = analysis.opportunity?.score ?? 0;
        const risk = analysis.risk?.data?.risk ?? intent.risk ?? "medium";

        return plans.map(p => {
            let s = p.confidence;

            if (labelIs(p, "aggressive")) {
                s += opp * 0.3;
                s -= (1 - threat) * 0.2;
                if (risk === "high") s += 0.1;
                if (risk === "low") s -= 0.2;
            }

            if (labelIs(p, "cautious"))
