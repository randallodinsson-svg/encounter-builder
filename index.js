// index.js - APEXCORE Frontend Runtime

console.log("StateEngine - module entry loaded");

import {
    startAPEXSIM,
    setTacticalCommand,
    toggleHeatmap
} from "./apexsim.js";

console.log("APEXCORE - Booting Module Runtime...");

// ------------------------------------------------------------
// BUTTON WIRING
// ------------------------------------------------------------

function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", handler);
}

// Tactical buttons
bindButton("btn-hold", () => {
    setTacticalCommand("hold");
    console.log("APEXSIM - Tactical command: hold");
});

bindButton("btn-flank", () => {
    setTacticalCommand("flank");
    console.log("APEXSIM - Tactical command: flank");
});

bindButton("btn-fallback", () => {
    setTacticalCommand("fallback");
    console.log("APEXSIM - Tactical command: fallback");
});

bindButton("btn-regroup", () => {
    setTacticalCommand("regroup");
    console.log("APEXSIM - Tactical command: regroup");
});

bindButton("btn-push", () => {
    setTacticalCommand("push");
    console.log("APEXSIM - Tactical command: push");
});

// Heatmap toggle
bindButton("btn-heatmap", () => {
    toggleHeatmap();
    console.log("APEXSIM - Heatmap toggled");
});

// ------------------------------------------------------------
// BOOT SIMULATION
// ------------------------------------------------------------

startAPEXSIM();

console.log("APEXCORE - Module Runtime Online");
