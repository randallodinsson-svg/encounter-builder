// index.js — APEXCORE State Engine v7.2
// -------------------------------------
console.log("StateEngine - module entry loaded");

import {
    setTacticalState,
    getTacticalState,
    setFormationMode,
    getFormationMode,
    setHighLevelOrder,
    getCommandLayerState,
    getSimState,
    startReplay,
    stopReplay,
    scrubReplay
} from "./apexsim.js";

import { getReplayState as simReplayState } from "./apexsim.js";

console.log("APEXCORE - Booting Module Runtime...");

// -------------------------------------
// INTERNAL STATE
// -------------------------------------

const cameraState = {
    mode: "tracking",
    zoom: 1.0
};

const exportState = {
    active: false,
    mode: "off" // "off" | "hud" | "clean" | "hybrid"
};

const radialMenuState = {
    visible: false,
    x: 0,
    y: 0,
    options: []
};

let heatmapEnabled = false;
let performanceMode = false;

// -------------------------------------
// EXPORTED ACCESSORS (USED BY RENDERER)
// -------------------------------------

export function getCameraState() {
    return cameraState;
}

export function getExportState() {
    return exportState;
}

export function getRadialMenuState() {
    return radialMenuState;
}

export function isHeatmapEnabled() {
    return heatmapEnabled;
}

export function isPerformanceMode() {
    return performanceMode;
}

// Replay state accessor required by renderer v7.2
export function getReplayState() {
    return simReplayState();
}

// -------------------------------------
// DOM HOOKS
// -------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    console.log("APEXCORE - Module Runtime Online");

    wireTacticalButtons();
    wireHeatmapToggle();
    wireCameraControls();
    wireExportControls();
    wirePerformanceToggle();
});

// -------------------------------------
// TACTICAL BUTTONS
// -------------------------------------

function wireTacticalButtons() {
    const map = [
        { id: "btn-hold", state: "hold" },
        { id: "btn-flank", state: "flank" },
        { id: "btn-fallback", state: "fallback" },
        { id: "btn-regroup", state: "regroup" },
        { id: "btn-push", state: "push" }
    ];

    for (const entry of map) {
        const btn = document.getElementById(entry.id);
        if (!btn) continue;

        btn.addEventListener("click", () => {
            setTacticalState(entry.state);
            console.log(`APEXSIM - Manual tactical command: ${entry.state}`);
        });
    }
}

// -------------------------------------
// HEATMAP TOGGLE
// -------------------------------------

function wireHeatmapToggle() {
    const btn = document.getElementById("btn-heatmap");
    if (!btn) return;

    btn.addEventListener("click", () => {
        heatmapEnabled = !heatmapEnabled;
        console.log("APEXSIM - Heatmap toggled");
        btn.classList.toggle("active", heatmapEnabled);
    });
}

// -------------------------------------
// CAMERA CONTROLS
// -------------------------------------

function wireCameraControls() {
    const select = document.getElementById("camera-mode");
    const zoomSlider = document.getElementById("camera-zoom");

    if (select) {
        select.addEventListener("change", () => {
            cameraState.mode = select.value || "tracking";
            console.log(`APEXSIM - Camera mode: ${cameraState.mode}`);
        });
    }

    if (zoomSlider) {
        zoomSlider.addEventListener("input", () => {
            const v = parseFloat(zoomSlider.value || "1");
            cameraState.zoom = v;
        });
    }
}

// -------------------------------------
// EXPORT CONTROLS
// -------------------------------------

function wireExportControls() {
    const btnHud = document.getElementById("btn-export-hud");
    const btnClean = document.getElementById("btn-export-clean");
    const btnHybrid = document.getElementById("btn-export-hybrid");
    const btnStop = document.getElementById("btn-export-stop");

    if (btnHud) {
        btnHud.addEventListener("click", () => {
            exportState.active = true;
            exportState.mode = "hud";
            console.log("APEXSIM - Export mode: HUD");
        });
    }

    if (btnClean) {
        btnClean.addEventListener("click", () => {
            exportState.active = true;
            exportState.mode = "clean";
            console.log("APEXSIM - Export mode: CLEAN");
        });
    }

    if (btnHybrid) {
        btnHybrid.addEventListener("click", () => {
            exportState.active = true;
            exportState.mode = "hybrid";
            console.log("APEXSIM - Export mode: HYBRID");
        });
    }

    if (btnStop) {
        btnStop.addEventListener("click", () => {
            exportState.active = false;
            exportState.mode = "off";
            console.log("APEXSIM - Export stopped");
        });
    }
}

// -------------------------------------
// PERFORMANCE TOGGLE
// -------------------------------------

function wirePerformanceToggle() {
    const btn = document.getElementById("btn-perf");
    if (!btn) return;

    btn.addEventListener("click", () => {
        performanceMode = !performanceMode;
        console.log(`APEXSIM - Performance mode: ${performanceMode ? "ON" : "OFF"}`);
        btn.classList.toggle("active", performanceMode);
    });
}

// -------------------------------------
// OPTIONAL: REPLAY CONTROLS (HOOKS ONLY)
// -------------------------------------

const replayApi = {
    start() {
        startReplay();
        console.log("APEXSIM - Replay started");
    },
    stop() {
        stopReplay();
        console.log("APEXSIM - Replay stopped");
    },
    scrub(t) {
        scrubReplay(t);
        console.log(`APEXSIM - Replay scrub: ${t.toFixed(2)}`);
    }
};

export { replayApi };

// -------------------------------------
// DEBUG LOGGING HELPERS
// -------------------------------------

export function logSimSummary() {
    const sim = getSimState();
    console.log("APEXSIM STATE SNAPSHOT:", {
        time: sim.time,
        tactics: sim.tactics,
        formation: sim.formation,
        command: sim.command
    });
}
