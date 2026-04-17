// apexim.js — APEXSIM v1.2 (Entity Types + Shapes + Colors)

console.log("APEXSIM — Core initializing…");

let _running = false;
let _lastTime = 0;

const simState = {
    tick: 0,
    time: 0,
    entities: []
};

// ------------------------------------------------------------
// ENTITY DEFINITIONS
// ------------------------------------------------------------

const ENTITY_TYPES = {
    SCOUT: {
        color: "#00FFC8",
        size: 12,
        shape: "circle",
        speed: 80
    },
    TANK: {
        color: "#FF3B3B",
        size: 22,
        shape: "square",
        speed: 40
    },
    SUPPORT: {
        color: "#FFD93B",
        size: 16,
        shape: "diamond",
        speed: 55
    }
};

function createEntity(id, type, x, y, vx, vy) {
    return {
        id,
        type,
        x,
        y,
        vx,
        vy
    };
}

function initEntities() {
    simState.entities = [
        createEntity("scout‑1", ENTITY_TYPES.SCOUT, 200, 200, 1, 1),
        createEntity("tank‑1", ENTITY_TYPES.TANK, 600, 300, -1, 1),
        createEntity("support‑1", ENTITY_TYPES.SUPPORT, 400, 500, 1, -1)
    ];
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

    const delta = (timestamp - _lastTime) / 1000;
    _lastTime = timestamp;

    simState.tick++;
    simState.time += delta * 1000;

    updateEntities(delta);

    requestAnimationFrame(simLoop);
}

function updateEntities(dt) {
    const width = 1280;
    const height = 720;

    for (const e of simState.entities) {
        const speed = e.type.speed;

        e.x += e.vx * speed * dt;
        e.y += e.vy * speed * dt;

        // bounce
        if (e.x < 40 || e.x > width - 40) e.vx *= -1;
        if (e.y < 40 || e.y > height - 40) e.vy *= -1;
    }
}

console.log("APEXSIM — Core online");
