// ------------------------------------------------------------
// apexsim.js — Core sim state + update
// ------------------------------------------------------------

import { applyFormations } from "./formation-logic.js";

const simState = {
    time: 0,
    tick: 0,
    entities: []
};

// ------------------------------------------------------------
// Accessors
// ------------------------------------------------------------
export function getSimState() {
    return simState;
}

// ------------------------------------------------------------
// Init / Reset
// ------------------------------------------------------------
export function initSim() {
    simState.time = 0;
    simState.tick = 0;

    simState.entities = [];

    // Leader in the center
    simState.entities.push({
        id: 1,
        role: "leader",
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 12,
        color: "#4FC3F7"
    });

    // Four followers to demonstrate formation
    for (let i = 0; i < 4; i++) {
        simState.entities.push({
            id: 2 + i,
            role: "follower",
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120,
            vx: 0,
            vy: 0,
            radius: 10,
            color: "#81C784"
        });
    }
}

// Call once at startup
initSim();

// ------------------------------------------------------------
// Movement helper — move toward targetX / targetY
// ------------------------------------------------------------
function moveTowardTargets(entities, dt) {
    const speed = 80; // units per second

    for (const e of entities) {
        if (e.targetX === undefined || e.targetY === undefined) continue;

        const dx = e.targetX - e.x;
        const dy = e.targetY - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) continue;

        const step = Math.min(speed * dt, dist);
        const nx = dx / dist;
        const ny = dy / dist;

        e.x += nx * step;
        e.y += ny * step;
    }
}

// ------------------------------------------------------------
// Main sim update
// ------------------------------------------------------------
export function updateSim(dt) {
    simState.time += dt;
    simState.tick++;

    // 1) Compute formation targets
    applyFormations(simState, dt);

    // 2) Move entities toward their targets
    moveTowardTargets(simState.entities, dt);
}
