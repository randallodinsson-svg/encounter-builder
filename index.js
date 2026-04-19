// ------------------------------------------------------------
// index.js — APEXCORE Module Runtime (Full Install)
// ------------------------------------------------------------

// ------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------
import { initSim, getSimState } from "./apexsim.js";
import { initRenderer } from "./apexsim-renderer.js";

// UI + Systems
import { enableFreeCamera, updateFreeCamera, setCameraPreset } from "./camera-controls.js";
import { initReplayUI, updateReplayUI } from "./replay-ui.js";
import "./apex-module-c.js";          // Enemy spawn + squad selection
import { drawTacticalOverlays } from "./tactical-overlays.js";

// ------------------------------------------------------------
// GLOBAL STATE ENGINE
// ------------------------------------------------------------
const state = {
    camera: {
        mode: "auto",
        x: 0,
        y: 0,
        zoom: 1,
        tx: 0,
        ty: 0,
        tz: 1
    },
    replay: {
        playing: false,
        time: 0,
        duration: 0,
        frames: []
    },
    export: {
        active: false,
        mode: "hud"
    },
    radialMenu: {
        visible: false,
        x: 0,
        y: 0,
        options: []
    }
};

// ------------------------------------------------------------
// STATE ACCESSORS
// ------------------------------------------------------------
export function getCameraState(){ return state.camera; }
export function getReplayState(){ return state.replay; }
export function getExportState(){ return state.export; }
export function getRadialMenuState(){ return state.radialMenu; }

// ------------------------------------------------------------
// CAMERA MODE SWITCHING
// ------------------------------------------------------------
export function setCameraMode(mode){
    const cam = getCameraState();
    cam.mode = mode;

    if(mode === "free"){
        enableFreeCamera();
    }
}

// ------------------------------------------------------------
// REPLAY CONTROL
// ------------------------------------------------------------
export function startReplay(){
    const r = getReplayState();
    r.playing = true;
}

export function pauseReplay(){
    const r = getReplayState();
    r.playing = false;
}

export function scrubReplay(t){
    const r = getReplayState();
    r.time = t * r.duration;
    r.playing = false;
}

// ------------------------------------------------------------
// RADIAL MENU CONTROL
// ------------------------------------------------------------
export function showRadialMenu(x, y, options){
    const r = getRadialMenuState();
    r.visible = true;
    r.x = x;
    r.y = y;
    r.options = options;
}

export function hideRadialMenu(){
    getRadialMenuState().visible = false;
}

// ------------------------------------------------------------
// MAIN UPDATE LOOP (CORE)
// ------------------------------------------------------------
function updateCore(dt){
    const cam = getCameraState();

    // Free camera override
    if(cam.mode === "free"){
        updateFreeCamera(dt);
    }

    // Replay UI
    updateReplayUI();
}

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------
console.log("StateEngine - module entry loaded");

window.addEventListener("load", ()=>{

    console.log("APEXCORE - Booting Module Runtime...");

    // Initialize simulation
    initSim();

    // Initialize renderer
    initRenderer();

    // Initialize replay UI
    initReplayUI();

    console.log("APEXCORE - Module Runtime Online");
});

// ------------------------------------------------------------
// EXPORTS FOR UI BUTTONS
// ------------------------------------------------------------
window.setCameraMode = setCameraMode;
window.setCameraPreset = setCameraPreset;
window.startReplay = startReplay;
window.pauseReplay = pauseReplay;
window.scrubReplay = scrubReplay;
window.showRadialMenu = showRadialMenu;
window.hideRadialMenu = hideRadialMenu;

// ------------------------------------------------------------
// RENDERER HOOKS (CALLED FROM RENDERER)
// ------------------------------------------------------------
export function apexcoreUpdate(dt){
    updateCore(dt);
}

export function apexcoreDrawOverlays(){
    drawTacticalOverlays();
}
