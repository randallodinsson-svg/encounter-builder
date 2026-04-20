// ------------------------------------------------------------
// camera-controls.js — Free Camera + Cinematic Presets
// ------------------------------------------------------------

// Camera state lives HERE, not in index.js
const cameraState = {
    x: 0,
    y: 0,
    zoom: 1,
    mode: "follow"
};

// Exported so index.js and renderer can use it
export function getCameraState() {
    return cameraState;
}

import { getSimState } from "./apexsim.js";

const freeCam = {
    enabled: false,
    speed: 220,
    fast: 420,
    keys: { w:false, a:false, s:false, d:false, q:false, e:false, shift:false },
    mouseDown: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0
};

export function enableFreeCamera() {
    freeCam.enabled = true;
    cameraState.mode = "free";
}

export function disableFreeCamera() {
    freeCam.enabled = false;
}
