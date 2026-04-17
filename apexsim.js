// apexim.js — APEXSIM v1.3 (Steering Behaviors)

console.log("APEXSIM — Core initializing…");

let _running = false;
let _lastTime = 0;

const simState = {
    tick: 0,
    time: 0,
    entities: []
};

// ------------------------------------------------------------
// ENTITY TYPES
// ------------------------------------------------------------

const ENTITY_TYPES = {
    SCOUT: {
        color: "#00FFC8",
        size: 12,
        shape: "circle",
        speed: 120
    },
    TANK: {
        color: "#FF3B3B",
        size: 22,
        shape: "square",
        speed: 60
    },
    SUPPORT: {
        color: "#FFD93B",
        size: 16,
        shape: "diamond",
        speed: 90
    }
};

// ------------------------------------------------------------
// ENTITY CREATION
// ------------------------------------------------------------

function createEntity(id, type, x, y, behavior = "wander") {
    return {
        id,
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        behavior,
        wanderAngle: Math.random() * Math.PI * 2
    };
}

function initEntities() {
    simState.entities = [
        createEntity("scout‑1", ENTITY_TYPES.SCOUT, 200, 200, "seek"),
        createEntity("tank‑1", ENTITY_TYPES.TANK, 600, 300, "wander"),
        createEntity("support‑1", ENTITY_TYPES.SUPPORT, 400, 500, "flee")
    ];
}

// ------------------------------------------------------------
// STEERING HELPERS
// ------------------------------------------------------------

function limit(vx, vy, max) {
    const mag = Math.hypot(vx, vy);
    if (mag > max) {
        return { vx: (vx / mag) * max, vy: (vy / mag) * max };
    }
    return { vx, vy };
}

function steerSeek(e, targetX, targetY) {
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const mag = Math.hypot(dx, dy) || 1;
    return { vx: dx / mag, vy: dy / mag };
}

function steerFlee(e, targetX, targetY) {
    const dx = e.x - targetX;
    const dy = e.y - targetY;
    const mag = Math.hypot(dx, dy) || 1;
    return { vx: dx / mag, vy: dy / mag };
}

function steerWander(e) {
    e.wanderAngle += (Math.random() - 0.5) * 0.4;
    return {
        vx: Math.cos(e.wanderAngle),
        vy: Math.sin(e.wanderAngle)
    };
}

function steerArrive(e, targetX, targetY) {
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    const speed = e.type.speed;
    const slowRadius = 150;

    const desiredSpeed = dist < slowRadius ? speed * (dist / slowRadius) : speed;

    return {
        vx: (dx / dist) * desiredSpeed,
        vy: (dy / dist) * desiredSpeed
    };
}

// ------------------------------------------------------------
// SIMULATION LOOP
// ------------------------------------------------------------

export function startAPEXSIM() {
    if (_running) return;
    _running = true;
    _lastTime = performance.now();
    initEntities();
    requestAnimationFrame(simLoop);
    console.log("APEXSIM — Simulation started");
}

export function stopAPEXSIM() {
    _running = false;
    console.log("APEXSIM — Simulation stopped");
}

export function getSimState() {
    return simState;
}

function simLoop(timestamp) {
    if (!_running) return;

    const dt = (timestamp - _lastTime) / 1000;
    _lastTime = timestamp;

    simState.tick++;
    simState.time += dt * 1000;

    updateEntities(dt);

    requestAnimationFrame(simLoop);
}

// ------------------------------------------------------------
// ENTITY UPDATE
// ------------------------------------------------------------

function updateEntities(dt) {
    const width = 1280;
    const height = 720;

    for (const e of simState.entities) {
        let steer = { vx: 0, vy: 0 };

        switch (e.behavior) {
            case "seek":
                steer = steerSeek(e, width / 2, height / 2);
                break;

            case "flee":
                steer = steerFlee(e, width / 2, height / 2);
                break;

            case "wander":
                steer = steerWander(e);
                break;

            case "arrive":
                steer = steerArrive(e, width / 2, height / 2);
                break;
        }

        // blend steering with velocity
        e.vx += steer.vx * dt * e.type.speed;
        e.vy += steer.vy * dt * e.type.speed;

        // clamp velocity
        const limited = limit(e.vx, e.vy, e.type.speed);
        e.vx = limited.vx;
        e.vy = limited.vy;

        // apply movement
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // bounce off edges
        if (e.x < 40 || e.x > width - 40) e.vx *= -1;
        if (e.y < 40 || e.y > height - 40) e.vy *= -1;
    }
}

console.log("APEXSIM — Core online");
