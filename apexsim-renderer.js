// apexim-renderer.js — Minimal APEXSIM Renderer
// ------------------------------------------------------------
// Renders the APEXSIM state onto the main canvas without
// interfering with HALO or other render layers.
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

console.log("APEXSIM Renderer — initializing…");

let ctx = null;

export function initAPEXSIMRenderer() {
    const canvas = document.getElementById("apex-field");
    if (!canvas) {
        console.error("APEXSIM Renderer — canvas not found");
        return;
    }

    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("APEXSIM Renderer — 2D context unavailable");
        return;
    }

    requestAnimationFrame(renderLoop);
    console.log("APEXSIM Renderer — online");
}

function renderLoop() {
    const state = getSimState();
    if (!ctx) return;

    // Draw a simple oscillating dot to prove the sim is alive
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;

    ctx.fillStyle = "#05070A";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const radius = 20 + state.osc * 10;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00FFC8";
    ctx.fill();

    requestAnimationFrame(renderLoop);
}
