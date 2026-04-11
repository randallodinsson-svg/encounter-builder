// ------------------------------------------------------------
// APEXSIM v4.5 — Memory, Learning & Adaptive Behavior Evolution
// Lightweight Memory Edition (Option A)
// ------------------------------------------------------------
// Adds:
// + Short-term memory (danger, safe, encounters, successes/failures)
// + Prey danger-avoidance learning
// + Predator adaptive flanking based on past failures
// + Leader patrol biasing away from danger clusters
// + Memory decay + reinforcement weighting
// + Fully compatible with v4.4 terrain, LOS, decoys, confusion, etc.
// ------------------------------------------------------------

const rand = Math.random;

// ------------------------------------------------------------
// Vector utilities
// ------------------------------------------------------------
function vec(x = 0, y = 0) { return { x, y }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function mul(v, s) { return { x: v.x * s, y: v.y * s }; }
function mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
function norm(v) { const m = mag(v); return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m }; }
function limit(v, max) { const m = mag(v); return m > max ? mul(norm(v), max) : v; }

// Line segment intersection (for LOS vs obstacles)
function segmentsIntersect(p1, p2, q1, q2) {
    function cross(a, b) { return a.x * b.y - a.y * b.x; }
    const r = sub(p2, p1);
    const s = sub(q2, q1);
    const denom = cross(r, s);
    if (denom === 0) return false;
    const u = cross(sub(q1, p1), r) / denom;
    const t = cross(sub(q1, p1), s) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// ------------------------------------------------------------
// Terrain zones
// type: "slow" | "fast" | "danger" | "cover"
// shape: circle { x, y, radius }
// ------------------------------------------------------------
class TerrainZone {
    constructor(x, y, radius, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
    }

    contains(pos) {
        return mag(sub(pos, vec(this.x, this.y))) <= this.radius;
    }
}

// ------------------------------------------------------------
// Lightweight Memory System (Option A)
// ------------------------------------------------------------
class Memory {
    constructor() {
        this.danger = [];      // last 10 danger locations
        this.safe = [];        // last 10 safe locations
        this.encounters = [];  // last 5 predator encounters
        this.evasions = [];    // last 5 successful evasions
        this.failures = [];    // last 5 failed hunts (predators only)
    }

    push(list, entry, max) {
        list.push(entry);
        if (list.length > max) list.shift();
    }

    recordDanger(pos) { this.push(this.danger, { x: pos.x, y: pos.y }, 10); }
    recordSafe(pos) { this.push(this.safe, { x: pos.x, y: pos.y }, 10); }
    recordEncounter(pos) { this.push(this.encounters, { x: pos.x, y: pos.y }, 5); }
    recordEvasion(pos) { this.push(this.evasions, { x: pos.x, y: pos.y }, 5); }
    recordFailure(pos) { this.push(this.failures, { x: pos.x, y: pos.y }, 5); }

    dangerBias(pos) {
        let bias = 0;
        for (const d of this.danger) {
            const dist = mag(sub(pos, d));
            if (dist < 220) bias += (1 - dist / 220);
        }
        return bias;
    }

    safeBias(pos) {
        let bias = 0;
        for (const s of this.safe) {
            const dist = mag(sub(pos, s));
            if (dist < 220) bias += (1 - dist / 220);
        }
        return bias;
    }
}

// ------------------------------------------------------------
// Agent
// ------------------------------------------------------------
class Agent {
    constructor(x, y, type = "prey", squadId = 0, packId = -1) {
        this.pos = vec(x, y);
        this.vel = vec((rand() - 0.5) * 2, (rand() - 0.5) * 2);
        this.acc = vec(0, 0);

        this.type = type;
        this.squadId = squadId;
        this.packId = packId;

        this.baseMaxSpeed = type === "predator" ? 2.7 : 2.1;
        this.maxSpeed = this.baseMaxSpeed;
        this.maxForce = type === "predator" ? 0.08 : 0.05;

        this.wanderAngle = 0;

        // Prey state
        this.panic = 0;
        this.alarm = 0;
        this.scatterTimer = 0;
        this.isDecoy = false;
        this.decoyTimer = 0;

        // Predator state
        this.confusion = 0;
               this.hasLOS = true;

        // Terrain state
        this.terrainFactor = 1.0;
        this.inCover = false;

        // NEW: Lightweight memory
        this.memory = new Memory();

        // Adaptive flanking bias (predators)
        this.flankBias = 0; // -1..1

        // Trail
        this.trail = [];
        this.maxTrail = 40;
        this.trailFade = 1 / this.maxTrail;

        // Debug
        this.debugCirclePos = vec();
        this.debugTarget = vec();
    }

    applyForce(f) { this.acc = add(this.acc, f); }

    // --------------------------------------------------------
    // Steering primitives
    // --------------------------------------------------------
    steerSeek(target) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        let desiredNorm = mul(norm(desired), this.maxSpeed);
        return limit(sub(desiredNorm, this.vel), this.maxForce);
    }

    steerArrive(target, slowRadius = 80) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        let speed = this.maxSpeed;
        if (d < slowRadius) speed = this.maxSpeed * (d / slowRadius);
        let desiredNorm = mul(norm(desired), speed);
        return limit(sub(desiredNorm, this.vel), this.maxForce);
    }

    steerFlee(target) {
        const desired = sub(this.pos, target);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        let desiredNorm = mul(norm(desired), this.maxSpeed);
        return limit(sub(desiredNorm, this.vel), this.maxForce);
    }

    // --------------------------------------------------------
    // Wander
    // --------------------------------------------------------
    steerWander() {
        const wanderRadius = 12;
        const wanderDistance = 20;
        const change = 0.3;
        this.wanderAngle += (rand() * 2 - 1) * change;
        const circlePos = add(this.pos, mul(norm(this.vel), wanderDistance));
        const wanderOffset = vec(
            Math.cos(this.wanderAngle) * wanderRadius,
            Math.sin(this.wanderAngle) * wanderRadius
        );
        this.debugCirclePos = circlePos;
        this.debugTarget = add(circlePos, wanderOffset);
        const desired = sub(this.debugTarget, this.pos);
        return limit(sub(norm(desired), this.vel), this.maxForce);
    }

    // --------------------------------------------------------
    // Flocking
    // --------------------------------------------------------
    flock(neighbors) {
        const sep = this.flockSeparation(neighbors);
        const ali = this.flockAlignment(neighbors);
        const coh = this.flockCohesion(neighbors);
        const wan = this.steerWander();

        let steer = vec(0, 0);
        steer = add(steer, mul(sep, 1.5));
        steer = add(steer, mul(ali, 1.0));
        steer = add(steer, mul(coh, 0.8));
        steer = add(steer, mul(wan, 0.25));

        this.applyForce(steer);
    }

    flockSeparation(neighbors) {
        const desiredSeparation = 25;
        let steer = vec(0, 0);
        let count = 0;
        for (const other of neighbors) {
            if (other === this || other.type !== this.type) continue;
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < desiredSeparation) {
                let diff = mul(norm(sub(this.pos, other.pos)), 1 / d);
                steer = add(steer, diff);
                count++;
            }
        }
        if (count > 0) steer = mul(steer, 1 / count);
        if (mag(steer) > 0) {
            steer = mul(norm(steer), this.maxSpeed);
            steer = limit(sub(steer, this.vel), this.maxForce);
        }
        return steer;
    }

    flockAlignment(neighbors) {
        const neighborDist = 50;
        let sum = vec(0, 0);
        let count = 0;
        for (const other of neighbors) {
            if (other === this || other.type !== this.type) continue;
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < neighborDist) {
                sum = add(sum, other.vel);
                count++;
            }
        }
        if (count > 0) {
            sum = mul(norm(mul(sum, 1 / count)), this.maxSpeed);
            return limit(sub(sum, this.vel), this.maxForce);
        }
        return vec(0, 0);
    }

    flockCohesion(neighbors) {
        const neighborDist = 50;
        let sum = vec(0, 0);
        let count = 0;
        for (const other of neighbors) {
            if (other === this || other.type !== this.type) continue;
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < neighborDist) {
                sum = add(sum, other.pos);
                count++;
            }
        }
        if (count > 0) {
            return this.steerSeek(mul(sum, 1 / count));
        }
        return vec(0, 0);
    }

    // --------------------------------------------------------
    // Obstacle avoidance
    // --------------------------------------------------------
    avoidObstacles(obstacles) {
        if (!obstacles || obstacles.length === 0) return vec(0, 0);

        const lookAhead = 40;
        const forward = norm(this.vel);
        const ahead = add(this.pos, mul(forward, lookAhead));
        const aheadHalf = add(this.pos, mul(forward, lookAhead * 0.5));
        let mostThreatening = null;

        for (const obs of obstacles) {
            const collision =
                mag(sub(obs.pos, ahead)) <= obs.radius ||
                mag(sub(obs.pos, aheadHalf)) <= obs.radius;
            if (collision) {
                if (!mostThreatening) mostThreatening = obs;
                else {
                    const d1 = mag(sub(obs.pos, this.pos));
                    const d2 = mag(sub(mostThreatening.pos, this.pos));
                    if (d1 < d2) mostThreatening = obs;
                }
            }
        }

        if (mostThreatening) {
            let avoid = norm(sub(ahead, mostThreatening.pos));
            return mul(avoid, this.maxForce * 2.5);
        }
        return vec(0, 0);
    }

    // --------------------------------------------------------
    // Predator/Prey interactions with memory
    // --------------------------------------------------------
    predatorHuntPack(target, packCenter, packIndex, packSize, packConfusion, hasLOS) {
        const confusionFactor = packConfusion || 0;
        const los = hasLOS !== false;

        // Adaptive flanking bias from memory
        const biasAngle = this.flankBias * 0.6;

        if (!target || !los) {
            const wander = this.steerWander();
            const toCenter = this.steerArrive(packCenter, 120);
            let steer = vec(0, 0);
            steer = add(steer, mul(wander, 1.0 + confusionFactor));
            steer = add(steer, mul(toCenter, 0.6));
            return steer;
        }

        const toTarget = this.steerSeek(target.pos);
        const toCenter = this.steerArrive(packCenter, 100);

        const baseAngle = (packIndex / Math.max(1, packSize)) * Math.PI * 2;
        const flankAngle = baseAngle + biasAngle;
        const flankRadius = 40 + confusionFactor * 20;

        const flankPos = add(
            target.pos,
            vec(Math.cos(flankAngle) * flankRadius, Math.sin(flankAngle) * flankRadius)
        );
        const flankForce = this.steerArrive(flankPos, 60);

        const huntWeight = 1.4 * (1 - confusionFactor * 0.7);
        const centerWeight = 0.6 + confusionFactor * 0.4;

        let steer = vec(0, 0);
        steer = add(steer, mul(toTarget, huntWeight));
        steer = add(steer, mul(toCenter, centerWeight));
        steer = add(steer, flankForce);

        return steer;
    }

    preyFlee(predators) {
        if (!predators.length) {
            this.panic *= 0.96;
            return vec(0, 0);
        }

        let threat = null;
        let threatDist = Infinity;

        for (const pr of predators) {
            const d = mag(sub(pr.pos, this.pos));
            if (d < threatDist) {
                threatDist = d;
                threat = pr;
            }
        }

        if (!threat) {
            this.panic *= 0.96;
            return vec(0, 0);
        }

        const fleeRadius = 180;
        if (threatDist > fleeRadius) {
            this.panic *= 0.96;
            return vec(0, 0);
        }

        // Record danger memory
        this.memory.recordDanger(this.pos);

        this.panic = Math.min(1, this.panic + 0.05);
        const fleeForce = this.steerFlee(threat.pos);
        const scale = 1.0 + (1 - threatDist / fleeRadius) * 2.0;
        return mul(fleeForce, scale);
    }

    // --------------------------------------------------------
    // Terrain influence
    // --------------------------------------------------------
    applyTerrainEffect(zones) {
        this.terrainFactor = 1.0;
        this.inCover = false;

        for (const z of zones) {
            if (!z.contains(this.pos)) continue;

            if (z.type === "slow") {
                this.terrainFactor *= 0.7;
            } else if (z.type === "fast") {
                this.terrainFactor *= 1.3;
            } else if (z.type === "danger") {
                if (this.type === "prey") {
                    this.panic = Math.min(1, this.panic + 0.02);
                    this.memory.recordDanger(this.pos);
                }
            } else if (z.type === "cover") {
                this.inCover = true;
            }
        }

        this.maxSpeed = this.baseMaxSpeed * this.terrainFactor;
    }

    // --------------------------------------------------------
    // Update
    // --------------------------------------------------------
    update() {
        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed * (1 + this.panic * 0.5));
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        if (this.decoyTimer > 0) {
            this.decoyTimer--;
            if (this.decoyTimer <= 0) this.isDecoy = false;
        }

        if (this.type === "predator") {
            this.confusion *= 0.97;
            // mild decay toward neutral flank bias
            this.flankBias *= 0.99;
        }

        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
    }
}

// ------------------------------------------------------------
// Leader (with patrol biasing from danger memory)
// ------------------------------------------------------------
class Leader {
    constructor(x, y, id = 0) {
        this.id = id;
        this.pos = vec(x, y);
        this.vel = vec(1, 0);
        this.acc = vec(0, 0);

        this.maxSpeed = 2.0;
        this.maxForce = 0.05;

        this.wanderAngle = 0;

        this.waypoints = [];
        this.currentWaypoint = 0;
        this.arriveRadius = 60;

        this.evasive = false;
        this.evasiveTimer = 0;
        this.evasiveTarget = null;
        this.zigzagPhase = 0;

        // NEW: leader memory (danger clusters)
        this.memory = new Memory();
    }

    applyForce(f) { this.acc = add(this.acc, f); }

    steerArrive(target, slowRadius = 80) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        let speed = this.maxSpeed;
        if (d < slowRadius) speed = this.maxSpeed * (d / slowRadius);
        let desiredNorm = mul(norm(desired), speed);
        return limit(sub(desiredNorm, this.vel), this.maxForce);
    }

    steerWander() {
        const wanderRadius = 10;
        const wanderDistance = 25;
        const change = 0.2;
        this.wanderAngle += (rand() * 2 - 1) * change;
        const circlePos = add(this.pos, mul(norm(this.vel), wanderDistance));
        const wanderOffset = vec(
            Math.cos(this.wanderAngle) * wanderRadius,
            Math.sin(this.wanderAngle) * wanderRadius
        );
        const target = add(circlePos, wanderOffset);
        return limit(sub(norm(sub(target, this.pos)), this.vel), this.maxForce);
    }

    avoidObstacles(obstacles) {
        if (!obstacles || obstacles.length === 0) return vec(0, 0);

        const lookAhead = 50;
        const forward = norm(this.vel);
        const ahead = add(this.pos, mul(forward, lookAhead));
        const aheadHalf = add(this.pos, mul(forward, lookAhead * 0.5));
        let mostThreatening = null;

        for (const obs of obstacles) {
            const collision =
                mag(sub(obs.pos, ahead)) <= obs.radius + 10 ||
                mag(sub(obs.pos, aheadHalf)) <= obs.radius + 10;
            if (collision) {
                if (!mostThreatening) mostThreatening = obs;
                else {
                    const d1 = mag(sub(obs.pos, this.pos));
                    const d2 = mag(sub(mostThreatening.pos, this.pos));
                    if (d1 < d2) mostThreatening = obs;
                }
            }
        }

        if (mostThreatening) {
            let avoid = norm(sub(ahead, mostThreatening.pos));
            return mul(avoid, this.maxForce * 3);
        }
        return vec(0, 0);
    }

    setWaypoints(points) {
        this.waypoints = points;
        this.currentWaypoint = 0;
    }

    triggerEvasive(safeZone) {
        this.evasive = true;
        this.evasiveTimer = 300;
        this.evasiveTarget = safeZone ? vec(safeZone.x, safeZone.y) : null;
        this.zigzagPhase = 0;
    }

    // Leader patrol with bias away from danger memory
    updatePatrol(obstacles) {
        let steer = vec(0, 0);

        if (this.evasive && this.evasiveTimer > 0 && this.evasiveTarget) {
            const base = this.steerArrive(this.evasiveTarget, 80);
            this.zigzagPhase += 0.25;
            const perp = norm(vec(-this.vel.y, this.vel.x));
            const zigzag = mul(perp, Math.sin(this.zigzagPhase) * 0.8);
            steer = add(steer, base);
            steer = add(steer, zigzag);
            this.evasiveTimer--;
            if (this.evasiveTimer <= 0) {
                this.evasive = false;
                this.evasiveTarget = null;
            }
        } else {
            if (!this.waypoints || this.waypoints.length === 0) return;

            // Choose current waypoint, but bias away from danger clusters
            let target = this.waypoints[this.currentWaypoint];
            const baseDanger = this.memory.dangerBias(target);
            if (baseDanger > 0.5) {
                // look ahead to next waypoint if current is "hot"
                const nextIndex = (this.currentWaypoint + 1) % this.waypoints.length;
                const nextTarget = this.waypoints[nextIndex];
                const nextDanger = this.memory.dangerBias(nextTarget);
                if (nextDanger < baseDanger) {
                    this.currentWaypoint = nextIndex;
                    target = nextTarget;
                }
            }

            const toTarget = sub(target, this.pos);
            const dist = mag(toTarget);
            steer = add(steer, this.steerArrive(target, this.arriveRadius));

            if (dist < this.arriveRadius * 0.6) {
                this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
            }
        }

        steer = add(steer, this.avoidObstacles(obstacles));
        steer = add(steer, this.steerWander());

        this.applyForce(steer);

        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed);
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);
    }
}
// ------------------------------------------------------------
// Simulation Engine
// ------------------------------------------------------------
const APEXSIM = {
    agents: [],
    obstacles: [],
    leaders: [],
    squads: [],          // { leaderId, agentIndices, formationOffsets }
    predatorPacks: [],   // { packId, predatorIndices, targetPreyIndex, confusion, hasLOS, lastTargetDist }
    safeZones: [],       // { x, y, radius }
    terrainZones: [],    // TerrainZone[]
    formationMode: "circle",
    width: 800,
    height: 600,
    running: false,
    ctx: null,

    // Environmental triggers
    triggers: {
        noiseBursts: [], // { x, y, radius, strength, decay }
        lightPulses: []  // { x, y, radius, strength, decay }
    },

    // Debug toggles
    showTrails: true,
    showDebugVectors: true,
    showGlow: true,

    init(canvas) {
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.agents = [];
        this.leaders = [];
        this.squads = [];
        this.predatorPacks = [];
        this.safeZones = [];
        this.terrainZones = [];
        this.triggers.noiseBursts = [];
        this.triggers.lightPulses = [];

        const totalPrey = 42;
        const totalPredators = 9;
        const squadCount = 3;
        const preyPerSquad = Math.floor(totalPrey / squadCount);
        const packCount = 3;
        const predatorsPerPack = Math.floor(totalPredators / packCount);

        // Obstacles
        this.obstacles = [
            { pos: vec(this.width * 0.33, this.height * 0.5), radius: 40 },
            { pos: vec(this.width * 0.66, this.height * 0.4), radius: 35 },
            { pos: vec(this.width * 0.5, this.height * 0.7), radius: 45 }
        ];

        // Safe zones
        this.safeZones = [
            { x: this.width * 0.15, y: this.height * 0.2, radius: 60 },
            { x: this.width * 0.85, y: this.height * 0.8, radius: 60 }
        ];

        // Terrain zones
        this.terrainZones = [
            new TerrainZone(this.width * 0.25, this.height * 0.3, 70, "slow"),
            new TerrainZone(this.width * 0.75, this.height * 0.6, 70, "fast"),
            new TerrainZone(this.width * 0.5, this.height * 0.25, 60, "danger"),
            new TerrainZone(this.width * 0.5, this.height * 0.55, 80, "cover")
        ];

        // Leaders
        for (let i = 0; i < squadCount; i++) {
            const angle = (i / squadCount) * Math.PI * 2;
            const cx = this.width / 2 + Math.cos(angle) * 80;
            const cy = this.height / 2 + Math.sin(angle) * 60;
            const leader = new Leader(cx, cy, i);
            this.leaders.push(leader);
        }

        // Leader waypoints
        const steps = 8;
        const rX = Math.min(this.width, this.height) * 0.25;
        const rY = Math.min(this.width, this.height) * 0.18;
        for (let i = 0; i < this.leaders.length; i++) {
            const leader = this.leaders[i];
            const waypoints = [];
            const phase = (i / this.leaders.length) * Math.PI * 2;
            for (let s = 0; s < steps; s++) {
                const a = (s / steps) * Math.PI * 2 + phase;
                const x = this.width / 2 + Math.cos(a) * rX;
                const y = this.height / 2 + Math.sin(a) * rY;
                waypoints.push(vec(x, y));
            }
            leader.setWaypoints(waypoints);
        }

        // Prey squads
        let agentIndex = 0;
        for (let s = 0; s < squadCount; s++) {
            const squadAgentIndices = [];
            for (let j = 0; j < preyPerSquad; j++) {
                const a = new Agent(rand() * this.width, rand() * this.height, "prey", s, -1);
                this.agents.push(a);
                squadAgentIndices.push(agentIndex);
                agentIndex++;
            }
            this.squads.push({
                leaderId: s,
                agentIndices: squadAgentIndices,
                formationOffsets: []
            });
        }

        // Leftover prey
        while (agentIndex < totalPrey) {
            const s = this.squads.length - 1;
            const a = new Agent(rand() * this.width, rand() * this.height, "prey", s, -1);
            this.agents.push(a);
            this.squads[s].agentIndices.push(agentIndex);
            agentIndex++;
        }

        // Predator packs
        for (let p = 0; p < totalPredators; p++) {
            const packId = Math.floor(p / predatorsPerPack);
            const a = new Agent(rand() * this.width, rand() * this.height, "predator", -1, packId);
            this.agents.push(a);
            agentIndex++;
        }

        // Build packs
        for (let packId = 0; packId < packCount; packId++) {
            const packPredators = [];
            for (let i = 0; i < this.agents.length; i++) {
                const a = this.agents[i];
                if (a.type === "predator" && a.packId === packId) {
                    packPredators.push(i);
                }
            }
            this.predatorPacks.push({
                packId,
                predatorIndices: packPredators,
                targetPreyIndex: null,
                confusion: 0,
                hasLOS: true,
                lastTargetDist: null
            });
        }

        this.buildAllSquadFormations();
    },

    // --------------------------------------------------------
    // Formation slot offsets per prey squad
    // --------------------------------------------------------
    buildAllSquadFormations() {
        for (const squad of this.squads) {
            const n = squad.agentIndices.length;
            squad.formationOffsets = [];

            if (this.formationMode === "circle") {
                const radius = 60;
                for (let i = 0; i < n; i++) {
                    const angle = (i / n) * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    squad.formationOffsets.push(vec(x, y));
                }
            } else if (this.formationMode === "line") {
                const spacing = 18;
                const startX = -(n / 2) * spacing;
                const y = 0;
                for (let i = 0; i < n; i++) {
                    const x = startX + i * spacing;
                    squad.formationOffsets.push(vec(x, y));
                }
            }
        }
    },

    setFormation(mode) {
        this.formationMode = mode;
        this.buildAllSquadFormations();
    },

    // --------------------------------------------------------
    // Pack target selection with confusion & false targets
    // --------------------------------------------------------
    choosePackTargets() {
        const prey = this.agents.filter(a => a.type === "prey");
        if (prey.length === 0) {
            for (const pack of this.predatorPacks) {
                pack.targetPreyIndex = null;
            }
            return;
        }

        for (const pack of this.predatorPacks) {
            let center = vec(0, 0);
            let count = 0;
            for (const idx of pack.predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            let closestIndex = null;
            let closestDist = Infinity;
            for (let i = 0; i < this.agents.length; i++) {
                const a = this.agents[i];
                if (a.type !== "prey") continue;
                const d = mag(sub(a.pos, center));
                if (d < closestDist) {
                    closestDist = d;
                    closestIndex = i;
                }
            }

            if (pack.confusion > 0.4) {
                const decoyCandidates = [];
                const normalCandidates = [];
                for (let i = 0; i < this.agents.length; i++) {
                    const a = this.agents[i];
                    if (a.type !== "prey") continue;
                    if (a.isDecoy) decoyCandidates.push(i);
                    else normalCandidates.push(i);
                }

                if (decoyCandidates.length && rand() < 0.7) {
                    pack.targetPreyIndex = decoyCandidates[Math.floor(rand() * decoyCandidates.length)];
                } else if (normalCandidates.length && rand() < 0.4) {
                    pack.targetPreyIndex = normalCandidates[Math.floor(rand() * normalCandidates.length)];
                } else {
                    pack.targetPreyIndex = closestIndex;
                }
            } else {
                pack.targetPreyIndex = closestIndex;
            }
        }
    },

    // --------------------------------------------------------
    // LOS check between pack center and target prey
    // --------------------------------------------------------
    updatePackLOS() {
        for (const pack of this.predatorPacks) {
            if (pack.targetPreyIndex == null) {
                pack.hasLOS = false;
                continue;
            }

            const predatorIndices = pack.predatorIndices;
            if (!predatorIndices.length) {
                pack.hasLOS = false;
                continue;
            }

            let center = vec(0, 0);
            let count = 0;
            for (const idx of predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            const target = this.agents[pack.targetPreyIndex];
            if (!target) {
                pack.hasLOS = false;
                continue;
            }

            let blocked = false;
            const p1 = center;
            const p2 = target.pos;

            for (const obs of this.obstacles) {
                const steps = 8;
                for (let i = 0; i < steps; i++) {
                    const angle1 = (i / steps) * Math.PI * 2;
                    const angle2 = ((i + 1) / steps) * Math.PI * 2;
                    const q1 = add(obs.pos, vec(Math.cos(angle1) * obs.radius, Math.sin(angle1) * obs.radius));
                    const q2 = add(obs.pos, vec(Math.cos(angle2) * obs.radius, Math.sin(angle2) * obs.radius));
                    if (segmentsIntersect(p1, p2, q1, q2)) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) break;
            }

            if (target.inCover && mag(sub(target.pos, center)) > 80) {
                blocked = true;
            }

            pack.hasLOS = !blocked;
        }
    },

    // --------------------------------------------------------
    // Prey alarm propagation, decoys, and group dynamics
    // --------------------------------------------------------
    updatePreyAlarmAndGroupBehavior() {
        for (const squad of this.squads) {
            const indices = squad.agentIndices;
            if (!indices.length) continue;

            let center = vec(0, 0);
            let count = 0;
            for (const idx of indices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            let nearestPredDist = Infinity;
            for (const ag of this.agents) {
                if (ag.type !== "predator") continue;
                const d = mag(sub(ag.pos, center));
                if (d < nearestPredDist) nearestPredDist = d;
            }

            const alarmRadius = 260;
            let squadAlarm = 0;
            if (nearestPredDist < alarmRadius) {
                squadAlarm = 1 - nearestPredDist / alarmRadius;
            }

            for (const idx of indices) {
                const a = this.agents[idx];
                a.alarm = Math.max(a.alarm * 0.9, squadAlarm);

                if (a.alarm > 0.7 && a.scatterTimer <= 0) {
                    a.scatterTimer = 180 + Math.floor(rand() * 60);
                } else if (a.scatterTimer > 0) {
                    a.scatterTimer--;
                }
            }

            if (squadAlarm > 0.75) {
                const decoyCount = Math.max(1, Math.floor(indices.length * 0.15));
                for (let i = 0; i < decoyCount; i++) {
                    const idx = indices[Math.floor(rand() * indices.length)];
                    const a = this.agents[idx];
                    if (!a.isDecoy) {
                        a.isDecoy = true;
                        a.decoyTimer = 240 + Math.floor(rand() * 120);
                    }
                }
            }

            const leader = this.leaders[squad.leaderId];
            if (squadAlarm > 0.6) {
                const safeZone = this.findNearestSafeZone(center);
                if (safeZone && !leader.evasive) {
                    leader.triggerEvasive(safeZone);
                }
            }

            // Feed leader danger memory from squad
            if (squadAlarm > 0.4) {
                leader.memory.recordDanger(center);
            }
        }
    },

    findNearestSafeZone(pos) {
        if (!this.safeZones.length) return null;
        let best = null;
        let bestDist = Infinity;
        for (const sz of this.safeZones) {
            const d = mag(sub(vec(sz.x, sz.y), pos));
            if (d < bestDist) {
                bestDist = d;
                best = sz;
            }
        }
        return best;
    },

    // --------------------------------------------------------
    // Predator confusion update based on prey behavior
    // --------------------------------------------------------
    updatePredatorConfusion() {
        for (const pack of this.predatorPacks) {
            const predatorIndices = pack.predatorIndices;
            if (!predatorIndices.length) continue;

            let chaos = 0;
            let sampleCount = 0;

            let center = vec(0, 0);
            for (const idx of predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
            }
            center = mul(center, 1 / predatorIndices.length);

            for (const ag of this.agents) {
                if (ag.type !== "prey") continue;
                const d = mag(sub(ag.pos, center));
                if (d < 200) {
                    sampleCount++;
                    if (ag.scatterTimer > 0 || ag.isDecoy || ag.alarm > 0.7) {
                        chaos += 1;
                    }
                }
            }

            let localConfusion = 0;
            if (sampleCount > 0) {
                localConfusion = chaos / sampleCount;
            }

            if (!pack.hasLOS) {
                localConfusion = Math.min(1, localConfusion + 0.3);
            }

            pack.confusion = pack.confusion * 0.9 + localConfusion * 0.6;
            pack.confusion = Math.min(1, Math.max(0, pack.confusion));

            for (const idx of predatorIndices) {
                const pr = this.agents[idx];
                pr.confusion = pack.confusion;
            }
        }
    },

    // --------------------------------------------------------
    // Adaptive learning: predator failures -> flank bias
    // --------------------------------------------------------
    updatePredatorLearning() {
        for (const pack of this.predatorPacks) {
            if (pack.targetPreyIndex == null) {
                pack.lastTargetDist = null;
                continue;
            }
            const target = this.agents[pack.targetPreyIndex];
            if (!target) {
                pack.lastTargetDist = null;
                continue;
            }

            let center = vec(0, 0);
            let count = 0;
            for (const idx of pack.predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            const dist = mag(sub(target.pos, center));

            if (pack.lastTargetDist != null) {
                const delta = dist - pack.lastTargetDist;
                // If distance is growing while LOS is present, treat as "failure" and adjust flank bias
                if (delta > 2 && pack.hasLOS) {
                    for (const idx of pack.predatorIndices) {
                        const pr = this.agents[idx];
                        pr.memory.recordFailure(target.pos);
                        // Nudge flank bias randomly left/right
                        const dir = rand() < 0.5 ? -1 : 1;
                        pr.flankBias += dir * 0.1;
                        pr.flankBias = Math.max(-1, Math.min(1, pr.flankBias));
                    }
                }
            }

            pack.lastTargetDist = dist;
        }
    },

    // --------------------------------------------------------
    // Environmental triggers: noise & light
    // --------------------------------------------------------
    spawnNoiseBurst(x, y, radius = 160, strength = 1.0) {
        this.triggers.noiseBursts.push({ x, y, radius, strength, decay: 0.97 });
    },

    spawnLightPulse(x, y, radius = 200, strength = 1.0) {
        this.triggers.lightPulses.push({ x, y, radius, strength, decay: 0.96 });
    },

    updateTriggers() {
        const newNoise = [];
        for (const n of this.triggers.noiseBursts) {
            for (const a of this.agents) {
                const d = mag(sub(a.pos, vec(n.x, n.y)));
                if (d < n.radius) {
                    if (a.type
                if (d < l.radius) {
                    if (a.type === "prey") {
                        a.panic = Math.min(1, a.panic + 0.02 * l.strength);
                    } else {
                        a.confusion = Math.min(1, a.confusion + 0.03 * l.strength);
                    }
                }
            }
            l.strength *= l.decay;
            if (l.strength > 0.1) newLight.push(l);
        }
        this.triggers.lightPulses = newLight;
    },

    // --------------------------------------------------------
    // STEP LOOP
    // --------------------------------------------------------
    step() {
        const predators = this.agents.filter(a => a.type === "predator");
        const prey = this.agents.filter(a => a.type === "prey");

        // Random environmental events
        if (rand() < 0.003) {
            this.spawnNoiseBurst(rand() * this.width, rand() * this.height, 160, 1.0);
        }
        if (rand() < 0.002) {
            this.spawnLightPulse(rand() * this.width, rand() * this.height, 200, 1.0);
        }

        this.updateTriggers();

        // Leaders
        for (const leader of this.leaders) {
            leader.updatePatrol(this.obstacles);

            if (leader.pos.x < 0) leader.pos.x = this.width;
            if (leader.pos.x > this.width) leader.pos.x = 0;
            if (leader.pos.y < 0) leader.pos.y = this.height;
            if (leader.pos.y > this.height) leader.pos.y = 0;
        }

        // Prey alarm, decoys, group behavior
        this.updatePreyAlarmAndGroupBehavior();

        // LOS and confusion
        this.updatePackLOS();
        this.updatePredatorConfusion();

        // Adaptive predator learning
        this.updatePredatorLearning();

        // Pack target selection
        this.choosePackTargets();

        // Prey squads
        for (const squad of this.squads) {
            const leader = this.leaders[squad.leaderId];
            const indices = squad.agentIndices;
            const offsets = squad.formationOffsets;

            let squadCenter = vec(0, 0);
            let count = 0;
            for (const idx of indices) {
                const a = this.agents[idx];
                squadCenter = add(squadCenter, a.pos);
                count++;
            }
            if (count > 0) squadCenter = mul(squadCenter, 1 / count);
            const squadSafeZone = this.findNearestSafeZone(squadCenter);

            let avgAlarm = 0;
            for (const idx of indices) {
                avgAlarm += this.agents[idx].alarm;
            }
            avgAlarm /= Math.max(1, indices.length);

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                const a = this.agents[idx];
                const neighbors = prey;

                const offset = offsets[i] || null;
                let slotWorld = null;
                if (offset) {
                    slotWorld = add(leader.pos, offset);
                }

                a.applyTerrainEffect(this.terrainZones);

                // Memory-based danger avoidance
                const dangerBias = a.memory.dangerBias(a.pos);
                if (dangerBias > 0.2) {
                    let dangerCenter = vec(0, 0);
                    let dCount = 0;
                    for (const d of a.memory.danger) {
                        dangerCenter = add(dangerCenter, d);
                        dCount++;
                    }
                    if (dCount > 0) {
                        dangerCenter = mul(dangerCenter, 1 / dCount);
                        let away = sub(a.pos, dangerCenter);
                        if (mag(away) > 0) {
                            away = mul(norm(away), a.maxSpeed);
                            const avoidDangerForce = limit(sub(away, a.vel), a.maxForce * 1.2 * dangerBias);
                            a.applyForce(avoidDangerForce);
                        }
                    }
                }

                a.flock(neighbors);

                if (a.isDecoy && a.decoyTimer > 0) {
                    let away = sub(a.pos, squadCenter);
                    if (mag(away) === 0) away = vec(rand() - 0.5, rand() - 0.5);
                    away = norm(away);

                    let nearestPred = null;
                    let nearestDist = Infinity;
                    for (const pr of predators) {
                        const d = mag(sub(pr.pos, a.pos));
                        if (d < nearestDist) {
                            nearestDist = d;
                            nearestPred = pr;
                        }
                    }

                    let lureDir = away;
                    if (nearestPred) {
                        const toPred = norm(sub(nearestPred.pos, a.pos));
                        lureDir = norm(add(mul(away, 0.6), mul(toPred, 0.4)));
                    }

                    const desired = mul(lureDir, a.maxSpeed * 1.1);
                    const decoyForce = limit(sub(desired, a.vel), a.maxForce * 2.0);
                    a.applyForce(decoyForce);
                } else if (a.scatterTimer > 0 && a.alarm > 0.5) {
                    let away = sub(a.pos, squadCenter);
                    if (mag(away) === 0) away = vec(rand() - 0.5, rand() - 0.5);
                    away = norm(away);
                    away = mul(away, a.maxSpeed);
                    const scatterForce = limit(sub(away, a.vel), a.maxForce * 1.8);
                    a.applyForce(scatterForce);
                } else if (a.alarm > 0.5 && squadSafeZone) {
                    const safeTarget = vec(squadSafeZone.x, squadSafeZone.y);
                    const safeForce = a.steerArrive(safeTarget, 100);
                    a.applyForce(mul(safeForce, 1.2));
                    a.memory.recordSafe(safeTarget);
                } else if (avgAlarm > 0.4 && slotWorld) {
                    const distFromLeader = mag(sub(a.pos, leader.pos));
                    const shieldRadius = 70;
                    if (distFromLeader < shieldRadius) {
                        const formForce = a.steerArrive(slotWorld, 40);
                        a.applyForce(mul(formForce, 1.3));
                    } else {
                        const formForce = a.steerArrive(slotWorld, 80);
                        a.applyForce(formForce);
                    }
                } else {
                    if (slotWorld) {
                        const formForce = a.steerArrive(slotWorld, 60);
                        a.applyForce(formForce);
                    }
                }

                const fleeForce = a.preyFlee(predators);
                a.applyForce(fleeForce);

                const avoid = a.avoidObstacles(this.obstacles);
                a.applyForce(avoid);
            }
        }

        // Predator packs
        for (const pack of this.predatorPacks) {
            const predatorIndices = pack.predatorIndices;
            if (predatorIndices.length === 0) continue;

            let center = vec(0, 0);
            let count = 0;
            for (const idx of predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            const target = (pack.targetPreyIndex != null) ? this.agents[pack.targetPreyIndex] : null;
            const packConfusion = pack.confusion || 0;
            const hasLOS = pack.hasLOS;

            for (let i = 0; i < predatorIndices.length; i++) {
                const idx = predatorIndices[i];
                const pr = this.agents[idx];

                pr.applyTerrainEffect(this.terrainZones);

                const hunt = pr.predatorHuntPack(target, center, i, predatorIndices.length, packConfusion, hasLOS);
                const avoid = pr.avoidObstacles(this.obstacles);
                const wander = pr.steerWander();

                const wanderWeight = 0.2 + packConfusion * 0.6;

                pr.applyForce(hunt);
                pr.applyForce(avoid);
                pr.applyForce(mul(wander, wanderWeight));
            }
        }

        // Update all agents + wrap
        for (const a of this.agents) {
            a.update();

            if (a.pos.x < 0) a.pos.x = this.width;
            if (a.pos.x > this.width) a.pos.x = 0;
            if (a.pos.y < 0) a.pos.y = this.height;
            if (a.pos.y > this.height) a.pos.y = 0;
        }
    },

    // --------------------------------------------------------
    // DRAWING LAYERS
    // --------------------------------------------------------
    drawTrails() {
        const c = this.ctx;

        for (const a of this.agents) {
            if (a.trail.length < 2) continue;

            for (let i = 0; i < a.trail.length - 1; i++) {
                const p1 = a.trail[i];
                const p2 = a.trail[i + 1];

                const alpha = i * a.trailFade;

                if (a.type === "predator") {
                    c.strokeStyle = `rgba(255, 80, 80, ${alpha})`;
                } else {
                    c.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                }

                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(p1.x, p1.y);
                c.lineTo(p2.x, p2.y);
                c.stroke();
            }
        }
    },

    drawDebugVectors() {
        const c = this.ctx;

        for (const a of this.agents) {
            c.strokeStyle = a.type === "predator" ? "#ff5555" : "#0f0";
            c.beginPath();
            c.moveTo(a.pos.x, a.pos.y);
            c.lineTo(a.pos.x + a.vel.x * 10, a.pos.y + a.vel.y * 10);
            c.stroke();

            c.strokeStyle = "#f00";
            c.beginPath();
            c.arc(a.debugCirclePos.x, a.debugCirclePos.y, 12, 0, Math.PI * 2);
            c.stroke();

            c.strokeStyle = "#ff0";
            c.beginPath();
            c.moveTo(a.debugCirclePos.x, a.debugCirclePos.y);
            c.lineTo(a.debugTarget.x, a.debugTarget.y);
            c.stroke();

            if (a.type === "prey" && a.isDecoy) {
                c.strokeStyle = "rgba(255,255,0,0.7)";
                c.beginPath();
                c.arc(a.pos.x, a.pos.y, 8, 0, Math.PI * 2);
                c.stroke();
            }
        }

        for (const squad of this.squads) {
            const leader = this.leaders[squad.leaderId];
            const indices = squad.agentIndices;
            const offsets = squad.formationOffsets;

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                const a = this.agents[idx];
                const offset = offsets[i];
                if (!offset) continue;

                const slot = add(leader.pos, offset);

                c.strokeStyle = "rgba(255,255,255,0.4)";
                c.beginPath();
                c.arc(slot.x, slot.y, 4, 0, Math.PI * 2);
                c.stroke();

                c.strokeStyle = "rgba(255,255,255,0.2)";
                c.beginPath();
                c.moveTo(a.pos.x, a.pos.y);
                c.lineTo(slot.x, slot.y);
                c.stroke();
            }
        }

        c.strokeStyle = "#ff8800";
        for (const obs of this.obstacles) {
            c.beginPath();
            c.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            c.stroke();
        }

        for (const leader of this.leaders) {
            c.strokeStyle = leader.evasive ? "#ff00ff" : "#ffffff";
            c.beginPath();
            c.arc(leader.pos.x, leader.pos.y, 6, 0, Math.PI * 2);
            c.stroke();

            c.beginPath();
            c.moveTo(leader.pos.x - 8, leader.pos.y);
            c.lineTo(leader.pos.x + 8, leader.pos.y);
            c.moveTo(leader.pos.x, leader.pos.y - 8);
            c.lineTo(leader.pos.x, leader.pos.y + 8);
            c.stroke();

            if (leader.waypoints && leader.waypoints.length > 0) {
                c.strokeStyle = "rgba(255,255,255,0.25)";
                c.beginPath();
                for (let i = 0; i < leader.waypoints.length; i++) {
                    const wp = leader.waypoints[i];
                    if (i === 0) c.moveTo(wp.x, wp.y);
                    else c.lineTo(wp.x, wp.y);
                }
                c.closePath();
                c.stroke();

                c.fillStyle = "rgba(255,255,255,0.4)";
                for (const wp of leader.waypoints) {
                    c.beginPath();
                    c.arc(wp.x, wp.y, 3, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }

        for (const pack of this.predatorPacks) {
            if (!pack.predatorIndices.length) continue;
            let center = vec(0, 0);
            let count = 0;
            for (const idx of pack.predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            const conf = pack.confusion || 0;
            const alpha = 0.2 + conf * 0.5;
            c.strokeStyle = `rgba(255,80,80,${alpha})`;
            c.beginPath();
            c.arc(center.x, center.y, 10 + conf * 10, 0, Math.PI * 2);
            c.stroke();

            if (!pack.hasLOS) {
                c.strokeStyle = "rgba(255,255,255,0.5)";
                c.beginPath();
                c.moveTo(center.x - 6, center.y - 6);
                c.lineTo(center.x + 6, center.y + 6);
                c.moveTo(center.x + 6, center.y - 6);
                c.lineTo(center.x - 6, center.y + 6);
                c.stroke();
            }
        }

        c.strokeStyle = "rgba(0,200,255,0.5)";
        for (const sz of this.safeZones) {
            c.beginPath();
            c.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
            c.stroke();
        }

        for (const z of this.terrainZones) {
            let color = "rgba(255,255,255,0.2)";
            if (z.type === "slow") color = "rgba(255,120,0,0.25)";
            else if (z.type === "fast") color = "rgba(0,255,120,0.25)";
            else if (z.type === "danger") color = "rgba(255,0,80,0.25)";
            else if (z.type === "cover") color = "rgba(0,120,255,0.25)";

            c.strokeStyle = color;
            c.beginPath();
            c.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            c.stroke();
        }
    },

    drawGlow() {
        const c = this.ctx;

        for (const a of this.agents) {
            const speed = mag(a.vel);
            const glowSize = 8 + speed * 4;

            const gradient = c.createRadialGradient(
                a.pos.x, a.pos.y, 0,
                a.pos.x, a.pos.y, glowSize
            );

            if (a.type === "predator") {
                const confusionBoost = a.confusion * 0.4;
                gradient.addColorStop(0, `rgba(255, 80, 80, ${0.3 + confusionBoost})`);
                gradient.addColorStop(1, "rgba(255, 80, 80, 0)");
            } else {
                const panicBoost = a.panic * 0.4;
                const alarmBoost = a.alarm * 0.3;
                gradient.addColorStop(0, `rgba(0, 234, 255, ${0.3 + panicBoost + alarmBoost})`);
                gradient.addColorStop(1, "rgba(0, 234, 255, 0)");
            }

            c.fillStyle = gradient;
            c.beginPath();
            c.arc(a.pos.x, a.pos.y, glowSize, 0, Math.PI * 2);
            c.fill();
        }

        // Noise bursts
        for (const n of this.triggers.noiseBursts) {
            const g = c.createRadialGradient(
                n.x, n.y, 0,
                n.x, n.y, n.radius
            );
            g.addColorStop(0, `rgba(255,255,0,${0.25 * n.strength})`);
            g.addColorStop(1, "rgba(255,255,0,0)");
            c.fillStyle = g;
            c.beginPath();
            c.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            c.fill();
        }

        // Light pulses
        for (const l of this.triggers.lightPulses) {
            const g = c.createRadialGradient(
                l.x, l.y, 0,
                l.x, l.y, l.radius
            );
            g.addColorStop(0, `rgba(0,200,255,${0.3 * l.strength})`);
            g.addColorStop(1, "rgba(0,200,255,0)");
            c.fillStyle = g;
            c.beginPath();
            c.arc(l.x, l.y, l                        
