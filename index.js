// ------------------------------------------------------------
// index.js — APEXCORE Runtime (v8.8 Full Install)
// ------------------------------------------------------------

// ------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------
import { initSim } from "./apexsim.js";
import { initRenderer } from "./apexsim-renderer.js";

import { enableFreeCamera, updateFreeCamera, setCameraPreset } from "./camera-controls.js";
import { initReplayUI, updateReplayUI } from "./replay-ui.js";

import "./apex-module-c.js";
import { drawTacticalOverlays } from "./tactical-overlays.js";

import { updateCommands } from "./apex-commands.js";
import "./orders-wheel.js";

import { updateBehaviorAI } from "./behavior-ai.js";
import { updateFormationFollowers } from "./formation-followers.js";
import { updateEnemyCoordination } from "./enemy-coordination.js";

import { recordFrame, updateReplayPlayback,
         startRecording, stopRecording, startPlayback } from "./timeline-recorder.js";

import { addCameraKeyframe, updateCameraKeyframes } from "./camera-keyframes.js";
import { setCameraRail, updateCameraRail } from "./camera-rails.js";

import { updateCinematicEvents } from "./cinematic-events.js";
import { initDebugOverlay, updateDebugOverlay } from "./debug-overlay.js";

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
        recording: false,
        cameraTrack: []
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
// REPLAY CONTROL
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
    const replay = getReplayState();
    replay.cameraTrack = [];
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

    // Replay mode
    if(replay.playing){
        updateReplayPlayback(dt);
        updateCameraKeyframes(dt);
        updateCameraRail(dt);
        updateCinematicEvents(dt);
        updateReplayUI();
        updateDebugOverlay();
        return;
    }

    // Live simulation
    if(cam.mode === "free"){
        updateFreeCamera(dt);
    }

    updateCommands(dt);
    updateBehaviorAI(dt);
    updateFormationFollowers(dt);
    updateEnemyCoordination(dt);

    recordFrame(dt);

    updateReplayUI();
    updateDebugOverlay();
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
    initDebugOverlay();

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

window.addCameraKeyframe = addCameraKeyframe;
window.setCameraRail = setCameraRail;

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
