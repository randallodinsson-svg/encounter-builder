// apexim.js — APEXSIM v1.1 (Entities + Movement)

console.log("APEXSIM — Core initializing…");

let _running = false;
let _lastTime = 0;

const simState = {
    tick: 0,
    time: 0,
    entities: []
};

function createEntity(id, x, y, vx, vy) {
    return { id, x, y, vx, vy };
}

function initEntities() {
    simState.entities = [
        createEntity("alpha", 200, 200, 40, 20),
        createEntity("beta", 600, 300, -30, 25),
        createEntity("gamma", 400, 500, 10, -35)
    ];
}

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

    const delta = (timestamp - _lastTime) / 1000; // seconds
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
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // simple bounce on edges
        if (e.x < 40 || e.x > width - 40) e.vx *= -1;
        if (e.y < 40 || e.y > height - 40) e.vy *= -1;
    }
}

console.log("APEXSIM — Core online");
