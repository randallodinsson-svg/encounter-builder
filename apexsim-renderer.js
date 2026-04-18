// apexim-renderer.js — APEXSIM Renderer v7.2 (Full Cinematic)
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

        // Velocity vectors (debug)
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

        // Facing cone (cinematic)
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
// THREAT + HEATMAP + HOTSPOT
// ------------------------------------------------------------

function drawThreat() {
    const sim = getSimState();
    if (isHeatmapEnabled()) {
        drawHeatmap(ctx, sim);
    }

    const tc = getThreatCenter();
    const mag = getThreatMagnitude();

    const radius = 40 + mag * 4;
    drawRing(tc.x, tc.y, radius, 2, "rgba(0,255,200,0.5)", 0.8);
}

function drawThreatArcs() {
    const tc = getThreatCenter();
    const mag = getThreatMagnitude();
    const r = 80 + mag * 3;

    drawRing(tc.x, tc.y, r, 2, "rgba(255,0,0,0.25)", 0.8);
    drawRing(tc.x, tc.y, r * 1.3, 1.5, "rgba(255,0,0,0.15)", 0.6);
}

function drawHotspotPulse() {
    const sim = getSimState();
    const hotspot = sim.cameraAnchors.engagementHotspot;
    const t = sim.time;

    const baseR = 30;
    const pulse = (Math.sin(t * 2) + 1) * 0.5;
    const r = baseR + pulse * 20;

    drawRing(hotspot.x, hotspot.y, r, 2, "rgba(0,200,255,0.5)", 0.9);
}

// ------------------------------------------------------------
// RADIAL MENU
// ------------------------------------------------------------

function drawRadialMenu() {
    const radial = getRadialMenuState();
    if (!radial.visible) return;

    const p = worldToScreen(radial.x, radial.y);

    ctx.save();
    ctx.translate(p.x, p.y);

    const radiusInner = 20 * camera.zoom;
    const radiusOuter = 80 * camera.zoom;

    ctx.beginPath();
    ctx.arc(0, 0, radiusOuter, 0, Math.PI * 2);
    ctx.arc(0, 0, radiusInner, Math.PI * 2, 0, true);
    ctx.fillStyle = "rgba(5,10,20,0.95)";
    ctx.fill();

    const options = radial.options || [];
    const segment = (Math.PI * 2) / options.length;

    ctx.font = `${10 * camera.zoom}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < options.length; i++) {
        const angle = i * segment + segment / 2;
        const tx = Math.cos(angle) * (radiusInner + (radiusOuter - radiusInner) * 0.6);
        const ty = Math.sin(angle) * (radiusInner + (radiusOuter - radiusInner) * 0.6);

        ctx.fillStyle = "rgba(0,255,200,0.9)";
        ctx.fillText(options[i].label, tx, ty);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// FORMATION GHOSTS + SQUAD LABELS
// ------------------------------------------------------------

function drawFormationGhosts() {
    const sim = getSimState();
    const entities = sim.entities;
    const leader = entities.find(e => e.id === sim.formation.leaderId);
    if (!leader) return;

    const count = entities.length;
    const mode = sim.formation.mode;

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

        const gx = leader.x + offsetX;
        const gy = leader.y + offsetY;

        drawRing(gx, gy, 10, 1.5, "rgba(255,255,255,0.15)", 0.6);
    }

    // Squad labels (centered on centroid)
    const sx = sim.cameraAnchors.squadCentroid.x;
    const sy = sim.cameraAnchors.squadCentroid.y;
    drawLabel(sx, sy - 40, "SQUAD", "rgba(255,255,255,0.7)", "center", 11);
}

// ------------------------------------------------------------
// MINIMAP
// ------------------------------------------------------------

function drawMinimap() {
    const sim = getSimState();
    const entities = sim.entities;
    const enemies = sim.enemies;

    const w = 180;
    const h = 120;
    const x0 = canvas.width - w - 20;
    const y0 = canvas.height - h - 20;

    ctx.save();
    ctx.fillStyle = "rgba(5,10,20,0.85)";
    ctx.fillRect(x0, y0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.strokeRect(x0, y0, w, h);

    function mapX(x) { return x0 + (x / 1280) * w; }
    function mapY(y) { return y0 + (y / 720) * h; }

    for (const e of entities) {
        ctx.fillStyle = e.type.color;
        ctx.fillRect(mapX(e.x), mapY(e.y), 3, 3);
    }

    for (const en of enemies) {
        ctx.fillStyle = "#FF4D4D";
        ctx.fillRect(mapX(en.x), mapY(en.y), 3, 3);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// HUD + LETTERBOXING
// ------------------------------------------------------------

function drawHud() {
    const sim = getSimState();
    const replay = getReplayState();
    const camState = getCameraState();
    const exportState = getExportState();

    ctx.save();

    // Top bar
    ctx.fillStyle = "rgba(5,10,20,0.96)";
    ctx.fillRect(0, 0, canvas.width, 40);

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#9FA8B8";
    ctx.textBaseline = "middle";

    ctx.fillText("APEXSIM // ENCOUNTER BUILDER", 20, 20);

    const tactical = sim.tactics.state.toUpperCase();
    const formation = sim.formation.mode.toUpperCase();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    const leaderText = leader ? `${leader.x.toFixed(0)}, ${leader.y.toFixed(0)}` : "N/A";
    const order = sim.command.highLevelOrder.toUpperCase();
    const replayLabel = replay.playing ? "REPLAY" : "LIVE";
    const perfLabel = isPerformanceMode() ? "ON" : "OFF";

    const summary = [
        `Tactical: ${tactical}`,
        `Formation: ${formation}`,
        `Leader: ${leaderText}`,
        `Order: ${order}`,
        `Replay: ${replayLabel}`,
        `Perf: ${perfLabel}`,
        `Cam: ${camState.mode.toUpperCase()}`,
        `Zoom: ${camState.zoom.toFixed(2)}`,
        `Export: ${exportState.active ? exportState.mode.toUpperCase() : "OFF"}`
    ].join("   |   ");

    ctx.fillText(summary, 260, 20);

    ctx.restore();
}

function drawLetterbox() {
    const exportState = getExportState();
    if (!exportState.active) return;
    if (exportState.mode === "hud") return;

    const barHeight = 60;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, canvas.width, barHeight);
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    ctx.restore();
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
        // Free cam: targetX/Y controlled externally (future)
    } else if (camState.mode === "auto") {
        updateAutoDirector(sim, dt);
    }

    // Dynamic zoom based on threat magnitude
    const mag = getThreatMagnitude();
    const baseZoom = camState.zoom;
    const zoomOffset = smoothstep(10, 40, mag) * 0.25; // zoom in as threat rises
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
    // At this point you could serialize exportMetadata or frames for offline encoding.
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
