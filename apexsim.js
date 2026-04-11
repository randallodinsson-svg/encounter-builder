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

    recordDanger(pos) { this.push(this.danger, pos, 10); }
    recordSafe(pos) { this.push(this.safe, pos, 10); }
    recordEncounter(pos) { this.push(this.encounters, pos, 5); }
    recordEvasion(pos) { this.push(this.evasions, pos, 5); }
    recordFailure(pos) { this.push(this.failures, pos, 5); }

    // Weighted danger field
    dangerBias(pos) {
        let bias = 0;
        for (const d of this.danger) {
            const dist = mag(sub(pos, d));
            if (dist < 200) bias += (1 - dist / 200);
        }
        return bias;
    }

    // Weighted safe field
    safeBias(pos) {
        let bias = 0;
        for (const s of this.safe) {
            const dist = mag(sub(pos, s));
            if (dist < 200) bias += (1 - dist / 200);
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

        // Adaptive flanking
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
            if (mag(sub(this.pos, vec(z.x, z.y))) > z.radius) continue;

            if (z.type === "slow") this.terrainFactor *= 0.7;
            else if (z.type === "fast") this.terrainFactor *= 1.3;
            else if (z.type === "danger") {
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
        const lookAhead = 50;
        const forward = norm(this.vel);
        const ahead = add(this.pos, mul(forward, lookAhead));
        const aheadHalf = add(this.pos, mul(forward, lookAhead * 0.5));
        let mostThreatening = null;

        for (const obs of obstacles) {
            const collision =
                mag(sub(obs.pos, ahead)) <= obs.radius + 10 ||
                mag(sub
