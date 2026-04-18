// apexim.js — APEXSIM v7.2 Core Simulation + Replay Metadata + Camera Anchors + Tactical Movement
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

    // Engagement hotspot
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
// TACTICAL MOVEMENT (v7.2)
// ------------------------------------------------------------

function updateTacticalMovement(dt) {
    const entities = simState.entities;
    const enemies = simState.enemies;
    const tactics = simState.tactics;
    const formation = simState.formation;

    const leader = entities.find(e => e.id === formation.leaderId);
    if (!leader) return;

    // --- Leader behavior based on tactical state ---
    let leaderTargetX = leader.x;
    let leaderTargetY = leader.y;

    const baseAdvance = 40;
    const baseLateral = 60;

    if (tactics.state === "hold") {
        // Minimal movement
    } else if (tactics.state === "push") {
        const tc = tactics.threatCenter;
        const dx = tc.x - leader.x;
        const dy = tc.y - leader.y;
        const d = Math.hypot(dx, dy) || 1;
        leaderTargetX += (dx / d) * baseAdvance;
        leaderTargetY += (dy / d) * baseAdvance;
    } else if (tactics.state === "fallback") {
        const tc = tactics.threatCenter;
        const dx = leader.x - tc.x;
        const dy = leader.y - tc.y;
        const d = Math.hypot(dx, dy) || 1;
        leaderTargetX += (dx / d) * baseAdvance;
        leaderTargetY += (dy / d) * baseAdvance;
    } else if (tactics.state === "flank") {
        const tc = tactics.threatCenter;
        const dx = tc.x - leader.x;
        const dy = tc.y - leader.y;
        const d = Math.hypot(dx, dy) || 1;
        const nx = dx / d;
        const ny = dy / d;
        const px = -ny;
        const py = nx;
        leaderTargetX += px * baseLateral;
        leaderTargetY += py * baseLateral;
    } else if (tactics.state === "regroup") {
        const cx = simState.cameraAnchors.squadCentroid.x;
        const cy = simState.cameraAnchors.squadCentroid.y;
        const dx = cx - leader.x;
        const dy = cy - leader.y;
        const d = Math.hypot(dx, dy) || 1;
        leaderTargetX += (dx / d) * baseAdvance;
        leaderTargetY += (dy / d) * baseAdvance;
    }

    // Smooth leader toward target
    const leaderLerp = 2.0 * dt;
    leader.x += (leaderTargetX - leader.x) * leaderLerp;
    leader.y += (leaderTargetY - leader.y) * leaderLerp;

    // --- Formation followers ---
    const count = entities.length;
    const mode = formation.mode;

    for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (e.id === leader.id) continue;

        let offsetX = 0;
        let offsetY = 0;

        if (mode === "tight") {
            const angle = (i / count) * Math.PI * 2;
            const r = 60;
            offsetX = Math.cos(angle) * r;
            offsetY = Math.sin(angle) * r;
        } else if (mode === "spread") {
            const angle = (i / count) * Math.PI * 2;
            const r = 110;
            offsetX = Math.cos(angle) * r;
            offsetY = Math.sin(angle) * r;
        } else if (mode === "line") {
            const spacing = 26;
            const idx = i - count / 2;
            offsetX = idx * spacing;
            offsetY = 0;
        } else if (mode === "wedge") {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const spacingX = 26;
            const spacingY = 26;
            offsetX = (col - 1.5) * spacingX * (row + 1);
            offsetY = row * spacingY;
        }

        const targetX = leader.x + offsetX;
        const targetY = leader.y + offsetY;

        const followLerp = 3.0 * dt;
        e.x += (targetX - e.x) * followLerp;
        e.y += (targetY - e.y) * followLerp;
    }

    // --- Enemy drift toward hotspot ---
    const hotspot = simState.cameraAnchors.engagementHotspot;
    for (const enemy of enemies) {
        const dx = hotspot.x - enemy.x;
        const dy = hotspot.y - enemy.y;
        const d = Math.hypot(dx, dy) || 1;
        const speed = 20;
        enemy.x += (dx / d) * speed * dt;
        enemy.y += (dy / d) * speed * dt;
    }

    // Update threat center
    if (enemies.length > 0) {
        const ex = enemies.reduce((a, e) => a + e.x, 0) / enemies.length;
        const ey = enemies.reduce((a, e) => a + e.y, 0) / enemies.length;
        simState.tactics.threatCenter.x = (leader.x + ex) / 2;
        simState.tactics.threatCenter.y = (leader.y + ey) / 2;
    }
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

    // Tactical movement (v7.2)
    updateTacticalMovement(dt);

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
