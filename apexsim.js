// apexim.js — Minimal APEXSIM Core
// ------------------------------------------------------------
// Provides a simple simulation loop and exposes hooks for the
// renderer. This version is intentionally minimal so it cannot
// break the engine during reintegration.
// ------------------------------------------------------------

console.log("APEXSIM — Core initializing…");

let _running = false;
let _lastTime = 0;

const simState = {
    tick: 0,
    time: 0,
    entities: []
};

export function startAPEXSIM() {
    if (_running) return;
    _running = true;
    _lastTime = performance.now();
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

    const delta = timestamp - _lastTime;
    _lastTime = timestamp;

    simState.tick++;
    simState.time += delta;

    // Example: simple oscillating value
    simState.osc = Math.sin(simState.time * 0.002);

    requestAnimationFrame(simLoop);
}

console.log("APEXSIM — Core online");
