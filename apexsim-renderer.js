// ------------------------------------------------------------
// apexsim-renderer.js — Renderer
// ------------------------------------------------------------

import { getSimState, updateSim } from "./apexsim.js";
import { getCameraState, getReplayState, getExportState, apexcoreUpdate, apexcoreDrawOverlays } from "./index.js";

export const canvas = document.getElementById("apex-canvas");
export const ctx = canvas.getContext("2d");

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

export function w2s(x, y){
    const cam = getCameraState();
    return {
        x: (x - cam.x) * cam.zoom + canvas.width / 2,
        y: (y - cam.y) * cam.zoom + canvas.height / 2
    };
}

function drawCircle(x, y, r, color){
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * cam.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawFacingLine(x, y, facing, length, color){
    const p = w2s(x, y);
    const cam = getCameraState();
    const ex = p.x + Math.cos(facing) * length * cam.zoom;
    const ey = p.y + Math.sin(facing) * length * cam.zoom;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * cam.zoom;
    ctx.stroke();
}

function drawEntities(){
    const sim = getSimState();
    for(const ent of sim.entities){
        drawCircle(ent.x, ent.y, 10, "#00A8FF");
        drawFacingLine(ent.x, ent.y, ent.facing, 18, "#00C8FF");
    }
}

function drawEnemies(){
    const sim = getSimState();
    for(const en of sim.enemies){
        drawCircle(en.x, en.y, 12, "#FF4444");
        drawFacingLine(en.x, en.y, en.facing, 20, "#FF8888");
    }
}

function drawFormationGhosts(){
    const sim = getSimState();
    for(const g of sim.formation.ghosts){
        drawCircle(g.x, g.y, 8, "rgba(255,255,255,0.25)");
    }
}

function drawLetterbox(){
    const exp = getExportState();
    if(!exp.active) return;
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
}

function captureFrame(){
    const r = getReplayState();
    if(!r.recording) return;
    r.frames.push(canvas.toDataURL("image/png"));
}

let lastTime = performance.now();

export function initRenderer(){
    console.log("APEXSIM Renderer - initializing");
    requestAnimationFrame(renderFrame);
}

function renderFrame(t){
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    updateSim(dt);
    apexcoreUpdate(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawEntities();
    drawEnemies();
    drawFormationGhosts();

    apexcoreDrawOverlays();
    drawLetterbox();
    captureFrame();

    requestAnimationFrame(renderFrame);
}

console.log("APEXSIM Renderer - online");
