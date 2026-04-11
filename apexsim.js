// ------------------------------------------------------------
// APEXSIM v4.5 — Full Memory + Behavior Expansion
// ------------------------------------------------------------
// - Multi-layer memory (danger, safety, encounters, flanks, terrain)
// - Prey learning: danger maps, safe corridors, cover preference
// - Predator learning: pack-level failure memory, adaptive flanking, pursuit styles
// - Leader learning: patrol rerouting around danger clusters
// - Compatible with 4.4 formations, LOS, decoys, confusion, terrain
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
// ------------------------------------------------------------
class TerrainZone {
    constructor(x, y, radius, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type; // "slow" | "fast" | "danger" | "cover"
    }

    contains(pos) {
        return mag(sub(pos, vec(this.x, this.y))) <= this.radius;
    }
}
// ------------------------------------------------------------
// Full Memory System
// ------------------------------------------------------------
class Memory {
    constructor() {
        this.danger = [];        // {x,y,intensity}
        this.safe = [];          // {x,y,intensity}
        this.encounters = [];    // predator/prey encounters
        this.evasions = [];      // successful escapes
        this.failures = [];      // failed hunts (predators)
        this.coverSpots = [];    // remembered cover locations
        this.terrainBias = {};   // type -> weight
    }

    _push(list, entry, max) {
        list.push(entry);
        if (list.length > max) list.shift();
    }

    recordDanger(pos, intensity = 1) {
        this._push(this.danger, { x: pos.x, y: pos.y, w: intensity }, 18);
    }

    recordSafe(pos, intensity = 1) {
        this._push(this.safe, { x: pos.x, y: pos.y, w: intensity }, 18);
    }

    recordEncounter(pos) {
        this._push(this.encounters, { x: pos.x, y: pos.y }, 10);
    }

    recordEvasion(pos) {
        this._push(this.evasions, { x: pos.x, y: pos.y }, 10);
    }

    recordFailure(pos) {
        this._push(this.failures, { x: pos.x, y: pos.y }, 10);
    }

    recordCover(pos) {
        this._push(this.coverSpots, { x: pos.x, y: pos.y }, 12);
    }

    adjustTerrain(type, delta) {
        if (!this.terrainBias[type]) this.terrainBias[type] = 0;
        this.terrainBias[type] += delta;
        this.terrainBias[type] = Math.max(-2, Math.min(2, this.terrainBias[type]));
    }

    _biasFromList(pos, list, radius) {
        let bias = 0;
        for (const e of list) {
            const d = mag(sub(pos, e));
            if (d < radius) {
                const w = e.w != null ? e.w : 1;
                bias += (1 - d / radius) * w;
            }
        }
        return bias;
    }

    dangerBias(pos, radius = 260) {
        return this._biasFromList(pos, this.danger, radius);
    }

    safeBias(pos, radius = 260) {
        return this._biasFromList(pos, this.safe, radius);
    }

    bestCover(pos) {
        let best = null;
        let bestScore = -Infinity;
        for (const c of this.coverSpots) {
            const d = mag(sub(c, pos));
            if (d === 0) continue;
            const score = (1 / d) * 100;
            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }
        return best;
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

        this.type = type;      // "prey" | "predator"
        this.squadId = squadId;
        this.packId = packId;

        this.baseMaxSpeed = type === "predator" ? 2.9 : 2.2;
        this.maxSpeed = this.baseMaxSpeed;
        this.maxForce = type === "predator" ? 0.09 : 0.055;

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
        this.pursuitStyle = rand() < 0.5 ? "direct" : "flank";

        // Terrain state
        this.terrainFactor = 1.0;
        this.inCover = false;

        // Full memory
        this.memory = new Memory();

        // Adaptive flanking bias
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
    // Steering primitives (continued)
    // --------------------------------------------------------
    steerWander() {
        const wanderRadius = 12;
        const wanderDistance = 22;
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
        steer = add(steer, mul(sep, 1.6));
        steer = add(steer, mul(ali, 1.0));
        steer = add(steer, mul(coh, 0.85));
        steer = add(steer, mul(wan, 0.25));

        this.applyForce(steer);
    }

    flockSeparation(neighbors) {
        const desiredSeparation = 26;
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
        const neighborDist = 52;
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
        const neighborDist = 52;
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

        const lookAhead = 42;
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
            return mul(avoid, this.maxForce * 2.6);
        }

        return vec(0, 0);
    }

    // --------------------------------------------------------
    // Predator/Prey interactions
    // --------------------------------------------------------
    predatorHuntPack(target, packCenter, packIndex, packSize, packConfusion, hasLOS) {
        const confusionFactor = packConfusion || 0;
        const los = hasLOS !== false;
        const biasAngle = this.flankBias * 0.7;

        if (!target || !los) {
            const wander = this.steerWander();
            const toCenter = this.steerArrive(packCenter, 120);
            let steer = vec(0, 0);
            steer = add(steer, mul(wander, 1.0 + confusionFactor));
            steer = add(steer, mul(toCenter, 0.7));
            return steer;
        }

        const toTarget = this.steerSeek(target.pos);
        const toCenter = this.steerArrive(packCenter, 100);

        const baseAngle = (packIndex / Math.max(1, packSize)) * Math.PI * 2;
        const flankAngle = baseAngle + biasAngle;
        const flankRadius = 42 + confusionFactor * 24;

        const flankPos = add(
            target.pos,
            vec(Math.cos(flankAngle) * flankRadius, Math.sin(flankAngle) * flankRadius)
        );

        const flankForce = this.steerArrive(flankPos, 60);

        const huntWeight = this.pursuitStyle === "direct"
            ? 1.6 * (1 - confusionFactor * 0.6)
            : 1.2 * (1 - confusionFactor * 0.4);

        const flankWeight = this.pursuitStyle === "flank"
            ? 1.4 + confusionFactor * 0.6
            : 0.9 + confusionFactor * 0.4;

        const centerWeight = 0.6 + confusionFactor * 0.4;

        let steer = vec(0, 0);
        steer = add(steer, mul(toTarget, huntWeight));
        steer = add(steer, mul(toCenter, centerWeight));
        steer = add(steer, mul(flankForce, flankWeight));

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

        const fleeRadius = 190;
        if (threatDist > fleeRadius) {
            this.panic *= 0.96;
            return vec(0, 0);
        }

        this.memory.recordDanger(this.pos, 1);
        this.memory.recordEncounter(threat.pos);

        this.panic = Math.min(1, this.panic + 0.06);
        const fleeForce = this.steerFlee(threat.pos);
        const scale = 1.0 + (1 - threatDist / fleeRadius) * 2.2;

        return mul(fleeForce, scale);
    }

    // --------------------------------------------------------
    // Terrain influence + learned terrain bias
    // --------------------------------------------------------
    applyTerrainEffect(zones) {
        this.terrainFactor = 1.0;
        this.inCover = false;

        for (const z of zones) {
            if (!z.contains(this.pos)) continue;

            if (z.type === "slow") {
                this.terrainFactor *= 0.7;
                this.memory.adjustTerrain("slow", -0.01);
            } else if (z.type === "fast") {
                this.terrainFactor *= 1.3;
                this.memory.adjustTerrain("fast", 0.01);
            } else if (z.type === "danger") {
                if (this.type === "prey") {
                    this.panic = Math.min(1, this.panic + 0.02);
                    this.memory.recordDanger(this.pos, 1.2);
                } else {
                    this.memory.recordFailure(this.pos);
                }
                this.memory.adjustTerrain("danger", -0.02);
            } else if (z.type === "cover") {
                this.inCover = true;
                this.memory.recordCover(this.pos);
                this.memory.adjustTerrain("cover", 0.02);
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
            this.flankBias *= 0.99;
        } else {
            this.panic *= 0.995;
            this.alarm *= 0.985;
        }

        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
    }
}
// ------------------------------------------------------------
// Leader (with patrol learning)
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

        this.memory = new Memory();
    }

    applyForce(f) { this.acc = add(this.acc, f); }

    steerArrive(target, slowRadius = 80) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        let speed = this.maxSpeed;
        if (d < slowRadius) speed = this.maxSpeed * (d / slowRadius);

        const desiredNorm = mul(norm(desired), speed);
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

        const lookAhead = 52;
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
        this.evasiveTimer = 320;
        this.evasiveTarget = safeZone ? vec(safeZone.x, safeZone.y) : null;
        this.zigzagPhase = 0;
    }

    updatePatrol(obstacles) {
        let steer = vec(0, 0);

        // ----------------------------------------------------
        // Evasive mode (zig-zag toward safe zone)
        // ----------------------------------------------------
        if (this.evasive && this.evasiveTimer > 0 && this.evasiveTarget) {
            const base = this.steerArrive(this.evasiveTarget, 80);

            this.zigzagPhase += 0.25;
            const perp = norm(vec(-this.vel.y, this.vel.x));
            const zigzag = mul(perp, Math.sin(this.zigzagPhase) * 0.9);

            steer = add(steer, base);
            steer = add(steer, zigzag);

            this.evasiveTimer--;
            if (this.evasiveTimer <= 0) {
                this.evasive = false;
                this.evasiveTarget = null;
            }
        }

        // ----------------------------------------------------
        // Normal patrol mode
        // ----------------------------------------------------
        else {
            if (!this.waypoints || this.waypoints.length === 0) return;

            let target = this.waypoints[this.currentWaypoint];

            // Leader avoids danger clusters using memory
            const baseDanger = this.memory.dangerBias(target, 220);
            if (baseDanger > 0.6) {
                const nextIndex = (this.currentWaypoint + 1) % this.waypoints.length;
                const nextTarget = this.waypoints[nextIndex];
                const nextDanger = this.memory.dangerBias(nextTarget, 220);

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

        // ----------------------------------------------------
        // Add obstacle avoidance + wander
        // ----------------------------------------------------
        steer = add(steer, this.avoidObstacles(obstacles));
        steer = add(steer, this.steerWander());

        this.applyForce(steer);

        // ----------------------------------------------------
        // Update motion
        // ----------------------------------------------------
        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed);
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);
    }
}
// ------------------------------------------------------------
// APEXSIM Engine
// ------------------------------------------------------------
const APEXSIM = {
    agents: [],
    obstacles: [],
    leaders: [],
    squads: [],
    predatorPacks: [],
    safeZones: [],
    terrainZones: [],
    width: 800,
    height: 600,
    running: false,
    ctx: null,

    triggers: {
        noiseBursts: [],
        lightPulses: []
    },

    showTrails: true,
    showDebugVectors: true,
    showGlow: true,

    // --------------------------------------------------------
    // INIT
    // --------------------------------------------------------
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

        // Leader waypoints (elliptical patrol loops)
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

        // Leftover prey (if totalPrey % squadCount != 0)
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
                lastTargetDist: null,
                failureMemory: []
            });
        }

        this.buildAllSquadFormations();
    },

    // --------------------------------------------------------
    // Formations
    // --------------------------------------------------------
    buildAllSquadFormations() {
        for (const squad of this.squads) {
            const n = squad.agentIndices.length;
            squad.formationOffsets = [];

            const radius = 60;

            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                squad.formationOffsets.push(vec(x, y));
            }
        }
    },
    // --------------------------------------------------------
    // Pack LOS check
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
            for (const idx of predatorIndices) {
                center = add(center, this.agents[idx].pos);
            }
            center = mul(center, 1 / predatorIndices.length);

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
                    const a1 = (i / steps) * Math.PI * 2;
                    const a2 = ((i + 1) / steps) * Math.PI * 2;
                    const q1 = add(obs.pos, vec(Math.cos(a1) * obs.radius, Math.sin(a1) * obs.radius));
                    const q2 = add(obs.pos, vec(Math.cos(a2) * obs.radius, Math.sin(a2) * obs.radius));
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
    // Prey alarm propagation + decoys + leader danger memory
    // --------------------------------------------------------
    updatePreyAlarmAndGroupBehavior() {
        for (const squad of this.squads) {
            const indices = squad.agentIndices;
            if (!indices.length) continue;

            let center = vec(0, 0);
            for (const idx of indices) center = add(center, this.agents[idx].pos);
            center = mul(center, 1 / indices.length);

            let nearestPredDist = Infinity;
            for (const ag of this.agents) {
                if (ag.type !== "predator") continue;
                const d = mag(sub(ag.pos, center));
                if (d < nearestPredDist) nearestPredDist = d;
            }

            const alarmRadius = 280;
            let squadAlarm = nearestPredDist < alarmRadius
                ? 1 - nearestPredDist / alarmRadius
                : 0;

            for (const idx of indices) {
                const a = this.agents[idx];
                a.alarm = Math.max(a.alarm * 0.9, squadAlarm);

                if (a.alarm > 0.7 && a.scatterTimer <= 0) {
                    a.scatterTimer = 200 + Math.floor(rand() * 60);
                } else if (a.scatterTimer > 0) {
                    a.scatterTimer--;
                }
            }

            if (squadAlarm > 0.75) {
                const decoyCount = Math.max(1, Math.floor(indices.length * 0.18));
                for (let i = 0; i < decoyCount; i++) {
                    const idx = indices[Math.floor(rand() * indices.length)];
                    const a = this.agents[idx];
                    if (!a.isDecoy) {
                        a.isDecoy = true;
                        a.decoyTimer = 260 + Math.floor(rand() * 120);
                    }
                }
            }

            const leader = this.leaders[squad.leaderId];
            if (squadAlarm > 0.6) {
                const safeZone = this.findNearestSafeZone(center);
                if (safeZone && !leader.evasive) leader.triggerEvasive(safeZone);
            }

            if (squadAlarm > 0.4) {
                leader.memory.recordDanger(center, squadAlarm);
            }
        }
    },

    findNearestSafeZone(pos) {
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
    // Predator confusion
    // --------------------------------------------------------
    updatePredatorConfusion() {
        for (const pack of this.predatorPacks) {
            const preds = pack.predatorIndices;
            if (!preds.length) continue;

            let center = vec(0, 0);
            for (const idx of preds) center = add(center, this.agents[idx].pos);
            center = mul(center, 1 / preds.length);

            let chaos = 0;
            let sampleCount = 0;

            for (const ag of this.agents) {
                if (ag.type !== "prey") continue;
                const d = mag(sub(ag.pos, center));
                if (d < 220) {
                    sampleCount++;
                    if (ag.scatterTimer > 0 || ag.isDecoy || ag.alarm > 0.7) chaos++;
                }
            }

            let localConfusion = sampleCount > 0 ? chaos / sampleCount : 0;
            if (!pack.hasLOS) localConfusion = Math.min(1, localConfusion + 0.35);

            pack.confusion = pack.confusion * 0.9 + localConfusion * 0.6;
            pack.confusion = Math.max(0, Math.min(1, pack.confusion));

            for (const idx of preds) {
                this.agents[idx].confusion = pack.confusion;
            }
        }
    },

    // --------------------------------------------------------
    // Predator learning
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
            for (const idx of pack.predatorIndices) center = add(center, this.agents[idx].pos);
            center = mul(center, 1 / pack.predatorIndices.length);

            const dist = mag(sub(target.pos, center));

            if (pack.lastTargetDist != null) {
                const delta = dist - pack.lastTargetDist;

                if (delta > 2 && pack.hasLOS) {
                    pack.failureMemory.push({ x: target.pos.x, y: target.pos.y });
                    if (pack.failureMemory.length > 12) pack.failureMemory.shift();

                    for (const idx of pack.predatorIndices) {
                        const pr = this.agents[idx];
                        pr.memory.recordFailure(target.pos);

                        const dir = rand() < 0.5 ? -1 : 1;
                        pr.flankBias += dir * 0.12;
                        pr.flankBias = Math.max(-1, Math.min(1, pr.flankBias));

                        if (rand() < 0.1) {
                            pr.pursuitStyle = pr.pursuitStyle === "direct" ? "flank" : "direct";
                        }
                    }
                }
            }

            pack.lastTargetDist = dist;
        }
    },

    // --------------------------------------------------------
    // Environmental triggers
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
                    if (a.type === "prey") a.panic = Math.min(1, a.panic + 0.03 * n.strength);
                    else a.confusion = Math.min(1, a.confusion + 0.02 * n.strength);
                }
            }
            n.strength *= n.decay;
            if (n.strength > 0.1) newNoise.push(n);
        }
        this.triggers.noiseBursts = newNoise;

        const newLight = [];
        for (const l of this.triggers.lightPulses) {
            l.strength *= l.decay;
            if (l.strength > 0.1) newLight.push(l);
        }
        this.triggers.lightPulses = newLight;
    },

    // --------------------------------------------------------
    // STEP
    // --------------------------------------------------------
    step() {
        if (!this.ctx) return;

        this.choosePackTargets();
        this.updatePackLOS();
        this.updatePreyAlarmAndGroupBehavior();
        this.updatePredatorConfusion();
        this.updatePredatorLearning();
        this.updateTriggers();

        for (const a of this.agents) {
            a.applyTerrainEffect(this.terrainZones);
        }

        for (const leader of this.leaders) {
            leader.updatePatrol(this.obstacles);
        }

        // Prey squads
        for (const squad of this.squads) {
            const leader = this.leaders[squad.leaderId];
            const indices = squad.agentIndices;

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                const agent = this.agents[idx];
                if (agent.type !== "prey") continue;

                const offset = squad.formationOffsets[i] || vec(0, 0);
                const targetPos = add(leader.pos, offset);

                const neighbors = indices.map(id => this.agents[id]);
                agent.flock(neighbors);

                const fleeForce = agent.preyFlee(this.agents.filter(a => a.type === "predator"));
                agent.applyForce(fleeForce);

                const arriveForce = agent.steerArrive(targetPos, 90);
                agent.applyForce(arriveForce);

                const avoid = agent.avoidObstacles(this.obstacles);
                agent.applyForce(avoid);

                agent.update();
            }
        }

        // Predator packs
        for (const pack of this.predatorPacks) {
            const preds = pack.predatorIndices;
            if (!preds.length) continue;

            let center = vec(0, 0);
            for (const idx of preds) center = add(center, this.agents[idx].pos);
            center = mul(center, 1 / preds.length);

            const target = pack.targetPreyIndex != null ? this.agents[pack.targetPreyIndex] : null;

            for (let i = 0; i < preds.length; i++) {
                const idx = preds[i];
                const pr = this.agents[idx];

                const huntForce = pr.predatorHuntPack(
                    target,
                    center,
                    i,
                    preds.length,
                    pack.confusion,
                    pack.hasLOS
                );
                pr.applyForce(huntForce);

                const avoid = pr.avoidObstacles(this.obstacles);
                pr.applyForce(avoid);

                pr.update();
            }
        }

        // Lone prey (not in squads)
        for (const a of this.agents) {
            if (a.type === "predator") continue;
            if (a.squadId < 0) {
                const neighbors = this.agents.filter(o => o.type === "prey");
                a.flock(neighbors);
                const fleeForce = a.preyFlee(this.agents.filter(o => o.type === "predator"));
                a.applyForce(fleeForce);
                const avoid = a.avoidObstacles(this.obstacles);
                a.applyForce(avoid);
                a.update();
            }
        }
    },

    // --------------------------------------------------------
    // DRAW HELPERS
    // --------------------------------------------------------
    drawTrails() {
        const c = this.ctx;
        for (const a of this.agents) {
            if (!a.trail.length) continue;
            c.beginPath();
            for (let i = 0; i < a.trail.length; i++) {
                const p = a.trail[i];
                const t = i / a.trail.length;
                const alpha = t * 0.4;
                c.strokeStyle = a.type === "predator"
                    ? `rgba(255,120,80,${alpha})`
                    : `rgba(120,220,255,${alpha})`;
                if (i === 0) c.moveTo(p.x, p.y);
                else c.lineTo(p.x, p.y);
            }
            c.stroke();
        }
    },

    drawDebugVectors() {
        const c = this.ctx;
        c.strokeStyle = "rgba(255,255,255,0.25)";
        for (const a of this.agents) {
            if (!a.debugCirclePos || !a.debugTarget) continue;
            c.beginPath();
            c.moveTo(a.pos.x, a.pos.y);
            c.lineTo(a.debugTarget.x, a.debugTarget.y);
            c.stroke();
        }
    },

    drawGlow() {
        const c = this.ctx;

        for (const a of this.agents) {
            if (a.type === "predator") {
                const conf = a.confusion || 0;
                const radius = 18 + conf * 10;
                const g = c.createRadialGradient(
                    a.pos.x, a.pos.y, 0,
                    a.pos.x, a.pos.y, radius
                );
                g.addColorStop(0, `rgba(255,80,40,0.35)`);
                g.addColorStop(1, "rgba(255,80,40,0)");
                c.fillStyle = g;
                c.beginPath();
                c.arc(a.pos.x, a.pos.y, radius, 0, Math.PI * 2);
                c.fill();
            } else {
                const panic = a.panic || a.alarm || 0;
                if (panic <= 0.05 && !a.isDecoy) continue;
                const radius = 16 + panic * 18;
                const g = c.createRadialGradient(
                    a.pos.x, a.pos.y, 0,
                    a.pos.x, a.pos.y, radius
                );
                if (a.isDecoy) {
                    g.addColorStop(0, `rgba(255,255,120,0.35)`);
                } else {
                    g.addColorStop(0, `rgba(120,220,255,0.3)`);
                }
                g.addColorStop(1, "rgba(120,220,255,0)");
                c.fillStyle = g;
                c.beginPath();
                c.arc(a.pos.x, a.pos.y, radius, 0, Math.PI * 2);
                c.fill();
            }
        }

        for (const l of this.triggers.lightPulses) {
            const g = this.ctx.createRadialGradient(
                l.x, l.y, 0,
                l.x, l.y, l.radius
            );
            g.addColorStop(0, `rgba(0,200,255,${0.3 * l.strength})`);
            g.addColorStop(1, "rgba(0,200,255,0)");
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    // --------------------------------------------------------
    // DRAW
    // --------------------------------------------------------
    draw() {
        const c = this.ctx;
        c.clearRect(0, 0, this.width, this.height);

        if (this.showTrails) this.drawTrails();
        if (this.showGlow) this.drawGlow();
        if (this.showDebugVectors) this.drawDebugVectors();

        c.fillStyle = "rgba(255,136,0,0.15)";
        for (const obs of this.obstacles) {
            c.beginPath();
            c.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            c.fill();
        }

        c.fillStyle = "rgba(0,180,255,0.08)";
        for (const sz of this.safeZones) {
            c.beginPath();
            c.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
            c.fill();
        }

        for (const z of this.terrainZones) {
            let color = "rgba(255,255,255,0.05)";
            if (z.type === "slow") color = "rgba(255,120,0,0.12)";
            else if (z.type === "fast") color = "rgba(0,255,120,0.12)";
            else if (z.type === "danger") color = "rgba(255,0,80,0.12)";
            else if (z.type === "cover") color = "rgba(0,120,255,0.12)`;

            c.fillStyle = color;
            c.beginPath();
            c.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            c.fill();
        }

        for (const a of this.agents) {
            if (a.type === "predator") {
                const conf = a.confusion || 0;
                const r = 255;
                const g = Math.floor(80 + conf * 80);
                const b = Math.floor(80 + conf * 40);
                c.fillStyle = `rgb(${r},${g},${b})`;
            } else {
                const alarmTint = Math.floor(a.alarm * 120);
                const decoyTint = a.isDecoy ? 80 : 0;
                const g = Math.max(0, 234 - alarmTint);
                const b = 255 - decoyTint;
                c.fillStyle = `rgb(0,${g
