// ------------------------------------------------------------
// timeline-recorder.js — State Export + Timeline Recording
// ------------------------------------------------------------

// Internal export/timeline state
const exportState = {
    recording: false,
    frames: [],
    duration: 0,
    time: 0
};

// Exported so index.js + renderer can use it
export function getExportState() {
    return exportState;
}

import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// START / STOP RECORDING
// ------------------------------------------------------------
export function startRecording() {
    exportState.recording = true;
    exportState.frames = [];
    exportState.time = 0;
    exportState.duration = 0;
}

export function stopRecording() {
    exportState.recording = false;
    exportState.duration = exportState.frames.length;
}

// ------------------------------------------------------------
// RECORD FRAME EACH TICK
// Called from index.js via apexcoreUpdate()
// ------------------------------------------------------------
export function updateTimelineRecorder(dt) {
    if (!exportState.recording) return;

    exportState.time += dt;

    // Capture a snapshot of the sim state
    const sim = getSimState();
    exportState.frames.push(JSON.parse(JSON.stringify(sim)));
}

// ------------------------------------------------------------
// GET FRAME AT TIME (for replay)
// ------------------------------------------------------------
export function getFrameAt(time) {
    if (exportState.frames.length === 0) return null;

    const index = Math.floor(time);
    return exportState.frames[Math.min(index, exportState.frames.length - 1)];
}
