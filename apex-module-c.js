// ------------------------------------------------------------
// apex-module-c.js — Enemy Spawn + Squad Selection
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";
import { canvas } from "./apexsim-renderer.js";

// WORLD → SCREEN
function screenToWorld(sx, sy){
    return {
        x: (sx - canvas.width/2) / camera.zoom + camera.x,
        y: (sy - canvas.height/2) / camera.zoom + camera.y
    };
}

// ------------------------------------------------------------
// ENEMY SPAWN
// ------------------------------------------------------------
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

    getSimState().enemies.push({
        x, y,
        facing: 0,
        type: spawnType
    });

    spawnMode = false;
});

// ------------------------------------------------------------
// SQUAD SELECTION
// ------------------------------------------------------------
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
    let dist = Infinity;

    for(const ent of sim.entities){
        const dx = ent.x - x;
        const dy = ent.y - y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if(d < 30 && d < dist){
            closest = ent;
            dist = d;
        }
    }

    if(closest){
        sim.formation.leaderId = closest.id;
    }

    selecting = false;
});
