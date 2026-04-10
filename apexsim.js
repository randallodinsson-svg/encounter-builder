// ------------------------------------------------------------
// APEXSIM v3.7 — Dynamic Formation Leader
// + Formation Control + Flocking + Obstacle Avoidance
// + Trails + Glow + Debug
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
// Agent
// ------------------------------------------------------------
class Agent {
    constructor(x, y) {
        this.pos = vec(x, y);
        this.vel = vec((rand() - 0.5) * 2, (rand() - 0.5) * 2);
        this.acc = vec(0, 0);

        this.maxSpeed = 2.0;
        this.maxForce = 0.05;

        this.wanderAngle = 0;

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
    // Flocking + Formation
    // --------------------------------------------------------
    flock(neighbors, obstacles, formationTarget) {
        const separation = this.flockSeparation(neighbors);
        const alignment = this.flockAlignment(neighbors);
        const cohesion = this.flockCohesion(neighbors);
        const wander = this.steerWander();
        const avoid = this.avoidObstacles(obstacles);
        const formation = formationTarget ? this.steerArrive(formationTarget, 60) : vec(0, 0);

        const sepWeight = 1.5;
        const aliWeight = 1.0;
        const cohWeight = 0.8;
        const wanWeight = 0.25;
        const avoWeight = 2.0;
        const formWeight = 1.2;

        let steer = vec(0, 0);
        steer = add(steer, mul(separation, sepWeight));
        steer = add(steer, mul(alignment, aliWeight));
        steer = add(steer, mul(cohesion, cohWeight));
        steer = add(steer, mul(wander, wanWeight));
        steer = add(steer, mul(avoid, avoWeight));
        steer = add(steer, mul(formation, formWeight));

        this.applyForce(steer);
    }

    flockSeparation(neighbors) {
        const desiredSeparation = 25;
        let steer = vec(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === this) continue;
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
            avoid = mul(avoid, this.maxForce * 2);
            return avoid;
        }

        return vec(0, 0);
    }

    update() {
        this.vel = add(this.vel, this.acc);
        this.vel = limit(this.vel, this.maxSpeed);
        this.pos = add(this.pos, this.vel);
        this.acc = vec(0, 0);

        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
    }
}

// ------------------------------------------------------------
// Simulation Engine
// ------------------------------------------------------------
const APEXSIM = {
    agents: [],
    obstacles: [],
    formationOffsets: [],
    formationMode: "circle", // "circle", "line", "none"
    leader: {
        pos: vec(0, 0),
        angle: 0,
        radius: 120
    },
    width: 800,
    height: 600,
    running: false,
    ctx: null,

    // Debug toggles (wired to your UI)
    showTrails: true,
    showDebugVectors: true,
    showGlow: true,

    init(canvas) {
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.agents = [];
        const count = 40;
        for (let i = 0; i < count; i++) {
            this.agents.push(new Agent(rand() * this.width, rand() * this.height));
        }

        // Static obstacles
        this.obstacles = [
            { pos: vec(this.width * 0.33, this.height * 0.5), radius: 40 },
            { pos: vec(this.width * 0.66, this.height * 0.4), radius: 35 },
            { pos: vec(this.width * 0.5, this.height * 0.7), radius: 45 }
        ];

        // Leader starts at center
        this.leader.pos = vec(this.width / 2, this.height / 2);
        this.leader.angle = 0;
        this.leader.radius = Math.min(this.width, this.height) * 0.25;

        this.buildFormationOffsets();
    },

    // --------------------------------------------------------
    // Formation slot offsets (relative to leader)
// --------------------------------------------------------
    buildFormationOffsets() {
        this.formationOffsets = [];
        const n = this.agents.length;

        if (this.formationMode === "circle") {
            const radius = 80;
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                this.formationOffsets.push(vec(x, y));
            }
        } else if (this.formationMode === "line") {
            const spacing = 20;
            const startX = -(n / 2) * spacing;
            const y = 0;
            for (let i = 0; i < n; i++) {
                const x = startX + i * spacing;
                this.formationOffsets.push(vec(x, y));
            }
        } else {
            for (let i = 0; i < n; i++) {
                this.formationOffsets.push(null);
            }
        }
    },

    setFormation(mode) {
        this.formationMode = mode;
        this.buildFormationOffsets();
    },

    // --------------------------------------------------------
    // Leader motion
    // --------------------------------------------------------
    updateLeader() {
        // Leader moves in a smooth looping path
        this.leader.angle += 0.01;
        const center = vec(this.width / 2, this.height / 2);

        const x = center.x + Math.cos(this.leader.angle) * this.leader.radius;
        const y = center.y + Math.sin(this.leader.angle * 0.7) * this.leader.radius * 0.6;

        this.leader.pos.x = x;
        this.leader.pos.y = y;
    },

    step() {
        this.updateLeader();

        for (let i = 0; i < this.agents.length; i++) {
            const a = this.agents[i];
            const neighbors = this.agents;

            const offset = this.formationOffsets[i];
            let slotWorld = null;
            if (offset) {
                slotWorld = add(this.leader.pos, offset);
            }

            a.flock(neighbors, this.obstacles, slotWorld);
        }

        for (const a of this.agents) {
            a.update();

            if (a.pos.x < 0) a.pos.x = this.width;
            if (a.pos.x > this.width) a.pos.x = 0;
            if (a.pos.y < 0) a.pos.y = this.height;
            if (a.pos.y > this.height) a.pos.y = 0;
        }
    },

    // --------------------------------------------------------
    // Cinematic Fade‑Out Trails
    // --------------------------------------------------------
    drawTrails() {
        const c = this.ctx;

        for (const a of this.agents) {
            if (a.trail.length < 2) continue;

            for (let i = 0; i < a.trail.length - 1; i++) {
                const p1 = a.trail[i];
                const p2 = a.trail[i + 1];

                const alpha = i * a.trailFade;

                c.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                c.lineWidth = 1;

                c.beginPath();
                c.moveTo(p1.x, p1.y);
                c.lineTo(p2.x, p2.y);
                c.stroke();
            }
        }
    },

    // --------------------------------------------------------
    // Debug vectors + obstacle + formation + leader debug
    // --------------------------------------------------------
    drawDebugVectors() {
        const c = this.ctx;

        for (let i = 0; i < this.agents.length; i++) {
            const a = this.agents[i];

            // Velocity vector
            c.strokeStyle = "#0f0";
            c.beginPath();
            c.moveTo(a.pos.x, a.pos.y);
            c.lineTo(a.pos.x + a.vel.x * 10, a.pos.y + a.vel.y * 10);
            c.stroke();

            // Wander circle
            c.strokeStyle = "#f00";
            c.beginPath();
            c.arc(a.debugCirclePos.x, a.debugCirclePos.y, 12, 0, Math.PI * 2);
            c.stroke();

            // Wander target
            c.strokeStyle = "#ff0";
            c.beginPath();
            c.moveTo(a.debugCirclePos.x, a.debugCirclePos.y);
            c.lineTo(a.debugTarget.x, a.debugTarget.y);
            c.stroke();

            // Formation slot debug (world position)
            const offset = this.formationOffsets[i];
            if (offset) {
                const slot = add(this.leader.pos, offset);

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

        // Leader debug
        c.strokeStyle = "#ffffff";
        c.beginPath();
        c.arc(this.leader.pos.x, this.leader.pos.y, 6, 0, Math.PI * 2);
        c.stroke();

        c.beginPath();
        c.moveTo(this.leader.pos.x - 8, this.leader.pos.y);
        c.lineTo(this.leader.pos.x + 8, this.leader.pos.y);
        c.moveTo(this.leader.pos.x, this.leader.pos.y - 8);
        c.lineTo(this.leader.pos.x, this.leader.pos.y + 8);
        c.stroke();
    },

    // --------------------------------------------------------
    // Glow effect
    // --------------------------------------------------------
    drawGlow() {
        const c = this.ctx;

        for (const a of this.agents) {
            const glowSize = 8 + mag(a.vel) * 4;

            const gradient = c.createRadialGradient(
                a.pos.x, a.pos.y, 0,
                a.pos.x, a.pos.y, glowSize
            );

            gradient.addColorStop(0, "rgba(0, 234, 255, 0.35)");
            gradient.addColorStop(1, "rgba(0, 234, 255, 0)");

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

        // Obstacles fill (subtle)
        c.fillStyle = "rgba(255, 136, 0, 0.15)";
        for (const obs of this.obstacles) {
            c.beginPath();
            c.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
            c.fill();
        }

        c.fillStyle = "#00eaff";
        for (const a of this.agents) {
            c.beginPath();
            c.arc(a.pos.x, a.pos.y, 4, 0, Math.PI * 2);
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
