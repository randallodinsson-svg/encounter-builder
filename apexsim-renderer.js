// apexim-renderer.js - APEXSIM Renderer v7.0 (Tactical Clean + Command Layer)
console.log("APEXSIM Renderer - initializing");

import {
    getSimState,
    getTacticalState,
    getFormationMode,
    getLeaderPosition,
    getThreatCenter,
    getThreatMagnitude,
    getEntities,
    getSquads,
    getEnemies,
    getCommandLayerState,
    getReplayState,
    drawHeatmap
} from "./apexsim.js";
import { isHeatmapEnabled, getRadialMenuState } from "./index.js";

// ------------------------------------------------------------
// CANVAS SETUP
// ------------------------------------------------------------

const canvas = document.getElementById("apex-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    console.warn("APEXSIM Renderer - canvas not found");
}

// ------------------------------------------------------------
// COMMAND CONSOLE OVERLAY
// ------------------------------------------------------------

const consoleLog = [];
const MAX_CONSOLE_LINES = 10;

let lastTacticalState = null;
let lastFormationMode = null;
let lastThreatBand = null;

function addConsoleEntry(type, message) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    consoleLog.push({
        time: `${hh}:${mm}:${ss}`,
        type,
        message
    });

    if (consoleLog.length > MAX_CONSOLE_LINES) {
        consoleLog.shift();
    }
}

function getThreatBand(mag) {
    if (mag < 10) return "low";
    if (mag < 25) return "medium";
    return "high";
}

function updateConsoleFromState(simState) {
    const tactical = getTacticalState();
    const formation = getFormationMode();
    const threatMag = getThreatMagnitude();
    const band = getThreatBand(threatMag);

    if (lastTacticalState === null) {
        lastTacticalState = tactical;
        addConsoleEntry("system", "Simulation online");
        addConsoleEntry("tactical", `Initial tactical state: ${tactical.toUpperCase()}`);
    } else if (tactical !== lastTacticalState) {
        addConsoleEntry("tactical", `TACTICAL → ${tactical.toUpperCase()}`);
        lastTacticalState = tactical;
    }

    if (lastFormationMode === null) {
        lastFormationMode = formation;
        addConsoleEntry("formation", `Initial formation: ${formation.toUpperCase()}`);
    } else if (formation !== lastFormationMode) {
        addConsoleEntry("formation", `FORMATION → ${formation.toUpperCase()}`);
        lastFormationMode = formation;
    }

    if (lastThreatBand === null) {
        lastThreatBand = band;
        addConsoleEntry("threat", `Threat level: ${band.toUpperCase()} (${Math.round(threatMag)})`);
    } else if (band !== lastThreatBand) {
        addConsoleEntry("threat", `THREAT → ${band.toUpperCase()} (${Math.round(threatMag)})`);
        lastThreatBand = band;
    }
}

function drawCommandConsole(ctx) {
    const width = 420;
    const height = 180;
    const x = 20;
    const y = canvas.height - height - 80;

    ctx.save();

    ctx.fillStyle = "rgba(5, 10, 18, 0.92)";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "rgba(120, 150, 200, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "rgba(0, 255, 200, 0.85)";
    ctx.font = "12px 'SF Mono', 'Consolas', monospace";
    ctx.textBaseline = "top";
    ctx.fillText("APEXCORE // COMMAND CONSOLE", x + 12, y + 10);

    const lineStartY = y + 32;
    const lineHeight = 14;

    for (let i = 0; i < consoleLog.length; i++) {
        const entry = consoleLog[i];
        const lineY = lineStartY + i * lineHeight;

        let color = "#E5F0FF";
        if (entry.type === "tactical") color = "#4DA3FF";
        if (entry.type === "formation") color = "#FFB84D";
        if (entry.type === "threat") color = "#FF4D4D";
        if (entry.type === "system") color = "#9B59FF";
        if (entry.type === "ping") color = "#00FFC8";

        const ageFactor = (consoleLog.length - 1 - i) / consoleLog.length;
        const alpha = 0.35 + 0.65 * (1 - ageFactor);

        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha.toFixed(2)})`;
        ctx.fillText(
            `[${entry.time}] ${entry.message}`,
            x + 12,
            lineY
        );
    }

    ctx.restore();
}

function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

// ------------------------------------------------------------
// TACTICAL TIMELINE RIBBON
// ------------------------------------------------------------

const tacticalTimeline = [];
const MAX_TIMELINE = 12;

function updateTacticalTimeline(state) {
    if (tacticalTimeline.length === 0 || tacticalTimeline[tacticalTimeline.length - 1].state !== state) {
        tacticalTimeline.push({
            state,
            timestamp: performance.now()
        });

        if (tacticalTimeline.length > MAX_TIMELINE) {
            tacticalTimeline.shift();
        }
    }
}

const stateColors = {
    hold: "#4DA3FF",
    flank: "#FFB84D",
    fallback: "#FF4D4D",
    regroup: "#9B59FF",
    push: "#00FFC8",
    default: "#CCCCCC"
};

function drawTacticalTimelineRibbon(ctx) {
    const x = 20;
    const y = canvas.height - 60;
    const width = canvas.width - 40;
    const height = 40;

    ctx.save();

    ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    const segmentWidth = width / MAX_TIMELINE;

    for (let i = 0; i < tacticalTimeline.length; i++) {
        const entry = tacticalTimeline[i];
        const color = stateColors[entry.state] || stateColors.default;

        const sx = x + i * segmentWidth;

        ctx.fillStyle = color;
        ctx.fillRect(sx, y, segmentWidth - 2, height);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(entry.state.toUpperCase(), sx + segmentWidth / 2, y + height / 2);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// SECTOR GRID OVERLAY
// ------------------------------------------------------------

function drawSectorGrid(ctx) {
    const w = canvas.width;
    const h = canvas.height;

    const majorStep = 160;
    const minorStep = 40;

    ctx.save();

    ctx.strokeStyle = "rgba(40, 52, 80, 0.25)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += minorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    for (let y = 0; y <= h; y += minorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(80, 100, 140, 0.45)";
    ctx.lineWidth = 1.5;

    for (let x = 0; x <= w; x += majorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    for (let y = 0; y <= h; y += majorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// ENTITY RENDERING
// ------------------------------------------------------------

function drawEntities(ctx, simState) {
    const entities = getEntities();
    const squads = getSquads();

    for (const e of entities) {
        const squad = squads.find(s => s.id === e.squadId);

        ctx.save();
        ctx.translate(e.x, e.y);

        const angle = Math.atan2(e.vy, e.vx);
        if (!Number.isNaN(angle)) ctx.rotate(angle);

        ctx.fillStyle = e.type.color;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;

        const size = e.type.size;

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (squad) {
            ctx.beginPath();
            ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
            ctx.strokeStyle = squad.color + "88";
           ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ------------------------------------------------------------
// ROLE ICONS / UNIT LABELS
// ------------------------------------------------------------

function drawRoleIconsAndLabels(ctx, simState) {
    const entities = simState.entities;
    const squads = simState.squads;

    ctx.save();
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    for (const e of entities) {
        const role = e.type.role || "unit";
        const x = e.x;
        const y = e.y - (e.type.size + 10);

        let color = "#E5F0FF";
        if (role === "support") color = "#00FFC8";
        if (role === "heavy") color = "#FF6B6B";
        if (role === "scout") color = "#4DA3FF";

        const squad = squads.find(s => s.id === e.squadId);
        const label = squad ? squad.label : role.toUpperCase();

        ctx.fillStyle = "rgba(5, 10, 18, 0.7)";
        ctx.fillRect(x - 22, y - 16, 44, 16);

        ctx.strokeStyle = "rgba(120, 150, 200, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 22, y - 16, 44, 16);

        ctx.fillStyle = color;
        ctx.fillText(label, x, y - 3);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// HUD RENDERING
// ------------------------------------------------------------

function drawHUD(ctx, simState) {
    const tactical = getTacticalState();
    const form = getFormationMode();
    const leader = getLeaderPosition();
    const cmd = getCommandLayerState();
    const replay = getReplayState();

    ctx.save();
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#E5F0FF";
    ctx.textBaseline = "top";

    const baseX = canvas.width - 260;
    const baseY = 20;
    const lineH = 18;

    ctx.fillText(`TACTICAL: ${tactical.toUpperCase()}`, baseX, baseY);
    ctx.fillText(`FORMATION: ${form.toUpperCase()}`, baseX, baseY + lineH);
    ctx.fillText(`LEADER: ${Math.round(leader.x)}, ${Math.round(leader.y)}`, baseX, baseY + lineH * 2);
    ctx.fillText(`ORDER: ${cmd.highLevelOrder.toUpperCase()}`, baseX, baseY + lineH * 3);

    const replayLabel = replay.playing ? "REPLAY: PLAY" : "REPLAY: LIVE";
    ctx.fillText(replayLabel, baseX, baseY + lineH * 4);

    ctx.restore();
}

// ------------------------------------------------------------
// THREAT CENTER MARKER
// ------------------------------------------------------------

function drawThreatCenterMarker(ctx) {
    const center = getThreatCenter();
    const mag = getThreatMagnitude();

    const x = center.x;
    const y = center.y;

    const norm = Math.max(0, Math.min(1, mag / 40));

    const outerR = 18 + 10 * norm;
    const innerR = 8 + 4 * norm;

    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 200, ${0.15 + 0.25 * norm})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + 0.3 * norm})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00FFC8";
    ctx.fill();
}

// ------------------------------------------------------------
// LEADER → THREAT VECTOR ARROW
// ------------------------------------------------------------

function drawThreatVectorArrow(ctx, simState) {
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader) return;

    const center = simState.tactics.threatCenter;

    const sx = leader.x;
    const sy = leader.y;
    const ex = center.x;
    const ey = center.y;

    const dx = ex - sx;
    const dy = ey - sy;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const headLen = 18;
    const hx = ex - nx * headLen;
    const hy = ey - ny * headLen;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = "rgba(0, 255, 200, 0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(hx + -ny * 8, hy + nx * 8);
    ctx.lineTo(hx + ny * 8, hy + -nx * 8);
   ctx.closePath();
    ctx.fillStyle = "rgba(0, 255, 200, 0.75)";
    ctx.fill();

    ctx.restore();
}

// ------------------------------------------------------------
// FORMATION GHOST OVERLAY
// ------------------------------------------------------------

function drawFormationGhostOverlay(ctx, simState) {
    const formation = simState.formation;
    const entities = simState.entities;

    const leader = entities.find(e => e.id === formation.leaderId);
    if (!leader) return;

    const mode = formation.mode;
    const count = formation.count || entities.length;

    let radius = 80;
    if (mode === "tight") radius = 50;
    if (mode === "spread") radius = 120;

    const roleColor = {
        default: "rgba(255,255,255,0.18)",
        support: "rgba(0,255,200,0.18)",
        heavy: "rgba(255,80,80,0.18)",
        scout: "rgba(80,160,255,0.18)"
    };

    ctx.save();

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;

        const gx = leader.x + Math.cos(angle) * radius;
        const gy = leader.y + Math.sin(angle) * radius;

        const ent = entities[i];
        const color = ent?.type?.role
            ? roleColor[ent.type.role] || roleColor.default
            : roleColor.default;

        ctx.beginPath();
        ctx.arc(gx, gy, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// FORMATION SHAPE VISUALIZER
// ------------------------------------------------------------

function drawFormationShape(ctx, simState) {
    const formation = simState.formation;
    const entities = simState.entities;
    const leader = entities.find(e => e.id === formation.leaderId);
    if (!leader) return;

    const mode = formation.mode;
    const cx = leader.x;
    const cy = leader.y;

    ctx.save();
    ctx.strokeStyle = "rgba(120, 150, 200, 0.45)";
    ctx.lineWidth = 1.5;

    if (mode === "tight" || mode === "spread") {
        const r = mode === "tight" ? 70 : 120;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    } else if (mode === "line") {
        const len = 160;
        ctx.beginPath();
        ctx.moveTo(cx - len / 2, cy);
        ctx.lineTo(cx + len / 2, cy);
        ctx.stroke();
    } else if (mode === "wedge") {
        const r = 120;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx - r * 0.7, cy + r * 0.6);
        ctx.lineTo(cx + r * 0.7, cy + r * 0.6);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// MINIMAP MODULE
// ------------------------------------------------------------

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 112;
const MINIMAP_X = 20;
const MINIMAP_Y = 20;

function drawMinimap(ctx, simState) {
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    const threatCenter = simState.tactics.threatCenter;
    const enemies = simState.enemies;

    ctx.save();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#0A0F18";
    ctx.fillRect(MINIMAP_X - 4, MINIMAP_Y - 4, MINIMAP_WIDTH + 8, MINIMAP_HEIGHT + 8);

    ctx.strokeStyle = "#1B2333";
    ctx.lineWidth = 2;
    ctx.strokeRect(MINIMAP_X - 4, MINIMAP_Y - 4, MINIMAP_WIDTH + 8, MINIMAP_HEIGHT + 8);

    ctx.globalAlpha = 1.0;

    ctx.fillStyle = "#05070B";
    ctx.fillRect(MINIMAP_X, MINIMAP_Y, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    const sx = MINIMAP_WIDTH / 1280;
    const sy = MINIMAP_HEIGHT / 720;

    ctx.beginPath();
    ctx.arc(
        MINIMAP_X + threatCenter.x * sx,
        MINIMAP_Y + threatCenter.y * sy,
        4,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "#00FFC8";
    ctx.fill();

    if (leader) {
        ctx.beginPath();
        ctx.arc(
            MINIMAP_X + leader.x * sx,
    MINIMAP_Y + leader.y * sy,
            3,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "#4DA3FF";
        ctx.fill();
    }

    for (const e of entities) {
        ctx.beginPath();
        ctx.arc(
            MINIMAP_X + e.x * sx,
            MINIMAP_Y + e.y * sy,
            2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = e.type.color;
        ctx.fill();
    }

    for (const enemy of enemies) {
        ctx.beginPath();
        ctx.arc(
            MINIMAP_X + enemy.x * sx,
            MINIMAP_Y + enemy.y * sy,
            2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "#FF6B6B";
        ctx.fill();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// FOG-OF-WAR OVERLAY
// ------------------------------------------------------------

function drawFogOfWar(ctx, simState) {
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader) return;

    const cx = leader.x;
    const cy = leader.y;

    const maxRadius = Math.max(canvas.width, canvas.height) * 0.9;
    const innerRadius = 140;
    const outerRadius = innerRadius + maxRadius;

    ctx.save();

    const gradient = ctx.createRadialGradient(
        cx, cy, innerRadius,
        cx, cy, outerRadius
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
    gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.35)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
}

// ------------------------------------------------------------
// TACTICAL PING SYSTEM
// ------------------------------------------------------------

const pings = [];
const PING_LIFETIME = 2000;

function addPing(x, y) {
    const now = performance.now();
    pings.push({
        x,
        y,
        created: now
    });

    addConsoleEntry("ping", `PING @ ${Math.round(x)}, ${Math.round(y)}`);
}

function drawPings(ctx) {
    const now = performance.now();

    for (let i = pings.length - 1; i >= 0; i--) {
        const ping = pings[i];
        const age = now - ping.created;
        if (age > PING_LIFETIME) {
            pings.splice(i, 1);
            continue;
        }

        const t = age / PING_LIFETIME;
        const alpha = 1 - t;
        const radius = 12 + 40 * t;

        ctx.save();

        ctx.beginPath();
        ctx.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ping.x, ping.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${0.8 * alpha})`;
        ctx.fill();

        ctx.restore();
    }
}

if (canvas) {
    canvas.addEventListener("click", (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
        addPing(x, y);
        triggerImpactPulse(0.4);
    });
}

// ------------------------------------------------------------
// ENEMY MARKERS + THREAT ARCS
// ------------------------------------------------------------

function drawEnemyMarkersAndArcs(ctx, simState) {
    const enemies = getEnemies();
    if (!enemies.length) return;

    ctx.save();

    for (const enemy of enemies) {
        const x = enemy.x;
        const y = enemy.y;
        const facing = enemy.facing || 0;
        const threat = enemy.threat || 1;

        const baseColor = `rgba(255, 80, 80, ${0.4 + 0.3 * Math.min(1, threat)})`;

        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 7, y + 6);
        ctx.lineTo(x - 7, y + 6);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();

        const arcRadius = 40 + 20 * Math.min(1, threat);
        const arcWidth = Math.PI / 4;

        ctx.beginPath();
        ctx.arc(x, y, arcRadius, facing - arcWidth, facing + arcWidth);
        ctx.strokeStyle = `rgba(255, 120, 120, 0.35)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// TACTICAL RANGE RINGS
// ------------------------------------------------------------

function drawRangeRings(ctx, simState) {
    const entities = simState.entities;
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader) return;

    const cx = leader.x;
    const cy = leader.y;

    const rings = [
        { r: 120, color: "rgba(0, 255, 200, 0.18)" },
        { r: 220, color: "rgba(77, 163, 255, 0.16)" },
        { r: 320, color: "rgba(255, 77, 77, 0.14)" }
    ];

    ctx.save();
    ctx.lineWidth = 1;

    for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.stroke();
    }

    ctx.restore();
}

// ------------------------------------------------------------
// CINEMATIC CAMERA SHAKE / IMPACT PULSES
// ------------------------------------------------------------

let cameraShakeIntensity = 0;
let cameraShakeDecay = 0.9;
let impactPulseStrength = 0;

function triggerCameraShake(intensity) {
    cameraShakeIntensity = Math.max(cameraShakeIntensity, intensity);
}

function triggerImpactPulse(strength) {
    impactPulseStrength = Math.max(impactPulseStrength, strength);
}

function applyCameraShake(ctx) {
    if (cameraShakeIntensity <= 0.001) return;

    const dx = (Math.random() - 0.5) * cameraShakeIntensity * 8;
    const dy = (Math.random() - 0.5) * cameraShakeIntensity * 8;
    ctx.translate(dx, dy);

    cameraShakeIntensity *= cameraShakeDecay;
}

function drawImpactPulse(ctx) {
    if (impactPulseStrength <= 0.01) return;

    const alpha = impactPulseStrength * 0.25;
    const radius = Math.max(canvas.width, canvas.height) * (0.2 + 0.4 * impactPulseStrength);

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    impactPulseStrength *= 0.88;
}

// ------------------------------------------------------------
// RADIAL MENU RENDERING
// ------------------------------------------------------------

function drawRadialMenu(ctx) {
    const menu = getRadialMenuState();
    if (!menu.visible) return;

    const x = menu.x;
    const y = menu.y;
    const options = menu.options;
    const radiusInner = 24;
    const radiusOuter = 70;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, radiusOuter, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(5, 10, 18, 0.92)";
    ctx.fill();

    ctx.strokeStyle = "rgba(120, 150, 200, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const segment = (Math.PI * 2) / options.length;

    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < options.length; i++) {
        const angle = i * segment + segment / 2;
        const tx = x + Math.cos(angle) * ((radiusInner + radiusOuter) / 2);
        const ty = y + Math.sin(angle) * ((radiusInner + radiusOuter) / 2);

        ctx.fillStyle = "rgba(0, 255, 200, 0.85)";
        ctx.fillText(options[i].label, tx, ty);
    }

    ctx.restore();
}

// ------------------------------------------------------------
// REPLAY TIMELINE OVERLAY
// ------------------------------------------------------------

function drawReplayOverlay(ctx) {
    const replay = getReplayState();
    if (replay.duration <= 0) return;

    const x = 20;
    const y = canvas.height - 90;
    const width = canvas.width - 40;
    const height = 10;

    ctx.save();

    ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    const pct = replay.time / replay.duration;
    const px = x + width * pct;

    ctx.beginPath();
    ctx.moveTo(px, y - 4);
    ctx.lineTo(px, y + height + 4);
    ctx.strokeStyle = "rgba(0, 255, 200, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

// ------------------------------------------------------------
// MAIN RENDER LOOP
// ------------------------------------------------------------

function renderFrame() {
    if (!ctx || !canvas) return;

    const simState = getSimState();
    const tacticalState = getTacticalState();

    updateTacticalTimeline(tacticalState);
    updateConsoleFromState(simState);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    applyCameraShake(ctx);

    if (isHeatmapEnabled()) {
        drawHeatmap(ctx, simState);
    } else {
        ctx.fillStyle = "#05070B";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawSectorGrid(ctx);

    drawThreatCenterMarker(ctx);
    drawThreatVectorArrow(ctx, simState);

    drawEntities(ctx, simState);
    drawFormationGhostOverlay(ctx, simState);
    drawFormationShape(ctx, simState);
    drawRoleIconsAndLabels(ctx, simState);

    drawEnemyMarkersAndArcs(ctx, simState);
    drawRangeRings(ctx, simState);

    drawPings(ctx);

    drawFogOfWar(ctx, simState);

    ctx.restore();

    drawHUD(ctx, simState);
    drawMinimap(ctx, simState);

    drawCommandConsole(ctx);
    drawTacticalTimelineRibbon(ctx);
    drawReplayOverlay(ctx);
    drawRadialMenu(ctx);

    drawImpactPulse(ctx);

    requestAnimationFrame(renderFrame);
}

// ------------------------------------------------------------
// START RENDERER
// ------------------------------------------------------------

export function startAPEXSIMRenderer() {
    if (!ctx || !canvas) return;
    console.log("APEXSIM Renderer - online");
    addConsoleEntry("system", "Renderer online");
    requestAnimationFrame(renderFrame);
}

startAPEXSIMRenderer();
