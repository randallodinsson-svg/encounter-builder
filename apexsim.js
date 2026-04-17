// apexim.js — APEXSIM v1.5 (Steering Blending + Priorities)

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

function steerSeek(e, tx, ty) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const mag = Math.hypot(dx, dy) || 1;
    return { vx: dx / mag, vy: dy / mag };
}

function steerFlee(e, tx, ty) {
    const dx = e.x - tx;
    const dy = e.y - ty;
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

function steerArrive(e, tx, ty) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    const speed = e.type.speed;
    const slowRadius = 150;

    const desiredSpeed = dist < slowRadius ? speed * (dist / slowRadius) : speed;

    return {
        vx: (dx / dist) * desiredSpeed,
        vy: (dy / dist) * desiredSpeed
    };
}

// Avoid neighbors
function steerAvoidOthers(e, entities, radius = 80) {
    let ax = 0, ay = 0, count = 0;

    for (const other of entities) {
        if (other === e) continue;
        const dx = e.x - other.x;
        const dy = e.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < radius) {
            const strength = (radius - dist) / radius;
            ax += (dx / dist) * strength;
            ay += (dy / dist) * strength;
            count++;
        }
    }

    if (count === 0) return { vx: 0, vy: 0 };

    ax /= count;
    ay /= count;

    const mag = Math.hypot(ax, ay) || 1;
    return { vx: ax / mag, vy: ay / mag };
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
// ENTITY UPDATE — Steering Blending + Priority
// ------------------------------------------------------------

function updateEntities(dt) {
    const width = 1280;
    const height = 720;
    const entities = simState.entities;

    for (const e of entities) {
        // --- Primary steering (behavior)
        let primary = { vx: 0, vy: 0 };

        switch (e.behavior) {
            case "seek":
                primary = steerSeek(e, width / 2, height / 2);
                break;

            case "flee":
                primary = steerFlee(e, width / 2, height / 2);
                break;

            case "wander":
                primary = steerWander(e);
                break;

            case "arrive":
                primary = steerArrive(e, width / 2, height / 2);
                break;
        }

        // --- Secondary steering (avoidance)
        const avoid = steerAvoidOthers(e, entities, 80);

        // --- Weighted blending
        const weights = {
            primary: 1.0,
            avoid: 2.0,
            wander: 0.3
        };

        const ax =
            primary.vx * weights.primary +
            avoid.vx * weights.avoid;

        const ay =
            primary.vy * weights.primary +
            avoid.vy * weights.avoid;

        // --- Apply acceleration
        e.vx += ax * dt * e.type.speed;
        e.vy += ay * dt * e.type.speed;

        // --- Clamp velocity
        const limited = limit(e.vx, e.vy, e.type.speed);
        e.vx = limited.vx;
        e.vy = limited.vy;

        // --- Move
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // --- Bounce off edges
        if (e.x < 40) { e.x = 40; e.vx *= -1; }
        if (e.x > width - 40) { e.x = width - 40; e.vx *= -1; }
        if (e.y < 40) { e.y = 40; e.vy *= -1; }
        if (e.y > height - 40) { e.y = height - 40; e.vy *= -1; }
    }
}

console.log("APEXSIM — Core online");
