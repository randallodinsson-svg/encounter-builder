// ------------------------------------------------------------
// apex-module-c.js — Enemy Spawn + Squad Selection
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { canvas } from "./apexsim-renderer.js";
import { getCameraState } from "./index.js";

function screenToWorld(sx, sy){
    const cam = getCameraState();
    return {
        x: (sx - canvas.width/2) / cam.zoom + cam.x,
        y: (sy - canvas.height/2) / cam.zoom + cam.y
    };
}

// ENEMY SPAWN
let spawnMode = false;
let spawnType = "grunt";

export function spawnEnemyAtCursor(type){
    spawnMode = true;
    spawnType = type;
}
window.spawnEnemyAtCursor = spawnEnemyAtCursor;

canvas.addEventListener("click", e=>{
    if(!spawnMode) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    getSimState().enemies.push({ x, y, facing: 0, type: spawnType });
    spawnMode = false;
});

// SQUAD SELECTION
let selecting = false;

export function enableSquadSelection(){
    selecting = true;
}
window.enableSquadSelection = enableSquadSelection;

canvas.addEventListener("click", e=>{
    if(!selecting) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const sim = getSimState();
    let closest = null;
    let bestDist = Infinity;

    for(const ent of sim.entities){
        const dx = ent.x - x;
        const dy = ent.y - y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if(d < 30 && d < bestDist){
            bestDist = d;
            closest = ent;
        }
    }

    if(closest){
        sim.formation.leaderId = closest.id;
    }

    selecting = false;
});

// Inline UI panel
(function createApexUIPanel(){
    if(document.getElementById("apex-ui-panel")) return;
    const panel = document.createElement("div");
    panel.id = "apex-ui-panel";
    panel.style.position = "fixed";
    panel.style.left = "20px";
    panel.style.top = "20px";
    panel.style.padding = "12px";
    panel.style.background = "rgba(5,10,20,0.9)";
    panel.style.color = "#9FA8B8";
    panel.style.fontFamily = "system-ui";
    panel.style.fontSize = "12px";
    panel.style.border = "1px solid rgba(255,255,255,0.08)";
    panel.style.width = "200px";

    panel.innerHTML = `
        <div style="margin-bottom:8px; font-weight:bold;">Enemy Spawn</div>
        <button style="width:100%; margin-bottom:6px;" onclick="spawnEnemyAtCursor('grunt')">Spawn Grunt</button>
        <button style="width:100%; margin-bottom:6px;" onclick="spawnEnemyAtCursor('elite')">Spawn Elite</button>
        <button style="width:100%; margin-bottom:12px;" onclick="spawnEnemyAtCursor('brute')">Spawn Brute</button>
        <div style="margin-bottom:8px; font-weight:bold;">Squad Selection</div>
        <button style="width:100%;" onclick="enableSquadSelection()">Select Squad</button>
    `;
    document.body.appendChild(panel);
})();
