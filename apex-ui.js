// ------------------------------------------------------------
// apex-ui.js — Modern UI Controller (No APEX Global)
// ------------------------------------------------------------

import { enableFreeCamera, disableFreeCamera, setCinematicChase, setCinematicLowAngle, setCinematicShoulder } from "./camera-controls.js";
import { startRecording, stopRecording } from "./timeline-recorder.js";
import { getReplayState } from "./replay-ui.js";
import { getSimState, initSim } from "./apexsim.js";

// ------------------------------------------------------------
// Helper: bind button by data-ui="key"
// ------------------------------------------------------------
function bind(key, fn) {
    const btn = document.querySelector(`[data-ui="${key}"]`);
    if (!btn) return;
    btn.addEventListener("click", fn);
}

// ------------------------------------------------------------
// UI Initialization
// ------------------------------------------------------------
export function initUI() {
    console.log("APEX UI — online (modern mode).");

    // --- Simulation Controls ---
    bind("reset", () => {
        console.log("Resetting simulation...");
        initSim();
    });

    bind("play", () => {
        const replay = getReplayState();
        replay.playing = true;
    });

    bind("pause", () => {
        const replay = getReplayState();
        replay.playing = false;
    });

    // --- Camera Controls ---
    bind("cam-free", () => {
        console.log("Free camera enabled.");
        enableFreeCamera();
    });

    bind("cam-follow", () => {
        console.log("Follow camera enabled.");
        disableFreeCamera();
    });

    bind("cam-chase", () => {
        console.log("Cinematic chase camera.");
        setCinematicChase();
    });

    bind("cam-low", () => {
        console.log("Cinematic low-angle camera.");
        setCinematicLowAngle();
    });

    bind("cam-shoulder", () => {
        console.log("Cinematic shoulder camera.");
        setCinematicShoulder();
    });

    // --- Recording Controls ---
    bind("record-start", () => {
        console.log("Recording started.");
        startRecording();
    });

    bind("record-stop", () => {
        console.log("Recording stopped.");
        stopRecording();
    });
}

// Auto-start UI when DOM is ready
window.addEventListener("DOMContentLoaded", initUI);
