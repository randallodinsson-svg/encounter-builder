// apexim-renderer.js - APEXSIM Renderer v4.8
console.log("APEXSIM Renderer - initializing");

import {
    getSimState,
    getTacticalState,
    getFormationMode,
    getLeaderPosition,
    getThreatCenter,
    getThreatMagnitude,
    getEntities,
    drawHeatmap
} from "./apexsim.js";

// ------------------------------------------------------------
// CANVAS SETUP
// ------------------------------------------------------------

const canvas = document.getElementById("apex-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    console.warn("APEXSIM Renderer - canvas not found");
}

// ------------------------------------------------------------
// TACTICAL TIMELINE RIBBON (NEW)
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

    // Background
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

    for (const e of entities) {
        ctx.save();
        ctx.translate(e.x, e.y);

        const angle = Math.atan2(e.vy, e.vx);
        if (!Number.isNaN(angle)) ctx.rotate(angle);

        ctx.fillStyle = e.type.color;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;

        const size = e.type.size;

        if (e.type.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (e.type.shape === "square") {
            ctx.beginPath();
            ctx.rect(-size, -size, size * 2, size * 2);
            ctx.fill();
            ctx.stroke();
        } else if (e.type.shape === "diamond") {
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(size + 6, 0);
        ctx.lineTo(size + 16, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// ------------------------------------------------------------
// HUD RENDERING
// ------------------------------------------------------------

function drawHUD(ctx, simState) {
    const tactical = getTacticalState();
    const form = getFormationMode();
    const leader = getLeaderPosition();

    ctx.save();
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#E5F0FF";
    ctx.textBaseline = "top";

    const baseX = canvas.width - 260;
    const baseY = 20;
    const lineH = 20;

    ctx.fillText(`TACTICAL: ${tactical.toUpperCase()}`, baseX, baseY);
    ctx.fillText(`FORMATION: ${form.toUpperCase()}`, baseX, baseY + lineH);
    ctx.fillText(`LEADER: ${Math.round(leader.x)}, ${Math.round(leader.y)}`, baseX, baseY + lineH * 2);

    ctx.restore();
}

// ------------------------------------------------------------
// THREAT CENTER MARKER (PULSE)
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
        default: "rgba(255,255,255,0.25)",
        support: "rgba(0,255,200,0.25)",
        heavy: "rgba(255,80,80,0.25)",
        scout: "rgba(80,160,255,0.25)"
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

        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.5;
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSectorGrid(ctx);
    drawHeatmap(ctx, simState);

    drawThreatCenterMarker(ctx);
    drawThreatVectorArrow(ctx, simState);

    drawEntities(ctx, simState);
    drawFormationGhostOverlay(ctx, simState);

    drawHUD(ctx, simState);
    drawMinimap(ctx, simState);

    drawTacticalTimelineRibbon(ctx);

    requestAnimationFrame(renderFrame);
}

// ------------------------------------------------------------
// START RENDERER
// ------------------------------------------------------------

export function startAPEXSIMRenderer() {
    if (!ctx || !canvas) return;
    console.log("APEXSIM Renderer - online");
    requestAnimationFrame(renderFrame);
}

startAPEXSIMRenderer();
