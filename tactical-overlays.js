// ------------------------------------------------------------
// tactical-overlays.js — Cones, Arcs, Zones, Highlights
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { ctx, w2s } from "./apexsim-renderer.js";
import { getCameraState } from "./index.js";

export const overlays = {
    cones: true,
    arcs: true,
    zones: true,
    highlights: true
};

window.toggleCones = () => overlays.cones = !overlays.cones;
window.toggleArcs  = () => overlays.arcs  = !overlays.arcs;
window.toggleZones = () => overlays.zones = !overlays.zones;
window.toggleHighlights = () => overlays.highlights = !overlays.highlights;

function drawCone(x, y, facing, angle, length, color, alpha=0.25){
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(facing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, length * cam.zoom, -angle/2, angle/2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
}

function drawArc(x, y, radius, start, end, color, width=2, alpha=0.8){
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * cam.zoom, start, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * cam.zoom;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
}

function drawZone(x, y, radius, color, alpha=0.12){
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * cam.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
}

function drawHighlight(x, y, radius, color="#00FFC8"){
    const p = w2s(x, y);
    const cam = getCameraState();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * cam.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * cam.zoom;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
}

export function drawTacticalOverlays(){
    const sim = getSimState();

    if(overlays.highlights){
        const lead = sim.entities.find(e => e.id === sim.formation.leaderId);
        if(lead){
            drawHighlight(lead.x, lead.y, 22, "#00FFC8");
        }
    }

    for(const en of sim.enemies){
        if(overlays.cones){
            drawCone(en.x, en.y, en.facing, Math.PI/3, 160, "rgba(255,60,60,1)", 0.18);
        }
        if(overlays.arcs){
            drawArc(en.x, en.y, 40, en.facing-0.4, en.facing+0.4, "rgba(255,120,120,0.9)", 2, 0.9);
        }
        if(overlays.zones){
            drawZone(en.x, en.y, 120, "rgba(255,0,0,1)", 0.08);
        }
    }
}

(function createOverlayPanel(){
    if(document.getElementById("apex-overlay-panel")) return;
    const panel = document.createElement("div");
    panel.id = "apex-overlay-panel";
    panel.style.position = "fixed";
    panel.style.right = "20px";
    panel.style.top = "20px";
    panel.style.padding = "12px";
    panel.style.background = "rgba(5,10,20,0.9)";
    panel.style.color = "#9FA8B8";
    panel.style.fontFamily = "system-ui";
    panel.style.fontSize = "12px";
    panel.style.border = "1px solid rgba(255,255,255,0.08)";
    panel.style.width = "180px";
    panel.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold;">Tactical Overlays</div>
        <button style="width:100%; margin-bottom:6px;" onclick="toggleCones()">Toggle Cones</button>
        <button style="width:100%; margin-bottom:6px;" onclick="toggleArcs()">Toggle Arcs</button>
        <button style="width:100%; margin-bottom:6px;" onclick="toggleZones()">Toggle Zones</button>
        <button style="width:100%;" onclick="toggleHighlights()">Toggle Highlights</button>
    `;
    document.body.appendChild(panel);
})();
