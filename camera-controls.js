// ------------------------------------------------------------
// camera-controls.js — Free Camera + Cinematic Presets
// ------------------------------------------------------------

import { getCameraState, getReplayState } from "./index.js";
import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// FREE CAMERA STATE
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
    const cam = getCameraState();
    cam.mode = "free";
}

export function disableFreeCamera() {
    freeCam.enabled = false;
}

// ------------------------------------------------------------
// KEYBOARD INPUT
// ------------------------------------------------------------
window.addEventListener("keydown", e=>{
    if(e.key==="w") freeCam.keys.w=true;
    if(e.key==="a") freeCam.keys.a=true;
    if(e.key==="s") freeCam.keys.s=true;
    if(e.key==="d") freeCam.keys.d=true;
    if(e.key==="q") freeCam.keys.q=true;
    if(e.key==="e") freeCam.keys.e=true;
    if(e.key==="Shift") freeCam.keys.shift=true;
});

window.addEventListener("keyup", e=>{
    if(e.key==="w") freeCam.keys.w=false;
    if(e.key==="a") freeCam.keys.a=false;
    if(e.key==="s") freeCam.keys.s=false;
    if(e.key==="d") freeCam.keys.d=false;
    if(e.key==="q") freeCam.keys.q=false;
    if(e.key==="e") freeCam.keys.e=false;
    if(e.key==="Shift") freeCam.keys.shift=false;
});

// ------------------------------------------------------------
// MOUSE LOOK
// ------------------------------------------------------------
const canvas = document.getElementById("apex-canvas");

canvas.addEventListener("mousedown", e=>{
    if(!freeCam.enabled) return;
    freeCam.mouseDown = true;
    freeCam.lastX = e.clientX;
    freeCam.lastY = e.clientY;
});

window.addEventListener("mouseup", ()=>{
    freeCam.mouseDown = false;
});

window.addEventListener("mousemove", e=>{
    if(!freeCam.mouseDown || !freeCam.enabled) return;

    const dx = e.clientX - freeCam.lastX;
    const dy = e.clientY - freeCam.lastY;

    freeCam.lastX = e.clientX;
    freeCam.lastY = e.clientY;

    freeCam.yaw   += dx * 0.004;
    freeCam.pitch += dy * 0.004;
});

// ------------------------------------------------------------
// UPDATE FREE CAMERA
// ------------------------------------------------------------
export function updateFreeCamera(dt) {
    if(!freeCam.enabled) return;

    const cam = getCameraState();
    const speed = freeCam.keys.shift ? freeCam.fast : freeCam.speed;

    let vx = 0, vy = 0;

    if(freeCam.keys.w) vy -= speed;
    if(freeCam.keys.s) vy += speed;
    if(freeCam.keys.a) vx -= speed;
    if(freeCam.keys.d) vx += speed;

    // Move camera
    cam.x += vx * dt;
    cam.y += vy * dt;

    // Zoom
    if(freeCam.keys.q) cam.zoom *= (1 - dt * 1.5);
    if(freeCam.keys.e) cam.zoom *= (1 + dt * 1.5);
}

// ------------------------------------------------------------
// CINEMATIC CAMERA PRESETS
// ------------------------------------------------------------
export function setCameraPreset(preset){
    const cam = getCameraState();
    const sim = getSimState();
    const a = sim.cameraAnchors;

    if(preset === "chase"){
        cam.mode = "free";
        cam.x = a.leader.x - 120;
        cam.y = a.leader.y - 40;
        cam.zoom = 1.2;
    }

    if(preset === "low"){
        cam.mode = "free";
        cam.x = a.leader.x - 40;
        cam.y = a.leader.y + 20;
        cam.zoom = 0.7;
    }

    if(preset === "shoulder"){
        cam.mode = "free";
        cam.x = a.leader.x - 80;
        cam.y = a.leader.y - 10;
        cam.zoom = 1.0;
    }
}

// ------------------------------------------------------------
// OPTIONAL: QUICK UI HOOKS
// ------------------------------------------------------------
window.enableFreeCamera = enableFreeCamera;
window.setCameraPreset = setCameraPreset;

