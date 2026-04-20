// ------------------------------------------------------------
// apexsim-renderer.js — Renderer
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { getCameraState, getReplayState, getExportState, apexcoreUpdate, apexcoreDrawOverlays } from "./index.js";

export const canvas = document.getElementById("apex-canvas");
export const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ------------------------------------------------------------
// WORLD → SCREEN TRANSFORM
// ------------------------------------------------------------
export function w2s(x, y) {
    const cam = getCameraState();
    return {
        x: (x - cam.x) * cam.zoom + canvas.width / 2,
        y: (y - cam.y) * cam.zoom + canvas.height / 2
    };
}

// ------------------------------------------------------------
// BASIC DRAW HELPERS
// ------------------------------------------------------------
function drawCircle(x, y, r, color) {
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * cam.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawEntity(e) {
    drawCircle(e.x, e.y, e.radius || 12, e.color || "#4FC3F7");
}

// ------------------------------------------------------------
// MAIN RENDER FUNCTION (EXPORTED)
// ------------------------------------------------------------
export function renderFrame(simState) {
    const cam = getCameraState();

    // Clear screen
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw entities
    for (const e of simState.entities) {
        drawEntity(e);
    }

    // Tactical overlays
    apexcoreDrawOverlays(ctx, simState);

    // Replay overlays (optional)
    const replay = getReplayState();
    const exp = getExportState();

    // Example: draw timeline progress bar
    if (exp.duration > 0) {
        ctx.fillStyle = "#1E88E5";
        ctx.fillRect(20, canvas.height - 20, (replay.time / exp.duration) * (canvas.width - 40), 4);
    }
}
