"use strict";

/*=========================================================
  APEXSIM v4.4 — Stabilized Edition
  Predator/Prey Ecosystem + HALO Squad
=========================================================*/

// --------------------------------------------------------
// Core math & helpers
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

function dist(a, b) {
    return mag(sub(a, b));
}

// --------------------------------------------------------
// RNG
// --------------------------------------------------------
let _rngSeed = Date.now() & 0xffffffff;

function randSeed(seed) {
    _rngSeed = seed >>> 0;
}

function rand() {
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
// Geometry
// --------------------------------------------------------
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
// Agent (prey + predator) — Part 1
// --------------------------------------------------------
class Agent {
    constructor(type, x, y) {
        this.type = type; // "prey" | "predator"
        this.pos = vec(x, y);
        this.vel = vec(randRange(-1, 1), randRange(-1, 1));
        this.acc = vec(0, 0);

        this.baseMaxSpeed = type === "predator" ? 3.0 : 2.4;
        this.maxSpeed = this.baseMaxSpeed;
        this.maxForce = 0.12;

        this.radius = type === "predator" ? 8 : 6;

        this.panic = 0;
        this.scatterTimer = 0;

        this.trail = [];
        this.trailMax = 25;

        this.hasLOS = false;
    }

    applyForce(f) {
        this.acc.x += f.x;
        this.acc.y += f.y;
    }

    update() {
        this.vel = add(this.vel, this.acc);
        const s = mag(this.vel);
        if (s > this.maxSpeed) {
            this.vel = mul(norm(this.vel), this.maxSpeed);
        }

        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }

        if (this.type === "prey") {
            this.panic *= 0.94;
            if (this.scatterTimer > 0) this.scatterTimer--;
        }
    }

    steerSeek(target, scale = 1) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * scale);
    }

    steerFlee(target, scale = 1) {
        const desired = sub(this.pos, target);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * scale);
    }
    steerWander(scale = 1) {
        const jitter = vec(randRange(-1, 1), randRange(-1, 1));
        return mul(norm(jitter), this.maxForce * 0.6 * scale);
    }

    avoidObstacles(obstacles) {
        let steer = vec(0, 0);
        for (const o of obstacles) {
            const d = dist(this.pos, o.pos);
            const safeDist = o.radius + this.radius + 18;
            if (d < safeDist && d > 0) {
                const push = mul(norm(sub(this.pos, o.pos)), (safeDist - d) * 0.05);
                steer = add(steer, push);
            }
        }
        return steer;
    }

    flock(neighbors) {
        if (!neighbors.length) return;

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

    preyBehavior(allAgents, obstacles) {
        const predators = [];
        for (const other of allAgents) {
            if (other.type !== "predator") continue;
            if (dist(this.pos, other.pos) < 260) predators.push(other);
        }

        let fleeForce = vec(0, 0);
        let threatLevel = 0;

        for (const p of predators) {
            const d = dist(this.pos, p.pos);
            if (d < 260) {
                fleeForce = add(fleeForce, this.steerFlee(p.pos, 1.4));
                const t = 1 - clamp(d / 260, 0, 1);
                threatLevel = Math.max(threatLevel, t);
            }
        }

        this.panic = Math.max(this.panic, threatLevel);
        this.applyForce(fleeForce);

        const neighbors = [];
        for (const other of allAgents) {
            if (other === this || other.type !== "prey") continue;
            if (dist(this.pos, other.pos) < 80) neighbors.push(other);
        }

        if (this.scatterTimer > 0) {
            this.applyForce(this.steerWander(1.0));
        } else {
            this.flock(neighbors);
        }

        const avoid = this.avoidObstacles(obstacles);
        this.applyForce(avoid);
    }

    predatorBehavior(target, obstacles, confusion = 0) {
        let steer = vec(0, 0);

        if (target) {
            const seek = this.steerSeek(target.pos, 1.2);
            steer = add(steer, seek);
        } else {
            steer = add(steer, this.steerWander(0.8));
        }

        if (confusion > 0) {
            const jitter = mul(
                vec(randRange(-1, 1), randRange(-1, 1)),
                confusion * 0.4
            );
            steer = add(steer, jitter);
        }

        const avoid = this.avoidObstacles(obstacles);
        steer = add(steer, avoid);

        this.applyForce(steer);
    }
}

// --------------------------------------------------------
// HALO Leader (squad anchor)
// --------------------------------------------------------
class HaloLeader {
    constructor(x, y, index, total) {
        this.pos = vec(x, y);
        this.vel = vec(randRange(-1, 1), randRange(-1, 1));
        this.acc = vec(0, 0);

        this.maxSpeed = 2.2;
        this.maxForce = 0.10;
        this.radius = 7;

        this.index = index;
        this.total = total;

        this.patrolRadius = 140;
        this.patrolCenter = vec(x, y);
        this.patrolAngle = (index / total) * Math.PI * 2;
    }

    applyForce(f) {
        this.acc.x += f.x;
        this.acc.y += f.y;
    }

    update() {
        this.patrolAngle += 0.004;
        const target = {
            x: this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius,
            y: this.patrolCenter.y + Math.sin(this.patrolAngle) * this.patrolRadius
        };

        const seek = this._steerSeek(target, 0.9);
        this.applyForce(seek);

        this.vel = add(this.vel, this.acc);
        const s = mag(this.vel);
        if (s > this.maxSpeed) {
            this.vel = mul(norm(this.vel), this.maxSpeed);
        }

        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);
    }

    _steerSeek(target, scale = 1) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);
        const nd = mul(norm(desired), this.maxSpeed);
        const steer = sub(nd, this.vel);
        return mul(steer, this.maxForce * scale);
    }
}
// --------------------------------------------------------
// APEXSIM v4.4 — Engine Shell
// --------------------------------------------------------
const APEXSIM = {
    width: 0,
    height: 0,
    ctx: null,
    running: false,

    agents: [],
    leaders: [],
    obstacles: [],
    predatorPacks: [],

    config: {
        preyCount: 70,
        predatorCount: 8,
        haloCount: 4,
        obstacleCount: 10
    },

    init(canvas, options = {}) {
        if (!canvas || !canvas.getContext) {
            throw new Error("APEXSIM.init: canvas with 2D context required.");
        }

        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.agents = [];
        this.leaders = [];
        this.obstacles = [];
        this.predatorPacks = [];

        if (options.seed != null) {
            randSeed(options.seed);
        }

        this._setupWorld();
    },

    _setupWorld() {
        this._spawnObstacles();
        this._spawnHaloLeaders();
        this._spawnAgents();
        this._formPredatorPacks();
    },

    _spawnObstacles() {
        this.obstacles = [];
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

    _spawnHaloLeaders() {
        this.leaders = [];
        const cx = this.width / 2;
        const cy = this.height / 2;
        const r = Math.min(this.width, this.height) * 0.25;

        for (let i = 0; i < this.config.haloCount; i++) {
            const ang = (i / this.config.haloCount) * Math.PI * 2;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            const leader = new HaloLeader(x, y, i, this.config.haloCount);
            this.leaders.push(leader);
        }
    },

    _spawnAgents() {
        this.agents = [];

        for (let i = 0; i < this.config.preyCount; i++) {
            const a = new Agent(
                "prey",
                randRange(0, this.width),
                randRange(0, this.height)
            );
            this.agents.push(a);
        }

        for (let i = 0; i < this.config.predatorCount; i++) {
            const a = new Agent(
                "predator",
                randRange(0, this.width),
                randRange(0, this.height)
            );
            this.agents.push(a);
        }
    },

    _formPredatorPacks() {
        const predators = this.agents.filter(a => a.type === "predator");
        const packSize = 3;
        let packId = 0;

        this.predatorPacks = [];

        for (let i = 0; i < predators.length; i += packSize) {
            const slice = predators.slice(i, i + packSize);
            const indices = [];

            for (const p of slice) {
                const idx = this.agents.indexOf(p);
                if (idx >= 0) indices.push(idx);
            }

            this.predatorPacks.push({
                id: packId,
                predatorIndices: indices,
                targetPreyIndex: null,
                confusion: 0
            });

            packId++;
        }
    },

    _updatePackLOS() {
        for (const pack of this.predatorPacks) {
            const indices = pack.predatorIndices;
            if (!indices.length) {
                pack.targetPreyIndex = null;
                continue;
            }

            let center = vec(0, 0);
            for (const idx of indices) {
                center = add(center, this.agents[idx].pos);
            }
            center = mul(center, 1 / indices.length);

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

            for (const idx of indices) {
                const p = this.agents[idx];
                p.hasLOS = false;
            }

            if (bestPreyIndex == null) continue;

            const prey = this.agents[bestPreyIndex];
            let blocked = false;

            for (const o of this.obstacles) {
                if (lineIntersectsCircle(center, prey.pos, o.pos, o.radius + 4)) {
                    blocked = true;
                    break;
                }
            }

            const hasLOS = !blocked;
            for (const idx of indices) {
                const p = this.agents[idx];
                p.hasLOS = hasLOS;
            }

            if (!hasLOS && bestDist > 260) {
                pack.confusion = clamp(pack.confusion + 0.02, 0, 1);
            } else {
                pack.confusion *= 0.96;
            }
        }
    },
    _updateLeaders() {
        for (const leader of this.leaders) {
            leader.update();

            // Wrap around screen edges
            if (leader.pos.x < 0) leader.pos.x += this.width;
            if (leader.pos.x > this.width) leader.pos.x -= this.width;
            if (leader.pos.y < 0) leader.pos.y += this.height;
            if (leader.pos.y > this.height) leader.pos.y -= this.height;
        }
    },

    _updateAgents() {
        this._updatePackLOS();

        for (let i = 0; i < this.agents.length; i++) {
            const a = this.agents[i];

            // Reset speed to base each frame
            a.maxSpeed = a.baseMaxSpeed;

            if (a.type === "prey") {
                this._applyPreySquadAlarm(a);
                a.preyBehavior(this.agents, this.obstacles);
            } else {
                const pack = this._findPackForPredatorIndex(i);
                let target = null;
                let confusion = 0;

                if (pack && pack.targetPreyIndex != null) {
                    target = this.agents[pack.targetPreyIndex];
                    confusion = pack.confusion;
                }

                a.predatorBehavior(target, this.obstacles, confusion);
            }

            a.update();

            // Wrap around edges
            if (a.pos.x < 0) a.pos.x += this.width;
            if (a.pos.x > this.width) a.pos.x -= this.width;
            if (a.pos.y < 0) a.pos.y += this.height;
            if (a.pos.y > this.height) a.pos.y -= this.height;
        }
    },

    _applyPreySquadAlarm(agent) {
        let nearestPred = Infinity;

        for (const other of this.agents) {
            if (other.type !== "predator") continue;
            const d = dist(agent.pos, other.pos);
            if (d < nearestPred) nearestPred = d;
        }

        const alarmRadius = 260;
        const alarm =
            nearestPred < alarmRadius ? 1 - nearestPred / alarmRadius : 0;

        // Trigger scatter
        if (alarm > 0.7 && agent.scatterTimer <= 0) {
            agent.scatterTimer = 200 + Math.floor(rand() * 60);
        }

        agent.panic = Math.max(agent.panic, alarm);
    },

    _findPackForPredatorIndex(idx) {
        for (const pack of this.predatorPacks) {
            if (pack.predatorIndices.includes(idx)) return pack;
        }
        return null;
    },

    update() {
        if (!this.running) return;
        this._updateLeaders();
        this._updateAgents();
    },
    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        // Obstacles
        for (const o of this.obstacles) {
            ctx.fillStyle = "rgba(80,80,80,0.9)";
            ctx.beginPath();
            ctx.arc(o.pos.x, o.pos.y, o.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Trails
        ctx.lineWidth = 1;
        for (const a of this.agents) {
            if (!a.trail.length) continue;
            const isPred = a.type === "predator";
            ctx.strokeStyle = isPred
                ? "rgba(255,80,80,0.35)"
                : "rgba(120,200,255,0.35)";
            ctx.beginPath();
            for (let i = 0; i < a.trail.length; i++) {
                const t = a.trail[i];
                if (i === 0) ctx.moveTo(t.x, t.y);
                else ctx.lineTo(t.x, t.y);
            }
            ctx.stroke();
        }

        // Agents
        for (const a of this.agents) {
            const angle = Math.atan2(a.vel.y, a.vel.x);
            const size = a.radius;

            ctx.save();
            ctx.translate(a.pos.x, a.pos.y);
            ctx.rotate(angle);

            if (a.type === "predator") {
                const base = a.hasLOS ? "255,80,80" : "200,80,80";
                ctx.fillStyle = `rgba(${base},0.95)`;
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

        // HALO leaders
        for (const leader of this.leaders) {
            ctx.save();
            ctx.translate(leader.pos.x, leader.pos.y);

            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.beginPath();
            ctx.arc(0, 0, leader.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(180,240,255,0.9)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, leader.radius + 4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    },

    start() {
        this.running = true;
    },

    stop() {
        this.running = false;
    }
};

// --------------------------------------------------------
// Export
// --------------------------------------------------------
if (typeof window !== "undefined") {
    window.APEXSIM = APEXSIM;
}
