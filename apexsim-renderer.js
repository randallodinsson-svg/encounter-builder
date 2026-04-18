// ------------------------------------------------------------
// APEXSIM RENDERER v7.2 — CHUNK 1/3
// Core renderer, draw helpers, grid, entities, enemies
// ------------------------------------------------------------

console.log("APEXSIM Renderer - initializing");

import {
    getSimState,
    getEntities,
    getEnemies,
    getThreatCenter,
    getThreatMagnitude,
    drawHeatmap
} from "./apexsim.js";

import {
    getCameraState,
    getExportState,
    getRadialMenuState,
    isHeatmapEnabled,
    isPerformanceMode,
    getReplayState
} from "./index.js";

// ------------------------------------------------------------
// CANVAS SETUP
// ------------------------------------------------------------

const canvas = document.getElementById("apex-canvas");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

// ------------------------------------------------------------
// FLAGS
// ------------------------------------------------------------

const DEBUG_OVERLAY = true;

// ------------------------------------------------------------
// CAMERA CORE STATE
// ------------------------------------------------------------

const camera = {
    x: 640,
    y: 360,
    zoom: 1.0,
    targetX: 640,
    targetY: 360,
    targetZoom: 1.0,
    shake: 0,
    mode: "tracking"
};

// ------------------------------------------------------------
// DIRECTOR STATE
// ------------------------------------------------------------

const director = {
    shotTimer: 0,
    shotDuration: 3.0,
    lastShot: "",
    blend: 0,
    weightLeader: 3,
    weightHotspot: 2,
    weightCentroid: 1,
    weightThreat: 1
};

// ------------------------------------------------------------
// EXPORT STATE
// ------------------------------------------------------------

let exportFrames = [];
let exportMetadata = [];

// ------------------------------------------------------------
// TIME
// ------------------------------------------------------------

let lastTimestamp = performance.now();

// ------------------------------------------------------------
// MATH HELPERS
// ------------------------------------------------------------

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

// ------------------------------------------------------------
// WORLD <-> SCREEN
// ------------------------------------------------------------

function worldToScreen(x, y) {
    const sx = (x - camera.x) * camera.zoom + canvas.width / 2;
    const sy = (y - camera.y) * camera.zoom + canvas.height / 2;
    return { x: sx, y: sy };
}

function screenToWorld(x, y) {
    const wx = (x - canvas.width / 2) / camera.zoom + camera.x;
    const wy = (y - canvas.height / 2) / camera.zoom + camera.y;
    return { x: wx, y: wy };
}

// ------------------------------------------------------------
// DRAW HELPERS
// ------------------------------------------------------------

function drawCircle(x, y, r, color, alpha = 1.0) {
    const p = worldToScreen(x, y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * camera.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawRing(x, y, r, thickness, color, alpha = 1.0) {
    const p = worldToScreen(x, y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * camera.zoom, 0, Math.PI * 2);
    ctx.lineWidth = thickness * camera.zoom;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

function drawLine(x1, y1, x2, y2, color, width = 1, alpha = 1.0) {
    const p1 = worldToScreen(x1, y1);
    const p2 = worldToScreen(x2, y2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * camera.zoom;
    ctx.stroke();
    ctx.restore();
}

function drawLabel(x, y, text, color = "#FFFFFF", align = "center", size = 12) {
    const p = worldToScreen(x, y);
    ctx.save();
    ctx.font = `${size * camera.zoom}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, p.x, p.y);
    ctx.restore();
}

// ------------------------------------------------------------
// BACKDROP + GRID
// ------------------------------------------------------------

function drawGrid() {
    ctx.save();
    ctx.fillStyle = "#05070A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;

    const spacing = 40;
    const leftWorld = screenToWorld(0, 0).x;
    const rightWorld = screenToWorld(canvas.width, 0).x;
    const topWorld = screenToWorld(0, 0).y;
    const bottomWorld = screenToWorld(0, canvas.height).y;

    const startX = Math.floor(leftWorld / spacing) * spacing;
    const endX = Math.ceil(rightWorld / spacing) * spacing;
    const startY = Math.floor(topWorld / spacing) * spacing;
    const endY = Math.ceil(bottomWorld / spacing) * spacing;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += spacing) {
        const p1 = worldToScreen(x, topWorld);
        const p2 = worldToScreen(x, bottomWorld);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
    for (let y = startY; y <= endY; y += spacing) {
        const p1 = worldToScreen(leftWorld, y);
        const p2 = worldToScreen(rightWorld, y);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    ctx.restore();
}

// ------------------------------------------------------------
// ENTITIES + ENEMIES
// ------------------------------------------------------------

function drawEntities() {
    const entities = getEntities();
    for (const e of entities) {
        drawCircle(e.x, e.y, e.type.size, e.type.color, 0.95);

        if (DEBUG_OVERLAY && (e.vx || e.vy)) {
            drawLine(e.x, e.y, e.x + e.vx * 0.5, e.y + e.vy * 0.5, "rgba(0,255,200,0.5)", 1, 0.8);
        }
    }
}

function drawEnemies() {
    const enemies = getEnemies();
    for (const enemy of enemies) {
        drawCircle(enemy.x, enemy.y, 8, "#FF4D4D", 0.9);
        drawRing(enemy.x, enemy.y, 26, 1.5, "rgba(255,77,77,0.6)", 0.9);

        const facing = enemy.facing || 0;
        const angleWidth = Math.PI / 4;
        const r = 80;

        const p = worldToScreen(enemy.x, enemy.y);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(facing);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r * camera.zoom, -angleWidth / 2, angleWidth / 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,77,77,0.18)";
        ctx.fill();

        ctx.restore();
    }
}
// ------------------------------------------------------------
// AUTO-DIRECTOR
// ------------------------------------------------------------

function chooseDirectorShot(sim) {
    const anchors = sim.cameraAnchors;

    const shots = [
        { name: "leader", x: anchors.leader.x, y: anchors.leader.y, w: director.weightLeader },
        { name: "hotspot", x: anchors.engagementHotspot.x, y: anchors.engagementHotspot.y, w: director.weightHotspot },
        { name: "centroid", x: anchors.squadCentroid.x, y: anchors.squadCentroid.y, w: director.weightCentroid },
        { name: "threat", x: anchors.threatCenter.x, y: anchors.threatCenter.y, w: director.weightThreat }
    ];

    // Avoid repeating last shot
    const filtered = shots.filter(s => s.name !== director.lastShot);
    const pool = filtered.length > 0 ? filtered : shots;

    const totalWeight = pool.reduce((a, s) => a + s.w, 0);
    let r = Math.random() * totalWeight;

    for (const s of pool) {
        if (r < s.w) {
            director.lastShot = s.name;
            return s;
        }
        r -= s.w;
    }

    return pool[0];
}

function updateAutoDirector(sim, dt) {
    director.shotTimer -= dt;
    if (director.shotTimer <= 0) {
        const shot = chooseDirectorShot(sim);
        camera.targetX = shot.x;
        camera.targetY = shot.y;

        director.shotTimer = director.shotDuration;
        director.blend = 0;
    }

    director.blend = clamp(director.blend + dt * 0.5, 0, 1);
}

// ------------------------------------------------------------
// CAMERA MODES + ZOOM
// ------------------------------------------------------------

function updateCameraMode(sim, dt) {
    const camState = getCameraState();
    const anchors = sim.cameraAnchors;

    if (camState.mode === "tracking") {
        camera.targetX = anchors.leader.x;
        camera.targetY = anchors.leader.y;

    } else if (camState.mode === "orbit") {
        const t = sim.time * 0.4;
        const r = 140;
        camera.targetX = anchors.engagementHotspot.x + Math.cos(t) * r;
        camera.targetY = anchors.engagementHotspot.y + Math.sin(t) * r;

    } else if (camState.mode === "rail") {
        camera.targetX = anchors.squadCentroid.x;
        camera.targetY = anchors.squadCentroid.y;

    } else if (camState.mode === "free") {
        // Free cam: targetX/Y controlled externally

    } else if (camState.mode === "auto") {
        updateAutoDirector(sim, dt);
    }

    // Dynamic zoom based on threat magnitude
    const mag = getThreatMagnitude();
    const baseZoom = camState.zoom;
    const zoomOffset = smoothstep(10, 40, mag) * 0.25;
    camera.targetZoom = baseZoom + zoomOffset;
}

function updateCamera(dt) {
    const sim = getSimState();
    const camState = getCameraState();

    updateCameraMode(sim, dt);

    const posLerp = 2.5 * dt * (isPerformanceMode() ? 0.7 : 1.0);
    camera.x += (camera.targetX - camera.x) * posLerp;
    camera.y += (camera.targetY - camera.y) * posLerp;

    const zoomLerp = 3.0 * dt;
    camera.zoom += (camera.targetZoom - camera.zoom) * zoomLerp;

    applyCameraShake();
}

// ------------------------------------------------------------
// CAMERA SHAKE + IMPACT
// ------------------------------------------------------------

function applyCameraShake() {
    if (camera.shake > 0.001) {
        const intensity = camera.shake * camera.zoom;
        camera.x += (Math.random() - 0.5) * intensity;
        camera.y += (Math.random() - 0.5) * intensity;
        camera.shake *= 0.92;
    }
}

export function triggerImpactPulse(strength = 1.0) {
    camera.shake = Math.min(camera.shake + strength * 0.5, 3.0);
}

// ------------------------------------------------------------
// REPLAY-AWARE CAMERA
// ------------------------------------------------------------

function updateCameraReplay(dt) {
    const replay = getReplayState();
    if (!replay.playing || replay.frames.length === 0) {
        updateCamera(dt);
        return;
    }

    const frame = replay.frames.find(f => f.time >= replay.time);
    if (!frame) {
        updateCamera(dt);
        return;
    }

    const anchors = frame.cameraAnchors;
    const camState = getCameraState();

    camera.targetX = anchors.engagementHotspot.x;
    camera.targetY = anchors.engagementHotspot.y;

    const posLerp = 2.5 * dt;
    camera.x += (camera.targetX - camera.x) * posLerp;
    camera.y += (camera.targetY - camera.y) * posLerp;

    const zoomLerp = 3.0 * dt;
    camera.zoom += (camState.zoom - camera.zoom) * zoomLerp;

    applyCameraShake();
}

// ------------------------------------------------------------
// CAMERA UPDATE WRAPPER
// ------------------------------------------------------------

function updateCameraFromState(dt) {
    updateCameraReplay(dt);
}
// ------------------------------------------------------------
// EXPORT PIPELINE
// ------------------------------------------------------------

function beginExport() {
    exportFrames = [];
    exportMetadata = [];
    console.log("APEXSIM Renderer - Export capture started");
}

function endExport() {
    console.log("APEXSIM Renderer - Export capture stopped");
    console.log(`Captured ${exportFrames.length} frames with metadata.`);
}

function captureFrame() {
    const exportState = getExportState();
    if (!exportState.active) return;

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    exportFrames.push(frame);

    const sim = getSimState();
    exportMetadata.push({
        time: sim.time,
        camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
        tactics: { ...sim.tactics },
        formation: { ...sim.formation },
        command: { ...sim.command }
    });
}

// ------------------------------------------------------------
// DEBUG OVERLAY
// ------------------------------------------------------------

function drawDebugOverlay() {
    if (!DEBUG_OVERLAY) return;

    const sim = getSimState();
    const replay = getReplayState();

    ctx.save();
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textBaseline = "top";

    const lines = [
        `TIME: ${sim.time.toFixed(2)}`,
        `CAM: (${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}) Z=${camera.zoom.toFixed(2)}`,
        `MODE: ${getCameraState().mode.toUpperCase()}`,
        `REPLAY: ${replay.playing ? "ON" : "OFF"} t=${replay.time.toFixed(2)}/${replay.duration.toFixed(2)}`,
        `THREAT: ${getThreatMagnitude().toFixed(1)}`,
        `SHAKE: ${camera.shake.toFixed(2)}`
    ];

    let y = 50;
    for (const line of lines) {
        ctx.fillText(line, 20, y);
        y += 12;
    }

    ctx.restore();
}

// ------------------------------------------------------------
// MAIN RENDER LOOP
// ------------------------------------------------------------

function renderFrame(timestamp) {
    const dt = clamp((timestamp - lastTimestamp) / 1000, 0.001, 0.05);
    lastTimestamp = timestamp;

    updateCameraFromState(dt);

    // BACKDROP + GRID
    drawGrid();

    // THREAT + HEATMAP + ARCS + HOTSPOT
    drawThreat();
    drawThreatArcs();
    drawHotspotPulse();

    // FORMATION GHOSTS
    drawFormationGhosts();

    // ENTITIES + ENEMIES
    drawEntities();
    drawEnemies();

    // RADIAL MENU
    drawRadialMenu();

    // HUD + MINIMAP
    const exportState = getExportState();
    if (exportState.mode !== "clean") {
        drawHud();
        drawMinimap();
    }

    // LETTERBOXING (CLEAN / HYBRID)
    drawLetterbox();

    // DEBUG
    drawDebugOverlay();

    // EXPORT CAPTURE
    captureFrame();

    requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);

console.log("APEXSIM Renderer - online");
