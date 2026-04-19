// ------------------------------------------------------------
// replay-ui.js — Replay Scrubber UI
// ------------------------------------------------------------

import { getReplayState } from "./index.js";

let ui = {
    playBtn: null,
    pauseBtn: null,
    scrub: null,
    timeLabel: null,
    initialized: false
};

export function initReplayUI(){
    if(ui.initialized) return;

    ui.playBtn   = document.getElementById("apex-replay-play");
    ui.pauseBtn  = document.getElementById("apex-replay-pause");
    ui.scrub     = document.getElementById("apex-replay-scrub");
    ui.timeLabel = document.getElementById("apex-replay-time");

    if(!ui.playBtn) return;

    ui.playBtn.onclick = ()=> getReplayState().playing = true;
    ui.pauseBtn.onclick = ()=> getReplayState().playing = false;

    ui.scrub.oninput = ()=>{
        const r = getReplayState();
        const t = parseFloat(ui.scrub.value);
        r.time = t * r.duration;
        r.playing = false;
    };

    ui.initialized = true;
}

function fmt(sec){
    const m = Math.floor(sec/60);
    const s = sec - m*60;
    return `${String(m).padStart(2,"0")}:${s.toFixed(1)}`;
}

export function updateReplayUI(){
    if(!ui.initialized) return;

    const r = getReplayState();
    const t = r.time || 0;
    const d = r.duration || 0.0001;

    ui.scrub.value = (t / d).toFixed(3);
    ui.timeLabel.textContent = `${fmt(t)} / ${fmt(d)}`;
}
