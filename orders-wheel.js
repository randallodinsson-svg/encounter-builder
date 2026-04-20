// ------------------------------------------------------------
// orders-wheel.js — APEXSIM v8.1 Orders Wheel UI
// ------------------------------------------------------------

import { issueCommand, COMMANDS } from "./apex-commands.js";
import { canvas } from "./apexsim-renderer.js";
import { getCameraState } from "./index.js";

let wheelActive = false;
let wheelX = 0;
let wheelY = 0;

function screenToWorld(sx, sy){
    const cam = getCameraState();
    return {
        x: (sx - canvas.width/2) / cam.zoom + cam.x,
        y: (sy - canvas.height/2) / cam.zoom + cam.y
    };
}

// ------------------------------------------------------------
// OPEN WHEEL
// ------------------------------------------------------------
canvas.addEventListener("contextmenu", e=>{
    e.preventDefault();
    wheelActive = true;
    wheelX = e.clientX;
    wheelY = e.clientY;
    showWheel(wheelX, wheelY);
});

// ------------------------------------------------------------
// CLOSE WHEEL + ISSUE COMMAND
// ------------------------------------------------------------
window.addEventListener("click", e=>{
    if(!wheelActive) return;

    const dx = e.clientX - wheelX;
    const dy = e.clientY - wheelY;
    const angle = Math.atan2(dy, dx);

    const world = screenToWorld(e.clientX, e.clientY);

    // 5‑way radial selection
    if(angle > -0.6 && angle < 0.6){
        issueCommand(COMMANDS.MOVE, world.x, world.y);
    }
    else if(angle >= 0.6 && angle < 1.8){
        issueCommand(COMMANDS.ATTACK, world.x, world.y);
    }
    else if(angle >= 1.8 || angle <= -1.8){
        issueCommand(COMMANDS.HOLD);
    }
    else if(angle > -1.8 && angle < -0.6){
        issueCommand(COMMANDS.FLEE, world.x, world.y);
    }
    else{
        issueCommand(COMMANDS.REGROUP);
    }

    hideWheel();
    wheelActive = false;
});

// ------------------------------------------------------------
// UI PANEL (HTML injection)
// ------------------------------------------------------------
function showWheel(x, y){
    let el = document.getElementById("orders-wheel");
    if(!el){
        el = document.createElement("div");
        el.id = "orders-wheel";
        el.style.position = "fixed";
        el.style.width = "200px";
        el.style.height = "200px";
        el.style.borderRadius = "50%";
        el.style.background = "rgba(5,10,20,0.92)";
        el.style.border = "1px solid rgba(255,255,255,0.1)";
        el.style.pointerEvents = "none";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "#9FA8B8";
        el.style.fontFamily = "system-ui";
        el.style.fontSize = "12px";
        el.innerHTML = "Orders";
        document.body.appendChild(el);
    }
    el.style.left = (x - 100) + "px";
    el.style.top = (y - 100) + "px";
    el.style.display = "flex";
}

function hideWheel(){
    const el = document.getElementById("orders-wheel");
    if(el) el.style.display = "none";
}
