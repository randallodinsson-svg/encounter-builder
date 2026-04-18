// apexim.js — APEXSIM v7.2 Core Simulation + Replay Metadata + Camera Anchors
console.log("APEXSIM - Core initializing");

// ------------------------------------------------------------
// SIMULATION STATE
// ------------------------------------------------------------

const simState = {
    time: 0,
    dt: 0.016,

    // -------------------------------
    // CAMERA ANCHORS (v7.2)
    // -------------------------------
    cameraAnchors: {
        leader: { x: 640, y: 360 },
        squadCentroid: { x: 640, y: 360 },
        threatCenter: { x: 640, y: 360 },
        engagementHotspot: { x: 640, y: 360 }
    },

    // -------------------------------
    // DIRECTOR EVENTS (v7.2)
    // -------------------------------
    directorEvents: [],

    // -------------------------------
    // REPLAY METADATA (v7.2)
    // -------------------------------
    replay: {
        playing: false,
        time: 0,
        duration: 0,
        frames: [],
        eventMarkers: []
    },

    // -------------------------------
    // TACTICAL STATE
    // -------------------------------
    tactics: {
        state: "hold",
        threatCenter: { x: 640, y: 360 },
        threatMagnitude: 0
    },

    // -------------------------------
    // FORMATION STATE
    // -------------------------------
    formation: {
        mode: "tight",
        leaderId: null,
        count: 0
    },

    // -------------------------------
    // ENTITIES
    // -------------------------------
    entities: [],
    squads: [],
    enemies: [],

    // -------------------------------
    // COMMAND LAYER
    // -------------------------------
    command: {
        highLevelOrder: "defend"
    }
};

// ------------------------------------------------------------
// ENTITY TYPES
// ------------------------------------------------------------

const ENTITY_TYPES = {
    infantry: {
        size: 6,
        speed: 60,
        color: "#4DA3FF",
        role: "unit"
    },
    support: {
        size: 7,
        speed: 55,
        color: "#00FFC8",
        role: "support"
    },
    heavy: {
        size: 8,
        speed: 45,
        color: "#FF6B6B",
        role: "heavy"
    },
    scout: {
        size: 5,
        speed: 75,
        color: "#4DFFB8",
        role: "scout"
    }
};

// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

function initSimulation() {
    // Create two squads
    simState.squads = [
        { id: "alpha", label: "ALPHA", color: "#4DA3FF" },
        { id: "bravo", label: "BRAVO", color: "#FFB84D" }
    ];

    // Create entities
    const entities = [];
    let idCounter = 1;

    function spawnSquad(squadId, x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 40;
            entities.push({
                id: idCounter++,
                squadId,
                x: x + Math.cos(angle) * r,
                y: y + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
                type: ENTITY_TYPES.infantry
            });
        }
    }

    spawnSquad("alpha", 500, 360, 12);
    spawnSquad("bravo", 780, 360, 12);

    simState.entities = entities;
    simState.formation.leaderId = entities[0].id;
    simState.formation.count = entities.length;

    // Spawn enemies
    simState.enemies = [
        { x: 640, y: 200, facing: 0, threat: 1 },
        { x: 700, y: 240, facing: 0.5, threat: 0.8 },
        { x: 580, y: 240, facing: -0.5, threat: 0.8 }
    ];
}

initSimulation();

// ------------------------------------------------------------
// CAMERA ANCHOR UPDATES (v7.2)
// ------------------------------------------------------------

function updateCameraAnchors() {
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);

    if (leader) {
        simState.cameraAnchors.leader.x = leader.x;
        simState.cameraAnchors.leader.y = leader.y;
    }

    // Squad centroid
    let sx = 0, sy = 0;
    for (const e of entities) {
        sx += e.x;
        sy += e.y;
    }
    sx /= entities.length;
    sy /= entities.length;

    simState.cameraAnchors.squadCentroid.x = sx;
    simState.cameraAnchors.squadCentroid.y = sy;

    // Threat center
    simState.cameraAnchors.threatCenter.x = simState.tactics.threatCenter.x;
    simState.cameraAnchors.threatCenter.y = simState.tactics.threatCenter.y;

    // Engagement hotspot (midpoint between squads and enemies)
    const ex = simState.enemies.reduce((a, e) => a + e.x, 0) / simState.enemies.length;
    const ey = simState.enemies.reduce((a, e) => a + e.y, 0) / simState.enemies.length;

    simState.cameraAnchors.engagementHotspot.x = (sx + ex) / 2;
    simState.cameraAnchors.engagementHotspot.y = (sy + ey) / 2;
}

// ------------------------------------------------------------
// DIRECTOR EVENT TAGGING (v7.2)
// ------------------------------------------------------------

function tagDirectorEvent(type, data = {}) {
    simState.directorEvents.push({
        time: simState.time,
        type,
        ...data
    });
}

// ------------------------------------------------------------
// REPLAY SYSTEM (v7.2)
// ------------------------------------------------------------

function recordReplayFrame() {
    if (simState.replay.playing) return;

    simState.replay.frames.push({
        time: simState.time,
        entities: simState.entities.map(e => ({ ...e })),
        enemies: simState.enemies.map(e => ({ ...e })),
        tactics: { ...simState.tactics },
        formation: { ...simState.formation },
        command: { ...simState.command },
        cameraAnchors: JSON.parse(JSON.stringify(simState.cameraAnchors))
    });

    simState.replay.duration = simState.time;
}

export function startReplay() {
    simState.replay.playing = true;
    simState.replay.time = 0;
}

export function stopReplay() {
    simState.replay.playing = false;
}

export function scrubReplay(t) {
    simState.replay.time = Math.max(0, Math.min(simState.replay.duration, t));
}

export function getReplayState() {
    return simState.replay;
}

// ------------------------------------------------------------
// TACTICAL STATE
// ------------------------------------------------------------

export function setTacticalState(state) {
    simState.tactics.state = state;
    tagDirectorEvent("tacticalChange", { state });
}

export function getTacticalState() {
    return simState.tactics.state;
}

// ------------------------------------------------------------
// FORMATION
// ------------------------------------------------------------

export function setFormationMode(mode) {
    simState.formation.mode = mode;
    tagDirectorEvent("formationChange", { mode });
}

export function getFormationMode() {
    return simState.formation.mode;
}

export function getLeaderPosition() {
    const leader = simState.entities.find(e => e.id === simState.formation.leaderId);
    return leader ? { x: leader.x, y: leader.y } : { x: 0, y: 0 };
}

// ------------------------------------------------------------
// HIGH-LEVEL ORDERS
// ------------------------------------------------------------

export function setHighLevelOrder(order) {
    simState.command.highLevelOrder = order;
    tagDirectorEvent("orderChange", { order });
}

export function getCommandLayerState() {
    return simState.command;
}

// ------------------------------------------------------------
// SQUAD TARGETING
// ------------------------------------------------------------

export function setActiveSquadLeader(id) {
    simState.formation.leaderId = id;
}

export function setSquadTarget(squadId, x, y) {
    tagDirectorEvent("squadTarget", { squadId, x, y });
}

// ------------------------------------------------------------
// THREAT SYSTEM
// ------------------------------------------------------------

export function getThreatCenter() {
    return simState.tactics.threatCenter;
}

export function getThreatMagnitude() {
    return simState.tactics.threatMagnitude;
}

// ------------------------------------------------------------
// ENTITIES
// ------------------------------------------------------------

export function getEntities() {
    return simState.entities;
}

export function getSquads() {
    return simState.squads;
}

export function getEnemies() {
    return simState.enemies;
}

// ------------------------------------------------------------
// HEATMAP (CPU PATH)
// ------------------------------------------------------------

export function drawHeatmap(ctx, simState) {
    const tc = simState.tactics.threatCenter;
    const mag = simState.tactics.threatMagnitude;

    const grad = ctx.createRadialGradient(tc.x, tc.y, 20, tc.x, tc.y, 300);
    grad.addColorStop(0, "rgba(0,255,200,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// ------------------------------------------------------------
// SIMULATION UPDATE
// ------------------------------------------------------------

function updateSimulation(dt) {
    simState.time += dt;

    // Threat magnitude oscillation (placeholder)
    simState.tactics.threatMagnitude = 20 + Math.sin(simState.time * 0.5) * 10;

    // Update camera anchors
    updateCameraAnchors();

    // Record replay frame
    recordReplayFrame();
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------

function tick() {
    updateSimulation(simState.dt);
    requestAnimationFrame(tick);
}

tick();

console.log("APEXSIM - Core online");

// ------------------------------------------------------------
// EXPORT SIM STATE
// ------------------------------------------------------------

export function getSimState() {
    return simState;
}
