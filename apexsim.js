// ------------------------------------------------------------
// APEXSIM v3.4 — Flocking (Separation, Alignment, Cohesion)
// + Steering Base + Fade‑Out Trails + Debug + Glow
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

    steerFlee(target) {
        const desired = sub(this.pos, target);
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
    // Wander steering (kept as noise source)
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
    // Flocking behaviors
    // --------------------------------------------------------
    flock(neighbors) {
        const separation = this.flockSeparation(neighbors);
        const alignment = this.flockAlignment(neighbors);
        const cohesion = this.flockCohesion(neighbors);
        const wander = this.steerWander();

        const sepWeight = 1.5;
        const aliWeight = 1.0;
        const cohWeight = 1.0;
        const wanWeight = 0.3;

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
        for (let i = 0; i < 40; i++) {
            this.agents.push(new Agent(rand() * this.width, rand() * this.height));
        }
    },

    step() {
        // Flocking: each agent considers all others as potential neighbors
        for (let i = 0; i < this.agents.length; i++) {
            const a = this.agents[i];
            const neighbors = this.agents; // simple global neighborhood
            a.flock(neighbors);
        }

        for (const a of this.agents) {
            a.update();

            // Wrap edges
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
    // Debug vectors
    // --------------------------------------------------------
    drawDebugVectors() {
        const c = this.ctx;

        for (const a of this.agents) {
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
        }
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
