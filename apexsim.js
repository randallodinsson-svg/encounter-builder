// apexim.js — APEXSIM v4.0 (Formation + Influence Maps + Tactical AI)

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
        leaderId: "scout‑1",
        spacing: 80,
        switchCooldown: 0
    },
    influence: {
        cols: GRID_COLS,
        rows: GRID_ROWS,
        cellWidth: FIELD_WIDTH / GRID_COLS,
        cellHeight: FIELD_HEIGHT / GRID_ROWS,
        threat: createGrid(GRID_COLS, GRID_ROWS)
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
        threat: 1.0
    },
    TANK: {
        color: "#FF3B3B",
        size: 22,
        shape: "square",
        speed: 60,
        threat: 3.0
    },
    SUPPORT: {
        color: "#FFD93B",
        size: 16,
        shape: "diamond",
        speed: 90,
        threat: 1.5
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
        createEntity("scout‑1", ENTITY_TYPES.SCOUT, 400, 300, "leader"),
        createEntity("tank‑1", ENTITY_TYPES.TANK, 300, 300, "formation"),
        createEntity("support‑1", ENTITY_TYPES.SUPPORT, 500, 300, "formation")
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

// influence‑driven steering: move toward lower threat
function steerFromThreat(e, influence) {
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

    for (const o of offsets) {
        const nx = cx + o.dx;
        const ny = cy + o.dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

        const nVal = threat[ny][nx];
        const delta = center - nVal; // positive if neighbor is safer (lower threat)

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

    if (simState.tick % 300 === 0 && simState.formation.switchCooldown <= 0) {
        cycleFormationMode();
    }

    updateEntities(dt);
    updateInfluence();

    requestAnimationFrame(simLoop);
}

// ------------------------------------------------------------
// ENTITY UPDATE — Formation + Influence‑Driven Tactical AI
// ------------------------------------------------------------

function updateEntities(dt) {
    const width = FIELD_WIDTH;
    const height = FIELD_HEIGHT;
    const entities = simState.entities;
    const formation = simState.formation;
    const influence = simState.influence;

    const leader = entities.find(e => e.id === formation.leaderId);

    for (const e of entities) {
        let primary = { vx: 0, vy: 0 };

        if (e.behavior === "leader") {
            primary = steerWander(e);
        }

        if (e.behavior === "formation") {
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
        const threatSteer = steerFromThreat(e, influence); // toward safer cells

        const ax =
            primary.vx * 1.0 +
            avoid.vx * 2.0 +
            threatSteer.vx * 1.5;

        const ay =
            primary.vy * 1.0 +
            avoid.vy * 2.0 +
            threatSteer.vy * 1.5;

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
