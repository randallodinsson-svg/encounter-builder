// ------------------------------------------------------------
// camera-rails.js — APEXSIM v8.7 Camera Rails + Orbits
// ------------------------------------------------------------

import { getCameraState, getReplayState } from "./index.js";
import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// RAIL TYPES
// ------------------------------------------------------------
const RAIL_TYPES = {
    NONE: "none",
    ORBIT: "orbit",
    DOLLY: "dolly",
    CRANE: "crane",
    CHASE: "chase"
};

// ------------------------------------------------------------
// CAMERA RAIL STATE
// ------------------------------------------------------------
const railState = {
    type: RAIL_TYPES.NONE,
    t: 0,
    duration: 4,
    params: {}
};

// ------------------------------------------------------------
// SET CAMERA RAIL
// ------------------------------------------------------------
export function setCameraRail(type, params = {}){
    railState.type = type;
    railState.params = params;
    railState.t = 0;
}

// ------------------------------------------------------------
// UPDATE CAMERA RAIL (during replay)
// ------------------------------------------------------------
export function updateCameraRail(dt){
    const replay = getReplayState();
    const cam = getCameraState();
    const sim = getSimState();

    if(!replay.playing) return;
    if(railState.type === RAIL_TYPES.NONE) return;

    railState.t += dt;
    const t = railState.t / railState.duration;

    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    switch(railState.type){

        // --------------------------------------------------------
        // ORBIT CAMERA
        // --------------------------------------------------------
        case RAIL_TYPES.ORBIT: {
            const radius = railState.params.radius || 260;
            const speed  = railState.params.speed  || 0.6;

            const ang = replay.time * speed;

            cam.x = leader.x + Math.cos(ang) * radius;
            cam.y = leader.y + Math.sin(ang) * radius;
            cam.zoom = railState.params.zoom || 1.1;
        } break;

        // --------------------------------------------------------
        // DOLLY CAMERA (linear path)
        // --------------------------------------------------------
        case RAIL_TYPES.DOLLY: {
            const p0 = railState.params.start;
            const p1 = railState.params.end;

            if(!p0 || !p1) return;

            const tt = Math.min(1, t);

            cam.x = p0.x + (p1.x - p0.x) * tt;
            cam.y = p0.y + (p1.y - p0.y) * tt;
            cam.zoom = railState.params.zoom || 1.0;
        } break;

        // --------------------------------------------------------
        // CRANE CAMERA (vertical + horizontal)
        // --------------------------------------------------------
        case RAIL_TYPES.CRANE: {
            const height = railState.params.height || 180;
            const offset = railState.params.offset || 220;

            const tt = Math.min(1, t);

            cam.x = leader.x + offset * (1 - tt);
            cam.y = leader.y - height * tt;
            cam.zoom = railState.params.zoom || 1.2;
        } break;

        // --------------------------------------------------------
        // CHASE CAMERA (spring follow)
        // --------------------------------------------------------
        case RAIL_TYPES.CHASE: {
            const followDist = railState.params.distance || 180;
            const stiffness  = railState.params.stiffness || 6;

            const targetX = leader.x - Math.cos(leader.facing) * followDist;
            const targetY = leader.y - Math.sin(leader.facing) * followDist;

            cam.x += (targetX - cam.x) * stiffness * dt;
            cam.y += (targetY - cam.y) * stiffness * dt;
            cam.zoom = railState.params.zoom || 1.05;
        } break;
    }
}
