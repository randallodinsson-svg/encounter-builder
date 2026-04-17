// apexim-renderer.js — APEXSIM Renderer + Steel-Tablet Tactical HUD

import { getSimState } from "./apexsim.js";

console.log("APEXSIM Renderer — initializing…");

let _running = false;
let _lastTime = 0;
let _canvas = null;
let _ctx = null;

const BG_COLOR = "#05070A";
const FIELD_BORDER = "#1A1F26";

const TEXT_COLOR = "#E5F0FF";
const ACCENT_CYAN = "#00FFC8";
const ACCENT_AMBER = "#FFC857";
const ACCENT_RED = "#FF3B3B";
const ACCENT_BLUE = "#4DA3FF";
const ACCENT_GREEN = "#4CFF7A";

export function startAPEXSIMRenderer() {
    if (_running) return;

    _canvas = document.getElementById("apexsim-canvas");
    if (!_canvas) {
        _canvas = document.createElement("canvas");
        _canvas.id = "apexsim-canvas";
        _canvas.width = 1280;
        _canvas.height = 720;
        document.body.appendChild(_canvas);
    }

    _ctx = _canvas.getContext("2d");
    _running = true;
    _lastTime = performance.now();
    requestAnimationFrame(renderLoop);

    console.log("APEXSIM Renderer — online");
}

export function stopAPEXSIMRenderer() {
    _running = false;
}

function renderLoop(timestamp) {
    if (!_running) return;

    const dt = (timestamp - _lastTime) / 1000;
    _lastTime = timestamp;

    const state = getSimState();
    if (!state || !_ctx) {
        requestAnimationFrame(renderLoop);
        return;
    }

    drawScene(state, dt);

    requestAnimationFrame(renderLoop);
}

function drawScene(simState, dt) {
    const ctx = _ctx;
    const w = _canvas.width;
    const h = _canvas.height;

    // background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // field border
    ctx.strokeStyle = FIELD_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // world: entities + tactical world overlays
    drawEntities(simState);
    drawThreatArrow(simState);
    drawFlankArc(simState);

    // HUD: top-right Steel-Tablet cluster
    drawTacticalHUD(simState, dt);
}

// ------------------------------------------------------------
// WORLD RENDERING
// ------------------------------------------------------------

function drawEntities(simState) {
    const ctx = _ctx;
    const entities = simState.entities || [];

    for (const e of entities) {
        ctx.save();
        ctx.translate(e.x, e.y);

        ctx.fillStyle = e.type.color || ACCENT_CYAN;
        const size = e.type.size || 12;

        if (e.type.shape === "square") {
            ctx.fillRect(-size / 2, -size / 2, size, size);
        } else if (e.type.shape === "diamond") {
            ctx.beginPath();
            ctx.moveTo(0, -size / 1.2);
            ctx.lineTo(size / 1.2, 0);
            ctx.lineTo(0, size / 1.2);
            ctx.lineTo(-size / 1.2, 0);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// threat arrow: leader → threat center, length + color by magnitude
function drawThreatArrow(simState) {
    const ctx = _ctx;
    const tactics = simState.tactics;
    const entities = simState.entities || [];
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader || !tactics) return;

    const mag = tactics.threatMag || 0;
    if (mag <= 0.1) return;

    const dir = tactics.threatDir || { x: 0, y: 0 };
    const norm = Math.hypot(dir.x, dir.y) || 1;
    const dx = dir.x / norm;
    const dy = dir.y / norm;

    const baseLen = 80;
    const len = baseLen + Math.min(1, mag / 40) * 80;

    const startX = leader.x;
    const startY = leader.y;
    const endX = startX + dx * len;
    const endY = startY + dy * len;

    const tNorm = Math.max(0, Math.min(1, mag / 40));
    const color = lerpColor(ACCENT_GREEN, ACCENT_RED, tNorm);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // arrowhead
    const angle = Math.atan2(dy, dx);
    const ah = 10;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - Math.cos(angle - Math.PI / 6) * ah,
        endY - Math.sin(angle - Math.PI / 6) * ah
    );
    ctx.lineTo(
        endX - Math.cos(angle + Math.PI / 6) * ah,
        endY - Math.sin(angle + Math.PI / 6) * ah
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

// dynamic arc flank preview (only when FLANK)
function drawFlankArc(simState) {
    const ctx = _ctx;
    const tactics = simState.tactics;
    const entities = simState.entities || [];
    const leader = entities.find(e => e.id === simState.formation.leaderId);
    if (!leader || !tactics) return;

    if (tactics.state !== "flank") return;

    const dir = tactics.threatDir || { x: 0, y: 0 };
    const mag = tactics.threatMag || 0;
    const norm = Math.hypot(dir.x, dir.y) || 1;
    if (norm === 0) return;

    const tx = dir.x / norm;
    const ty = dir.y / norm;

    // perpendicular base
    const perp = { x: -ty, y: tx };

    // dynamic curvature based on threat magnitude
    const tNorm = Math.max(0, Math.min(1, mag / 40));
    const radius = 120 + tNorm * 80;
    const arcSpan = Math.PI / 2 + tNorm * (Math.PI / 4); // 90°–135°

    // arc center offset slightly opposite threat
    const centerX = leader.x - tx * 40;
    const centerY = leader.y - ty * 40;

    // choose side: default left
    const startAngle = Math.atan2(perp.y, perp.x) - arcSpan / 2;
    const endAngle = startAngle + arcSpan;

    ctx.save();
    ctx.strokeStyle = ACCENT_CYAN;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.25;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.stroke();

    ctx.restore();
}

// ------------------------------------------------------------
// HUD RENDERING (Steel-Tablet Cluster)
// ------------------------------------------------------------

let _hudLerpThreat = 0;

function drawTacticalHUD(simState, dt) {
    const ctx = _ctx;
    const w = _canvas.width;

    const tactics = simState.tactics || {};
    const formation = simState.formation || {};
    const entities = simState.entities || [];
    const leader = entities.find(e => e.id === formation.leaderId);

    const state = tactics.state || "hold";
    const threatMag = tactics.threatMag || 0;

    const threatNorm = Math.max(0, Math.min(1, threatMag / 40));
    _hudLerpThreat += (threatNorm - _hudLerpThreat) * Math.min(1, dt * 8);

    // HUD base position (top-right)
    const margin = 24;
    const xRight = w - margin;
    let y = margin + 8;

    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // tactical state label
    const stateLabel = "TACTICAL: " + state.toUpperCase();
    ctx.fillStyle = getStateColor(state);
    ctx.globalAlpha = 0.95;
    ctx.fillText(stateLabel, xRight, y);

    y += 18;

    // threat magnitude bar
    const barWidth = 160;
    const barHeight = 6;
    const barX = xRight - barWidth;
    const barY = y + 4;

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#151A22";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = lerpColor(ACCENT_GREEN, ACCENT_RED, _hudLerpThreat);
    ctx.fillRect(barX, barY, barWidth * _hudLerpThreat, barHeight);

    y += 18;

    // formation mode
    const formLabel = "FORM: " + (formation.mode || "line").toUpperCase();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(formLabel, xRight, y);

    y += 18;

    // leader position (small, optional)
    if (leader) {
        const posLabel =
            "LEADER: " + Math.round(leader.x) + ", " + Math.round(leader.y);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#9BA4B5";
        ctx.fillText(posLabel, xRight, y);
    }

    ctx.restore();
}

function getStateColor(state) {
    switch (state) {
        case "hold":
            return TEXT_COLOR;
        case "flank":
            return ACCENT_CYAN;
        case "fallback":
            return ACCENT_AMBER;
        case "regroup":
            return ACCENT_BLUE;
        case "push":
            return ACCENT_RED;
        default:
            return TEXT_COLOR;
    }
}

// ------------------------------------------------------------
// UTIL
// ------------------------------------------------------------

function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return a;
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bch = Math.round(ca.b + (cb.b - ca.b) * t);
    return `rgb(${r},${g},${bch})`;
}

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}
