// index.js - APEXCORE v7.0 Command Layer
console.log("StateEngine - module entry loaded");

import {
    setTacticalState,
    setFormationMode,
    setHighLevelOrder,
    setActiveSquadLeader,
    setSquadTarget,
    startReplay,
    stopReplay,
    scrubReplay,
    getSquads,
    getReplayState
} from "./apexsim.js";
import { startAPEXSIMRenderer } from "./apexsim-renderer.js";

// ------------------------------------------------------------
// BOOT
// ------------------------------------------------------------

console.log("APEXCORE - Booting Module Runtime...");

// ------------------------------------------------------------
// DOM HOOKS
// ------------------------------------------------------------

const btnHold = document.getElementById("btn-hold");
const btnFlank = document.getElementById("btn-flank");
const btnFallback = document.getElementById("btn-fallback");
const btnRegroup = document.getElementById("btn-regroup");
const btnPush = document.getElementById("btn-push");

const btnFormTight = document.getElementById("btn-form-tight");
const btnFormSpread = document.getElementById("btn-form-spread");
const btnFormLine = document.getElementById("btn-form-line");
const btnFormWedge = document.getElementById("btn-form-wedge");

const btnOrderDefend = document.getElementById("btn-order-defend");
const btnOrderAdvance = document.getElementById("btn-order-advance");
const btnOrderSweep = document.getElementById("btn-order-sweep");
const btnOrderSecure = document.getElementById("btn-order-secure");

const btnSquadAlpha = document.getElementById("btn-squad-alpha");
const btnSquadBravo = document.getElementById("btn-squad-bravo");

const btnReplayPlay = document.getElementById("btn-replay-play");
const btnReplayStop = document.getElementById("btn-replay-stop");
const replaySlider = document.getElementById("replay-slider");

const heatmapToggle = document.getElementById("btn-heatmap");

// ------------------------------------------------------------
// HEATMAP TOGGLE STATE
// ------------------------------------------------------------

let heatmapEnabled = true;
if (heatmapToggle) {
    heatmapToggle.addEventListener("click", () => {
        heatmapEnabled = !heatmapEnabled;
        console.log("APEXSIM - Heatmap toggled");
    });
}

export function isHeatmapEnabled() {
    return heatmapEnabled;
}

// ------------------------------------------------------------
// TACTICAL COMMAND BUTTONS
// ------------------------------------------------------------

if (btnHold) {
    btnHold.addEventListener("click", () => {
        console.log("APEXSIM - Manual tactical command: hold");
        setTacticalState("hold");
    });
}
if (btnFlank) {
    btnFlank.addEventListener("click", () => {
        console.log("APEXSIM - Manual tactical command: flank");
        setTacticalState("flank");
    });
}
if (btnFallback) {
    btnFallback.addEventListener("click", () => {
        console.log("APEXSIM - Manual tactical command: fallback");
        setTacticalState("fallback");
    });
}
if (btnRegroup) {
    btnRegroup.addEventListener("click", () => {
        console.log("APEXSIM - Manual tactical command: regroup");
        setTacticalState("regroup");
    });
}
if (btnPush) {
    btnPush.addEventListener("click", () => {
        console.log("APEXSIM - Manual tactical command: push");
        setTacticalState("push");
    });
}

// ------------------------------------------------------------
// FORMATION MODE BUTTONS
// ------------------------------------------------------------

if (btnFormTight) {
    btnFormTight.addEventListener("click", () => setFormationMode("tight"));
}
if (btnFormSpread) {
    btnFormSpread.addEventListener("click", () => setFormationMode("spread"));
}
if (btnFormLine) {
    btnFormLine.addEventListener("click", () => setFormationMode("line"));
}
if (btnFormWedge) {
    btnFormWedge.addEventListener("click", () => setFormationMode("wedge"));
}

// ------------------------------------------------------------
// HIGH-LEVEL ORDERS
// ------------------------------------------------------------

if (btnOrderDefend) {
    btnOrderDefend.addEventListener("click", () => {
        setHighLevelOrder("defend");
    });
}
if (btnOrderAdvance) {
    btnOrderAdvance.addEventListener("click", () => {
        setHighLevelOrder("advance");
    });
}
if (btnOrderSweep) {
    btnOrderSweep.addEventListener("click", () => {
        setHighLevelOrder("sweep");
    });
}
if (btnOrderSecure) {
    btnOrderSecure.addEventListener("click", () => {
        setHighLevelOrder("secure");
    });
}

// ------------------------------------------------------------
// SQUAD SELECTION
// ------------------------------------------------------------

let activeSquadId = "alpha";

function setActiveSquad(id) {
    activeSquadId = id;
    setActiveSquadLeader(id);
}

if (btnSquadAlpha) {
    btnSquadAlpha.addEventListener("click", () => setActiveSquad("alpha"));
}
if (btnSquadBravo) {
    btnSquadBravo.addEventListener("click", () => setActiveSquad("bravo"));
}

// ------------------------------------------------------------
// REPLAY CONTROLS
// ------------------------------------------------------------

if (btnReplayPlay) {
    btnReplayPlay.addEventListener("click", () => {
        startReplay();
    });
}
if (btnReplayStop) {
    btnReplayStop.addEventListener("click", () => {
        stopReplay();
    });
}
if (replaySlider) {
    replaySlider.addEventListener("input", () => {
        const v = parseFloat(replaySlider.value) || 0;
        const replay = getReplayState();
        const t = (v / 100) * replay.duration;
        scrubReplay(t);
    });
}

// Keep slider synced
setInterval(() => {
    const replay = getReplayState();
    if (!replaySlider || replay.duration <= 0) return;
    const pct = (replay.time / replay.duration) * 100;
    replaySlider.value = String(pct);
}, 200);

// ------------------------------------------------------------
// RADIAL ORDERS WHEEL (RIGHT-CLICK)
// ------------------------------------------------------------

const canvas = document.getElementById("apex-canvas");

let radialMenu = {
    visible: false,
    x: 0,
    y: 0,
    options: [
        { label: "HOLD", action: () => setTacticalState("hold") },
        { label: "FLANK", action: () => setTacticalState("flank") },
        { label: "FALLBACK", action: () => setTacticalState("fallback") },
        { label: "REGROUP", action: () => setTacticalState("regroup") },
        { label: "PUSH", action: () => setTacticalState("push") }
    ]
};

export function getRadialMenuState() {
    return radialMenu;
}

if (canvas) {
    canvas.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const rect = canvas.getBoundingClientRect();
        radialMenu.x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        radialMenu.y = (ev.clientY - rect.top) * (canvas.height / rect.height);
        radialMenu.visible = true;
    });

    canvas.addEventListener("mousedown", (ev) => {
        if (!radialMenu.visible) return;
        if (ev.button !== 0) return;

        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        const y = (ev.clientY - rect.top) * (canvas.height / rect.height);

        const dx = x - radialMenu.x;
        const dy = y - radialMenu.y;
        const d = Math.hypot(dx, dy);

        if (d < 20 || d > 80) {
            radialMenu.visible = false;
            return;
        }

        const angle = Math.atan2(dy, dx);
        const normAngle = (angle + Math.PI * 2) % (Math.PI * 2);

        const segment = (Math.PI * 2) / radialMenu.options.length;
        const index = Math.floor(normAngle / segment);
        const opt = radialMenu.options[index];
        if (opt && opt.action) opt.action();

        radialMenu.visible = false;
    });

    canvas.addEventListener("dblclick", (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
        const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
        const squads = getSquads();
        const squad = squads.find(s => s.id === activeSquadId);
        if (squad) {
            setSquadTarget(squad.id, x, y);
        }
    });
}

// ------------------------------------------------------------
// START RENDERER
// ------------------------------------------------------------

startAPEXSIMRenderer();

console.log("APEXCORE - Module Runtime Online");
