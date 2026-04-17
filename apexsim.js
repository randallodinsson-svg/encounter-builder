// apexim.js — APEXSIM v4.5
// Formation + Influence Maps + Role-Based Tactical AI + Hybrid Tactical Maneuvers (Dynamic Arc Flank)

console.log("APEXSIM — Core initializing…");

let _running = false;
let _lastTime = 0;

const FIELD_WIDTH = 1280;
const FIELD_HEIGHT = 720;

const GRID_COLS = 32;
const GRID_ROWS = 18;

const simState = {
    tick: 0,
    time: 0,
    entities: [],
    formation: {
        mode: "line",       // line | wedge | circle | v
        leaderId: "scout-1",
        spacing: 80,
        switchCooldown: 0
    },
    influence: {
        cols: GRID_COLS,
        rows: GRID_ROWS,
        cellWidth: FIELD_WIDTH / GRID_COLS,
        cellHeight: FIELD_HEIGHT / GRID_ROWS,
        threat: createGrid(GRID_COLS, GRID_ROWS)
    },
    tactics: {
        state: "hold",          // hold | flank | fallback | regroup | push
        manualCommand: null,    // same values as state or null
        cooldown: 0,
        threatDir: { x: 0, y: 0 },
        threatMag: 0,
        threatCenter: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 }
    }
};

// ------------------------------------------------------------
// GRID HELPERS
// ------------------------------------------------------------

function createGrid(cols, rows) {
    const grid = [];
    for (let y = 0; y < rows; y++) {
        const row = new Array(cols).fill(0);
        grid.push(row);
    }
    return grid;
}

function clearGrid(grid) {
    for (let y = 0; y < grid.length; y++) {
        grid[y].fill(0);
    }
}

// ------------------------------------------------------------
// ENTITY TYPES
// ------------------------------------------------------------

const ENTITY_TYPES = {
    SCOUT: {
        color: "#00FFC8",
        size: 12,
        shape: "circle",
        speed: 140,
        threat: 1.0,
        role: "skirmisher" // avoids threat
    },
    TANK: {
        color: "#FF3B3B",
        size: 22,
        shape: "square",
        speed: 60,
        threat: 3.0,
        role: "frontline" // seeks threat
    },
    SUPPORT: {
        color: "#FFD93B",
        size: 16,
        shape: "diamond",
        speed: 90,
        threat: 1.5,
        role: "support" // strongly avoids threat
    }
};

// ------------------------------------------------------------
// ENTITY CREATION
// ------------------------------------------------------------

function createEntity(id, type, x, y, behavior = "formation") {
    return {
        id,
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        behavior,
        wanderAngle: Math.random() * Math.PI * 2,
        slotIndex: 0
    };
}

function initEntities() {
    simState.entities = [
        createEntity("scout-1", ENTITY_TYPES.SCOUT, 400, 300, "leader"),
        createEntity("tank-1", ENTITY_TYPES.TANK, 300, 300, "formation"),
        createEntity("support-1", ENTITY_TYPES.SUPPORT, 500, 300, "formation")
    ];

    simState.entities.forEach((e, i) => {
        e.slotIndex = i;
    });
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

function steerWander(e) {
    e.wanderAngle += (Math.random() - 0.5) * 0.4;
    return {
        vx: Math.cos(e.wanderAngle),
        vy: Math.sin(e.wanderAngle)
    };
}

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

// role-based influence steering: SCOUT/SUPPORT move toward safer cells, TANK toward higher threat
function steerByRoleAndThreat(e, influence) {
    const { cellWidth, cellHeight, cols, rows, threat } = influence;

    const cx = Math.floor(e.x / cellWidth);
    const cy = Math.floor(e.y / cellHeight);

    if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) {
        return { vx: 0, vy: 0 };
    }

    const center = threat[cy][cx];

    let gx = 0;
    let gy = 0;
    let samples = 0;

    const offsets = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];

    const role = e.type.role;

    for (const o of offsets) {
        const nx = cx + o.dx;
        const ny = cy + o.dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

        const nVal = threat[ny][nx];

        let delta;
        if (role === "frontline") {
            // TANK: move toward higher threat
            delta = nVal - center;
        } else {
            // SCOUT / SUPPORT: move toward lower threat
            delta = center - nVal;
        }

        gx += o.dx * delta;
        gy += o.dy * delta;
        samples++;
    }

    if (samples === 0) return { vx: 0, vy: 0 };

    const mag = Math.hypot(gx, gy) || 1;
    return { vx: gx / mag, vy: gy / mag };
}

// ------------------------------------------------------------
// FORMATION SLOT CALCULATION
// ------------------------------------------------------------

function getFormationOffset(mode, index, spacing) {
    switch (mode) {
        case "line":
            return { x: (index - 1) * spacing, y: 0 };

        case "wedge":
            return { x: (index - 1) * spacing, y: Math.abs(index - 1) * spacing };

        case "circle": {
            const angle = index * (Math.PI * 2 / 3);
            return {
                x: Math.cos(angle) * spacing,
                y: Math.sin(angle) * spacing
            };
        }

        case "v":
            return { x: (index - 1) * spacing, y: Math.abs(index - 1) * spacing * 0.7 };

        default:
            return { x: 0, y: 0 };
    }
}

// ------------------------------------------------------------
// FORMATION SWITCHING
// ------------------------------------------------------------

function cycleFormationMode() {
    const modes = ["line", "wedge", "circle", "v"];
    const f = simState.formation;
    const currentIndex = modes.indexOf(f.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    f.mode = modes[nextIndex];
    f.switchCooldown = 1.0;
    console.log("APEXSIM — Formation switched to:", f.mode);
}

// ------------------------------------------------------------
// INFLUENCE MAP UPDATE
// ------------------------------------------------------------

function updateInfluence() {
    const inf = simState.influence;
    const grid = inf.threat;

    clearGrid(grid);

    for (const e of simState.entities) {
        const baseThreat = e.type.threat;

        const cx = Math.floor(e.x / inf.cellWidth);
        const cy = Math.floor(e.y / inf.cellHeight);

        const radiusCells = 3;

        for (let gy = cy - radiusCells; gy <= cy + radiusCells; gy++) {
            if (gy < 0 || gy >= inf.rows) continue;
            for (let gx = cx - radiusCells; gx <= cx + radiusCells; gx++) {
                if (gx < 0 || gx >= inf.cols) continue;

                const cellCenterX = (gx + 0.5) * inf.cellWidth;
                const cellCenterY = (gy + 0.5) * inf.cellHeight;

                const dx = cellCenterX - e.x;
                const dy = cellCenterY - e.y;
                const dist = Math.hypot(dx, dy);

                const maxDist = radiusCells * Math.max(inf.cellWidth, inf.cellHeight);
                const falloff = Math.max(0, 1 - dist / maxDist);

                grid[gy][gx] += baseThreat * falloff;
            }
        }
    }
}

// ------------------------------------------------------------
// TACTICAL SYSTEM — HYBRID CONTROL + DYNAMIC ARC FLANK
// ------------------------------------------------------------

// external/manual command API (for future UI / scripting)
export function setTacticalCommand(command) {
    const valid = ["hold", "flank", "fallback", "regroup", "push", null];
    if (!valid.includes(command)) return;
    simState.tactics.manualCommand = command;
    if (command) {
        simState.tactics.state = command;
        simState.tactics.cooldown = 1.0;
        console.log("APEXSIM — Manual tactical command:", command);
    }
}

// compute threat vector relative to leader using influence grid
function computeThreatVector(leader) {
    const inf = simState.influence;
    const grid = inf.threat;

    let sumX = 0;
    let sumY = 0;
    let totalThreat = 0;

    for (let y = 0; y < inf.rows; y++) {
        for (let x = 0; x < inf.cols; x++) {
            const v = grid[y][x];
            if (v <= 0) continue;

            const cx = (x + 0.5) * inf.cellWidth;
            const cy = (y + 0.5) * inf.cellHeight;

            const dx = cx - leader.x;
            const dy = cy - leader.y;

            sumX += dx * v;
            sumY += dy * v;
            totalThreat += v;
        }
    }

    if (totalThreat <= 0) {
        return {
            dir: { x: 0, y: 0 },
            mag: 0,
            center: { x: leader.x, y: leader.y }
        };
    }

    const avgX = leader.x + sumX / totalThreat;
    const avgY = leader.y + sumY / totalThreat;

    const vx = avgX - leader.x;
    const vy = avgY - leader.y;
    const mag = Math.hypot(vx, vy) || 1;

    return {
        dir: { x: vx / mag, y: vy / mag },
        mag: totalThreat,
        center: { x: avgX, y: avgY }
    };
}

function updateTactics(dt) {
    const tactics = simState.tactics;
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader) return;

    // update threat vector
    const threatInfo = computeThreatVector(leader);
    tactics.threatDir = threatInfo.dir;
    tactics.threatMag = threatInfo.mag;
    tactics.threatCenter = threatInfo.center;

    if (tactics.cooldown > 0) {
        tactics.cooldown -= dt;
    }

    // manual command has priority
    if (tactics.manualCommand) {
        tactics.state = tactics.manualCommand;
        return;
    }

    // automatic logic (only when no manual command)
    if (tactics.cooldown > 0) return;

    const threatMag = tactics.threatMag;
    const dir = tactics.threatDir;

    // compute formation spread (for regroup)
    let maxDist = 0;
    for (const e of entities) {
        const d = Math.hypot(e.x - leader.x, e.y - leader.y);
        if (d > maxDist) maxDist = d;
    }

    // thresholds (tunable)
    const LOW_THREAT = 5;
    const HIGH_THREAT = 25;
    const SPREAD_THRESHOLD = 260;

    // REGROUP if squad is too spread
    if (maxDist > SPREAD_THRESHOLD) {
        tactics.state = "regroup";
        tactics.cooldown = 1.0;
        return;
    }

    // no significant threat → HOLD
    if (threatMag < LOW_THREAT || (dir.x === 0 && dir.y === 0)) {
        tactics.state = "hold";
        return;
    }

    // high threat → FALLBACK or PUSH depending on roles
    const hasTank = entities.some(e => e.type.role === "frontline");
    if (threatMag > HIGH_THREAT) {
        if (hasTank) {
            tactics.state = "push";
        } else {
            tactics.state = "fallback";
        }
        tactics.cooldown = 1.0;
        return;
    }

    // medium threat → FLANK (dynamic arc)
    tactics.state = "flank";
    tactics.cooldown = 1.0;
}

// tactical state vector (dynamic arc flank, fallback, regroup, push, hold)
function getTacticalStateVector(e, leader, tactics) {
    const state = tactics.state;
    const dir = tactics.threatDir;
    const mag = tactics.threatMag;

    if (state === "hold" || mag === 0) {
        return { vx: 0, vy: 0 };
    }

    // normalize threat direction
    let tx = dir.x;
    let ty = dir.y;
    const tmag = Math.hypot(tx, ty) || 1;
    tx /= tmag;
    ty /= tmag;

    // dynamic scaling based on threat magnitude
    const threatNorm = Math.max(0, Math.min(1, mag / 40)); // clamp 0..1

    if (state === "fallback") {
        // move opposite threat direction
        return { vx: -tx, vy: -ty };
    }

    if (state === "push") {
        // move into threat
        return { vx: tx, vy: ty };
    }

    if (state === "regroup") {
        // move toward leader
        const dx = leader.x - e.x;
        const dy = leader.y - e.y;
        const dmag = Math.hypot(dx, dy) || 1;
        return { vx: dx / dmag, vy: dy / dmag };
    }

    if (state === "flank") {
        // dynamic arc flank:
        // base on perpendicular to threat direction, blended with slight forward/back
        // choose side based on role to create organic asymmetry
        const perpLeft = { x: -ty, y: tx };
        const perpRight = { x: ty, y: -tx };

        let side = perpLeft;
        if (e.type.role === "support") side = perpRight; // support tends to opposite side
        if (e.type.role === "frontline") side = perpLeft; // tank leads main flank

        // dynamic blend: more lateral at medium threat, more forward/back at high threat
        const lateralWeight = 0.6 + 0.3 * (1 - threatNorm); // more lateral when threat lower
        const forwardWeight = 0.4 * threatNorm;             // more forward when threat higher

        // frontline leans more forward, support more lateral
        let roleForwardBoost = 0;
        if (e.type.role === "frontline") roleForwardBoost = 0.2;
        if (e.type.role === "support") roleForwardBoost = -0.1;

        const fw = forwardWeight + roleForwardBoost;
        const lw = lateralWeight - roleForwardBoost * 0.5;

        const vx = side.x * lw + (-tx) * fw; // arc around threat center while slightly advancing/retreating
        const vy = side.y * lw + (-ty) * fw;

        const magArc = Math.hypot(vx, vy) || 1;
        return { vx: vx / magArc, vy: vy / magArc };
    }

    return { vx: 0, vy: 0 };
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

    if (simState.formation.switchCooldown > 0) {
        simState.formation.switchCooldown -= dt;
    }

    // keep formation switching demo
    if (simState.tick % 300 === 0 && simState.formation.switchCooldown <= 0) {
        cycleFormationMode();
    }

    updateEntities(dt);
    updateInfluence();
    updateTactics(dt);

    requestAnimationFrame(simLoop);
}

// ------------------------------------------------------------
// ENTITY UPDATE — Formation + Role-Based Tactical AI + Maneuvers
// ------------------------------------------------------------

function updateEntities(dt) {
    const width = FIELD_WIDTH;
    const height = FIELD_HEIGHT;
    const entities = simState.entities;
    const formation = simState.formation;
    const influence = simState.influence;
    const tactics = simState.tactics;

    const leader = entities.find(e => e.id === formation.leaderId);

    for (const e of entities) {
        let primary = { vx: 0, vy: 0 };

        // leader behavior
        if (e.behavior === "leader") {
            primary = steerWander(e);
        }

        // formation followers
        if (e.behavior === "formation" && leader) {
            const offset = getFormationOffset(
                formation.mode,
                e.slotIndex,
                formation.spacing
            );

            const targetX = leader.x + offset.x;
            const targetY = leader.y + offset.y;

            primary = steerSeek(e, targetX, targetY);
        }

        const avoid = steerAvoidOthers(e, entities, 80);
        const roleTactical = steerByRoleAndThreat(e, influence);
        const stateTactical = leader
            ? getTacticalStateVector(e, leader, tactics)
            : { vx: 0, vy: 0 };

        // weights
        let roleWeight = 1.5;
        if (e.type.role === "support") roleWeight = 2.0;
        if (e.type.role === "frontline") roleWeight = 1.2;

        let stateWeight = 1.0;
        if (tactics.state === "flank") stateWeight = 1.6;
        if (tactics.state === "fallback") stateWeight = 1.8;
        if (tactics.state === "push") stateWeight = 1.8;
        if (tactics.state === "regroup") stateWeight = 2.0;

        const ax =
            primary.vx * 1.0 +
            avoid.vx * 2.0 +
            roleTactical.vx * roleWeight +
            stateTactical.vx * stateWeight;

        const ay =
            primary.vy * 1.0 +
            avoid.vy * 2.0 +
            roleTactical.vy * roleWeight +
            stateTactical.vy * stateWeight;

        e.vx += ax * dt * e.type.speed;
        e.vy += ay * dt * e.type.speed;

        const limited = limit(e.vx, e.vy, e.type.speed);
        e.vx = limited.vx;
        e.vy = limited.vy;

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (e.x < 40) { e.x = 40; e.vx *= -1; }
        if (e.x > width - 40) { e.x = width - 40; e.vx *= -1; }
        if (e.y < 40) { e.y = 40; e.vy *= -1; }
        if (e.y > height - 40) { e.y = height - 40; e.vy *= -1; }
    }
}

console.log("APEXSIM — Core online");
