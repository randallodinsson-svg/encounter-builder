// apexcore-engine.js — minimal bootloader for Encounter Builder

console.log("APEXCORE ENGINE — initializing…");

function bootMinimalField() {
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

    // Clear and paint background
    ctx.fillStyle = "#05070A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a simple “APEXCORE ONLINE” marker
    ctx.fillStyle = "#00FFC8";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("APEXCORE — MINIMAL BOOT ONLINE", 40, 60);

    console.log("APEXCORE ENGINE — minimal field rendered");
}

// Simple DOM-ready guard
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMinimalField);
} else {
    bootMinimalField();
}
