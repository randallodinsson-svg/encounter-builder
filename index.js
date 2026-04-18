// index.js — APEXCORE v7.2 Command Layer
console.log("StateEngine - module entry loaded");

import {
    setTacticalState,
    setFormationMode,
    setHighLevelOrder,
    setActiveSquadLeader,
    setSquadTarget,
    startReplay,
    stopReplay,
    scrubReplay,
    getSquads,
    getReplayState
} from "./apexsim.js";

// ------------------------------------------------------------
// BOOT
// ------------------------------------------------------------

console.log("APEXCORE - Booting Module Runtime...");

// ------------------------------------------------------------
// DOM HOOKS
// ------------------------------------------------------------

// Tactical
const btnHold = document.getElementById("btn-hold");
const btnFlank = document.getElementById("btn-flank");
const btnFallback = document.getElementById("btn-fallback");
const btnRegroup = document.getElementById("btn-regroup");
const btnPush = document.getElementById("btn-push");

// Formation
const btnFormTight = document.getElementById("btn-form-tight");
const btnFormSpread = document.getElementById("btn-form-spread");
const btnFormLine = document.getElementById("btn-form-line");
const btnFormWedge = document.getElementById("btn-form-wedge");

// High-level orders
const btnOrderDefend = document.getElementById("btn-order-defend");
const btnOrderAdvance = document.getElementById("btn-order-advance");
const btnOrderSweep = document.getElementById("btn-order-sweep");
const btnOrderSecure = document.getElementById("btn-order-secure");

// Squad selection
const btnSquadAlpha = document.getElementById("btn-squad-alpha");
const btnSquadBravo = document.getElementById("btn-squad-bravo");

// Replay
const btnReplayPlay = document.getElementById("btn-replay-play");
const btnReplayStop = document.getElementById("btn-replay-stop");
const replaySlider = document.getElementById("replay-slider");

// Heatmap + Performance
const heatmapToggle = document.getElementById("btn-heatmap");
const perfToggle = document.getElementById("btn-performance");

// Camera Controls (v7.2)
const btnCamOrbit = document.getElementById("btn-cam-orbit");
const btnCamTracking = document.getElementById("btn-cam-tracking");
const btnCamRail = document.getElementById("btn-cam-rail");
const btnCamFree = document.getElementById("btn-cam-free");
const btnCamAuto = document.getElementById("btn-cam-auto");
const btnCamReset = document.getElementById("btn-cam-reset");
const btnCamZoomIn = document.getElementById("btn-cam-zoom-in");
const btnCamZoomOut = document.getElementById("btn-cam-zoom-out");

// Export Controls (v7.2)
const btnExportStart = document.getElementById("btn-export-start");
const btnExportStop = document.getElementById("btn-export-stop");
const btnExportHUD = document.getElementById("btn-export-hud");
const btnExportClean = document.getElementById("btn-export-clean");
const btnExportHybrid = document.getElementById("btn-export-hybrid");
const btnExportAutoDirector = document.getElementById("btn-export-auto");

// ------------------------------------------------------------
// HEATMAP STATE
// ------------------------------------------------------------

let heatmapEnabled = true;

if (heatmapToggle) {
    heatmapToggle.addEventListener("click", () => {
        heatmapEnabled = !heatmapEnabled;
        console.log("APEXSIM - Heatmap toggled");
    });
}

export function isHeatmapEnabled() {
    return heatmapEnabled;
}

// ------------------------------------------------------------
// PERFORMANCE MODE
// ------------------------------------------------------------

let performanceMode = false;

if (perfToggle) {
    perfToggle.addEventListener("click", () => {
        performanceMode = !performanceMode;
        console.log("APEXSIM - Performance mode:", performanceMode ? "ON" : "OFF");
    });
}

export function isPerformanceMode() {
    return performanceMode;
}

// ------------------------------------------------------------
// CAMERA STATE (v7.2)
// ------------------------------------------------------------

let cameraMode = "tracking"; // orbit, tracking, rail, free, auto
let cameraZoom = 1.0;
let exportMode = "hud"; // hud, clean, hybrid
let exportActive = false;

export function getCameraState() {
    return {
        mode: cameraMode,
        zoom: cameraZoom,
        exportMode,
        exportActive
    };
}

// Camera mode buttons
if (btnCamOrbit) btnCamOrbit.addEventListener("click", () => cameraMode = "orbit");
if (btnCamTracking) btnCamTracking.addEventListener("click", () => cameraMode = "tracking");
if (btnCamRail) btnCamRail.addEventListener("click", () => cameraMode = "rail");
if (btnCamFree) btnCamFree.addEventListener("click", () => cameraMode = "free");
if (btnCamAuto) btnCamAuto.addEventListener("click", () => cameraMode = "auto");

// Camera zoom
if (btnCamZoomIn) btnCamZoomIn.addEventListener("click", () => cameraZoom = Math.min(2.5, cameraZoom + 0.1));
if (btnCamZoomOut) btnCamZoomOut.addEventListener("click", () => cameraZoom = Math.max(0.4, cameraZoom - 0.1));

// Reset camera
if (btnCamReset) btnCamReset.addEventListener("click", () => {
    cameraMode = "tracking";
    cameraZoom = 1.0;
});

// ------------------------------------------------------------
// EXPORT CONTROLS (v7.2)
// ------------------------------------------------------------

export function getExportState() {
    return {
        mode: exportMode,
        active: exportActive
    };
}

if (btnExportHUD) btnExportHUD.addEventListener("click", () => exportMode = "hud");
if (btnExportClean) btnExportClean.addEventListener("click", () => exportMode = "clean");
if (btnExportHybrid) btnExportHybrid.addEventListener("click", () => exportMode = "hybrid");

// Start/Stop capture
if (btnExportStart) btnExportStart.addEventListener("click", () => {
    exportActive = true;
    console.log("APEXSIM - Export started");
});

if (btnExportStop) btnExportStop.addEventListener("click", () => {
    exportActive = false;
    console.log("APEXSIM - Export stopped");
});

// Auto-director replay export
if (btnExportAutoDirector) {
    btnExportAutoDirector.addEventListener("click", () => {
        cameraMode = "auto";
        exportActive = true;
        console.log("APEXSIM - Auto-Director Replay Export");
    });
}

// ------------------------------------------------------------
// TACTICAL COMMANDS
// ------------------------------------------------------------

if (btnHold) btnHold.addEventListener("click", () => { console.log("APEXSIM - Manual tactical command: hold"); setTacticalState("hold"); });
if (btnFlank) btnFlank.addEventListener("click", () => { console.log("APEXSIM - Manual tactical command: flank"); setTacticalState("flank"); });
if (btnFallback) btnFallback.addEventListener("click", () => { console.log("APEXSIM - Manual tactical command: fallback"); setTacticalState("fallback"); });
if (btnRegroup) btnRegroup.addEventListener("click", () => { console.log("APEXSIM - Manual tactical command: regroup"); setTacticalState("regroup"); });
if (btnPush) btnPush.addEventListener("click", () => { console.log("APEXSIM - Manual tactical command: push"); setTacticalState("push"); });

// ------------------------------------------------------------
// FORMATION
// ------------------------------------------------------------

if (btnFormTight) btnFormTight.addEventListener("click", () => setFormationMode("tight"));
if (btnFormSpread) btnFormSpread.addEventListener("click", () => setFormationMode("spread"));
if (btnFormLine) btnFormLine.addEventListener("click", () => setFormationMode("line"));
if (btnFormWedge) btnFormWedge.addEventListener("click", () => setFormationMode("wedge"));

// ------------------------------------------------------------
// HIGH-LEVEL ORDERS
// ------------------------------------------------------------

if (btnOrderDefend) btnOrderDefend.addEventListener("click", () => setHighLevelOrder("defend"));
if (btnOrderAdvance) btnOrderAdvance.addEventListener("click", () => setHighLevelOrder("advance"));
if (btnOrderSweep) btnOrderSweep.addEventListener("click", () => setHighLevelOrder("sweep"));
if (btnOrderSecure) btnOrderSecure.addEventListener("click", () => setHighLevelOrder("secure"));

// ------------------------------------------------------------
// SQUAD SELECTION
// ------------------------------------------------------------

let activeSquadId = "alpha";

function setActiveSquad(id) {
    activeSquadId = id;
    setActiveSquadLeader(id);
}

if (btnSquadAlpha) btnSquadAlpha.addEventListener("click", () => setActiveSquad("alpha"));
if (btnSquadBravo) btnSquadBravo.addEventListener("click", () => setActiveSquad("bravo"));

// ------------------------------------------------------------
// REPLAY CONTROLS
// ------------------------------------------------------------

if (btnReplayPlay) btnReplayPlay.addEventListener("click", () => startReplay());
if (btnReplayStop) btnReplayStop.addEventListener("click", () => stopReplay());

if (replaySlider) {
    replaySlider.addEventListener("input", () => {
        const v = parseFloat(replaySlider.value) || 0;
        const replay = getReplayState();
        const t = (v / 100) * replay.duration;
        scrubReplay(t);
    });
}

setInterval(() => {
    const replay = getReplayState();
    if (!replaySlider || replay.duration <= 0) return;
    const pct = (replay.time / replay.duration) * 100;
    replaySlider.value = String(pct);
}, 200);

// ------------------------------------------------------------
// RADIAL MENU
// ------------------------------------------------------------

const canvas = document.getElementById("apex-canvas");

let radialMenu = {
    visible: false,
    x: 0,
    y: 0,
    options: [
        { label: "HOLD", action: () => setTacticalState("hold") },
        { label: "FLANK", action: () => setTacticalState("flank") },
        { label: "FALLBACK", action: () => setTacticalState("fallback") },
        { label: "REGROUP", action: () => setTacticalState("regroup") },
        { label: "PUSH", action: () => setTacticalState("push") }
    ]
};

export function getRadialMenuState() {
    return radialMenu;
}

if (canvas) {
    canvas.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const rect = canvas.getBoundingClientRect();
        radialMenu.x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        radialMenu.y = (ev.clientY - rect.top) * (canvas.height / rect.height);
        radialMenu.visible = true;
    });

    canvas.addEventListener("mousedown", (ev) => {
        if (!radialMenu.visible) return;
        if (ev.button !== 0) return;

        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        const y = (ev.clientY - rect.top) * (canvas.height / rect.height);

        const dx = x - radialMenu.x;
        const dy = y - radialMenu.y;
        const d = Math.hypot(dx, dy);

        if (d < 20 || d > 80) {
            radialMenu.visible = false;
            return;
        }

        const angle = Math.atan2(dy, dx);
        const normAngle = (angle + Math.PI * 2) % (Math.PI * 2);

        const segment = (Math.PI * 2) / radialMenu.options.length;
        const index = Math.floor(normAngle / segment);
        const opt = radialMenu.options[index];
        if (opt && opt.action) opt.action();

        radialMenu.visible = false;
    });

    canvas.addEventListener("dblclick", (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
        const squads = getSquads();
        const squad = squads.find(s => s.id === activeSquadId);
        if (squad) setSquadTarget(squad.id, x, y);
    });
}

// ------------------------------------------------------------
// ONLINE
// ------------------------------------------------------------

console.log("APEXCORE - Module Runtime Online");
