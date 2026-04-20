// ------------------------------------------------------------
// index.js — APEXCORE Runtime (v8.5 Full Install)
// ------------------------------------------------------------

// ------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------
import { initSim } from "./apexsim.js";
import { initRenderer } from "./apexsim-renderer.js";

import { enableFreeCamera, updateFreeCamera, setCameraPreset } from "./camera-controls.js";
import { initReplayUI, updateReplayUI } from "./replay-ui.js";

import "./apex-module-c.js";          // Enemy spawn + squad selection
import { drawTacticalOverlays } from "./tactical-overlays.js";

import { updateCommands } from "./apex-commands.js";                 // v8.1 Command Layer
import "./orders-wheel.js";                                          // v8.1 Orders Wheel UI

import { updateBehaviorAI } from "./behavior-ai.js";                 // v8.2 Behavior AI
import { updateFormationFollowers } from "./formation-followers.js"; // v8.3 Formation Followers
import { updateEnemyCoordination } from "./enemy-coordination.js";   // v8.4 Hybrid Coordination AI

import { recordFrame, updateReplayPlayback,
         startRecording, stopRecording, startPlayback } from "./timeline-recorder.js"; // v8.5

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

// ------------------------------------------------------------
// STATE ACCESSORS
// ------------------------------------------------------------
export function getCameraState(){ return state.camera; }
export function getReplayState(){ return state.replay; }
export function getExportState(){ return state.export; }
export function getRadialMenuState(){ return state.radialMenu; }

// ------------------------------------------------------------
// CAMERA MODE
// ------------------------------------------------------------
export function setCameraMode(mode){
    const cam = getCameraState();
    cam.mode = mode;

    if(mode === "free"){
        enableFreeCamera();
    }
}

// ------------------------------------------------------------
// REPLAY CONTROL (HIGH-LEVEL)
// ------------------------------------------------------------
export function startReplay(){
    startPlayback();
}

export function pauseReplay(){
    getReplayState().playing = false;
}

export function scrubReplay(t){
    const r = getReplayState();
    r.time = t * r.duration;
    r.playing = false;
}

// ------------------------------------------------------------
// RECORDING CONTROL
// ------------------------------------------------------------
export function beginRecording(){
    startRecording();
}

export function endRecording(){
    stopRecording();
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
// CORE UPDATE LOOP
// ------------------------------------------------------------
function updateCore(dt){
    const cam = getCameraState();
    const replay = getReplayState();

    // If we're in replay playback, drive from timeline
    if(replay.playing){
        updateReplayPlayback(dt);
        updateReplayUI();
        return;
    }

    // Normal live simulation
    if(cam.mode === "free"){
        updateFreeCamera(dt);
    }

    updateCommands(dt);
    updateBehaviorAI(dt);
    updateFormationFollowers(dt);
    updateEnemyCoordination(dt);

    // Record live frames if recording
    recordFrame(dt);

    updateReplayUI();
}

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------
console.log("StateEngine - module entry loaded");

window.addEventListener("load", ()=>{

    console.log("APEXCORE - Booting Module Runtime...");

    initSim();
    initRenderer();
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

window.beginRecording = beginRecording;
window.endRecording = endRecording;

window.showRadialMenu = showRadialMenu;
window.hideRadialMenu = hideRadialMenu;

// ------------------------------------------------------------
// RENDERER HOOKS
// ------------------------------------------------------------
export function apexcoreUpdate(dt){
    updateCore(dt);
}

export function apexcoreDrawOverlays(){
    drawTacticalOverlays();
}
