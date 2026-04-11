// ------------------------------------------------------------
// APEXSIM v4.1 — Predator Pack Behavior & Coordinated Hunting
// + Multi‑Leader Prey Squads
// + Predator Packs (shared targets, flanking, herding)
// + Flocking, Avoidance, Panic, Trails, Glow, Debug
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
// Agent Types
// type: "prey" | "predator"
// packId: for predators (which pack they belong to)
// squadId: for prey (which leader/squad they belong to)
// ------------------------------------------------------------
class Agent {
    constructor(x, y, type = "prey", squadId = 0, packId = -1) {
        this.pos = vec(x, y);
        this.vel = vec((rand() - 0.5) * 2, (rand() - 0.5) * 2);
        this.acc = vec(0, 0);

        this.type = type;
        this.squadId = squadId;
        this.packId = packId;

        this.maxSpeed = type === "predator" ? 2.7 : 2.1;
        this.maxForce = type === "predator" ? 0.08 : 0.05;

        this.wanderAngle = 0;

        // Panic state (for prey)
        this.panic = 0; // 0..1

        // Trail buffer
        this.trail = [];
        this.maxTrail = 40;
        this.trailFade = 1 / this.maxTrail;

        // Debug storage
        this.debugCirclePos = vec();
        this.debugTarget = vec();
    }

    applyForce(f) {
        this.acc = add(this.acc, f);
    }

    // --------------------------------------------------------
    // Steering primitives
    // --------------------------------------------------------
    steerSeek(target) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        let desiredNorm = norm(desired);
        desiredNorm = mul(desiredNorm, this.maxSpeed);

        const steer = sub(desiredNorm, this.vel);
        return limit(steer, this.maxForce);
    }

    steerArrive(target, slowRadius = 80) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        let speed = this.maxSpeed;
        if (d < slowRadius) {
            speed = this.maxSpeed * (d / slowRadius);
        }

        let desiredNorm = norm(desired);
        desiredNorm = mul(desiredNorm, speed);

        const steer = sub(desiredNorm, this.vel);
        return limit(steer, this.maxForce);
    }

    steerFlee(target) {
        const desired = sub(this.pos, target);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        let desiredNorm = norm(desired);
        desiredNorm = mul(desiredNorm, this.maxSpeed);

        const steer = sub(desiredNorm, this.vel);
        return limit(steer, this.maxForce);
    }

    // --------------------------------------------------------
    // Wander steering (noise source)
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
        const steer = limit(sub(norm(desired), this.vel), this.maxForce);

        return steer;
    }

    // --------------------------------------------------------
    // Flocking (for prey primarily)
// --------------------------------------------------------
    flock(neighbors) {
        const separation = this.flockSeparation(neighbors);
        const alignment = this.flockAlignment(neighbors);
        const cohesion = this.flockCohesion(neighbors);
        const wander = this.steerWander();

        const sepWeight = 1.5;
        const aliWeight = 1.0;
        const cohWeight = 0.8;
        const wanWeight = 0.25;

        let steer = vec(0, 0);
        steer = add(steer, mul(separation, sepWeight));
        steer = add(steer, mul(alignment, aliWeight));
        steer = add(steer, mul(cohesion, cohWeight));
        steer = add(steer, mul(wander, wanWeight));

        this.applyForce(steer);
    }

    flockSeparation(neighbors) {
        const desiredSeparation = 25;
        let steer = vec(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === this) continue;
            if (other.type !== this.type) continue; // only separate within same type
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < desiredSeparation) {
                let diff = sub(this.pos, other.pos);
                diff = norm(diff);
                diff = mul(diff, 1 / d);
                steer = add(steer, diff);
                count++;
            }
        }

        if (count > 0) {
            steer = mul(steer, 1 / count);
        }

        if (mag(steer) > 0) {
            steer = norm(steer);
            steer = mul(steer, this.maxSpeed);
            steer = sub(steer, this.vel);
            steer = limit(steer, this.maxForce);
        }

        return steer;
    }

    flockAlignment(neighbors) {
        const neighborDist = 50;
        let sum = vec(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === this) continue;
            if (other.type !== this.type) continue;
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < neighborDist) {
                sum = add(sum, other.vel);
                count++;
            }
        }

        if (count > 0) {
            sum = mul(sum, 1 / count);
            sum = norm(sum);
            sum = mul(sum, this.maxSpeed);
            let steer = sub(sum, this.vel);
            steer = limit(steer, this.maxForce);
            return steer;
        }

        return vec(0, 0);
    }

    flockCohesion(neighbors) {
        const neighborDist = 50;
        let sum = vec(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === this) continue;
            if (other.type !== this.type) continue;
            const d = mag(sub(this.pos, other.pos));
            if (d > 0 && d < neighborDist) {
                sum = add(sum, other.pos);
                count++;
            }
        }

        if (count > 0) {
            sum = mul(sum, 1 / count);
            return this.steerSeek(sum);
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
                if (!mostThreatening) {
                    mostThreatening = obs;
                } else {
                    const currentDist = mag(sub(obs.pos, this.pos));
                    const bestDist = mag(sub(mostThreatening.pos, this.pos));
                    if (currentDist < bestDist) {
                        mostThreatening = obs;
                    }
                }
            }
        }

        if (mostThreatening) {
            let avoid = sub(ahead, mostThreatening.pos);
            avoid = norm(avoid);
            avoid = mul(avoid, this.maxForce * 2.5);
            return avoid;
        }

        return vec(0, 0);
    }

    // --------------------------------------------------------
    // Predator/Prey interactions
    // --------------------------------------------------------
    predatorHuntPack(target, packCenter, packIndex, packSize) {
        if (!target) return vec(0, 0);

        // Base seek toward target
        const toTarget = this.steerSeek(target.pos);

        // Pack cohesion: stay near pack center
        const toCenter = this.steerArrive(packCenter, 100);

        // Flanking: offset angle around target based on pack index
        const offsetAngle = (packIndex / Math.max(1, packSize)) * Math.PI * 2;
        const flankRadius = 40;
        const flankPos = add(
            target.pos,
            vec(Math.cos(offsetAngle) * flankRadius, Math.sin(offsetAngle) * flankRadius)
        );
        const flankForce = this.steerArrive(flankPos, 60);

        // Weights
        const huntWeight = 1.4;
        const centerWeight = 0.6;
        const flankWeight = 1.0;

        let steer = vec(0, 0);
        steer = add(steer, mul(toTarget, huntWeight));
        steer = add(steer, mul(toCenter, centerWeight));
        steer = add(steer, mul(flankForce, flankWeight));

        return steer;
    }

    preyFlee(predators) {
        if (predators.length === 0) {
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

        this.panic = Math.min(1, this.panic + 0.05);

        const fleeForce = this.steerFlee(threat.pos);
        const scale = 1.0 + (1 - threatDist / fleeRadius) * 2.0;
        return mul(fleeForce, scale);
    }

    update() {
        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed * (1 + this.panic * 0.5));
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
    }
}

// ------------------------------------------------------------
// Leader (for prey squads, patrol + steering)
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
    }

    applyForce(f) {
        this.acc = add(this.acc, f);
    }

    steerArrive(target, slowRadius = 80) {
        const desired = sub(target, this.pos);
        const d = mag(desired);
        if (d === 0) return vec(0, 0);

        let speed = this.maxSpeed;
        if (d < slowRadius) {
            speed = this.maxSpeed * (d / slowRadius);
        }

        let desiredNorm = norm(desired);
        desiredNorm = mul(desiredNorm, speed);

        const steer = sub(desiredNorm, this.vel);
        return limit(steer, this.maxForce);
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
        const desired = sub(target, this.pos);
        const steer = limit(sub(norm(desired), this.vel), this.maxForce);

        return steer;
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
                if (!mostThreatening) {
                    mostThreatening = obs;
                } else {
                    const currentDist = mag(sub(obs.pos, this.pos));
                    const bestDist = mag(sub(mostThreatening.pos, this.pos));
                    if (currentDist < bestDist) {
                        mostThreatening = obs;
                    }
                }
            }
        }

        if (mostThreatening) {
            let avoid = sub(ahead, mostThreatening.pos);
            avoid = norm(avoid);
            avoid = mul(avoid, this.maxForce * 3);
            return avoid;
        }

        return vec(0, 0);
    }

    setWaypoints(points) {
        this.waypoints = points;
        this.currentWaypoint = 0;
    }

    updatePatrol(obstacles) {
        if (!this.waypoints || this.waypoints.length === 0) return;

        const target = this.waypoints[this.currentWaypoint];
        const toTarget = sub(target, this.pos);
        const dist = mag(toTarget);

        let steer = vec(0, 0);

        steer = add(steer, this.steerArrive(target, this.arriveRadius));
        steer = add(steer, this.avoidObstacles(obstacles));
        steer = add(steer, this.steerWander());

        this.applyForce(steer);

        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed);
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        if (dist < this.arriveRadius * 0.6) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
        }
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
    predatorPacks: [],   // { packId, predatorIndices, targetPreyIndex }
    formationMode: "circle",
    width: 800,
    height: 600,
    running: false,
    ctx: null,

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

        // Leaders for prey squads
        for (let i = 0; i < squadCount; i++) {
            const angle = (i / squadCount) * Math.PI * 2;
            const cx = this.width / 2 + Math.cos(angle) * 80;
            const cy = this.height / 2 + Math.sin(angle) * 60;
            const leader = new Leader(cx, cy, i);
            this.leaders.push(leader);
        }

        // Patrol waypoints per leader
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
        const predatorIndices = [];
        for (let p = 0; p < totalPredators; p++) {
            const packId = Math.floor(p / predatorsPerPack);
            const a = new Agent(rand() * this.width, rand() * this.height, "predator", -1, packId);
            this.agents.push(a);
            predatorIndices.push(agentIndex);
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
                targetPreyIndex: null
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
    // Pack target selection
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
            // Compute pack center
            let center = vec(0, 0);
            let count = 0;
            for (const idx of pack.predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            // Find closest prey to pack center
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

            pack.targetPreyIndex = closestIndex;
        }
    },

    step() {
        const predators = this.agents.filter(a => a.type === "predator");
        const prey = this.agents.filter(a => a.type === "prey");

        // Update leaders (for prey squads)
        for (const leader of this.leaders) {
            leader.updatePatrol(this.obstacles);

            if (leader.pos.x < 0) leader.pos.x = this.width;
            if (leader.pos.x > this.width) leader.pos.x = 0;
            if (leader.pos.y < 0) leader.pos.y = this.height;
            if (leader.pos.y > this.height) leader.pos.y = 0;
        }

        // Pack target selection
        this.choosePackTargets();

        // Prey squads follow leaders + flock + flee predators
        for (const squad of this.squads) {
            const leader = this.leaders[squad.leaderId];
            const indices = squad.agentIndices;
            const offsets = squad.formationOffsets;

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                const a = this.agents[idx];
                const neighbors = prey;

                const offset = offsets[i] || null;
                let slotWorld = null;
                if (offset) {
                    slotWorld = add(leader.pos, offset);
                }

                a.flock(neighbors);

                if (slotWorld) {
                    const formForce = a.steerArrive(slotWorld, 60);
                    a.applyForce(formForce);
                }

                const fleeForce = a.preyFlee(predators);
                a.applyForce(fleeForce);

                const avoid = a.avoidObstacles(this.obstacles);
                a.applyForce(avoid);
            }
        }

        // Predator packs: coordinated hunting
        for (const pack of this.predatorPacks) {
            const predatorIndices = pack.predatorIndices;
            if (predatorIndices.length === 0) continue;

            // Pack center
            let center = vec(0, 0);
            let count = 0;
            for (const idx of predatorIndices) {
                const a = this.agents[idx];
                center = add(center, a.pos);
                count++;
            }
            if (count > 0) center = mul(center, 1 / count);

            const target = (pack.targetPreyIndex != null) ? this.agents[pack.targetPreyIndex] : null;

            // Each predator in pack
            for (let i = 0; i < predatorIndices.length; i++) {
                const idx = predatorIndices[i];
                const pr = this.agents[idx];

                const hunt = pr.predatorHuntPack(target, center, i, predatorIndices.length);
                const avoid = pr.avoidObstacles(this.obstacles);
                const wander = pr.steerWander();

                pr.applyForce(hunt);
                pr.applyForce(avoid);
                pr.applyForce(mul(wander, 0.2));
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
    // Trails
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

    // --------------------------------------------------------
    // Debug vectors + obstacles + leaders + formations
    // --------------------------------------------------------
    drawDebugVectors() {
        const c = this.ctx;

        // Agents
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
        }

        // Formation slots for prey squads
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

        // Obstacles
        c.strokeStyle = "#ff8800";
        for (const obs of this.obstacles) {
            c.beginPath();
            c.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            c.stroke();
        }

        // Leaders + waypoints
        for (const leader of this.leaders) {
            c.strokeStyle = "#ffffff";
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

        // Pack centers (optional subtle debug)
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

            c.strokeStyle = "rgba(255,80,80,0.4)";
            c.beginPath();
            c.arc(center.x, center.y, 10, 0, Math.PI * 2);
            c.stroke();
        }
    },

    // --------------------------------------------------------
    // Glow
    // --------------------------------------------------------
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
                gradient.addColorStop(0, "rgba(255, 80, 80, 0.4)");
                gradient.addColorStop(1, "rgba(255, 80, 80, 0)");
            } else {
                const panicBoost = a.panic * 0.4;
                gradient.addColorStop(0, `rgba(0, 234, 255, ${0.35 + panicBoost})`);
                gradient.addColorStop(1, "rgba(0, 234, 255, 0)");
            }

            c.fillStyle = gradient;
            c.beginPath();
            c.arc(a.pos.x, a.pos.y, glowSize, 0, Math.PI * 2);
            c.fill();
        }
    },

    // --------------------------------------------------------
    // Draw
    // --------------------------------------------------------
    draw() {
        const c = this.ctx;
        c.clearRect(0, 0, this.width, this.height);

        if (this.showTrails) this.drawTrails();
        if (this.showGlow) this.drawGlow();
        if (this.showDebugVectors) this.drawDebugVectors();

        // Obstacles fill
        c.fillStyle = "rgba(255, 136, 0, 0.15)";
        for (const obs of this.obstacles) {
            c.beginPath();
            c.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            c.fill();
        }

        // Agents
        for (const a of this.agents) {
            if (a.type === "predator") {
                c.fillStyle = "#ff5050";
            } else {
                c.fillStyle = "#00eaff";
            }
            c.beginPath();
            c.arc(a.pos.x, a.pos.y, a.type === "predator" ? 5 : 4, 0, Math.PI * 2);
            c.fill();
        }
    },

    run() {
        if (!this.running) return;
        this.step();
        this.draw();
        requestAnimationFrame(() => this.run());
    },

    start() {
        this.running = true;
        this.run();
    },

    stop() {
        this.running = false;
    }
};

window.APEXSIM = APEXSIM;
