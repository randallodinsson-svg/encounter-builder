// apexim-renderer.js — APEXSIM v1.2 Renderer (Shapes + Colors)

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

    for (const e of entities) {
        drawEntity(e);
    }

    requestAnimationFrame(renderLoop);
}

function drawEntity(e) {
    ctx.fillStyle = e.type.color;

    switch (e.type.shape) {
        case "circle":
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.type.size, 0, Math.PI * 2);
            ctx.fill();
            break;

        case "square":
            ctx.fillRect(
                e.x - e.type.size,
                e.y - e.type.size,
                e.type.size * 2,
                e.type.size * 2
            );
            break;

        case "diamond":
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - e.type.size);
            ctx.lineTo(e.x + e.type.size, e.y);
            ctx.lineTo(e.x, e.y + e.type.size);
            ctx.lineTo(e.x - e.type.size, e.y);
            ctx.closePath();
            ctx.fill();
            break;
    }

    // label
    ctx.fillStyle = "#8A9BA8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(e.id, e.x + e.type.size + 6, e.y + 4);
}
