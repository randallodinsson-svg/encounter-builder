// apexim-renderer.js - APEXSIM Renderer v4.6

console.log("APEXSIM Renderer - initializing");

import {
    getSimState,
    getTacticalState,
    getFormationMode,
    getLeaderPosition,
    getThreatCenter,
    getEntities,
    drawHeatmap
} from "./apexsim.js";

const canvas = document.getElementById("apex-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    console.warn("APEXSIM Renderer - canvas not found");
}

// ------------------------------------------------------------
// DRAW ENTITIES
// ------------------------------------------------------------

function drawEntities(ctx, simState) {
    const entities = getEntities();

    for (const e of entities) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Direction arrow (based on velocity)
        const angle = Math.atan2(e.vy, e.vx);
        if (!Number.isNaN(angle)) {
            ctx.rotate(angle);
        }

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

        // Direction pointer
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
// DRAW HUD
// ------------------------------------------------------------

function drawHUD(ctx, simState) {
    const tactical = getTacticalState();
    const form = getFormationMode();
    const leader = getLeaderPosition();

    ctx.save();
    ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#E5F0FF";
    ctx.textBaseline = "top";

    const baseX = canvas.width - 260;
    const baseY = 20;
    const lineH = 20;

    ctx.fillText(`TACTICAL: ${tactical.toUpperCase()}`, baseX, baseY + lineH * 0);
    ctx.fillText(`FORM: ${form.toUpperCase()}`, baseX, baseY + lineH * 1);
    ctx.fillText(`LEADER: ${Math.round(leader.x)}, ${Math.round(leader.y)}`, baseX, baseY + lineH * 2);

    ctx.restore();
}

// ------------------------------------------------------------
// THREAT CENTER MARKER
// ------------------------------------------------------------

function drawThreatCenter(ctx) {
    const center = getThreatCenter();
    const x = center.x;
    const y = center.y;

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 255, 200, 0.25)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Core dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00FFC8";
    ctx.fill();
}

// ------------------------------------------------------------
// MAIN RENDER LOOP
// ------------------------------------------------------------

function renderFrame() {
    if (!ctx || !canvas) return;

    const simState = getSimState();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Underlay
    drawHeatmap(ctx, simState);

    // Threat center marker
    drawThreatCenter(ctx);

    // Units + HUD
    drawEntities(ctx, simState);
    drawHUD(ctx, simState);

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

// Auto-start for current setup
startAPEXSIMRenderer();
