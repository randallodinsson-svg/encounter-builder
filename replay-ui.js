// ------------------------------------------------------------
// replay-ui.js — Replay Scrubber + State Access
// ------------------------------------------------------------

// Internal replay state
const replayState = {
    playing: false,
    time: 0,
    duration: 0,
    scrub: 0
};

// Exported so index.js + renderer can use it
export function getReplayState() {
    return replayState;
}

// UI elements
const playBtn = document.getElementById("apex-replay-play");
const pauseBtn = document.getElementById("apex-replay-pause");
const scrub = document.getElementById("apex-replay-scrub");
const timeLabel = document.getElementById("apex-replay-time");

// Play
playBtn.addEventListener("click", () => {
    replayState.playing = true;
});

// Pause
pauseBtn.addEventListener("click", () => {
    replayState.playing = false;
});

// Scrub
scrub.addEventListener("input", () => {
    replayState.scrub = parseFloat(scrub.value);
});

// Update UI each frame (called from index.js via apexcoreUpdate)
export function updateReplayUI(dt) {
    if (replayState.playing) {
        replayState.time += dt;
        if (replayState.time > replayState.duration) {
            replayState.time = replayState.duration;
            replayState.playing = false;
        }
    }

    // Update scrub bar
    if (replayState.duration > 0) {
        scrub.value = replayState.time / replayState.duration;
    }

    // Update label
    const t = replayState.time.toFixed(1);
    const d = replayState.duration.toFixed(1);
    timeLabel.textContent = `${t} / ${d}`;
}
