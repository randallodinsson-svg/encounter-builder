// ------------------------------------------------------------
// apex-commands.js — APEXSIM v8.1 Command Layer
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// COMMAND DEFINITIONS
// ------------------------------------------------------------
export const COMMANDS = {
    MOVE: "move",
    HOLD: "hold",
    REGROUP: "regroup",
    ATTACK: "attack",
    FLEE: "flee"
};

// ------------------------------------------------------------
// ISSUE COMMAND
// ------------------------------------------------------------
export function issueCommand(cmd, worldX, worldY){
    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    switch(cmd){

        case COMMANDS.MOVE:
            leader.order = { type: "move", x: worldX, y: worldY };
            break;

        case COMMANDS.HOLD:
            leader.order = { type: "hold" };
            break;

        case COMMANDS.REGROUP:
            leader.order = { type: "regroup" };
            break;

        case COMMANDS.ATTACK:
            leader.order = { type: "attack", x: worldX, y: worldY };
            break;

        case COMMANDS.FLEE:
            leader.order = { type: "flee", x: worldX, y: worldY };
            break;
    }
}

// ------------------------------------------------------------
// ORDER EXECUTION (called every frame)
// ------------------------------------------------------------
export function updateCommands(dt){
    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader || !leader.order) return;

    const o = leader.order;

    if(o.type === "move"){
        const dx = o.x - leader.x;
        const dy = o.y - leader.y;
        const d = Math.hypot(dx, dy);
        if(d < 2){
            leader.order = null;
            return;
        }
        leader.x += (dx / d) * 80 * dt;
        leader.y += (dy / d) * 80 * dt;
        leader.facing = Math.atan2(dy, dx);
    }

    if(o.type === "hold"){
        // Do nothing — intentional
    }

    if(o.type === "regroup"){
        // Snap leader back to formation origin
        leader.x = 0;
        leader.y = 0;
        leader.order = null;
    }

    if(o.type === "attack"){
        // Move toward attack point
        const dx = o.x - leader.x;
        const dy = o.y - leader.y;
        const d = Math.hypot(dx, dy);
        if(d < 4){
            leader.order = null;
            return;
        }
        leader.x += (dx / d) * 100 * dt;
        leader.y += (dy / d) * 100 * dt;
        leader.facing = Math.atan2(dy, dx);
    }

    if(o.type === "flee"){
        const dx = leader.x - o.x;
        const dy = leader.y - o.y;
        const d = Math.hypot(dx, dy);
        leader.x += (dx / d) * 140 * dt;
        leader.y += (dy / d) * 140 * dt;
        leader.facing = Math.atan2(dy, dx);
    }
}
