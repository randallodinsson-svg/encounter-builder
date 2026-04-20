// ------------------------------------------------------------
// camera-keyframes.js — APEXSIM v8.6 Keyframe Camera System
// Hybrid Mode: Manual + Auto Keyframes
// ------------------------------------------------------------

import { getCameraState, getReplayState } from "./index.js";
import { getSimState } from "./apexsim.js";

const AUTO_KEYFRAME_INTERVAL = 1.2; // seconds
let autoTimer = 0;

// ------------------------------------------------------------
// KEYFRAME STRUCTURE
// ------------------------------------------------------------
// keyframe = {
//   time: <seconds>,
//   x, y, zoom
// }

// ------------------------------------------------------------
// ADD MANUAL KEYFRAME
// ------------------------------------------------------------
export function addCameraKeyframe(){
    const cam = getCameraState();
    const replay = getReplayState();

    replay.cameraTrack.push({
        time: replay.time,
        x: cam.x,
        y: cam.y,
        zoom: cam.zoom
    });
}

// ------------------------------------------------------------
// AUTO KEYFRAMES (Hybrid Mode)
// ------------------------------------------------------------
function autoKeyframe(dt){
    const replay = getReplayState();
    if(!replay.playing) return;

    autoTimer += dt;
    if(autoTimer < AUTO_KEYFRAME_INTERVAL) return;
    autoTimer = 0;

    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    // Auto keyframe follows leader
    replay.cameraTrack.push({
        time: replay.time,
        x: leader.x + 180,
        y: leader.y - 120,
        zoom: 1.15
    });
}

// ------------------------------------------------------------
// INTERPOLATE CAMERA DURING REPLAY
// ------------------------------------------------------------
export function updateCameraKeyframes(dt){
    const replay = getReplayState();
    const cam = getCameraState();

    if(!replay.playing || replay.cameraTrack.length === 0) return;

    autoKeyframe(dt);

    // Find surrounding keyframes
    let a = replay.cameraTrack[0];
    let b = replay.cameraTrack[replay.cameraTrack.length - 1];

    for(let i = 0; i < replay.cameraTrack.length - 1; i++){
        const k0 = replay.cameraTrack[i];
        const k1 = replay.cameraTrack[i+1];
        if(replay.time >= k0.time && replay.time <= k1.time){
            a = k0;
            b = k1;
            break;
        }
    }

    const span = Math.max(0.0001, b.time - a.time);
    const t = (replay.time - a.time) / span;

    // Smooth interpolation
    cam.x = a.x + (b.x - a.x) * t;
    cam.y = a.y + (b.y - a.y) * t;
    cam.zoom = a.zoom + (b.zoom - a.zoom) * t;
}
