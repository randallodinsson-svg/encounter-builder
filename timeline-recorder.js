// ------------------------------------------------------------
// timeline-recorder.js — APEXSIM v8.5 Timeline Recorder + Replay
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { getReplayState, getCameraState } from "./index.js";

const MAX_FRAMES = 2000; // cap to avoid runaway memory

// ------------------------------------------------------------
// RECORD CURRENT FRAME
// ------------------------------------------------------------
export function recordFrame(dt){
    const sim = getSimState();
    const replay = getReplayState();

    if(!replay.recording) return;
    if(replay.frames.length >= MAX_FRAMES) return;

    replay.time += dt;
    replay.duration = replay.time;

    const frame = {
        time: replay.time,
        entities: sim.entities.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y,
            facing: e.facing
        })),
        enemies: sim.enemies.map(en => ({
            x: en.x,
            y: en.y,
            facing: en.facing
        }))
    };

    replay.frames.push(frame);
}

// ------------------------------------------------------------
// PLAYBACK UPDATE
// ------------------------------------------------------------
export function updateReplayPlayback(dt){
    const sim = getSimState();
    const replay = getReplayState();
    const cam = getCameraState();

    if(!replay.playing || replay.frames.length === 0) return;

    replay.time += dt;
    if(replay.time > replay.duration){
        replay.time = replay.duration;
        replay.playing = false;
        return;
    }

    // Find the two frames around current time
    let a = replay.frames[0];
    let b = replay.frames[replay.frames.length - 1];

    for(let i = 0; i < replay.frames.length - 1; i++){
        const f0 = replay.frames[i];
        const f1 = replay.frames[i+1];
        if(replay.time >= f0.time && replay.time <= f1.time){
            a = f0;
            b = f1;
            break;
        }
    }

    const span = Math.max(0.0001, b.time - a.time);
    const t = (replay.time - a.time) / span;

    // Lerp entities
    sim.entities.forEach(e =>{
        const fa = a.entities.find(x => x.id === e.id);
        const fb = b.entities.find(x => x.id === e.id);
        if(!fa || !fb) return;

        e.x = fa.x + (fb.x - fa.x) * t;
        e.y = fa.y + (fb.y - fa.y) * t;
        e.facing = fa.facing + (fb.facing - fa.facing) * t;
    });

    // Lerp enemies (by index)
    sim.enemies.forEach((en, i)=>{
        const fa = a.enemies[i];
        const fb = b.enemies[i];
        if(!fa || !fb) return;

        en.x = fa.x + (fb.x - fa.x) * t;
        en.y = fa.y + (fb.y - fa.y) * t;
        en.facing = fa.facing + (fb.facing - fa.facing) * t;
    });

    // Simple cinematic camera: orbit around leader during replay
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(leader){
        const radius = 260;
        const speed = 0.25;
        const ang = replay.time * speed;

        cam.x = leader.x + Math.cos(ang) * radius;
        cam.y = leader.y + Math.sin(ang) * radius;
        cam.zoom = 1.1;
    }
}

// ------------------------------------------------------------
// CONTROL HELPERS
// ------------------------------------------------------------
export function startRecording(){
    const replay = getReplayState();
    replay.frames = [];
    replay.time = 0;
    replay.duration = 0;
    replay.recording = true;
    replay.playing = false;
}

export function stopRecording(){
    const replay = getReplayState();
    replay.recording = false;
}

export function startPlayback(){
    const replay = getReplayState();
    if(replay.frames.length === 0) return;
    replay.time = 0;
    replay.playing = true;
    replay.recording = false;
}
