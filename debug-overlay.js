// ------------------------------------------------------------
// debug-overlay.js — APEXSIM v8.8.1 Debug Overlay (Guaranteed Visible)
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { getReplayState, getCameraState } from "./index.js";

let panel = null;

// ------------------------------------------------------------
// INIT DEBUG PANEL
// ------------------------------------------------------------
export function initDebugOverlay(){
    panel = document.createElement("div");

    // Position bottom-left so it never overlaps UI
    panel.style.position = "fixed";
    panel.style.bottom = "10px";
    panel.style.left = "10px";

    // Visual style
    panel.style.padding = "10px 14px";
    panel.style.background = "rgba(0, 0, 0, 0.75)";
    panel.style.color = "#00ff66";
    panel.style.fontFamily = "monospace";
    panel.style.fontSize = "12px";
    panel.style.whiteSpace = "pre";
    panel.style.pointerEvents = "none";

    // Border so it stands out
    panel.style.border = "1px solid #00ff66";
    panel.style.borderRadius = "4px";

    // MAXIMUM z-index so nothing can cover it
    panel.style.zIndex = "2147483647";

    document.body.appendChild(panel);
}

// ------------------------------------------------------------
// UPDATE DEBUG PANEL
// ------------------------------------------------------------
export function updateDebugOverlay(){
    if(!panel) return;

    const sim = getSimState();
    const replay = getReplayState();
    const cam = getCameraState();

    panel.textContent =
        `APEXSIM DEBUG\n` +
        `-------------------------\n` +
        `Entities: ${sim.entities.length}\n` +
        `Enemies: ${sim.enemies.length}\n` +
        `Replay: ${replay.playing ? "PLAYING" : replay.recording ? "RECORDING" : "LIVE"}\n` +
        `Replay Time: ${replay.time.toFixed(2)} / ${replay.duration.toFixed(2)}\n` +
        `Camera: (${cam.x.toFixed(1)}, ${cam.y.toFixed(1)}) z=${cam.zoom.toFixed(2)}\n` +
        `Timescale: ${sim.timescale.toFixed(2)}\n`;
}
