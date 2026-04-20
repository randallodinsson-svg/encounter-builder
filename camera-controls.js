// ------------------------------------------------------------
// camera-controls.js — Free Camera + Cinematic Presets
// ------------------------------------------------------------

// The global camera state used by renderer + engine
const cameraState = {
    x: 0,
    y: 0,
    zoom: 1,
    mode: "follow",   // "follow", "free", "cinematic"
    targetId: 1       // default leader
};

// Exported for renderer + index.js
export function getCameraState() {
    return cameraState;
}

import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// FREE CAMERA INTERNAL STATE
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// ENABLE / DISABLE FREE CAMERA
// ------------------------------------------------------------
export function enableFreeCamera() {
    freeCam.enabled = true;
    cameraState.mode = "free";
}

export function disableFreeCamera() {
    freeCam.enabled = false;
    cameraState.mode = "follow";
}

// ------------------------------------------------------------
// KEYBOARD INPUT
// ------------------------------------------------------------
window.addEventListener("keydown", e => {
    if (e.key in freeCam.keys) freeCam.keys[e.key] = true;
    if (e.key === "Shift") freeCam.keys.shift = true;
});

window.addEventListener("keyup", e => {
    if (e.key in freeCam.keys) freeCam.keys[e.key] = false;
    if (e.key === "Shift") freeCam.keys.shift = false;
});

// ------------------------------------------------------------
// MOUSE LOOK
// ------------------------------------------------------------
window.addEventListener("mousedown", e => {
    freeCam.mouseDown = true;
    freeCam.lastX = e.clientX;
    freeCam.lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
    freeCam.mouseDown = false;
});

window.addEventListener("mousemove", e => {
    if (!freeCam.mouseDown || !freeCam.enabled) return;

    const dx = e.clientX - freeCam.lastX;
    const dy = e.clientY - freeCam.lastY;

    freeCam.lastX = e.clientX;
    freeCam.lastY = e.clientY;

    freeCam.yaw   += dx * 0.002;
    freeCam.pitch += dy * 0.002;
});

// ------------------------------------------------------------
// ZOOM
// ------------------------------------------------------------
window.addEventListener("wheel", e => {
    cameraState.zoom *= (e.deltaY > 0 ? 0.9 : 1.1);
    cameraState.zoom = Math.max(0.1, Math.min(4, cameraState.zoom));
});

// ------------------------------------------------------------
// UPDATE CAMERA EACH FRAME
// Called from index.js via apexcoreUpdate()
// ------------------------------------------------------------
export function updateCamera(dt) {
    const speed = freeCam.keys.shift ? freeCam.fast : freeCam.speed;

    if (cameraState.mode === "free") {
        if (freeCam.keys.w) cameraState.y -= speed * dt;
        if (freeCam.keys.s) cameraState.y += speed * dt;
        if (freeCam.keys.a) cameraState.x -= speed * dt;
        if (freeCam.keys.d) cameraState.x += speed * dt;
        if (freeCam.keys.q) cameraState.zoom *= 0.98;
        if (freeCam.keys.e) cameraState.zoom *= 1.02;
    }

    if (cameraState.mode === "follow") {
        const sim = getSimState();
        const leader = sim.entities.find(e => e.id === cameraState.targetId);
        if (leader) {
            cameraState.x = leader.x;
            cameraState.y = leader.y;
        }
    }
}

// ------------------------------------------------------------
// CINEMATIC PRESETS
// ------------------------------------------------------------
export function setCinematicChase() {
    cameraState.mode = "cinematic";
    cameraState.zoom = 1.4;
}

export function setCinematicLowAngle() {
    cameraState.mode = "cinematic";
    cameraState.zoom = 1.1;
}

export function setCinematicShoulder() {
    cameraState.mode = "cinematic";
    cameraState.zoom = 1.8;
}
