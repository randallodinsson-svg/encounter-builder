// index.js - APEXCORE Runtime + APEXSIM + Renderer + Tactical Console

import { startAPEXSIM, setTacticalCommand } from "./apexsim.js";
import { startAPEXSIMRenderer } from "./apexsim-renderer.js";

console.log("StateEngine - module entry loaded");

window.addEventListener("DOMContentLoaded", () => {
    console.log("APEXCORE - Booting Module Runtime...");

    // Boot simulation
    startAPEXSIM();

    // Boot renderer
    startAPEXSIMRenderer();

    // Wire Tactical Command Console
    const consolePanel = document.getElementById("apex-tactical-console");
    if (consolePanel) {
        consolePanel.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                const cmd = btn.getAttribute("data-cmd");
                setTacticalCommand(cmd);
                console.log("APEXSIM - Tactical command:", cmd);
            });
        });
    }

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (key === "h") setTacticalCommand("hold");
        if (key === "f") setTacticalCommand("flank");
        if (key === "b") setTacticalCommand("fallback");
        if (key === "r") setTacticalCommand("regroup");
        if (key === "p") setTacticalCommand("push");
    });

    console.log("APEXCORE - Module Runtime Online");
});
