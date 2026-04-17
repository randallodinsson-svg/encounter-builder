// index.js - APEXCORE Runtime + APEXSIM + Renderer + Tactical Console + Heatmap Toggle

import { startAPEXSIM, setTacticalCommand, toggleHeatmap } from "./apexsim.js";
import { startAPEXSIMRenderer } from "./apexsim-renderer.js";

console.log("StateEngine - module entry loaded");

window.addEventListener("DOMContentLoaded", () => {
    console.log("APEXCORE - Booting Module Runtime...");

    startAPEXSIM();
    startAPEXSIMRenderer();

    // Tactical Console Buttons
    const consolePanel = document.getElementById("apex-tactical-console");
    if (consolePanel) {
        consolePanel.querySelectorAll("button[data-cmd]").forEach(btn => {
            btn.addEventListener("click", () => {
                const cmd = btn.getAttribute("data-cmd");
                setTacticalCommand(cmd);
                console.log("APEXSIM - Tactical command:", cmd);
            });
        });
    }

    // Heatmap Toggle Button
    const heatBtn = document.getElementById("heatmap-toggle");
    if (heatBtn) {
        heatBtn.addEventListener("click", () => {
            toggleHeatmap();
            console.log("APEXSIM - Heatmap toggled");
        });
    }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (key === "h") setTacticalCommand("hold");
        if (key === "f") setTacticalCommand("flank");
        if (key === "b") setTacticalCommand("fallback");
        if (key === "r") setTacticalCommand("regroup");
        if (key === "p") setTacticalCommand("push");
        if (key === "t") toggleHeatmap();
    });

    console.log("APEXCORE - Module Runtime Online");
});
