"use strict";

/*=========================================================
  APEXSIM v5 — APEXCORE-grade
  Core math, utilities, and engine shell
=========================================================*/

// --------------------------------------------------------
// Core vector math
// --------------------------------------------------------
function vec(x = 0, y = 0) {
    return { x, y };
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}

function mul(a, s) {
    return { x: a.x * s, y: a.y * s };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function mag(a) {
    return Math.hypot(a.x, a.y);
}
/*=========================================================
  APEXSIM v5 — Memory System (APEXCORE-grade)
=========================================================*/

// --------------------------------------------------------
// Prey Memory: remembers danger zones & recent threats
// --------------------------------------------------------
class PreyMemory {
    constructor() {
        this.dangerPoints = [];   // { pos:{x,y}, weight, t }
        this.maxPoints = 40;
    }

    recordDanger(pos, intensity = 1) {
        this.dangerPoints.push({
            pos: { x: pos.x, y: pos.y },
            weight: clamp(intensity, 0, 1),
            t: performance.now()
        });

        if (this.dangerPoints.length > this.maxPoints) {
            this.dangerPoints.shift();
        }
    }

    // Returns a bias value 0–1 based on how dangerous this area has been
    dangerBias(pos, radius = 200) {
        let total = 0;
        let count = 0;
        const now = performance.now();

        for (const d of this.dangerPoints) {
            const age = (now - d.t) / 2000; // fade over ~2s
            if (age > 1) continue;

            const distFactor = 1 - clamp(dist(pos, d.pos) / radius, 0, 1);
            if (distFactor <= 0) continue;

            const weight = d.weight * distFactor * (1 - age);
            total += weight;
            count++;
        }

        if (count === 0) return 0;
        return clamp(total / count, 0, 1);
    }
}

// --------------------------------------------------------
// Leader Memory: remembers danger clusters for squad routing
// --------------------------------------------------------
class LeaderMemory {
    constructor() {
        this.dangerZones = []; // { pos:{x,y}, level, t }
        this.maxZones = 20;
    }

    recordDanger(pos, level) {
        this.dangerZones.push({
            pos: { x: pos.x, y: pos.y },
            level: clamp(level, 0, 1),
            t: performance.now()
        });

        if (this.dangerZones.length > this.maxZones) {
            this.dangerZones.shift();
        }
    }

    // Returns a vector pushing the leader away from danger clusters
    dangerVector(currentPos) {
        let vx = 0;
        let vy = 0;
        const now = performance.now();

        for (const z of this.dangerZones) {
            const age = (now - z.t) / 3000;
            if (age > 1) continue;

            const d = sub(currentPos, z.pos);
            const m = mag(d);
            if (m === 0) continue;

            const f = (1 - age) * z.level * (1 - clamp(m / 300, 0, 1));
            vx += (d.x / m) * f;
            vy += (d.y / m) * f;
        }

        return { x: vx, y: vy };
    }
}

// --------------------------------------------------------
// Predator Pack Memory: remembers failed hunts & confusion
// --------------------------------------------------------
class PackMemory {
    constructor() {
        this.failures = []; // { pos:{x,y}, t }
        this.maxFailures = 30;
    }

    recordFailure(pos) {
        this.failures.push({
            pos: { x: pos.x, y: pos.y },
            t: performance.now()
        });

        if (this.failures.length > this.maxFailures) {
            this.failures.shift();
        }
    }

    confusionLevel() {
        const now = performance.now();
        let active = 0;

        for (const f of this.failures) {
            const age = (now - f.t) / 4000;
            if (age < 1) active++;
        }

        return clamp(active / this.maxFailures, 0, 1);
    }
}

function norm(a) {
    const m = mag(a);
    if (m === 0) return { x: 0, y: 0 };
    return { x: a.x / m, y: a.y / m };
}

function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function vLerp(a, b, t) {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
    };
}

// --------------------------------------------------------
// Deterministic-ish RNG (seedable hook if needed later)
// --------------------------------------------------------
let _rngSeed = Date.now() & 0xffffffff;

function randSeed(seed) {
    _rngSeed = seed >>> 0;
}

function rand() {
    // xorshift32
    let x = _rngSeed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    _rngSeed = x >>> 0;
    return (_rngSeed & 0xffffffff) / 0x100000000;
}

function randRange(min, max) {
    return min + (max - min) * rand();
}

// --------------------------------------------------------
// Geometry helpers
// --------------------------------------------------------
function dist(a, b) {
    return mag(sub(a, b));
}

function lineIntersectsCircle(p1, p2, center, radius) {
    const d = sub(p2, p1);
    const f = sub(p1, center);

    const a = dot(d, d);
    const b = 2 * dot(f, d);
    const c = dot(f, f) - radius * radius;

    let disc = b * b - 4 * a * c;
    if (disc < 0) return false;

    disc = Math.sqrt(disc);
    const t1 = (-b - disc) / (2 * a);
    const t2 = (-b + disc) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

// --------------------------------------------------------
// APEXSIM v5 engine shell
// --------------------------------------------------------
const APEXSIM = {
    // Core simulation state
    width: 0,
    height: 0,
    ctx: null,
    running: false,

    // Entities
    agents: [],
    leaders: [],
    predatorPacks: [],
    squads: [],

    // World features
    obstacles: [],
    terrainZones: [],
    safeZones: [],

    // Triggers / stimuli
    triggers: {
        noiseBursts: [],
        lightPulses: []
    },

    // Rendering flags
    showTrails: true,

    // ----------------------------------------------------
    // Initialization
    // ----------------------------------------------------
    init(canvas, options = {}) {
        if (!canvas || !canvas.getContext) {
            throw new Error("APEXSIM.init: canvas with 2D context required.");
        }

        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.agents = [];
        this.leaders = [];
        this.predatorPacks = [];
        this.squads = [];
        this.obstacles = [];
        this.terrainZones = [];
        this.safeZones = [];
        this.triggers = {
            noiseBursts: [],
            lightPulses: []
        };

        this.showTrails = options.showTrails ?? true;

        if (options.seed != null) {
            randSeed(options.seed);
        }

        // Further setup (agents, leaders, packs, terrain, etc.)
        // will be wired in by later chunks.
    }
};

// Export hook will be added in the final chunk.
/*=========================================================
  APEXSIM v5 — Agent Class (APEXCORE-grade)
=========================================================*/

class Agent {
    constructor(type, x, y) {
        this.type = type; // "prey" or "predator"

        this.pos = vec(x, y);
        this.vel = vec(randRange(-1, 1), randRange(-1, 1));
        this.acc = vec(0, 0);

        this.maxSpeed = type === "predator" ? 3.2 : 2.6;
        this.maxForce = 0.12;

        this.radius = type === "predator" ? 8 : 6;

        // Prey-specific
        this.panic = 0;
        this.scatterTimer = 0;
        this.memory = type === "prey" ? new PreyMemory() : null;

        // Predator-specific
        this.packId = null;
        this.hasLOS = false;
        this.confusion = 0;

        // Trails
        this.trail = [];
        this.trailMax = 25;
    }

    // ----------------------------------------------------
    // Core physics
    // ----------------------------------------------------
    applyForce(f) {
        this.acc.x += f.x;
        this.acc.y += f.y;
    }

    update() {
        this.vel = add(this.vel, this.acc);
        const speed = mag(this.vel);
        if (speed > this.maxSpeed) {
            this.vel = mul(norm(this.vel), this.maxSpeed);
        }

        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        // Trail
        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }

        // Prey panic decay
        if (this.type === "prey") {
            this.panic *= 0.94;
            if (this.scatterTimer > 0) this.scatterTimer--;
        }

        // Predator confusion decay
        if (this.type === "predator") {
            this.confusion *= 0.96;
        }
    }

    // ----------------------------------------------------
    // Steering helpers
    // ----------------------------------------------------
    steerSeek(target, forceScale = 1) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * forceScale);
    }

    steerFlee(target, forceScale = 1) {
        const desired = sub(this.pos, target);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * forceScale);
    }

    steerWander() {
        const jitter = vec(randRange(-1, 1), randRange(-1, 1));
        return mul(norm(jitter), this.maxForce * 0.6);
    }

    avoidObstacles(obstacles) {
        let steer = vec(0, 0);

        for (const o of obstacles) {
            const d = dist(this.pos, o.pos);
            const safeDist = o.radius + this.radius + 20;

            if (d < safeDist) {
                const push = mul(norm(sub(this.pos, o.pos)), (safeDist - d) * 0.04);
                steer = add(steer, push);
            }
        }

        return steer;
    }

    // ----------------------------------------------------
    // Prey behavior
    // ----------------------------------------------------
    preyFlee(predators) {
        if (predators.length === 0) return vec(0, 0);

        let fleeForce = vec(0, 0);
        let threatLevel = 0;

        for (const p of predators) {
            const d = dist(this.pos, p.pos);
            if (d < 260) {
                const f = this.steerFlee(p.pos, 1.4);
                fleeForce = add(fleeForce, f);

                const t = 1 - clamp(d / 260, 0, 1);
                threatLevel = Math.max(threatLevel, t);
            }
        }

        // Panic increases based on threat
        this.panic = Math.max(this.panic, threatLevel);

        // Memory records danger
        if (this.memory && threatLevel > 0.3) {
            this.memory.recordDanger(this.pos, threatLevel);
        }

        return fleeForce;
    }

    flock(neighbors) {
        if (neighbors.length === 0) return;

        let align = vec(0, 0);
        let cohesion = vec(0, 0);
        let separation = vec(0, 0);

        for (const n of neighbors) {
            align = add(align, n.vel);
            cohesion = add(cohesion, n.pos);

            const diff = sub(this.pos, n.pos);
            const d = mag(diff);
            if (d > 0) {
                separation = add(separation, mul(diff, 1 / d));
            }
        }

        const count = neighbors.length;
        align = mul(norm(align), this.maxSpeed);
        cohesion = mul(norm(sub(mul(cohesion, 1 / count), this.pos)), this.maxSpeed);
        separation = mul(norm(separation), this.maxSpeed);

        this.applyForce(mul(sub(align, this.vel), this.maxForce * 0.6));
        this.applyForce(mul(sub(cohesion, this.vel), this.maxForce * 0.5));
        this.applyForce(mul(sub(separation, this.vel), this.maxForce * 0.8));
    }

    // ----------------------------------------------------
    // Predator behavior (pack logic handled in engine)
    // ----------------------------------------------------
    predatorHunt(target, confusion = 0) {
        if (!target) return vec(0, 0);

        // Confusion adds randomness
        const jitter = mul(
            vec(randRange(-1, 1), randRange(-1, 1)),
            confusion * 0.4
        );

        const seek = this.steerSeek(target.pos, 1.2);
        return add(seek, jitter);
    }
}
/*=========================================================
  APEXSIM v5 — Leader Class (APEXCORE-grade)
=========================================================*/

class Leader {
    constructor(x, y) {
        this.pos = vec(x, y);
        this.vel = vec(randRange(-1, 1), randRange(-1, 1));
        this.acc = vec(0, 0);

        this.maxSpeed = 2.4;
        this.maxForce = 0.10;

        this.radius = 7;

        this.memory = new LeaderMemory();

        // Patrol
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;

        // Evasive mode
        this.evasive = false;
        this.evasiveTarget = null;
        this.evasiveTimer = 0;
    }

    setPatrol(points) {
        this.patrolPoints = points.map(p => ({ x: p.x, y: p.y }));
        this.currentPatrolIndex = 0;
    }

    applyForce(f) {
        this.acc.x += f.x;
        this.acc.y += f.y;
    }

    updatePhysics() {
        this.vel = add(this.vel, this.acc);
        const speed = mag(this.vel);
        if (speed > this.maxSpeed) {
            this.vel = mul(norm(this.vel), this.maxSpeed);
        }

        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);
    }

    triggerEvasive(targetPos, duration = 260) {
        this.evasive = true;
        this.evasiveTarget = { x: targetPos.x, y: targetPos.y };
        this.evasiveTimer = duration;
    }

    updatePatrol(obstacles) {
        let steer = vec(0, 0);

        if (this.evasive && this.evasiveTarget) {
            // Move toward safe zone / evasive target
            const seek = this._steerSeek(this.evasiveTarget, 1.2);
            steer = add(steer, seek);

            this.evasiveTimer--;
            if (this.evasiveTimer <= 0) {
                this.evasive = false;
                this.evasiveTarget = null;
            }
        } else if (this.patrolPoints.length > 0) {
            const target = this.patrolPoints[this.currentPatrolIndex];
            const d = dist(this.pos, target);

            const seek = this._steerSeek(target, 0.9);
            steer = add(steer, seek);

            if (d < 20) {
                this.currentPatrolIndex =
                    (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
        } else {
            // Idle wander if no patrol
            steer = this._steerWander();
        }

        // Danger memory bias (push away from danger clusters)
        const dangerVec = this.memory.dangerVector(this.pos);
        steer = add(steer, mul(dangerVec, 0.6));

        // Obstacle avoidance
        for (const o of obstacles) {
            const d = dist(this.pos, o.pos);
            const safeDist = o.radius + this.radius + 24;
            if (d < safeDist) {
                const push = mul(norm(sub(this.pos, o.pos)), (safeDist - d) * 0.05);
                steer = add(steer, push);
            }
        }

        this.applyForce(steer);
        this.updatePhysics();
    }

    _steerSeek(target, forceScale = 1) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * forceScale);
    }

    _steerWander() {
        const jitter = vec(randRange(-1, 1), randRange(-1, 1));
        return mul(norm(jitter), this.maxForce * 0.7);
    }
}
/*=========================================================
  APEXSIM v5 — Engine Core (APEXCORE-grade)
=========================================================*/

Object.assign(APEXSIM, {
    // ----------------------------------------------------
    // World configuration
    // ----------------------------------------------------
    config: {
        preyCount: 80,
        predatorCount: 10,
        leaderCount: 3,

        obstacleCount: 10,
        terrainZoneCount: 6,
        safeZoneCount: 3
    },

    // ----------------------------------------------------
    // World setup
    // ----------------------------------------------------
    setupWorld() {
        this.agents = [];
        this.leaders = [];
        this.predatorPacks = [];
        this.squads = [];
        this.obstacles = [];
        this.terrainZones = [];
        this.safeZones = [];
        this.triggers.noiseBursts = [];
        this.triggers.lightPulses = [];

        this._spawnTerrain();
        this._spawnSafeZones();
        this._spawnObstacles();
        this._spawnLeaders();
        this._spawnAgents();
        this._formPacksAndSquads();
    },

    _spawnTerrain() {
        const types = ["slow", "fast", "danger", "cover"];
        for (let i = 0; i < this.config.terrainZoneCount; i++) {
            const type = types[i % types.length];
            this.terrainZones.push({
                type,
                x: randRange(this.width * 0.1, this.width * 0.9),
                y: randRange(this.height * 0.1, this.height * 0.9),
                radius: randRange(80, 160)
            });
        }
    },

    _spawnSafeZones() {
        for (let i = 0; i < this.config.safeZoneCount; i++) {
            this.safeZones.push({
                x: randRange(this.width * 0.15, this.width * 0.85),
                y: randRange(this.height * 0.15, this.height * 0.85),
                radius: randRange(70, 120)
            });
        }
    },

    _spawnObstacles() {
        for (let i = 0; i < this.config.obstacleCount; i++) {
            this.obstacles.push({
                pos: vec(
                    randRange(this.width * 0.1, this.width * 0.9),
                    randRange(this.height * 0.1, this.height * 0.9)
                ),
                radius: randRange(18, 40)
            });
        }
    },

    _spawnLeaders() {
        for (let i = 0; i < this.config.leaderCount; i++) {
            const leader = new Leader(
                randRange(this.width * 0.2, this.width * 0.8),
                randRange(this.height * 0.2, this.height * 0.8)
            );

            // Simple patrol loop
            const pts = [];
            const cx = this.width / 2;
            const cy = this.height / 2;
            const r = Math.min(this.width, this.height) * 0.3;
            const offset = (i / this.config.leaderCount) * Math.PI * 2;

            for (let k = 0; k < 4; k++) {
                const ang = offset + (k / 4) * Math.PI * 2;
                pts.push({
                    x: cx + Math.cos(ang) * r,
                    y: cy + Math.sin(ang) * r
                });
            }

            leader.setPatrol(pts);
            this.leaders.push(leader);
        }
    },

    _spawnAgents() {
        // Prey
        for (let i = 0; i < this.config.preyCount; i++) {
            const a = new Agent(
                "prey",
                randRange(0, this.width),
                randRange(0, this.height)
            );
            this.agents.push(a);
        }

        // Predators
        for (let i = 0; i < this.config.predatorCount; i++) {
            const a = new Agent(
                "predator",
                randRange(0, this.width),
                randRange(0, this.height)
            );
            this.agents.push(a);
        }
    },

    _formPacksAndSquads() {
        // Predator packs: simple grouping
        const predators = this.agents.filter(a => a.type === "predator");
        const packSize = 3;
        let packId = 0;

        for (let i = 0; i < predators.length; i += packSize) {
            const slice = predators.slice(i, i + packSize);
            const indices = [];

            for (const p of slice) {
                const idx = this.agents.indexOf(p);
                if (idx >= 0) {
                    p.packId = packId;
                    indices.push(idx);
                }
            }

            this.predatorPacks.push({
                id: packId,
                predatorIndices: indices,
                targetPreyIndex: null,
                memory: new PackMemory(),
                hasLOS: false
            });

            packId++;
        }

        // Squads: assign prey to nearest leader
        const prey = this.agents.filter(a => a.type === "prey");
        this.squads = this.leaders.map((leader, i) => ({
            id: i,
            leaderIndex: i,
            agentIndices: []
        }));

        for (const p of prey) {
            let bestLeader = 0;
            let bestDist = Infinity;

            for (let i = 0; i < this.leaders.length; i++) {
                const d = dist(p.pos, this.leaders[i].pos);
                if (d < bestDist) {
                    bestDist = d;
                    bestLeader = i;
                }
            }

            const idx = this.agents.indexOf(p);
            if (idx >= 0) {
                this.squads[bestLeader].agentIndices.push(idx);
            }
        }
    },

    // ----------------------------------------------------
    // Line-of-sight for predator packs
    // ----------------------------------------------------
    updatePackLOS() {
        for (const pack of this.predatorPacks) {
            const indices = pack.predatorIndices;
            if (!indices.length) {
                pack.hasLOS = false;
                continue;
            }

            // Pack center
            let center = vec(0, 0);
            for (const idx of indices) {
                center = add(center, this.agents[idx].pos);
            }
            center = mul(center, 1 / indices.length);

            // Find closest prey
            let bestPreyIndex = null;
            let bestDist = Infinity;

            for (let i = 0; i < this.agents.length; i++) {
                const a = this.agents[i];
                if (a.type !== "prey") continue;

                const d = dist(center, a.pos);
                if (d < bestDist) {
                    bestDist = d;
                    bestPreyIndex = i;
                }
            }

            pack.targetPreyIndex = bestPreyIndex;

            if (bestPreyIndex == null) {
                pack.hasLOS = false;
                continue;
            }

            const prey = this.agents[bestPreyIndex];
            let blocked = false;

            for (const o of this.obstacles) {
                if (lineIntersectsCircle(center, prey.pos, o.pos, o.radius + 4)) {
                    blocked = true;
                    break;
                }
            }

            pack.hasLOS = !blocked;

            // Mark predators with LOS flag
            for (const idx of indices) {
                const p = this.agents[idx];
                p.hasLOS = pack.hasLOS;
            }
        }
    },

    // ----------------------------------------------------
    // Safe zone helper
    // ----------------------------------------------------
    findNearestSafeZone(pos) {
        let best = null;
        let bestDist = Infinity;

        for (const sz of this.safeZones) {
            const d = dist(pos, { x: sz.x, y: sz.y });
            if (d < bestDist) {
                bestDist = d;
                best = sz;
            }
        }

        return best;
    }
});
/*=========================================================
  APEXSIM v5 — Simulation Updates (APEXCORE-grade)
=========================================================*/

Object.assign(APEXSIM, {
    // ----------------------------------------------------
    // Squad behavior (prey + leaders)
    // ----------------------------------------------------
    updateSquadBehavior() {
        for (const squad of this.squads) {
            const indices = squad.agentIndices;
            if (!indices.length) continue;

            // Squad center
            let center = vec(0, 0);
            for (const idx of indices) {
                center = add(center, this.agents[idx].pos);
            }
            center = mul(center, 1 / indices.length);

            // Threat level near squad
            let nearestPredDist = Infinity;
            for (const ag of this.agents) {
                if (ag.type !== "predator") continue;
                const d = dist(ag.pos, center);
                if (d < nearestPredDist) nearestPredDist = d;
            }

            const alarmRadius = 280;
            const squadAlarm =
                nearestPredDist < alarmRadius
                    ? 1 - nearestPredDist / alarmRadius
                    : 0;

            // Apply alarm to members
            for (const idx of indices) {
                const a = this.agents[idx];
                if (a.type !== "prey") continue;

                a.panic = Math.max(a.panic, squadAlarm);

                if (squadAlarm > 0.7 && a.scatterTimer <= 0) {
                    a.scatterTimer = 200 + Math.floor(rand() * 60);
                }
            }

            const leader = this.leaders[squad.leaderIndex];

            // Leader evasive routing
            if (squadAlarm > 0.6 && leader) {
                const safeZone = this.findNearestSafeZone(center);
                if (safeZone && !leader.evasive) {
                    leader.triggerEvasive({ x: safeZone.x, y: safeZone.y });
                }
            }

            // Leader memory of danger
            if (squadAlarm > 0.4 && leader) {
                leader.memory.recordDanger(center, squadAlarm);
            }
        }
    },

    // ----------------------------------------------------
    // Predator pack updates
    // ----------------------------------------------------
    updatePredatorPacks() {
        for (const pack of this.predatorPacks) {
            const predatorIndices = pack.predatorIndices;
            if (!predatorIndices.length) continue;

            // Pack center
            let center = vec(0, 0);
            for (const idx of predatorIndices) {
                center = add(center, this.agents[idx].pos);
            }
            center = mul(center, 1 / predatorIndices.length);

            const targetIndex = pack.targetPreyIndex;
            const target =
                targetIndex != null ? this.agents[targetIndex] : null;

            // Confusion from memory
            const confusion = pack.memory.confusionLevel();

            // Apply steering to each predator
            for (const idx of predatorIndices) {
                const predator = this.agents[idx];
                if (!predator || predator.type !== "predator") continue;

                const steer = predator.predatorHunt(target, confusion);
                predator.applyForce(steer);
                predator.confusion = confusion;
            }

            // If target is getting away without LOS, record failure
            if (target && !pack.hasLOS) {
                const d = dist(center, target.pos);
                if (d > 260) {
                    pack.memory.recordFailure(target.pos);
                }
            }
        }
    },

    // ----------------------------------------------------
    // Agent updates (prey + predators)
    // ----------------------------------------------------
    updateAgents() {
        const neighborsRadius = 80;

        for (let i = 0; i < this.agents.length; i++) {
            const a = this.agents[i];

            // Terrain effects (simple speed modulation)
            this._applyTerrainEffect(a);

            if (a.type === "prey") {
                // Nearby predators
                const predators = [];
                for (const other of this.agents) {
                    if (other.type !== "predator") continue;
                    if (dist(a.pos, other.pos) < 260) predators.push(other);
                }

                const fleeForce = a.preyFlee(predators);
                a.applyForce(fleeForce);

                // Flocking with nearby prey
                const neighbors = [];
                for (const other of this.agents) {
                    if (other === a || other.type !== "prey") continue;
                    if (dist(a.pos, other.pos) < neighborsRadius) {
                        neighbors.push(other);
                    }
                }

                if (a.scatterTimer > 0) {
                    const wander = a.steerWander();
                    a.applyForce(mul(wander, 0.9));
                } else {
                    a.flock(neighbors);
                }

                // Memory-based danger bias
                if (a.memory) {
                    const bias = a.memory.dangerBias(a.pos, 220);
                    if (bias > 0.4) {
                        const center = vec(this.width / 2, this.height / 2);
                        const away = norm(sub(a.pos, center));
                        a.applyForce(mul(away, 0.03 * bias));
                    }
                }
            }

            // Obstacle avoidance for all
            const avoid = a.avoidObstacles(this.obstacles);
            a.applyForce(avoid);

            // Integrate motion
            a.update();

            // Wrap edges
            if (a.pos.x < 0) a.pos.x += this.width;
            if (a.pos.x > this.width) a.pos.x -= this.width;
            if (a.pos.y < 0) a.pos.y += this.height;
            if (a.pos.y > this.height) a.pos.y -= this.height;
        }
    },

    _applyTerrainEffect(agent) {
        let speedFactor = 1;

        for (const z of this.terrainZones) {
            const d = dist(agent.pos, { x: z.x, y: z.y });
            if (d > z.radius) continue;

            const t = 1 - d / z.radius;

            if (z.type === "slow") {
                speedFactor *= lerp(1, 0.6, t);
            } else if (z.type === "fast") {
                speedFactor *= lerp(1, 1.3, t);
            } else if (z.type === "danger") {
                if (agent.type === "prey") {
                    agent.panic = Math.max(agent.panic, 0.3 * t);
                }
            } else if (z.type === "cover") {
                if (agent.type === "prey") {
                    agent.panic *= 0.96;
                }
            }
        }

        agent.maxSpeed = (agent.type === "predator" ? 3.2 : 2.6) * speedFactor;
    },

    // ----------------------------------------------------
    // Leader updates
    // ----------------------------------------------------
    updateLeaders() {
        for (const leader of this.leaders) {
            leader.updatePatrol(this.obstacles);

            // Wrap edges
            if (leader.pos.x < 0) leader.pos.x += this.width;
            if (leader.pos.x > this.width) leader.pos.x -= this.width;
            if (leader.pos.y < 0) leader.pos.y += this.height;
            if (leader.pos.y > this.height) leader.pos.y -= this.height;
        }
    },

    // ----------------------------------------------------
    // Triggers / stimuli
    // ----------------------------------------------------
    updateTriggers() {
        // Noise
        this.triggers.noiseBursts = this.triggers.noiseBursts.filter(n => {
            n.strength *= 0.94;
            return n.strength > 0.05;
        });

        // Light
        this.triggers.lightPulses = this.triggers.lightPulses.filter(l => {
            l.strength *= 0.94;
            return l.strength > 0.05;
        });
    },

    // ----------------------------------------------------
    // Main update
    // ----------------------------------------------------
    update() {
        if (!this.running) return;

        this.updatePackLOS();
        this.updateSquadBehavior();
        this.updatePredatorPacks();
        this.updateLeaders();
        this.updateAgents();
        this.updateTriggers();
    }
});
/*=========================================================
  APEXSIM v5 — Rendering, Controls, Export (APEXCORE-grade)
=========================================================*/

Object.assign(APEXSIM, {
    // ----------------------------------------------------
    // Rendering
    // ----------------------------------------------------
    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        // Terrain zones
        for (const z of this.terrainZones) {
            if (z.type === "slow") ctx.fillStyle = "rgba(80, 120, 200, 0.18)";
            else if (z.type === "fast") ctx.fillStyle = "rgba(120, 220, 120, 0.18)";
            else if (z.type === "danger") ctx.fillStyle = "rgba(220, 80, 80, 0.22)";
            else if (z.type === "cover") ctx.fillStyle = "rgba(200, 200, 80, 0.22)";

            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Safe zones
        for (const sz of this.safeZones) {
            ctx.strokeStyle = "rgba(120, 240, 180, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Obstacles
        for (const obs of this.obstacles) {
            ctx.fillStyle = "rgba(80, 80, 80, 0.9)";
            ctx.beginPath();
            ctx.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Trails
        if (this.showTrails) {
            ctx.lineWidth = 1;
            for (const a of this.agents) {
                if (!a.trail.length) continue;
                const isPred = a.type === "predator";
                ctx.strokeStyle = isPred
                    ? "rgba(255, 80, 80, 0.4)"
                    : "rgba(120, 200, 255, 0.35)";
                ctx.beginPath();
                for (let i = 0; i < a.trail.length; i++) {
                    const t = a.trail[i];
                    if (i === 0) ctx.moveTo(t.x, t.y);
                    else ctx.lineTo(t.x, t.y);
                }
                ctx.stroke();
            }
        }

        // Agents
        for (const a of this.agents) {
            const angle = Math.atan2(a.vel.y, a.vel.x);
            const size = a.radius;

            ctx.save();
            ctx.translate(a.pos.x, a.pos.y);
            ctx.rotate(angle);

            if (a.type === "predator") {
                const baseColor = a.hasLOS ? "255,80,80" : "200,80,80";
                ctx.fillStyle = `rgba(${baseColor},0.95)`;
            } else {
                const panic = clamp(a.panic, 0, 1);
                const g = Math.floor(180 + panic * 60);
                const b = Math.floor(220 - panic * 80);
                ctx.fillStyle = `rgba(120,${g},${b},0.95)`;
            }

            ctx.beginPath();
            ctx.moveTo(size, 0);
            ctx.lineTo(-size * 0.7, size * 0.6);
            ctx.lineTo(-size * 0.7, -size * 0.6);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // Leaders
        for (const leader of this.leaders) {
            ctx.save();
            ctx.translate(leader.pos.x, leader.pos.y);
            ctx.fillStyle = leader.evasive
                ? "rgba(255, 255, 120, 0.95)"
                : "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(0, 0, leader.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    // ----------------------------------------------------
    // Control
    // ----------------------------------------------------
    start() {
        this.running = true;
    },

    stop() {
        this.running = false;
    }
});

// --------------------------------------------------------
// Export hook
// --------------------------------------------------------
if (typeof window !== "undefined") {
    window.APEXSIM = APEXSIM;
}
