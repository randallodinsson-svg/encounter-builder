// ------------------------------------------------------------
// cinematic-events.js — APEXSIM v8.8 Cinematic Events Layer
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { getReplayState } from "./index.js";
import { setCameraRail } from "./camera-rails.js";
import { addCameraKeyframe } from "./camera-keyframes.js";

let slowmoTimer = 0;
let lastImpactCount = 0;

// ------------------------------------------------------------
// UPDATE CINEMATIC EVENTS
// ------------------------------------------------------------
export function updateCinematicEvents(dt){
    const sim = getSimState();
    const replay = getReplayState();

    if(!replay.playing) return;

    // --------------------------------------------------------
    // 1) IMPACT BEATS (enemy deaths or hits)
    // --------------------------------------------------------
    const impactCount = sim.enemies.filter(e => e.dead).length;

    if(impactCount > lastImpactCount){
        // Trigger slow-mo beat
        slowmoTimer = 0.4;

        // Add a keyframe for dramatic cut
        addCameraKeyframe();

        // Switch to orbit rail for dramatic effect
        setCameraRail("orbit", { radius: 240, speed: 0.9, zoom: 1.2 });
    }

    lastImpactCount = impactCount;

    // --------------------------------------------------------
    // 2) SLOW-MOTION DECAY
    // --------------------------------------------------------
    if(slowmoTimer > 0){
        slowmoTimer -= dt;
        sim.timescale = 0.35;
    } else {
        sim.timescale = 1.0;
    }

    // --------------------------------------------------------
    // 3) AUTO-CUT LOGIC (every few seconds)
    // --------------------------------------------------------
    if(Math.random() < dt * 0.15){
        addCameraKeyframe();
    }

    // --------------------------------------------------------
    // 4) FOCUS SHIFT (leader under threat)
    // --------------------------------------------------------
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    const closeEnemies = sim.enemies.filter(en => {
        const dx = en.x - leader.x;
        const dy = en.y - leader.y;
        return Math.hypot(dx, dy) < 180;
    });

    if(closeEnemies.length >= 3){
        setCameraRail("crane", { height: 260, offset: 180, zoom: 1.25 });
    }
}
