// apexim.js - APEXSIM v4.6 (Heatmap Enabled, Soft Gradient, Under Entities)

console.log("APEXSIM - Core initializing");

let _running = false;
let _lastTime = 0;

// Heatmap toggle flag
export let HEATMAP_ENABLED = false;
export function toggleHeatmap() {
    HEATMAP_ENABLED = !HEATMAP_ENABLED;
}

// Field dimensions
const FIELD_WIDTH = 1280;
const FIELD_HEIGHT = 720;

// Influence grid resolution
const GRID_COLS = 32;
const GRID_ROWS = 18;

// Simulation state container
const simState = {
    tick: 0,
    time: 0,
    entities: [],
    formation: {
        mode: "line",
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
        state: "hold",
        manualCommand: null,
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
        grid.push(new Array(cols).fill(0));
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
        role: "skirmisher"
    },
    TANK: {
        color: "#FF3B3B",
        size: 22,
        shape: "square",
        speed: 60,
        threat: 3.0,
        role: "frontline"
    },
    SUPPORT: {
        color: "#FFD93B",
        size: 16,
        shape: "diamond",
        speed: 90,
        threat: 1.5,
        role: "support"
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
    let ax = 0;
    let ay = 0;
    let count = 0;

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
// ROLE-BASED THREAT STEERING
// ------------------------------------------------------------

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
            delta = nVal - center;
        } else {
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
// FORMATION OFFSETS
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
            return {
                x: (index - 1) * spacing,
                y: Math.abs(index - 1) * spacing * 0.7
            };

        default:
            return { x: 0, y: 0 };
    }
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
// TACTICAL SYSTEM
// ------------------------------------------------------------

export function setTacticalCommand(command) {
    const valid = ["hold", "flank", "fallback", "regroup", "push", null];
    if (!valid.includes(command)) return;

    simState.tactics.manualCommand = command;

    if (command) {
        simState.tactics.state = command;
        simState.tactics.cooldown = 1.0;
        console.log("APEXSIM - Manual tactical command:", command);
    }
}

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

    const threatInfo = computeThreatVector(leader);
    tactics.threatDir = threatInfo.dir;
    tactics.threatMag = threatInfo.mag;
    tactics.threatCenter = threatInfo.center;

    if (tactics.cooldown > 0) {
        tactics.cooldown -= dt;
    }

    if (tactics.manualCommand) {
        tactics.state = tactics.manualCommand;
        return;
    }

    if (tactics.cooldown > 0) return;

    const threatMag = tactics.threatMag;
    const dir = tactics.threatDir;

    let maxDist = 0;
    for (const e of entities) {
        const d = Math.hypot(e.x - leader.x, e.y - leader.y);
        if (d > maxDist) maxDist = d;
    }

    const LOW_THREAT = 5;
    const HIGH_THREAT = 25;
    const SPREAD_THRESHOLD = 260;

    if (maxDist > SPREAD_THRESHOLD) {
        tactics.state = "regroup";
        tactics.cooldown = 1.0;
        return;
    }

    if (threatMag < LOW_THREAT || (dir.x === 0 && dir.y === 0)) {
        tactics.state = "hold";
        return;
    }

    const hasTank = entities.some(e => e.type.role === "frontline");

    if (threatMag > HIGH_THREAT) {
        tactics.state = hasTank ? "push" : "fallback";
        tactics.cooldown = 1.0;
        return;
    }

    tactics.state = "flank";
    tactics.cooldown = 1.0;
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

    console.log("APEXSIM - Simulation started");
}

export function stopAPEXSIM() {
    _running = false;
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

    updateEntities(dt);
    updateInfluence();
    updateTactics(dt);

    requestAnimationFrame(simLoop);
}

// ------------------------------------------------------------
// ENTITY UPDATE
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

        // PRIMARY BEHAVIOR
        let primary = { vx: 0, vy: 0 };

        if (e.behavior === "leader") {
            primary = steerWander(e);
        }

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

        // SECONDARY BEHAVIORS
        const avoid = steerAvoidOthers(e, entities, 80);
        const roleTactical = steerByRoleAndThreat(e, influence);

        const stateTactical = leader
            ? getTacticalStateVector(e, leader, tactics)
            : { vx: 0, vy: 0 };

        // WEIGHTS
        let roleWeight = 1.5;
        if (e.type.role === "support") roleWeight = 2.0;
        if (e.type.role === "frontline") roleWeight = 1.2;

        let stateWeight = 1.0;
        if (tactics.state === "flank") stateWeight = 1.6;
        if (tactics.state === "fallback") stateWeight = 1.8;
        if (tactics.state === "push") stateWeight = 1.8;
        if (tactics.state === "regroup") stateWeight = 2.0;

        // FINAL ACCELERATION
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

        // VELOCITY + LIMIT
        e.vx += ax * dt * e.type.speed;
        e.vy += ay * dt * e.type.speed;

        const limited = limit(e.vx, e.vy, e.type.speed);
        e.vx = limited.vx;
        e.vy = limited.vy;

        // POSITION UPDATE
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // WORLD BOUNDS
        if (e.x < 40) { e.x = 40; e.vx *= -1; }
        if (e.x > width - 40) { e.x = width - 40; e.vx *= -1; }
        if (e.y < 40) { e.y = 40; e.vy *= -1; }
        if (e.y > height - 40) { e.y = height - 40; e.vy *= -1; }
    }
}

// ------------------------------------------------------------
// TACTICAL STATE VECTOR
// ------------------------------------------------------------

function getTacticalStateVector(e, leader, tactics) {
    const state = tactics.state;
    const dir = tactics.threatDir;
    const mag = tactics.threatMag;

    if (state === "hold" || mag === 0) {
        return { vx: 0, vy: 0 };
    }

    let tx = dir.x;
    let ty = dir.y;

    const tmag = Math.hypot(tx, ty) || 1;
    tx /= tmag;
    ty /= tmag;

    const threatNorm = Math.max(0, Math.min(1, mag / 40));

    // FALLBACK
    if (state === "fallback") {
        return { vx: -tx, vy: -ty };
    }

    // PUSH
    if (state === "push") {
        return { vx: tx, vy: ty };
    }

    // REGROUP
    if (state === "regroup") {
        const dx = leader.x - e.x;
        const dy = leader.y - e.y;
        const dmag = Math.hypot(dx, dy) || 1;
        return { vx: dx / dmag, vy: dy / dmag };
    }

    // FLANK (ARC)
    if (state === "flank") {
        const perpLeft = { x: -ty, y: tx };
        const perpRight = { x: ty, y: -tx };

        let side = perpLeft;
        if (e.type.role === "support") side = perpRight;
        if (e.type.role === "frontline") side = perpLeft;

        const lateralWeight = 0.6 + 0.3 * (1 - threatNorm);
        const forwardWeight = 0.4 * threatNorm;

        let roleForwardBoost = 0;
        if (e.type.role === "frontline") roleForwardBoost = 0.2;
        if (e.type.role === "support") roleForwardBoost = -0.1;

        const fw = forwardWeight + roleForwardBoost;
        const lw = lateralWeight - roleForwardBoost * 0.5;

        const vx = side.x * lw + (-tx) * fw;
        const vy = side.y * lw + (-ty) * fw;

        const magArc = Math.hypot(vx, vy) || 1;
        return { vx: vx / magArc, vy: vy / magArc };
    }

    return { vx: 0, vy: 0 };
}

// ------------------------------------------------------------
// HEATMAP RENDERING (Soft Gradient, Under Entities)
// ------------------------------------------------------------

export function drawHeatmap(ctx, simState) {
    if (!HEATMAP_ENABLED) return;

    const inf = simState.influence;
    const grid = inf.threat;

    const cols = inf.cols;
    const rows = inf.rows;
    const cw = inf.cellWidth;
    const ch = inf.cellHeight;

    // Find max threat for normalization
    let maxThreat = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] > maxThreat) {
                maxThreat = grid[y][x];
            }
        }
    }

    if (maxThreat <= 0) return;

    // Draw each cell as a soft gradient rectangle
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {

            const v = grid[y][x];
            if (v <= 0) continue;

            const norm = Math.min(1, v / maxThreat);

            // Soft gradient color: Blue → Cyan → White
            const color = heatColorSoft(norm);

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.45 * norm; // softer at low threat
            ctx.fillRect(x * cw, y * ch, cw, ch);
        }
    }

    ctx.globalAlpha = 1.0;
}

// ------------------------------------------------------------
// HEATMAP COLOR CURVE (Soft Gradient)
// Blue → Cyan → White
// ------------------------------------------------------------

function heatColorSoft(t) {
    // Clamp
    t = Math.max(0, Math.min(1, t));

    // Gradient stops:
    // 0.0 = deep blue (#0033FF)
    // 0.5 = cyan (#00FFFF)
    // 1.0 = white (#FFFFFF)

    let r, g, b;

    if (t < 0.5) {
        // Blue → Cyan
        const k = t / 0.5;
        r = 0 * (1 - k) + 0 * k;
        g = 51 * (1 - k) + 255 * k;
        b = 255 * (1 - k) + 255 * k;
    } else {
        // Cyan → White
        const k = (t - 0.5) / 0.5;
        r = 0 * (1 - k) + 255 * k;
        g = 255 * (1 - k) + 255 * k;
        b = 255 * (1 - k) + 255 * k;
    }

    return `rgb(${r},${g},${b})`;
}

// ------------------------------------------------------------
// COLOR UTILITIES
// ------------------------------------------------------------

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));

    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return a;

    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bch = Math.round(ca.b + (cb.b - ca.b) * t);

    return `rgb(${r},${g},${bch})`;
}

// ------------------------------------------------------------
// TACTICAL STATE COLOR (HUD)
// ------------------------------------------------------------

function getStateColor(state) {
    switch (state) {
        case "hold": return "#E5F0FF";
        case "flank": return "#00FFC8";
        case "fallback": return "#FFC857";
        case "regroup": return "#4DA3FF";
        case "push": return "#FF3B3B";
        default: return "#E5F0FF";
    }
}

// ------------------------------------------------------------
// EXPORTS FOR RENDERER (HUD + Heatmap)
// ------------------------------------------------------------

export function getTacticalState() {
    return simState.tactics.state;
}

export function getThreatMagnitude() {
    return simState.tactics.threatMag;
}

export function getThreatDirection() {
 return simState.tactics.threatDir;
}

export function getThreatCenter() {
    return simState.tactics.threatCenter;
}

export function getLeaderPosition() {
    const leader = simState.entities.find(e => e.id === simState.formation.leaderId);
    return leader ? { x: leader.x, y: leader.y } : { x: 0, y: 0 };
}

export function getFormationMode() {
    return simState.formation.mode;
}

export function getEntities() {
    return simState.entities;
}

// ------------------------------------------------------------
// FINAL EXPORTS (Public API)
// ------------------------------------------------------------

export default {
    startAPEXSIM,
    stopAPEXSIM,
    getSimState,
    setTacticalCommand,
    toggleHeatmap,
    getInfluenceGrid,
    getGridConfig,
    getTacticalState,
    getThreatMagnitude,
    getThreatDirection,
    getThreatCenter,
    getLeaderPosition,
    getFormationMode,
    getEntities
};

console.log("APEXSIM - Core online");   
