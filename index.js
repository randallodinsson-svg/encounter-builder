// ------------------------------------------------------------
// index.js — APEXCORE Module Runtime (Full Install)
// ------------------------------------------------------------

import { initSim, getSimState } from "./apexsim.js";
import { initRenderer } from "./apexsim-renderer.js";

import { enableFreeCamera, updateFreeCamera, setCameraPreset } from "./camera-controls.js";
import { initReplayUI, updateReplayUI } from "./replay-ui.js";
import "./apex-module-c.js";
import { drawTacticalOverlays } from "./tactical-overlays.js";

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
        frames: [],
        recording: false
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

export function getCameraState(){ return state.camera; }
export function getReplayState(){ return state.replay; }
export function getExportState(){ return state.export; }
export function getRadialMenuState(){ return state.radialMenu; }

export function setCameraMode(mode){
    const cam = getCameraState();
    cam.mode = mode;
    if(mode === "free") enableFreeCamera();
}

export function startReplay(){
    getReplayState().playing = true;
}

export function pauseReplay(){
    getReplayState().playing = false;
}

export function scrubReplay(t){
    const r = getReplayState();
    r.time = t * r.duration;
    r.playing = false;
}

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

function updateCore(dt){
    const cam = getCameraState();
    if(cam.mode === "free"){
        updateFreeCamera(dt);
    }
    updateReplayUI();
}

console.log("StateEngine - module entry loaded");

window.addEventListener("load", ()=>{
    console.log("APEXCORE - Booting Module Runtime...");
    initSim();
    initRenderer();
    initReplayUI();
    console.log("APEXCORE - Module Runtime Online");
});

window.setCameraMode = setCameraMode;
window.setCameraPreset = setCameraPreset;
window.startReplay = startReplay;
window.pauseReplay = pauseReplay;
window.scrubReplay = scrubReplay;
window.showRadialMenu = showRadialMenu;
window.hideRadialMenu = hideRadialMenu;

export function apexcoreUpdate(dt){
    updateCore(dt);
}

export function apexcoreDrawOverlays(){
    drawTacticalOverlays();
}
