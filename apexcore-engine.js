// apexcore-engine.js
// ------------------------------------------------------------
// Minimal APEXCORE engine boot layer.
// Draws to canvas and hooks into events.
// ------------------------------------------------------------

import { onEvent, emitEvent, onStateChange, updateStateFromEvent } from "./apexcore-events.js";

console.log("APEXCORE ENGINE — initializing…");

function bootEngine() {
    const canvas = document.getElementById("apex-field");
    if (!canvas) {
        console.error("APEXCORE ENGINE — canvas #apex-field not found");
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("APEXCORE ENGINE — 2D context not available");
        return;
    }

    // Initial render
    renderFrame(ctx, {});

    // Listen to state changes
    onStateChange((state) => {
        renderFrame(ctx, state);
    });

    // Example: emit a boot event and update state
    emitEvent("engine:boot", { time: Date.now() });
    updateStateFromEvent({ engineOnline: true });
}

function renderFrame(ctx, state) {
    ctx.fillStyle = "#05070A";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#00FFC8";
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText("APEXCORE — ENGINE ONLINE", 40, 60);

    ctx.fillStyle = "#8A9BA8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("State: " + JSON.stringify(state), 40, 90);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootEngine);
} else {
    bootEngine();
}

console.log("APEXCORE ENGINE — boot scheduled");
