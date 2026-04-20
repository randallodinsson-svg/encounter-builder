// ------------------------------------------------------------
// debug-overlay.js — APEXSIM v8.8 Debug Overlay
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { getReplayState, getCameraState } from "./index.js";

let panel = null;

// ------------------------------------------------------------
// INIT DEBUG PANEL
// ------------------------------------------------------------
export function initDebugOverlay(){
    panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "10px";
    panel.style.left = "10px";
    panel.style.padding = "10px 14px";
    panel.style.background = "rgba(0,0,0,0.65)";
    panel.style.color = "#0f0";
    panel.style.fontFamily = "monospace";
    panel.style.fontSize = "12px";
    panel.style.whiteSpace = "pre";
    panel.style.zIndex = "99999";
    panel.style.pointerEvents = "none";
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
