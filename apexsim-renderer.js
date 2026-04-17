// apexim-renderer.js — APEXSIM v1.1 Renderer (Entities)

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

    const { entities } = state;

    ctx.fillStyle = "#05070A";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // draw entities
    for (const e of entities) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "#00FFC8";
        ctx.fill();

        ctx.fillStyle = "#8A9BA8";
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(e.id, e.x + 20, e.y + 4);
    }

    requestAnimationFrame(renderLoop);
}
