// apexsim.js - APEXSIM v7.0 Tactical Core
console.log("APEXSIM - Core initializing");

// ------------------------------------------------------------
// CORE STATE
// ------------------------------------------------------------

const APEXSIM_TICK_RATE = 60;
const DT = 1 / APEXSIM_TICK_RATE;

let simState = {
    time: 0,
    entities: [],
    enemies: [],
    squads: [],
    formation: {
        leaderId: null,
        mode: "tight",
        count: 0
    },
    tactics: {
        state: "hold", // hold, flank, fallback, regroup, push
        threatCenter: { x: 640, y: 360 },
        threatMagnitude: 0
    },
    commandLayer: {
        highLevelOrder: "none", // defend, advance, sweep, secure
        lastOrderTime: 0
    },
    replay: {
        recording: true,
        playing: false,
        time: 0,
        duration: 0,
        events: []
    }
};

// ------------------------------------------------------------
// UTILS
// ------------------------------------------------------------

function randRange(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

// ------------------------------------------------------------
// ENTITY / SQUAD SETUP
// ------------------------------------------------------------

function createEntity(id, x, y, role, squadId) {
    return {
        id,
        x,
        y,
        vx: 0,
        vy: 0,
        type: {
            role,
            size: 10,
            shape: "circle",
            color:
                role === "support" ? "#00FFC8" :
                role === "heavy" ? "#FF6B6B" :
                role === "scout" ? "#4DA3FF" :
                "#E5F0FF"
        },
        squadId
    };
}

function createEnemy(id, x, y) {
    return {
        id,
        x,
        y,
        vx: 0,
        vy: 0,
        facing: randRange(0, Math.PI * 2),
        threat: randRange(0.5, 1.5),
        state: "patrol", // patrol, engage, retreat
        targetSquadId: null
    };
}

function createSquad(id, color, label, leaderId) {
    return {
        id,
        color,
        label,
        leaderId,
        members: [],
        state: "idle", // idle, moving, engaging, regrouping
        target: { x: 640, y: 360 }
    };
}

function initSim() {
    const squads = [];
    const entities = [];
    const enemies = [];

    const squadA = createSquad("alpha", "#4DA3FF", "ALPHA", "a1");
    const squadB = createSquad("bravo", "#00FFC8", "BRAVO", "b1");

    const roles = ["scout", "support", "heavy", "scout", "support"];

    let idCounter = 1;

    for (let i = 0; i < roles.length; i++) {
        const e = createEntity(
            "a" + idCounter,
            480 + randRange(-40, 40),
            360 + randRange(-40, 40),
            roles[i],
            squadA.id
        );
        entities.push(e);
        squadA.members.push(e.id);
        idCounter++;
    }

    idCounter = 1;
    for (let i = 0; i < roles.length; i++) {
        const e = createEntity(
            "b" + idCounter,
            800 + randRange(-40, 40),
            360 + randRange(-40, 40),
            roles[i],
            squadB.id
        );
        entities.push(e);
        squadB.members.push(e.id);
        idCounter++;
    }

    squadA.leaderId = squadA.members[0];
    squadB.leaderId = squadB.members[0];

    squads.push(squadA, squadB);

    for (let i = 0; i < 6; i++) {
        enemies.push(
            createEnemy(
                "e" + (i + 1),
                randRange(300, 1000),
                randRange(200, 520)
            )
        );
    }

    simState.entities = entities;
    simState.enemies = enemies;
    simState.squads = squads;

    simState.formation.leaderId = squadA.leaderId;
    simState.formation.mode = "tight";
    simState.formation.count = entities.length;

    simState.tactics.state = "hold";
    simState.tactics.threatCenter = { x: 640, y: 360 };
    simState.tactics.threatMagnitude = 0;

    simState.commandLayer.highLevelOrder = "none";
    simState.commandLayer.lastOrderTime = 0;

    simState.replay.recording = true;
    simState.replay.playing = false;
    simState.replay.time = 0;
    simState.replay.duration = 0;
    simState.replay.events = [];
}

initSim();

// ------------------------------------------------------------
// TACTICAL STATE ACCESSORS
// ------------------------------------------------------------

export function getSimState() {
    return simState;
}

export function getTacticalState() {
    return simState.tactics.state;
}

export function getFormationMode() {
    return simState.formation.mode;
}

export function getLeaderPosition() {
    const leader = simState.entities.find(e => e.id === simState.formation.leaderId);
    if (!leader) return { x: 640, y: 360 };
    return { x: leader.x, y: leader.y };
}

export function getThreatCenter() {
    return simState.tactics.threatCenter;
}

export function getThreatMagnitude() {
    return simState.tactics.threatMagnitude;
}

export function getEntities() {
    return simState.entities;
}

export function getSquads() {
    return simState.squads;
}

export function getEnemies() {
    return simState.enemies;
}

export function getCommandLayerState() {
    return simState.commandLayer;
}

export function getReplayState() {
    return simState.replay;
}

// ------------------------------------------------------------
// HEATMAP DRAW (STUB FOR RENDERER)
// ------------------------------------------------------------

export function drawHeatmap(ctx, state) {
    // Simple subtle background gradient based on threat magnitude
    const mag = clamp(state.tactics.threatMagnitude / 50, 0, 1);
    const g = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    g.addColorStop(0, `rgba(10, 20, 40, 1)`);
    g.addColorStop(1, `rgba(${20 + 80 * mag}, ${30}, ${60}, 1)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// ------------------------------------------------------------
// COMMAND LAYER INPUT (FROM UI)
// ------------------------------------------------------------

export function setTacticalState(state) {
    simState.tactics.state = state;
}

export function setFormationMode(mode) {
    simState.formation.mode = mode;
}

export function setHighLevelOrder(order) {
    simState.commandLayer.highLevelOrder = order;
    simState.commandLayer.lastOrderTime = simState.time;
}

export function setActiveSquadLeader(squadId) {
    const squad = simState.squads.find(s => s.id === squadId);
    if (!squad) return;
    simState.formation.leaderId = squad.leaderId;
}

export function setSquadTarget(squadId, x, y) {
    const squad = simState.squads.find(s => s.id === squadId);
    if (!squad) return;
    squad.target.x = x;
    squad.target.y = y;
}

// Replay controls
export function startReplay() {
    simState.replay.playing = true;
    simState.replay.recording = false;
    simState.replay.time = 0;
}

export function stopReplay() {
    simState.replay.playing = false;
    simState.replay.recording = true;
}

export function scrubReplay(t) {
    simState.replay.time = clamp(t, 0, simState.replay.duration);
}

// ------------------------------------------------------------
// REPLAY RECORDING
// ------------------------------------------------------------

function recordFrame() {
    if (!simState.replay.recording) return;

    simState.replay.events.push({
        time: simState.time,
        entities: simState.entities.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y
        })),
        enemies: simState.enemies.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y
        })),
        tactics: {
            state: simState.tactics.state,
            threatCenter: { ...simState.tactics.threatCenter },
            threatMagnitude: simState.tactics.threatMagnitude
        }
    });

    simState.replay.duration = simState.time;
}

// ------------------------------------------------------------
// ENEMY AI BEHAVIOR
// ------------------------------------------------------------

function updateEnemyAI(dt) {
    const squads = simState.squads;
    const enemies = simState.enemies;

    for (const enemy of enemies) {
        let closestSquad = null;
        let closestDist = Infinity;

        for (const squad of squads) {
            const leader = simState.entities.find(e => e.id === squad.leaderId);
            if (!leader) continue;
            const d = dist(enemy, leader);
            if (d < closestDist) {
                closestDist = d;
                closestSquad = squad;
            }
        }

        if (closestSquad) {
            enemy.targetSquadId = closestSquad.id;

            if (closestDist < 180) {
                enemy.state = "engage";
            } else if (closestDist > 400) {
                enemy.state = "patrol";
            } else if (closestDist < 120) {
                enemy.state = "retreat";
            }
        }

        let speed = 40;
        if (enemy.state === "engage") speed = 70;
        if (enemy.state === "retreat") speed = 60;

        let tx = enemy.x + Math.cos(enemy.facing) * 10;
        let ty = enemy.y + Math.sin(enemy.facing) * 10;

        if (closestSquad) {
            const leader = simState.entities.find(e => e.id === closestSquad.leaderId);
            if (leader) {
                if (enemy.state === "engage") {
                    tx = leader.x;
                    ty = leader.y;
                } else if (enemy.state === "retreat") {
                    const dx = enemy.x - leader.x;
                    const dy = enemy.y - leader.y;
                    tx = enemy.x + dx;
                    ty = enemy.y + dy;
                }
            }
        }

        const dx = tx - enemy.x;
        const dy = ty - enemy.y;
        const d = Math.hypot(dx, dy) || 1;

        const nx = dx / d;
        const ny = dy / d;

        enemy.vx = nx * speed;
        enemy.vy = ny * speed;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        enemy.facing = Math.atan2(enemy.vy, enemy.vx);
    }
}

// ------------------------------------------------------------
// SQUAD / FORMATION LOGIC
// ------------------------------------------------------------

function updateSquads(dt) {
    const squads = simState.squads;
    const entities = simState.entities;
    const tactics = simState.tactics;
    const cmd = simState.commandLayer;

    for (const squad of squads) {
        let desiredState = squad.state;

        if (cmd.highLevelOrder === "defend") {
            desiredState = "idle";
        } else if (cmd.highLevelOrder === "advance") {
            desiredState = "moving";
        } else if (cmd.highLevelOrder === "sweep") {
            desiredState = "moving";
        } else if (cmd.highLevelOrder === "secure") {
            desiredState = "engaging";
        }

        if (tactics.state === "fallback") {
            desiredState = "regrouping";
        } else if (tactics.state === "regroup") {
            desiredState = "regrouping";
        } else if (tactics.state === "push") {
            desiredState = "engaging";
        }

        squad.state = desiredState;

        const leader = entities.find(e => e.id === squad.leaderId);
        if (!leader) continue;

        let targetX = squad.target.x;
        let targetY = squad.target.y;

        if (cmd.highLevelOrder === "sweep") {
            targetX += Math.sin(simState.time * 0.1) * 80;
        }

        const dx = targetX - leader.x;
        const dy = targetY - leader.y;
        const d = Math.hypot(dx, dy) || 1;

        let leaderSpeed = 0;
        if (squad.state === "moving") leaderSpeed = 80;
        if (squad.state === "engaging") leaderSpeed = 90;
        if (squad.state === "regrouping") leaderSpeed = 70;

        const lnx = dx / d;
        const lny = dy / d;

        leader.vx = lnx * leaderSpeed;
        leader.vy = lny * leaderSpeed;

        leader.x += leader.vx * dt;
        leader.y += leader.vy * dt;

        const mode = simState.formation.mode;
        let radius = 80;
        if (mode === "tight") radius = 50;
        if (mode === "spread") radius = 120;

        const members = squad.members.map(id => entities.find(e => e.id === id)).filter(Boolean);

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            if (m.id === leader.id) continue;

            const angle = (i / members.length) * Math.PI * 2;
            const gx = leader.x + Math.cos(angle) * radius;
            const gy = leader.y + Math.sin(angle) * radius;

            const mdx = gx - m.x;
            const mdy = gy - m.y;
            const md = Math.hypot(mdx, mdy) || 1;

            const mSpeed = 70;
            const mnx = mdx / md;
            const mny = mdy / md;

            m.vx = mnx * mSpeed;
            m.vy = mny * mSpeed;

            m.x += m.vx * dt;
            m.y += m.vy * dt;
        }
    }
}

// ------------------------------------------------------------
// THREAT COMPUTATION
// ------------------------------------------------------------

function updateThreat() {
    const enemies = simState.enemies;
    const squads = simState.squads;

    if (!enemies.length || !squads.length) {
        simState.tactics.threatCenter = { x: 640, y: 360 };
        simState.tactics.threatMagnitude = 0;
        return;
    }

    let sumX = 0;
    let sumY = 0;
    let sumW = 0;

    for (const enemy of enemies) {
        let minDist = Infinity;
        for (const squad of squads) {
            const leader = simState.entities.find(e => e.id === squad.leaderId);
            if (!leader) continue;
            const d = dist(enemy, leader);
            if (d < minDist) minDist = d;
        }

        const w = clamp(1 / (minDist / 200 + 0.1), 0.1, 5) * enemy.threat;
        sumX += enemy.x * w;
        sumY += enemy.y * w;
        sumW += w;
    }

    if (sumW <= 0) {
        simState.tactics.threatCenter = { x: 640, y: 360 };
        simState.tactics.threatMagnitude = 0;
        return;
    }

    simState.tactics.threatCenter = {
        x: sumX / sumW,
        y: sumY / sumW
    };

    simState.tactics.threatMagnitude = clamp(sumW * 5, 0, 60);
}

// ------------------------------------------------------------
// MAIN UPDATE LOOP
// ------------------------------------------------------------

function updateSim(dt) {
    if (simState.replay.playing) {
        // Simple replay time advance
        simState.replay.time += dt;
        if (simState.replay.time > simState.replay.duration) {
            simState.replay.time = simState.replay.duration;
            simState.replay.playing = false;
            simState.replay.recording = true;
        }
        return;
    }

    simState.time += dt;

    updateEnemyAI(dt);
    updateSquads(dt);
    updateThreat();
    recordFrame();
}

setInterval(() => {
    updateSim(DT);
}, 1000 / APEXSIM_TICK_RATE);

console.log("APEXSIM - Core online");
